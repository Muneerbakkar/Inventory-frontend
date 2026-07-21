import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPurchaseBillsQuery, useUpdatePurchasePaymentStatusMutation, useDeletePurchaseBillMutation } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {  Plus, Trash2, Eye, Edit, Search, Calendar , ShoppingCart , X } from 'lucide-react';
import toast from "react-hot-toast";

const PartialAmountToast = ({ t, bill, updatePayment, revertSelect }) => {
  const [amountPaid, setAmountPaid] = useState(bill.amountPaid || 0);

  const handleSave = async () => {
    const amt = Number(amountPaid);
    if (isNaN(amt) || amt < 0 || amt > bill.grandTotal) {
      toast.error(`Please enter a valid amount between 0 and ${bill.grandTotal}`);
      return;
    }
    
    toast.dismiss(t.id);
    try {
      await updatePayment({ id: bill._id, status: 'Partial', amountPaid: amt }).unwrap();
      toast.success("Payment status updated!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update payment status.");
      revertSelect();
    }
  };

  const handleCancel = () => {
    toast.dismiss(t.id);
    revertSelect();
  };

  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <p className="text-base font-semibold">Partial Payment</p>
      <p className="text-sm text-muted-foreground">Enter the amount paid for <span className="font-bold">{bill.billNumber}</span>. (Max: ₹{bill.grandTotal})</p>
      
      <div className="flex flex-col gap-2 mt-1">
        <input 
          type="number" 
          className="w-full rounded border px-3 py-2 text-sm bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          max={bill.grandTotal}
          min={0}
          autoFocus
        />
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 rounded border px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const PurchaseList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: billsData, isLoading, isError } = useGetPurchaseBillsQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [updatePayment] = useUpdatePurchasePaymentStatusMutation();
  const [deletePurchaseBill] = useDeletePurchaseBillMutation();

  const bills = billsData?.data?.purchaseBills || [];

  const handleDelete = async (id, billNumber) => {
    toast(
      (t) => (
        <div className="flex w-full flex-col gap-3 text-left">
          <p className="text-base font-semibold">Delete bill <span className="font-bold">{billNumber}</span>?</p>
          <p className="text-sm text-muted-foreground">This action will rollback stock. This cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deletePurchaseBill(id).unwrap();
                  toast.success("Purchase bill deleted and stock rolled back!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete bill.");
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

  const handleStatusSelect = async (e, bill) => {
    const newStatus = e.target.value;
    const selectElement = e.target;
    
    if (newStatus === bill.status) return;

    if (newStatus === 'Partial') {
      toast(
        (t) => (
          <PartialAmountToast 
            t={t} 
            bill={bill} 
            updatePayment={updatePayment} 
            revertSelect={() => { selectElement.value = bill.status; }} 
          />
        ),
        { 
          duration: Infinity, 
          position: "top-center",
          style: { minWidth: "320px", padding: "20px 24px", alignItems: "flex-start" }
        }
      );
      return;
    }

    try {
      await updatePayment({ id: bill._id, status: newStatus }).unwrap();
      toast.success("Payment status updated!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update payment status.");
      selectElement.value = bill.status;
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Bills" description="Manage your purchase orders." icon={ShoppingCart}>
        <Button onClick={() => navigate("/purchases/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Bill
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by bill number or supplier name..."
            className="pl-9 pr-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
{search && (
  <button
    onClick={() => {
      setSearch("");
      setPage(1);
    }}
    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none flex items-center justify-center"
    title="Clear search"
  >
    <X className="h-4 w-4" />
  </button>
)}
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
              <th className="p-4 font-medium">Bill No</th>
              <th className="p-4 font-medium">Supplier</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium text-right">Amount (₹)</th>
              <th className="p-4 font-medium text-right">Balance Due (₹)</th>
              <th className="p-4 font-medium text-right">Status</th>
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
                <td colSpan={7} className="p-4 text-center text-destructive">Failed to load purchase bills.</td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">No purchase bills found</td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td data-label="Bill No" className="p-4 font-medium">{bill.billNumber}</td>
                  <td data-label="Supplier" className="p-4">{bill.supplierId?.name || '-'}</td>
                  <td data-label="Date" className="p-4 text-right sm:text-left">
                    <div className="flex flex-col sm:flex-col">
                      <span>{new Date(bill.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(bill.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </td>
                  <td data-label="Amount (₹)" className="p-4 text-right font-medium text-green-600">{bill.grandTotal.toFixed(2)}</td>
                  <td data-label="Balance Due (₹)" className="p-4 text-right text-orange-500">{bill.balanceDue.toFixed(2)}</td>
                  <td data-label="Status" className="p-4 text-right">
                    <select
                      value={bill.status}
                      onChange={(e) => handleStatusSelect(e, bill)}
                      className={`h-8 rounded-md border text-xs font-semibold px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${bill.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : bill.status === 'Partial' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'}`}
                    >
                      <option value="Pending" className="bg-background text-foreground">Pending</option>
                      <option value="Partial" className="bg-background text-foreground">Partial</option>
                      <option value="Paid" className="bg-background text-foreground">Paid</option>
                    </select>
                  </td>
                  <td data-label="Action" className="p-4 text-right sm:text-center">
                    <div className="flex items-center justify-end sm:justify-center gap-2 -mr-2 sm:mr-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/purchases/${bill._id}`)} title="View Bill">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/purchases/${bill._id}/edit`)} title="Edit Bill">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(bill._id, bill.billNumber)} title="Delete Bill">
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

      {billsData?.pagination && billsData.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={billsData.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

