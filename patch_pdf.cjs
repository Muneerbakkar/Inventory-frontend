const fs = require('fs');
const path = require('path');

function patchFile(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Imports
  if (!content.includes("import { jsPDF }")) {
    content = content.replace(config.importTarget, config.importTarget + "\nimport { jsPDF } from 'jspdf';\nimport { toPng } from 'html-to-image';");
  }
  if (!content.includes("Download")) {
    content = content.replace(config.iconsTarget, config.iconsTarget.replace('}', ', Download }'));
  }

  // 2. State
  if (!content.includes("isDownloading")) {
    content = content.replace(
      "const [currentPage, setCurrentPage] = useState(1);",
      "const [currentPage, setCurrentPage] = useState(1);\n  const [isDownloading, setIsDownloading] = useState(false);"
    );
  }

  // 3. Logic insertion before return
  if (!content.includes("pdfChunks = []")) {
    const logic = `
  const pdfChunks = [];
  let requiresEmptyFooterPage = false;

  if (${config.dataProp}?.items) {
    let itemsAdded = 0;
    let isFirstPage = true;
    
    const MAX_LOGO_FOOTER = 12;
    const MAX_LOGO_NO_FOOTER = 18;
    const MAX_NO_LOGO_FOOTER = 16;
    const MAX_NO_LOGO_NO_FOOTER = 22;
    
    while (itemsAdded < ${config.dataProp}.items.length) {
      let capacity;
      const remaining = ${config.dataProp}.items.length - itemsAdded;
      
      if (isFirstPage) {
        if (remaining <= MAX_LOGO_FOOTER) {
          capacity = remaining;
        } else if (remaining <= MAX_LOGO_NO_FOOTER) {
          capacity = remaining;
          requiresEmptyFooterPage = true;
        } else {
          capacity = MAX_LOGO_NO_FOOTER;
        }
      } else {
        if (remaining <= MAX_NO_LOGO_FOOTER) {
          capacity = remaining;
        } else if (remaining <= MAX_NO_LOGO_NO_FOOTER) {
          capacity = remaining;
          requiresEmptyFooterPage = true;
        } else {
          capacity = MAX_NO_LOGO_NO_FOOTER;
        }
      }
      
      const chunk = ${config.dataProp}.items.slice(itemsAdded, itemsAdded + capacity);
      pdfChunks.push(chunk);
      itemsAdded += chunk.length;
      isFirstPage = false;
    }

    if (requiresEmptyFooterPage) {
      pdfChunks.push([]); 
    }
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const pages = document.querySelectorAll('.pdf-render-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = 0; i < pages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const dataUrl = await toPng(pages[i], { 
          quality: 0.95, 
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        const imgProps = pdf.getImageProperties(dataUrl);
        let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let imgWidth = pdfWidth;
        const pdfPageHeight = 297; 
        
        if (imgHeight > pdfPageHeight) {
          const ratio = pdfPageHeight / imgHeight;
          imgHeight = pdfPageHeight;
          imgWidth = imgWidth * ratio;
        }
        
        if (i > 0) pdf.addPage();
        
        const xOffset = (pdfWidth - imgWidth) / 2;
        pdf.addImage(dataUrl, 'PNG', xOffset, 0, imgWidth, imgHeight);
      }
      
      pdf.save(\`${config.pdfName}\`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  `;
    content = content.replace("  return (", logic + "  return (");
  }

  // 4. Wrap return in fragment
  if (!content.includes("  return (\n    <>")) {
    content = content.replace(/  return \(\s*<div/, "  return (\n    <>\n      <div");
  }

  // 5. Button Insertion
  if (!content.includes("handleDownloadPDF")) {
    content = content.replace(
      config.buttonTarget,
      `<div className="flex gap-2">\n          <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading}>\n            <Download className="w-4 h-4 mr-2" /> {isDownloading ? "Generating..." : "PDF"}\n          </Button>\n          ${config.buttonTarget.trim()}\n        </div>`
    );
  }

  // 6. Append hidden component at end of return
  if (!content.includes("HIDDEN PDF TEMPLATES")) {
    const endOfReturnRegex = /      <\/div>\n    <\/div>\n  \);\n};\n?$/s;
    const endMatch = content.match(endOfReturnRegex);
    if (!endMatch) {
       console.log("Could not find end of return for " + filePath);
       return;
    }

    content = content.replace(endOfReturnRegex, 
`      </div>
    </div>
    
    {/* HIDDEN PDF TEMPLATES */}
    <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-9999] overflow-hidden">
        {pdfChunks.map((chunk, pageIndex) => (
          <div 
            key={\`pdf-page-\${pageIndex}\`}
            className="pdf-render-page bg-white text-black flex flex-col px-10 py-6 w-[794px] h-auto relative overflow-hidden"
          >
            ${config.hiddenContent}
          </div>
        ))}
      </div>
    </>
  );
};
`);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log("Patched " + filePath);
}

const configs = [
  {
    path: 'src/pages/Purchases/PurchaseView.jsx',
    importTarget: 'import { Button } from "../../components/ui/Button";',
    iconsTarget: "import {  Printer , ShoppingCart } from 'lucide-react';",
    dataProp: 'bill',
    pdfName: 'PurchaseBill-${bill.billNumber}.pdf',
    buttonTarget: `<Button onClick={() => window.print()}>\n          <Printer className="mr-2 h-4 w-4" /> Print Bill\n        </Button>`,
    hiddenContent: `{/* Header always on top of FIRST page only */}
            {pageIndex === 0 && (
              <>
                <div className="flex justify-between items-start mb-4 z-10 relative">
                  <div className="flex gap-4">
                    <img src="/logo.png" alt="Company Logo" className="h-16 object-contain" />
                    <div>
                      <h1 className="text-xl font-bold text-black mb-1">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
                      {settings?.address ? (
                        <p className="whitespace-pre-wrap text-sm text-gray-700 max-w-sm">{settings.address}</p>
                      ) : (
                        <>
                          <p className="font-bold text-sm mb-1">INVENQ</p>
                          <p className="text-sm">Room No: 122, Building Name, 1st Floor</p>
                          <p className="text-sm">Main Road, City, State - 123456</p>
                          <p className="text-sm">Phone: +91 98765 43210 | Email: info@yourcompany.com</p>
                          <p className="text-sm">Web: www.yourcompany.com</p>
                        </>
                      )}
                      {settings?.gstin && <p className="font-bold text-sm mt-1">GST: {settings.gstin}</p>}
                    </div>
                  </div>
                  <div className="text-right mt-0">
                    <h2 className="text-2xl font-black uppercase text-black mb-4">PURCHASE BILL</h2>
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Bill No:</td>
                          <td className="text-right">{bill.billNumber}</td>
                        </tr>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Bill Date:</td>
                          <td className="text-right">{new Date(bill.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                        {bill.supplierRefNumber && (
                          <tr>
                            <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Supplier Ref No:</td>
                            <td className="text-right">{bill.supplierRefNumber}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="h-px bg-gray-300 w-full mb-4 z-10 relative"></div>

                <div className="pb-2 z-10 relative">
                  <div className="text-xs">
                    <h3 className="font-bold text-sm mb-1 border-b border-gray-200 pb-1 w-1/2">Supplier Details</h3>
                    {bill.supplierId ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">{bill.supplierId.name}</p>
                        {bill.supplierId.address ? (
                          <div className="leading-relaxed max-w-sm text-gray-700">
                            {bill.supplierId.address.street && <p>{bill.supplierId.address.street}</p>}
                            {(bill.supplierId.address.city || bill.supplierId.address.state || bill.supplierId.address.pincode) && (
                              <p>
                                {[
                                  bill.supplierId.address.city,
                                  bill.supplierId.address.state,
                                  bill.supplierId.address.pincode
                                ].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">Address not provided</p>
                        )}
                        <p className="pt-0.5">Phone: {bill.supplierId.phone}</p>
                      </div>
                    ) : (
                      <p className="font-bold text-sm">Unknown Supplier</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Table - Hide if empty footer page */}
            {chunk.length > 0 && (
              <div className="mt-2 z-10 relative">
                <h3 className="font-bold text-sm mb-2">Product Details {pdfChunks.length > 1 ? \`(Page \${pageIndex + 1} of \${pdfChunks.length})\` : ''}</h3>
                <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-1.5 font-bold">Product Name</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-16">Qty</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-24">Price (Rs)</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-16">GST %</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-28">Total (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-1.5">
                          <div className="font-semibold">{item.productId?.name || 'Unknown Product'}</div>
                          {item.productId?.brand && <div className="text-[10px] text-gray-500 mt-0.5">Brand: {item.productId.brand}</div>}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-1.5 text-right">{item.purchasePrice.toFixed(2)}</td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.gstPercent}%</td>
                        <td className="border border-gray-300 p-1.5 text-right">{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer ONLY on the last page */}
            {pageIndex === pdfChunks.length - 1 && (
              <div className="mt-4 z-10 relative flex flex-col flex-1">
                {/* Charges Summary */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2">Charges Summary</h3>
                  <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 p-1.5 font-bold">Description</th>
                        <th className="border border-gray-300 p-1.5 font-bold text-right w-40">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Subtotal</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {bill.subTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Total GST</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {bill.totalGst.toFixed(2)}</td>
                      </tr>
                      {bill.roundOff !== 0 && (
                        <tr>
                          <td className="border border-gray-300 p-1.5">Round Off</td>
                          <td className="border border-gray-300 p-1.5 text-right">Rs. {bill.roundOff.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-300 p-1.5 bg-gray-50 font-bold">Grand Total</td>
                        <td className="border border-gray-300 p-1.5 bg-gray-50 text-right font-bold">Rs. {bill.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bank Details & Terms */}
                <div className="flex flex-row gap-8 mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm mb-1">Terms & Conditions:</h3>
                      <ol className="text-[10px] leading-tight space-y-1 text-gray-800 list-decimal pl-4">
                        <li>Goods received in good condition and as per the purchase order.</li>
                        <li>All discrepancies in quantity or quality must be reported immediately.</li>
                        <li>Payment will be processed as per the mutually agreed terms.</li>
                        <li>Errors and omissions excepted (E.&O.E.).</li>
                        <li>Subject to local jurisdiction only.</li>
                      </ol>
                    </div>
                  </div>
                  
                  <div className="w-32 flex items-center justify-center relative">
                    {bill.status === 'Settled' && (
                      <div className="border-[2px] border-green-500 text-green-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl tracking-widest rotate-[-20deg] opacity-80">
                        SETTLED
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-4 flex justify-between items-end pb-2">
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Supplier Signature
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}`
  },
  {
    path: 'src/pages/Purchases/PurchaseReturnView.jsx',
    importTarget: 'import { Button } from "../../components/ui/Button";',
    iconsTarget: "import {  Printer , Undo2 } from 'lucide-react';",
    dataProp: 'pr',
    pdfName: 'PurchaseReturn-${pr.returnNumber}.pdf',
    buttonTarget: `<Button onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>`,
    hiddenContent: `{/* Header always on top of FIRST page only */}
            {pageIndex === 0 && (
              <>
                <div className="flex justify-between items-start mb-4 z-10 relative">
                  <div className="flex gap-4">
                    <img src="/logo.png" alt="Company Logo" className="h-16 object-contain" />
                    <div>
                      <h1 className="text-xl font-bold text-black mb-1">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
                      {settings?.address ? (
                        <p className="whitespace-pre-wrap text-sm text-gray-700 max-w-sm">{settings.address}</p>
                      ) : (
                        <>
                          <p className="font-bold text-sm mb-1">INVENQ</p>
                          <p className="text-sm">Room No: 122, Building Name, 1st Floor</p>
                          <p className="text-sm">Main Road, City, State - 123456</p>
                          <p className="text-sm">Phone: +91 98765 43210 | Email: info@yourcompany.com</p>
                          <p className="text-sm">Web: www.yourcompany.com</p>
                        </>
                      )}
                      {settings?.gstin && <p className="font-bold text-sm mt-1">GST: {settings.gstin}</p>}
                    </div>
                  </div>
                  <div className="text-right mt-0">
                    <h2 className="text-2xl font-black uppercase text-black mb-4">PURCHASE RETURN</h2>
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Return No:</td>
                          <td className="text-right">{pr.returnNumber}</td>
                        </tr>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Return Date:</td>
                          <td className="text-right">{new Date(pr.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                        {pr.originalBillId && (
                          <tr>
                            <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Original Bill No:</td>
                            <td className="text-right">{pr.originalBillId.billNumber}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="h-px bg-gray-300 w-full mb-4 z-10 relative"></div>

                <div className="pb-2 z-10 relative">
                  <div className="text-xs">
                    <h3 className="font-bold text-sm mb-1 border-b border-gray-200 pb-1 w-1/2">Returned To Supplier</h3>
                    {pr.supplierId ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">{pr.supplierId.name}</p>
                        {pr.supplierId.address ? (
                          <div className="leading-relaxed max-w-sm text-gray-700">
                            {pr.supplierId.address.street && <p>{pr.supplierId.address.street}</p>}
                            {(pr.supplierId.address.city || pr.supplierId.address.state || pr.supplierId.address.pincode) && (
                              <p>
                                {[
                                  pr.supplierId.address.city,
                                  pr.supplierId.address.state,
                                  pr.supplierId.address.pincode
                                ].filter(Boolean).join(", ")}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">Address not provided</p>
                        )}
                        <p className="pt-0.5">Phone: {pr.supplierId.phone}</p>
                      </div>
                    ) : (
                      <p className="font-bold text-sm">Unknown Supplier</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Table - Hide if empty footer page */}
            {chunk.length > 0 && (
              <div className="mt-2 z-10 relative">
                <h3 className="font-bold text-sm mb-2">Product Details {pdfChunks.length > 1 ? \`(Page \${pageIndex + 1} of \${pdfChunks.length})\` : ''}</h3>
                <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-1.5 font-bold">Product Name</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-20">Return Qty</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-24">Price (Rs)</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-16">GST %</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-28">Total (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-1.5">
                          <div className="font-semibold">{item.productId?.name || 'Unknown Product'}</div>
                        </td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-1.5 text-right">{item.purchasePrice.toFixed(2)}</td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.gstPercent}%</td>
                        <td className="border border-gray-300 p-1.5 text-right font-medium">
                          {(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer ONLY on the last page */}
            {pageIndex === pdfChunks.length - 1 && (
              <div className="mt-4 z-10 relative flex flex-col flex-1">
                {/* Refund Summary */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2">Refund Summary</h3>
                  <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5 font-bold bg-gray-50">Description</td>
                        <td className="border border-gray-300 p-1.5 font-bold text-right bg-gray-50 w-32">Amount</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Subtotal Returned</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {pr.subTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Total GST Returned</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {pr.totalGst.toFixed(2)}</td>
                      </tr>
                      {pr.roundOff !== 0 && (
                        <tr>
                          <td className="border border-gray-300 p-1.5">Round Off</td>
                          <td className="border border-gray-300 p-1.5 text-right">Rs. {pr.roundOff.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-300 p-1.5 font-bold">Total Refund/Debit</td>
                        <td className="border border-gray-300 p-1.5 text-right font-bold">Rs. {pr.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terms & Conditions */}
                <div className="flex flex-row gap-8 mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm mb-1">Terms & Conditions:</h3>
                      <ol className="text-[10px] leading-tight space-y-1 text-gray-800 list-decimal pl-4">
                        <li>Goods returned as per mutual agreement/authorization.</li>
                        <li>Credit note to be issued against this return immediately.</li>
                        <li>All discrepancies in quantity must be reported immediately.</li>
                        <li>Subject to local jurisdiction only.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-4 flex justify-between items-end pb-2">
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Supplier Signature
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}`
  },
  {
    path: 'src/pages/Quotations/QuotationDetail.jsx',
    importTarget: 'import { Button } from "../../components/ui/Button";',
    iconsTarget: "import { Printer, FileText, Receipt } from 'lucide-react';",
    dataProp: 'quotation',
    pdfName: 'Quotation-${quotation.quotationNumber}.pdf',
    buttonTarget: `<Button onClick={() => window.print()}>\n          <Printer className="mr-2 h-4 w-4" /> Print Quotation\n        </Button>`,
    hiddenContent: `{/* Header always on top of FIRST page only */}
            {pageIndex === 0 && (
              <>
                <div className="flex justify-between items-start mb-4 z-10 relative">
                  <div className="flex gap-4">
                    <img src="/logo.png" alt="Company Logo" className="h-16 object-contain" />
                    <div>
                      <h1 className="text-xl font-bold text-black mb-1">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
                      {settings?.address ? (
                        <p className="whitespace-pre-wrap text-sm text-gray-700 max-w-sm">{settings.address}</p>
                      ) : (
                        <>
                          <p className="font-bold text-sm mb-1">INVENQ</p>
                          <p className="text-sm">Room No: 122, Building Name, 1st Floor</p>
                          <p className="text-sm">Main Road, City, State - 123456</p>
                          <p className="text-sm">Phone: +91 98765 43210 | Email: info@yourcompany.com</p>
                          <p className="text-sm">Web: www.yourcompany.com</p>
                        </>
                      )}
                      {settings?.gstin && <p className="font-bold text-sm mt-1">GST: {settings.gstin}</p>}
                    </div>
                  </div>
                  <div className="text-right mt-0">
                    <h2 className="text-2xl font-black uppercase text-black mb-4">TAX QUOTATION</h2>
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Quotation No:</td>
                          <td className="text-right">{quotation.quotationNumber}</td>
                        </tr>
                        <tr>
                          <td className="font-bold pr-4 py-0.5 whitespace-nowrap">Quotation Date:</td>
                          <td className="text-right">{new Date(quotation.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="h-px bg-gray-300 w-full mb-4 z-10 relative"></div>

                <div className="pb-2 z-10 relative">
                  <div className="text-xs">
                    <h3 className="font-bold text-sm mb-1 border-b border-gray-200 pb-1 w-1/2">Billed To</h3>
                    {quotation.customerId ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">{quotation.customerId.name}</p>
                        <p className="whitespace-pre-wrap leading-relaxed max-w-sm">{quotation.customerId.address || 'Address not provided'}</p>
                        <p className="pt-0.5">Phone: {quotation.customerId.phone}</p>
                      </div>
                    ) : (
                      <p className="font-bold text-sm">Walk-in Customer</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Table - Hide if empty footer page */}
            {chunk.length > 0 && (
              <div className="mt-2 z-10 relative">
                <h3 className="font-bold text-sm mb-2">Product Details {pdfChunks.length > 1 ? \`(Page \${pageIndex + 1} of \${pdfChunks.length})\` : ''}</h3>
                <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 p-1.5 font-bold">Product Name</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-16">Qty</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-24">Price (Rs)</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-center w-16">GST %</th>
                      <th className="border border-gray-300 p-1.5 font-bold text-right w-28">Total (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-1.5">
                          <div className="font-semibold">{item.productId?.name || 'Unknown Product'}</div>
                          {item.productId?.brand && <div className="text-[10px] text-gray-500 mt-0.5">Brand: {item.productId.brand}</div>}
                        </td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-1.5 text-right">{item.sellingPrice.toFixed(2)}</td>
                        <td className="border border-gray-300 p-1.5 text-center">{item.gstPercent}%</td>
                        <td className="border border-gray-300 p-1.5 text-right">{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer ONLY on the last page */}
            {pageIndex === pdfChunks.length - 1 && (
              <div className="mt-4 z-10 relative flex flex-col flex-1">
                {/* Charges Summary */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2">Charges Summary</h3>
                  <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 p-1.5 font-bold">Description</th>
                        <th className="border border-gray-300 p-1.5 font-bold text-right w-40">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Subtotal</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {quotation.subTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Total GST</td>
                        <td className="border border-gray-300 p-1.5 text-right">Rs. {quotation.totalGst.toFixed(2)}</td>
                      </tr>
                      {quotation.roundOff !== 0 && (
                        <tr>
                          <td className="border border-gray-300 p-1.5">Round Off</td>
                          <td className="border border-gray-300 p-1.5 text-right">Rs. {quotation.roundOff.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-300 p-1.5 bg-gray-50 font-bold">Grand Total</td>
                        <td className="border border-gray-300 p-1.5 bg-gray-50 text-right font-bold">Rs. {quotation.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bank Details & Terms */}
                <div className="flex flex-row gap-8 mb-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm mb-1">Bank Details</h3>
                      <table className="w-full border-collapse border border-gray-300 text-xs text-left">
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-1 font-bold bg-gray-50 w-32 text-gray-600">Account Holder</td>
                            <td className="border border-gray-300 p-1">{settings?.bankDetails?.accountName || settings?.name || "YOUR COMPANY PRIVATE LIMITED"}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-1 font-bold bg-gray-50 text-gray-600">Account Number</td>
                            <td className="border border-gray-300 p-1">{settings?.bankDetails?.accountNumber || "50200116941777"}</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 p-1 font-bold bg-gray-50 text-gray-600">IFSC Code</td>
                            <td className="border border-gray-300 p-1">{settings?.bankDetails?.ifscCode || "HDFC0002321"}</td>
                          </tr>
                          {settings?.bankDetails?.bankName && (
                            <tr>
                              <td className="border border-gray-300 p-1 font-bold bg-gray-50 text-gray-600">Bank Name</td>
                              <td className="border border-gray-300 p-1">{settings.bankDetails.bankName} {settings.bankDetails.branch ? \`(\${settings.bankDetails.branch})\` : ''}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-sm mb-1">Terms & Conditions:</h3>
                      {settings?.defaultTerms ? (
                        <div className="text-[10px] leading-relaxed text-gray-800 whitespace-pre-wrap max-w-md">
                          {settings.defaultTerms}
                        </div>
                      ) : (
                        <ol className="text-[10px] leading-tight space-y-1 text-gray-800 list-decimal pl-4">
                          <li>Goods once sold will not be taken back without proper authorization.</li>
                          <li>Interest @ 18% p.a. will be charged if payment is delayed beyond due date.</li>
                          <li>Our responsibility ceases once goods leave our premises.</li>
                          <li>Any discrepancies must be reported within 48 hours of delivery.</li>
                          <li>GST is applicable as per Indian taxation laws.</li>
                          <li>Subject to local jurisdiction only.</li>
                        </ol>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-32 flex items-center justify-center relative">
                    {quotation.status === 'Paid' && (
                      <div className="border-[2px] border-green-500 text-green-500 rounded-full w-24 h-24 flex items-center justify-center font-bold text-xl tracking-widest rotate-[-20deg] opacity-80">
                        PAID
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-4 flex justify-between items-end pb-2">
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Customer Signature
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="border-t border-gray-400 pt-1 text-center text-xs font-semibold">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}`
  }
];

configs.forEach(c => patchFile(c.path, c));
