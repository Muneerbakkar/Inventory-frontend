const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const pagesDir = path.resolve('src/pages');

function checkSyntax(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkSyntax(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        babel.parseSync(code, {
          filename: fullPath,
          presets: ['@babel/preset-react']
        });
      } catch (err) {
        console.error(`Syntax error in ${path.relative(pagesDir, fullPath)}:`);
        console.error(err.message);
        console.error('---');
      }
    }
  }
}

checkSyntax(pagesDir);
