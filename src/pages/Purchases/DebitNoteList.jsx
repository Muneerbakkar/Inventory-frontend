import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { useGetDebitNotesQuery, useUpdateDebitNoteStatusMutation, useDeleteDebitNoteMutation } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Trash2, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export const DebitNoteList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: notesData, isLoading, isError } = useGetDebitNotesQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [updateStatus] = useUpdateDebitNoteStatusMutation();
  const [deleteDebitNote] = useDeleteDebitNoteMutation();

  const notes = notesData?.data?.debitNotes || [];

  const handleDelete = async (id, noteNumber) => {
    toast(
      (t) => (
        <div className="flex w-full flex-col gap-3 text-left">
          <p className="text-base font-semibold">Delete debit note <span className="font-bold">{noteNumber}</span>?</p>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await deleteDebitNote(id).unwrap();
                  toast.success("Debit Note deleted!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete note.");
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Debit Note marked as ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || "Error updating status");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Debit Notes</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by note number or supplier name..."
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
              <th className="p-4 font-medium">Note No</th>
              <th className="p-4 font-medium">Supplier</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Related Return</th>
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
                <td colSpan={7} className="p-4 text-center text-destructive">Failed to load debit notes.</td>
              </tr>
            ) : notes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">No debit notes found</td>
              </tr>
            ) : (
              notes.map((note) => (
                <tr key={note._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td data-label="Note No" className="p-4 font-medium">{note.noteNumber}</td>
                  <td data-label="Supplier" className="p-4">{note.supplierId?.name || '-'}</td>
                  <td data-label="Date" className="p-4 text-right sm:text-left">
                    <div className="flex flex-col sm:flex-col">
                      <span>{new Date(note.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(note.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </td>
                  <td data-label="Related Return" className="p-4">{note.relatedReturnId?.returnNumber || '-'}</td>
                  <td data-label="Amount" className="p-4 text-right font-medium">₹{note.amount.toFixed(2)}</td>
                  <td data-label="Status" className="p-4 text-right sm:text-center">
                    <select
                      className={`h-8 rounded-md border text-xs font-semibold px-2 focus:outline-none focus:ring-1 focus:ring-ring ${
                        note.status === 'Settled' ? 'bg-green-100 text-green-700 border-green-200' :
                        note.status === 'Finalized' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                      value={note.status}
                      onChange={(e) => handleStatusChange(note._id, e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Finalized">Finalized</option>
                      <option value="Settled">Settled</option>
                    </select>
                  </td>
                  <td data-label="Action" className="p-4 text-right sm:text-center">
                    <div className="flex items-center justify-end sm:justify-center -mr-2 sm:mr-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(note._id, note.noteNumber)} title="Delete Note">
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

      {notesData?.pagination && notesData.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={notesData.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

