import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {  Plus, Edit, Trash2, Search, Calendar , Tags } from 'lucide-react';
import toast from "react-hot-toast";
import { useGetCategoriesQuery, useDeleteCategoryMutation, useUpdateCategoryMutation } from "../../features/categories/categoryApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

export const CategoryList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const { data, isLoading, isError } = useGetCategoriesQuery({ 
    page, 
    limit: 10, 
    search,
    startDate,
    endDate
  });
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();

  const handleToggleStatus = async (category) => {
    try {
      await updateCategory({ id: category._id, data: { isActive: !category.isActive } }).unwrap();
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update category status.");
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
                  await deleteCategory(id).unwrap();
                  toast.success("Category deleted successfully!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete category.");
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
        style: {
          minWidth: "360px",
          padding: "20px 24px",
          alignItems: "flex-start",
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Manage your product categories." icon={Tags}>
        <Link to="/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search categories..."
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

      <div className="<div md:rounded-md md:border md:bg-card md:shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">Failed to load categories.</TableCell>
              </TableRow>
            ) : data?.data?.categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No categories found.</TableCell>
              </TableRow>
            ) : (
              data?.data?.categories?.map((category) => (
                <TableRow key={category._id}>
                  <TableCell data-label="Category ID" className="font-mono text-sm text-foreground select-all">{category.customId || "-"}</TableCell>
                  <TableCell data-label="Name" className="font-medium">
                    {category.parentCategory && (
                      <span className="text-muted-foreground mr-1 text-xs">
                        {category.parentCategory.name} &gt;
                      </span>
                    )}
                    {category.name}
                  </TableCell>
                  <TableCell data-label="Description">{category.description || "-"}</TableCell>
                  <TableCell data-label="Status">
                    <button
                      onClick={() => handleToggleStatus(category)}
                      title={category.isActive ? "Click to deactivate" : "Click to activate"}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        category.isActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          category.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell data-label="Date Added" className="text-sm whitespace-nowrap text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(category.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(category.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Actions" className="text-right">
                    <div className="flex items-center justify-end -mr-2 sm:mr-0 gap-1">

                    <Link to={`/categories/${category._id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(category._id, category.name)}>
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

