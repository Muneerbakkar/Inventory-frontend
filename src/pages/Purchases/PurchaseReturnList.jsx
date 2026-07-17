import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPurchaseReturnsQuery, useDeletePurchaseReturnMutation } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Trash2, Eye, Edit, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export const PurchaseReturnList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: returnsData, isLoading, isError } = useGetPurchaseReturnsQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();

  const returns = returnsData?.data?.purchaseReturns || [];

  const handleDelete = async (id, returnNumber) => {
    toast(
      (t) => (
        <div className="flex w-full flex-col gap-3 text-left">
          <p className="text-base font-semibold">Delete return <span className="font-bold">{returnNumber}</span>?</p>
          <p className="text-sm text-muted-foreground">This action will rollback stock and delete the drafted debit note. This cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deletePurchaseReturn(id).unwrap();
                  toast.success("Purchase return deleted and stock rolled back!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete return.");
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Returns</h1>
        <Button onClick={() => navigate("/purchase-returns/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Return
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by return number or supplier name..."
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
              className="rounded-md border border-input bg-background pl-3 pr-9 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Calendar 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => startDateRef.current?.showPicker()}
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <div className="relative flex items-center w-full sm:w-auto">
            <input 
              type="date" 
              ref={endDateRef}
              className="rounded-md border border-input bg-background pl-3 pr-9 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
            <Calendar 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
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
              <th className="p-4 font-medium">Return No</th>
              <th className="p-4 font-medium">Original Bill</th>
              <th className="p-4 font-medium">Supplier</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">Amount Returned</th>
              <th className="p-4 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-destructive">Failed to load purchase returns.</td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">No purchase returns found</td>
              </tr>
            ) : (
              returns.map((ret) => (
                <tr key={ret._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td data-label="Return No" className="p-4 font-medium">{ret.returnNumber}</td>
                  <td data-label="Original Bill" className="p-4">{ret.originalBillId?.billNumber || '-'}</td>
                  <td data-label="Supplier" className="p-4">{ret.supplierId?.name || '-'}</td>
                  <td data-label="Date" className="p-4 text-right sm:text-left">
                    <div className="flex flex-col sm:flex-col">
                      <span>{new Date(ret.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(ret.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </td>
                  <td data-label="Amount Returned" className="p-4 text-right font-medium text-red-600">₹{ret.grandTotal.toFixed(2)}</td>
                  <td data-label="Action" className="p-4 text-right sm:text-center">
                    <div className="flex items-center justify-end sm:justify-center gap-2 -mr-2 sm:mr-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/purchase-returns/${ret._id}`)} title="View Return">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/purchase-returns/${ret._id}/edit`)} title="Edit Return">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(ret._id, ret.returnNumber)} title="Delete Return">
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

      {returnsData?.pagination && returnsData.pagination.pages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
                    <div className="flex items-center gap-1">
            {Array.from({ length: returnsData.pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === returnsData.pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
