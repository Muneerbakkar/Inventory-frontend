import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPurchaseReturnByIdQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Printer } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { PaginationControls } from "../../components/ui/PaginationControls";

export const PurchaseReturnView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPurchaseReturnByIdQuery(id);
  const pr = data?.data?.purchaseReturn;
  const settings = data?.data?.settings;

  const [currentPage, setCurrentPage] = useState(1);
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

  return (
    <div className="space-y-4 max-w-[794px] mx-auto pb-8 print:max-w-none print:mx-0 print:pb-0 print:space-y-0 print:min-h-[99vh] print:flex print:flex-col">
      <div className="flex items-center justify-between print:hidden">
        <BackButton className="print:hidden" to="/purchase-returns" />
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print Return
        </Button>
      </div>

      <div className="w-full overflow-x-auto pb-4 print:pb-0 print:overflow-visible print:flex-1 print:flex print:flex-col">
        <div className="min-w-[794px] flex justify-center print:min-w-0 print:flex-1 print:flex print:flex-col">
          <div className="bg-white text-black p-4 rounded-lg shadow-sm border print:shadow-none print:border-none print:p-0 print:bg-transparent print:flex-1 print:flex print:flex-col w-[794px] print:w-auto">
        
        {/* PDF-like Outer Border Wrapper */}
        <div className="p-6 border border-gray-300 print:border-none flex flex-col min-h-[700px] print:min-h-0 print:flex-1">
          
          {/* Header */}
          <div className="flex flex-row justify-between items-start pb-4 print:break-inside-avoid">
            <div className="space-y-0.5 text-xs text-gray-800">
              <div className="flex flex-col items-start gap-2 mb-3">
                <img src="/logo.png" alt="Logo" className="h-16 w-16 rounded-md" />
                <h1 className="text-xl font-black uppercase tracking-wide text-black">{settings?.name || "YOUR COMPANY PVT. LTD."}</h1>
              </div>
              {settings?.address ? (
                <p className="whitespace-pre-wrap leading-relaxed max-w-sm">{settings.address}</p>
              ) : (
                <>
                  <p className="font-bold text-sm mb-1">INVENQ</p>
                  <p>Room No: 122, Building Name, 1st Floor</p>
                  <p>Main Road, City, State - 123456</p>
                  <p>Phone: +91 98765 43210 | Email: info@yourcompany.com</p>
                  <p>Web: www.yourcompany.com</p>
                </>
              )}
              {settings?.gstin && <p className="font-bold mt-1">GST: {settings.gstin}</p>}
              {settings?.pan && <p className="font-bold">PAN: {settings.pan}</p>}
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

          <div className="h-px bg-gray-300 w-full mb-4"></div>

          {/* Addresses */}
          <div className="pb-4 print:break-inside-avoid">
            <div className="text-xs">
              <h3 className="font-bold text-sm mb-2 border-b border-gray-200 pb-1 w-1/2">Returned To Supplier</h3>
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
          <div className="mt-2 print:hidden" ref={tableRef}>
            <h3 className="font-bold text-sm mb-2">Product Details</h3>
            <div className="min-h-[400px]">
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
                  {paginatedItems.map((item, i) => (
                    <tr key={i} className="print:break-inside-avoid">
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
                  {paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border border-gray-300 p-4 text-center text-gray-500">No items found.</td>
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

          {/* Product Details Table (PRINT ONLY - ALL ITEMS) */}
          <div className="mt-2 hidden print:block">
            <h3 className="font-bold text-sm mb-2">Product Details</h3>
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
                {pr.items.map((item, i) => (
                  <tr key={i} className="print:break-inside-avoid">
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

          {/* Charges Summary Table */}
          <div className="mt-4 print:break-inside-avoid">
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
          <div className="mt-4 flex flex-row gap-8 print:break-inside-avoid">
            <div className="flex-1 space-y-4">
              <div className="print:break-inside-avoid">
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
          <div className="mt-auto pt-16 flex justify-between items-end pb-2 print:pb-0 print:break-inside-avoid">
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
      </div>
      </div>
      </div>
    </div>
  );
};
