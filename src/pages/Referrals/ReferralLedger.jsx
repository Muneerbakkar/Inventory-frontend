import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useGetReferralsQuery, useUpdateReferralMutation, useDeleteReferralMutation } from "../../features/referrals/referralsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {  Edit, Trash2, Search, Calendar , UsersRound } from 'lucide-react';
import toast from "react-hot-toast";

const PartialAmountToast = ({ t, refPerson, updateReferral, revertSelect }) => {
  const [amountPaid, setAmountPaid] = useState(refPerson.totalPaid || 0);

  const handleSave = async () => {
    const amt = Number(amountPaid);
    if (isNaN(amt) || amt < 0 || amt > refPerson.totalCommissionEarned) {
      toast.error(`Please enter a valid amount between 0 and ${refPerson.totalCommissionEarned}`);
      return;
    }
    
    toast.dismiss(t.id);
    try {
      await updateReferral({ id: refPerson._id, data: { status: 'Partial', totalPaid: amt } }).unwrap();
      toast.success("Referral payment updated!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update referral payment.");
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
      <p className="text-sm text-muted-foreground">Enter the commission paid for <span className="font-bold">{refPerson.name}</span>. (Max: ₹{refPerson.totalCommissionEarned})</p>
      
      <div className="flex flex-col gap-2 mt-1">
        <input 
          type="number" 
          className="w-full rounded border px-3 py-2 text-sm bg-background text-foreground border-input focus:outline-none focus:ring-2 focus:ring-ring"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          max={refPerson.totalCommissionEarned}
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

export const ReferralLedger = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: referralsData, isLoading, isError } = useGetReferralsQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [updateReferral] = useUpdateReferralMutation();
  const [deleteReferral] = useDeleteReferralMutation();

  const referrals = referralsData?.data?.referrals || [];

  const handleStatusChange = async (ref, newStatus, selectElement) => {
    if (newStatus === ref.status) return;

    if (newStatus === 'Partial') {
      toast(
        (t) => (
          <PartialAmountToast 
            t={t} 
            refPerson={ref} 
            updateReferral={updateReferral} 
            revertSelect={() => { selectElement.value = ref.status || 'Pending'; }} 
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
      const updateData = { status: newStatus };
      if (newStatus === 'Settled') {
        updateData.totalPaid = ref.totalCommissionEarned;
      } else if (newStatus === 'Pending') {
        updateData.totalPaid = 0;
      }
      await updateReferral({ id: ref._id, data: updateData }).unwrap();
      toast.success(`Referral status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || "Error updating status");
      selectElement.value = ref.status || 'Pending';
    }
  };

  const handleDelete = async (id, name) => {
    toast(
      (t) => (
        <div className="flex w-full flex-col gap-3 text-left">
          <p className="text-base font-semibold">Delete <span className="font-bold">{name}</span>?</p>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteReferral(id).unwrap();
                  toast.success("Referral person deleted successfully!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete referral.");
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
      <PageHeader title="Referral Commission Ledger" description="View referral transactions." icon={UsersRound} />



      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or phone..."
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
              <th className="p-4 font-medium">Referral ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium text-right">Earned (₹)</th>
              <th className="p-4 font-medium text-right">Paid (₹)</th>
              <th className="p-4 font-medium text-right">Balance (₹)</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="h-24 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-destructive">Failed to load referrals.</td>
              </tr>
            ) : referrals.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-muted-foreground">No referral persons found</td>
              </tr>
            ) : (
              referrals.map((ref) => {
                const balance = ref.totalCommissionEarned - ref.totalPaid;
                return (
                  <tr key={ref._id} className="border-b last:border-0 hover:bg-muted/50">
                    <td data-label="Referral ID" className="p-4 font-mono text-sm text-foreground select-all">{ref.customId || "-"}</td>
                    <td data-label="Name" className="p-4 font-medium">{ref.name}</td>
                    <td data-label="Phone" className="p-4">{ref.phone || '-'}</td>
                    <td data-label="Earned (₹)" className="p-4 text-right">{ref.totalCommissionEarned.toFixed(2)}</td>
                    <td data-label="Paid (₹)" className="p-4 text-right text-green-600">{ref.totalPaid.toFixed(2)}</td>
                    <td data-label="Balance (₹)" className="p-4 text-right font-semibold text-orange-500">{balance.toFixed(2)}</td>
                    <td data-label="Status" className="p-4 text-right sm:text-center">
                      <select
                        className={`h-8 rounded-md border text-xs font-semibold px-2 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer ${
                          ref.status === 'Settled' ? 'bg-green-100 text-green-700 border-green-200' :
                          ref.status === 'Partial' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}
                        value={ref.status || 'Pending'}
                        onChange={(e) => handleStatusChange(ref, e.target.value, e.target)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Settled">Settled</option>
                      </select>
                    </td>
                    <td data-label="Actions" className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/referrals/${ref._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(ref._id, ref.name)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {referralsData?.pagination && referralsData.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={referralsData.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

