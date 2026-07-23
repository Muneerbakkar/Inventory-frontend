import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPurchaseReturnByIdQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Printer, Download } from 'lucide-react';
import { BackButton } from "../../components/ui/BackButton";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { toPng } from 'html-to-image';
import { jsPDF } from "jspdf";

export const PurchaseReturnView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPurchaseReturnByIdQuery(id);
  const pr = data?.data?.purchaseReturn;
  const settings = data?.data?.settings;

  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const itemsPerPage = 20;
  const tableRef = useRef(null);

  if (isLoading) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;
  if (!pr) return <div className="p-8 text-center text-red-500">Purchase Return not found</div>;

  const handlePageChange = (page) => {
    if (page === '...') return;
    setCurrentPage(page);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const totalPages = Math.ceil(pr.items.length / itemsPerPage);
  const paginatedItems = pr.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // PDF Chunking Logic
  const MAX_LOGO_FOOTER = 10;
  const MAX_LOGO_NO_FOOTER = 16;
  const MAX_NO_LOGO_FOOTER = 14;
  const MAX_NO_LOGO_NO_FOOTER = 20;

  const pdfChunks = [];
  let requiresEmptyFooterPage = false;

  if (pr?.items) {
    let itemsAdded = 0;
    let isFirstPage = true;
    
    while (itemsAdded < pr.items.length) {
      let capacity;
      const remaining = pr.items.length - itemsAdded;

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
      
      const chunk = pr.items.slice(itemsAdded, itemsAdded + capacity);
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
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfPageHeight = 297; // A4 height in mm
      
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
        
        if (imgHeight > pdfPageHeight) {
          const ratio = pdfPageHeight / imgHeight;
          imgHeight = pdfPageHeight;
          imgWidth = imgWidth * ratio;
        }
        
        if (i > 0) pdf.addPage();
        
        const xOffset = (pdfWidth - imgWidth) / 2;
        pdf.addImage(dataUrl, 'PNG', xOffset, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`PurchaseReturn-${pr.returnNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[794px] mx-auto pb-8 print:w-[794px] print:max-w-[794px] print:mx-auto print:pb-0 print:space-y-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <BackButton />
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} disabled={isDownloading} variant="outline">
            <Download className="mr-2 h-4 w-4" /> 
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Return
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-black print:hidden flex flex-col min-h-[800px]">
        <div className="flex justify-between items-start mb-6 z-10 relative">
          <div className="flex gap-4">
            <img src="/logo-2.png" alt="Company Logo" className="h-16 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-black mb-1">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
              {settings?.address ? (
                  <p className="whitespace-pre-wrap text-sm text-gray-700 max-w-sm">{settings.address}</p>
                ) : (
                <>
                  <p className="font-bold text-sm mb-1">Archie</p>
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

        <div className="h-px bg-gray-500 w-full mb-4 z-10 relative"></div>

        {/* Addresses */}
        <div className="pb-4 z-10 relative">
          <div className="text-xs">
            <h3 className="font-bold text-sm mb-2 border-b border-gray-500 pb-1 w-1/2">Returned To Supplier</h3>
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

        {/* Product Details Table (SCREEN ONLY - PAGINATED) */}
        <div className="mt-2 z-10 relative" ref={tableRef}>
          <h3 className="font-bold text-sm mb-2">Product Details</h3>
          <div className="min-h-[400px]">
            <table className="w-full border-collapse border border-gray-400 text-xs text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-400 p-1.5 font-bold">Product Name</th>
                  <th className="border border-gray-400 p-1.5 font-bold text-center w-20">Return Qty</th>
                  <th className="border border-gray-400 p-1.5 font-bold text-right w-24">Price (Rs)</th>
                  <th className="border border-gray-400 p-1.5 font-bold text-center w-16">GST %</th>
                  <th className="border border-gray-400 p-1.5 font-bold text-right w-28">Total (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, i) => (
                  <tr key={i}>
                    <td className="border border-gray-400 p-1.5">
                      <div className="font-semibold">{item.productId?.name || 'Unknown Product'}</div>
                    </td>
                    <td className="border border-gray-400 p-1.5 text-center">{item.quantity}</td>
                    <td className="border border-gray-400 p-1.5 text-right">{item.purchasePrice.toFixed(2)}</td>
                    <td className="border border-gray-400 p-1.5 text-center">{item.gstPercent}%</td>
                    <td className="border border-gray-400 p-1.5 text-right font-medium">
                      {(item.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border border-gray-400 p-4 text-center text-gray-500">No items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <span className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, pr.items.length)} of {pr.items.length} entries
              </span>
              <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                theme="dark"
              />
            </div>
          )}
        </div>

        {/* Charges Summary Table */}
        <div className="mt-6 z-10 relative">
          <h3 className="font-bold text-sm mb-2">Refund Summary</h3>
          <table className="w-full border-collapse border border-gray-400 text-xs text-left">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-1.5 font-bold bg-gray-50">Description</td>
                <td className="border border-gray-400 p-1.5 font-bold text-right bg-gray-50 w-32">Amount</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1.5">Subtotal Returned</td>
                <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.subTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1.5">Total GST Returned</td>
                <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.totalGst.toFixed(2)}</td>
              </tr>
              {pr.roundOff !== 0 && (
                <tr>
                  <td className="border border-gray-400 p-1.5">Round Off</td>
                  <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.roundOff.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 p-1.5 font-bold">Total Refund/Debit</td>
                <td className="border border-gray-400 p-1.5 text-right font-bold">Rs. {pr.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-6 flex flex-row gap-8 z-10 relative">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-bold text-sm mb-1">Terms & Conditions:</h3>
              <ol className="text-xs leading-tight space-y-1 text-gray-800 list-decimal pl-4">
                <li>Goods returned as per mutual agreement/authorization.</li>
                <li>Credit note to be issued against this return immediately.</li>
                <li>All discrepancies in quantity must be reported immediately.</li>
                <li>Subject to local jurisdiction only.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 flex justify-between items-end pb-2 z-10 relative">
          <div className="w-48">
            <div className="border-t border-gray-800 pt-1 text-center text-xs font-semibold">
              Supplier Signature
            </div>
          </div>
          <div className="w-48">
            <div className="border-t border-gray-800 pt-1 text-center text-xs font-semibold">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      {/* 
        =======================================================================
        HIDDEN PDF TEMPLATES (USED EXCLUSIVELY FOR PERFECT HTML-TO-IMAGE PDF)
        =======================================================================
      */}
      <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none z-[-9999] overflow-hidden print:static print:opacity-100 print:pointer-events-auto print:z-auto print:overflow-visible">
        {pdfChunks.map((chunk, pageIndex) => (
          <div 
            key={`pdf-page-${pageIndex}`}
            className={`pdf-render-page bg-white text-black flex flex-col px-10 py-4 w-[794px] print:w-[210mm] h-auto relative overflow-hidden ${pageIndex < pdfChunks.length - 1 ? 'print:break-after-page' : ''}`}
          >
            {/* Header always on top of FIRST page only */}
            {pageIndex === 0 && (
              <>
                <div className="flex justify-between items-start mb-2 z-10 relative">
                  <div className="flex gap-4">
                    <img src="/logo-2.png" alt="Company Logo" className="h-16 object-contain" />
                    <div>
                      <h1 className="text-xl font-bold text-black mb-1">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
                      {settings?.address ? (
                          <p className="whitespace-pre-wrap text-sm text-gray-700 max-w-sm">{settings.address}</p>
                        ) : (
                        <>
                          <p className="font-bold text-sm mb-1">Archie</p>
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

                <div className="h-px bg-gray-500 w-full mb-2 z-10 relative"></div>

                {/* Addresses */}
                <div className="pb-1 z-10 relative">
                  <div className="text-xs">
                    <h3 className="font-bold text-sm mb-1 border-b border-gray-500 pb-1 w-1/2">Returned To Supplier</h3>
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
                <h3 className="font-bold text-sm mb-2">Product Details {pdfChunks.length > 1 ? `(Page ${pageIndex + 1} of ${pdfChunks.length})` : ''}</h3>
                <table className="w-full border-collapse border border-gray-400 text-xs text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-400 py-1 px-1.5 font-bold">Product Name</th>
                      <th className="border border-gray-400 py-1 px-1.5 font-bold text-center w-20">Return Qty</th>
                      <th className="border border-gray-400 py-1 px-1.5 font-bold text-right w-24">Price (Rs)</th>
                      <th className="border border-gray-400 py-1 px-1.5 font-bold text-center w-16">GST %</th>
                      <th className="border border-gray-400 py-1 px-1.5 font-bold text-right w-28">Total (Rs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-gray-400 py-1 px-1.5">
                          <div className="font-semibold">{item.productId?.name || 'Unknown Product'}</div>
                        </td>
                        <td className="border border-gray-400 py-1 px-1.5 text-center">{item.quantity}</td>
                        <td className="border border-gray-400 py-1 px-1.5 text-right">{item.purchasePrice.toFixed(2)}</td>
                        <td className="border border-gray-400 py-1 px-1.5 text-center">{item.gstPercent}%</td>
                        <td className="border border-gray-400 py-1 px-1.5 text-right font-medium">
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
              <div className="mt-2 z-10 relative flex flex-col flex-1">
                {/* Charges Summary Table */}
                <div className="mb-2">
                  <h3 className="font-bold text-sm mb-1">Refund Summary</h3>
                  <table className="w-full border-collapse border border-gray-400 text-xs text-left">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-1.5 font-bold bg-gray-50">Description</td>
                        <td className="border border-gray-400 p-1.5 font-bold text-right bg-gray-50 w-32">Amount</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-1.5">Subtotal Returned</td>
                        <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.subTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-1.5">Total GST Returned</td>
                        <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.totalGst.toFixed(2)}</td>
                      </tr>
                      {pr.roundOff !== 0 && (
                        <tr>
                          <td className="border border-gray-400 p-1.5">Round Off</td>
                          <td className="border border-gray-400 p-1.5 text-right">Rs. {pr.roundOff.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-400 p-1.5 font-bold">Total Refund/Debit</td>
                        <td className="border border-gray-400 p-1.5 text-right font-bold">Rs. {pr.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Terms & Conditions */}
                <div className="flex flex-row gap-8 mb-2">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-bold text-sm mb-1">Terms & Conditions:</h3>
                      <ol className="text-[10px] leading-tight text-gray-800 list-decimal pl-4">
                        <li>Goods returned as per mutual agreement/authorization.</li>
                        <li>Credit note to be issued against this return immediately.</li>
                        <li>All discrepancies in quantity must be reported immediately.</li>
                        <li>Subject to local jurisdiction only.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-10 flex justify-between items-end pb-2">
                  <div className="w-48">
                    <div className="border-t border-gray-800 pt-1 text-center text-xs font-semibold">
                      Supplier Signature
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="border-t border-gray-800 pt-1 text-center text-xs font-semibold">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

