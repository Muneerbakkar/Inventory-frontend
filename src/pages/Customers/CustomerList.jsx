import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetCustomersQuery, useDeleteCustomerMutation } from "../../features/customers/customersApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Edit, Trash2, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export const CustomerList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data: customersData, isLoading, isError } = useGetCustomersQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [deleteCustomer] = useDeleteCustomerMutation();

  const customers = customersData?.data?.customers || [];

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
                  await deleteCustomer(id).unwrap();
                  toast.success("Customer deleted successfully!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete customer.");
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
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Button onClick={() => navigate("/customers/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, phone or email..."
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
              <th className="p-4 font-medium">Customer ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Phone</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Address</th>
              <th className="p-4 font-medium">Added On</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="h-24 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-destructive">Failed to load customers.</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">No customers found</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td data-label="Customer ID" className="p-4 font-mono text-sm text-foreground select-all">{customer.customId || "-"}</td>
                  <td data-label="Name" className="p-4 font-medium">{customer.name}</td>
                  <td data-label="Phone" className="p-4">{customer.phone || '-'}</td>
                  <td data-label="Email" className="p-4">{customer.email || '-'}</td>
                  <td data-label="Address" className="p-4">{customer.address || '-'}</td>
                  <td data-label="Added On" className="p-4 text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(customer.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </td>
                  <td data-label="Actions" className="p-4 text-right">
                    <div className="flex items-center justify-end -mr-2 sm:mr-0 gap-1">

                    <Link to={`/customers/${customer._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(customer._id, customer.name)}>
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

      {customersData?.pagination && customersData.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={customersData.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

