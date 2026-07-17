import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGetQuotationsQuery, useConvertToInvoiceMutation, useDeleteQuotationMutation, useUpdateQuotationStatusMutation } from "../../features/quotations/quotationsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, ArrowRightLeft, Eye, Edit, Trash2, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export const QuotationList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: quotationsData, isLoading, isError } = useGetQuotationsQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [convertToInvoice, { isLoading: isConverting }] = useConvertToInvoiceMutation();
  const [deleteQuotation] = useDeleteQuotationMutation();
  const [updateQuotationStatus] = useUpdateQuotationStatusMutation();

  const quotations = quotationsData?.data?.quotations || [];

  const handleConvert = async (id, quotationNumber) => {
    try {
      await convertToInvoice({ id, data: { paymentMode: 'Cash', amountPaid: 0, commissionDetails: 0 } }).unwrap();
      toast.success(`Quotation ${quotationNumber} successfully converted to Invoice!`);
      navigate('/sales');
    } catch (err) {
      toast.error(err?.data?.message || "Failed to convert quotation. Check stock availability.");
    }
  };

  const handleDelete = async (id, quotationNumber) => {
    toast(
      (t) => (
        <div className="flex w-full flex-col gap-3 text-left">
          <p className="text-base font-semibold">Delete quotation <span className="font-bold">{quotationNumber}</span>?</p>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteQuotation(id).unwrap();
                  toast.success("Quotation deleted!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete quotation.");
                }
              }}
              className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { 
        duration: Infinity, 
        position: "top-center",
        style: { minWidth: "360px", padding: "20px 24px", alignItems: "flex-start" }
      }
    );
  };

  const handleStatusChange = async (id, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;
    if (newStatus === 'Converted') {
        toast.error("Cannot set status to Converted manually. Please use the Convert button.");
        return;
    }
    try {
      await updateQuotationStatus({ id, status: newStatus }).unwrap();
      toast.success(`Quotation marked as ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || "Error updating status");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
        <Button onClick={() => navigate("/quotations/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Quotation
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by quotation number or customer name..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-auto">
            <input 
              type="date" 
              ref={startDateRef}
              className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => startDateRef.current?.showPicker()}
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <div className="relative flex items-center w-full sm:w-auto">
            <input 
              type="date" 
              ref={endDateRef}
              className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => endDateRef.current?.showPicker()}
            />
          </div>
          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card responsive-table overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="p-4 font-medium">Quotation No</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Valid Till</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-destructive">Failed to load quotations.</td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">No quotations found</td>
              </tr>
            ) : (
              quotations.map((qt) => (
                <tr key={qt._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td data-label="Quotation No" className="p-4 font-medium">{qt.quotationNumber}</td>
                  <td data-label="Customer" className="p-4">{qt.customerId?.name || '-'}</td>
                  <td data-label="Date" className="p-4 text-right sm:text-left">
                    <div className="flex flex-col sm:flex-col">
                      <span>{new Date(qt.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(qt.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </td>
                  <td data-label="Valid Till" className="p-4 text-right sm:text-left">
                    {qt.validTillDate ? (
                      <div className="flex flex-col sm:flex-col">
                        <span>{new Date(qt.validTillDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span className="text-xs text-muted-foreground">{new Date(qt.validTillDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td data-label="Amount" className="p-4 text-right font-medium">₹{qt.grandTotal.toFixed(2)}</td>
                  <td data-label="Status" className="p-4 text-right sm:text-center">
                    <select
                      className={`h-8 rounded-md border text-xs font-semibold px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${
                        qt.status === 'Converted' ? 'bg-green-100 text-green-700 border-green-200' :
                        qt.status === 'Pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        qt.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                      value={qt.status}
                      onChange={(e) => handleStatusChange(qt._id, e.target.value, qt.status)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending</option>
                      <option value="Converted">Converted</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td data-label="Action" className="p-4 text-right sm:text-center">
                    <div className="flex items-center justify-end sm:justify-center gap-2 -mr-2 sm:mr-0">
                      {qt.status === 'Pending' ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" 
                          onClick={() => handleConvert(qt._id, qt.quotationNumber)}
                          disabled={isConverting}
                          title="Convert to Invoice"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="h-8 w-8" aria-hidden="true"></div>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/quotations/${qt._id}`)} title="View Quotation">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/quotations/${qt._id}/edit`)} title="Edit Quotation">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(qt._id, qt.quotationNumber)} title="Delete Quotation">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {quotationsData?.pagination && quotationsData.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={quotationsData.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

