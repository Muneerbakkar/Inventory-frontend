import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {  Plus, Edit, Trash2, Search, AlertTriangle, ArrowDownUp, Eye, Calendar , Package } from 'lucide-react';
import toast from "react-hot-toast";
import { useGetProductsQuery, useDeleteProductMutation } from "../../features/products/productApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

export const ProductList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  
  const { data, isLoading, isError } = useGetProductsQuery({ 
    page, 
    limit: 10, 
    search, 
    stockStatus,
    startDate,
    endDate
  });
  const [deleteProduct] = useDeleteProductMutation();

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
                  await deleteProduct(id).unwrap();
                  toast.success("Product deleted successfully!");
                } catch (err) {
                  toast.error(err?.data?.message || "Failed to delete product.");
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
      <PageHeader title="Products" description="Manage your product inventory." icon={Package}>
        <Link to="/products/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-md bg-card p-4 shadow-sm border w-full">
        <div className="flex flex-wrap items-center gap-4 flex-1 w-full md:w-auto">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center w-full md:w-auto">
            <input 
              type="date" 
              ref={startDateRef}
              className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full md:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
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
          <div className="relative flex items-center w-full md:w-auto">
            <input 
              type="date" 
              ref={endDateRef}
              className="rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-sm w-full md:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
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
              <TableHead>Product ID</TableHead>
              <TableHead>SKU / Name</TableHead>
              <TableHead>Category / Brand / Supplier</TableHead>
              <TableHead className="text-right">Price (ex. GST)</TableHead>
              <TableHead className="text-right">Price (inc. GST)</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-destructive">Failed to load products.</TableCell></TableRow>
            ) : data?.data?.products?.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No products found.</TableCell></TableRow>
            ) : (
              data?.data?.products?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell data-label="Product ID" className="font-mono text-sm text-foreground select-all">{product.customId || "-"}</TableCell>
                  <TableCell data-label="SKU / Name">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{product.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Category / Brand / Supplier">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{product.category?.name || product.category}</span>
                      <span className="text-xs text-muted-foreground">{product.brand}</span>
                      <span className="text-[11px] text-primary/80 font-medium mt-0.5">{product.supplierId?.name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Price (ex. GST)" className="text-right">₹{product.purchasePrice?.toFixed(2)}</TableCell>
                  <TableCell data-label="Price (inc. GST)" className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">₹{product.priceAfterGst?.toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground bg-accent px-1.5 rounded-sm">
                        {product.gstSlabId?.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Stock" className="text-center">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`font-medium ${product.quantity <= 0 ? "text-red-500" : product.quantity <= product.reorderLevel ? "text-orange-500" : "text-green-600"}`}>
                        {product.quantity} {product.unit}
                      </span>
                      {product.quantity <= product.reorderLevel && (
                        <AlertTriangle className={`h-4 w-4 ${product.quantity <= 0 ? "text-red-500" : "text-orange-500"}`} title="Low/Out of Stock" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-label="Date Added" className="text-sm whitespace-nowrap text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(product.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(product.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </TableCell>
                  <TableCell data-label="Actions" className="text-right">
                    <div className="flex items-center justify-end -mr-2 sm:mr-0 gap-1">

                    <Link to={`/products/${product._id}`} title="View Details">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/products/${product._id}/adjust`} title="Adjust Stock">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowDownUp className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={`/products/${product._id}/edit`} title="Edit">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(product._id, product.name)}>
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

