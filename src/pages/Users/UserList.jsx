import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {  Plus, Edit, Trash2, Search, Eye, ToggleLeft, ToggleRight, Calendar , Users } from 'lucide-react';
import toast from "react-hot-toast";
import { useGetUsersQuery, useDeleteUserMutation, useToggleUserStatusMutation } from "../../features/users/userApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

const ROLE_COLORS = {
  SuperAdmin: "bg-purple-500/10 text-purple-400",
  Admin: "bg-blue-500/10 text-blue-400",
  SalesStaff: "bg-green-500/10 text-green-400",
  WarehouseStaff: "bg-orange-500/10 text-orange-400",
  Accountant: "bg-yellow-500/10 text-yellow-400",
};

export const UserList = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data, isLoading, isError } = useGetUsersQuery({ 
    page, 
    limit: 10, 
    search, 
    startDate, 
    endDate 
  });
  const [deleteUser] = useDeleteUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const handleDelete = (id, name) => {
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
                  await deleteUser(id).unwrap();
                  toast.success("User deleted successfully!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete user.");
                }
              }}
              className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >Delete</button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded border px-4 py-2 text-sm font-semibold hover:bg-accent"
            >Cancel</button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center", style: { minWidth: "360px", padding: "20px 24px", alignItems: "flex-start" } }
    );
  };

  const handleToggle = async (id, currentStatus, name) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success(`${name} has been ${currentStatus ? "deactivated" : "activated"}.`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage system users." icon={Users}>
        <Link to="/users/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, phone or role..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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
              className="absolute left-3 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => startDateRef.current?.showPicker()}
            />
          </div>
          <span className="text-muted-foreground text-sm text-center">to</span>
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
              className="absolute left-3 h-4 w-4 text-muted-foreground cursor-pointer" 
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

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-destructive">Failed to load users.</TableCell></TableRow>
            ) : data?.data?.users?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No users found.</TableCell></TableRow>
            ) : (
              data?.data?.users?.map((user) => (
                <TableRow key={user._id}>
                  <TableCell data-label="User ID" className="font-mono text-sm text-foreground select-all">{user.customId || "-"}</TableCell>
                  <TableCell data-label="Name" className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell data-label="Email" className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell data-label="Phone">{user.phone}</TableCell>
                  <TableCell data-label="Role">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || "bg-accent text-accent-foreground"}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell data-label="Status">
                    {(() => {
                      const isToggleDisabled = user.role === 'SuperAdmin' || user._id === currentUser?._id || (currentUser?.role === 'Admin' && user.role === 'Admin');
                      return (
                        <button
                          disabled={isToggleDisabled}
                          onClick={() => handleToggle(user._id, user.isActive, user.name)}
                          title={isToggleDisabled ? "You do not have permission to change this status" : (user.isActive ? "Click to deactivate" : "Click to activate")}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                            user.isActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                          } ${isToggleDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              user.isActive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      );
                    })()}
                  </TableCell>
                  <TableCell data-label="Date Added" className="text-sm whitespace-nowrap text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Actions" className="text-right">
                    <div className="flex items-center justify-end -mr-2 sm:mr-0 gap-1">

                    <Link to={`/users/${user._id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Link to={`/users/${user._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user._id, user.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <PaginationControls 
            currentPage={page}
            totalPages={data.pagination.pages}
            onPageChange={setPage}
          />
      )}
    </div>
  );
};

