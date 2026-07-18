
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPurchaseBillByIdQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import {  Printer , ShoppingCart } from 'lucide-react';
import { BackButton } from "../../components/ui/BackButton";
import { PaginationControls } from "../../components/ui/PaginationControls";

export const PurchaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPurchaseBillByIdQuery(id);
  const bill = data?.data?.purchaseBill;
  const settings = data?.data?.settings;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const tableRef = useRef(null);

  if (isLoading) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;
  if (!bill) return <div className="p-8 text-center text-red-500">Purchase Bill not found</div>;

  const handlePageChange = (page) => {
    if (page === '...') return;
    setCurrentPage(page);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const totalPages = Math.ceil(bill.items.length / itemsPerPage);
  const paginatedItems = bill.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4 max-w-[794px] mx-auto pb-8 print:max-w-none print:mx-0 print:pb-0 print:space-y-0 print:min-h-[99vh] print:flex print:flex-col">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <BackButton />
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print Bill
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-black print:p-0 print:border-none print:shadow-none print:bg-transparent">
        <div className="flex justify-between items-start mb-6">
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

          <div className="h-px bg-gray-300 w-full mb-4"></div>

          {/* Addresses */}
          <div className="pb-4 print:break-inside-avoid">
            <div className="text-xs">
              <h3 className="font-bold text-sm mb-2 border-b border-gray-200 pb-1 w-1/2">Supplier Details</h3>
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

          {/* Product Details Table (SCREEN ONLY - PAGINATED) */}
          <div className="mt-2 print:hidden" ref={tableRef}>
            <h3 className="font-bold text-sm mb-2">Product Details</h3>
            <div className="min-h-[400px]">
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
                  {paginatedItems.map((item, i) => (
                    <tr key={i} className="print:break-inside-avoid">
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, bill.items.length)} of {bill.items.length} entries
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
                  <th className="border border-gray-300 p-1.5 font-bold text-center w-16">Qty</th>
                  <th className="border border-gray-300 p-1.5 font-bold text-right w-24">Price (Rs)</th>
                  <th className="border border-gray-300 p-1.5 font-bold text-center w-16">GST %</th>
                  <th className="border border-gray-300 p-1.5 font-bold text-right w-28">Total (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} className="print:break-inside-avoid">
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

          {/* Charges Summary */}
          <div className="mt-4 print:break-inside-avoid">
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
          <div className="mt-4 flex flex-row gap-8 print:break-inside-avoid">
            <div className="flex-1 space-y-4">

              <div className="print:break-inside-avoid">
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
  );
};
