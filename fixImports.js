import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'src', 'pages');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const allFiles = walkSync(pagesDir);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  // 1. Remove literal '\nimport...' from the bottom of the file
  const literalNewlineImport = /\\nimport \{ PaginationControls \} from "[^"]+";\\n/g;
  if (literalNewlineImport.test(content)) {
    content = content.replace(literalNewlineImport, '');
    modified = true;
  }
  
  const literalNewlineImport2 = /\\nimport \{ PaginationControls \} from "[^"]+";/g;
  if (literalNewlineImport2.test(content)) {
    content = content.replace(literalNewlineImport2, '');
    modified = true;
  }
  
  // 2. Also check if it was inserted at the very beginning of the file incorrectly
  if (content.startsWith('import { PaginationControls }')) {
    // leave it alone, it's valid syntax, maybe just ensure it doesn't have \n literally
  }

  // 3. Ensure PaginationControls is imported correctly
  if (content.includes('<PaginationControls') && !content.includes('import { PaginationControls }')) {
    let relativeToSrc = path.relative(path.dirname(file), path.join(__dirname, 'src', 'components', 'ui', 'PaginationControls'));
    relativeToSrc = relativeToSrc.replace(/\\/g, '/');
    if (!relativeToSrc.startsWith('.')) relativeToSrc = './' + relativeToSrc;
    
    // Insert after the first import statement
    const importRegex = /^import .*?;\n/m;
    const match = content.match(importRegex);
    if (match) {
       const importStr = `import { PaginationControls } from "${relativeToSrc}";\n`;
       content = content.replace(match[0], match[0] + importStr);
       modified = true;
    } else {
       const importStr = `import { PaginationControls } from "${relativeToSrc}";\n`;
       content = importStr + content;
       modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Fixed imports in ${path.basename(file)}`);
  }
}
