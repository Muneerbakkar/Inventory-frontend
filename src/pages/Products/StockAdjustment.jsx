import { PageHeader } from '../../components/ui/PageHeader';
import { PaginationControls } from "../../components/ui/PaginationControls";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {  Save, ArrowDownUp, AlertTriangle , Boxes } from 'lucide-react';
import { BackButton } from "../../components/ui/BackButton";
import toast from "react-hot-toast";
import { useGetProductByIdQuery } from "../../features/products/productApi";
import { useCreateAdjustmentMutation, useGetAdjustmentHistoryQuery } from "../../features/stock/stockApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

export const StockAdjustment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: productData, isLoading: isLoadingProduct } = useGetProductByIdQuery(id);
  const { data: historyData, isLoading: isLoadingHistory } = useGetAdjustmentHistoryQuery({ productId: id, page, limit: 10 });
  
  const [createAdjustment, { isLoading: isAdjusting }] = useCreateAdjustmentMutation();

  const [type, setType] = useState('Add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('New Stock');
  const [remarks, setRemarks] = useState('');

  const product = productData?.data?.product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) return toast.error("Please enter a valid quantity");
    
    if (type === 'Remove' && Number(quantity) > product.quantity) {
      return toast.error("Cannot remove more stock than currently available!");
    }

    try {
      await createAdjustment({ product: id, type, quantity: Number(quantity), reason, remarks }).unwrap();
      toast.success("Stock adjusted successfully!");
      setQuantity('');
      setRemarks('');
    } catch (err) {
      toast.error(err?.data?.message || "Failed to adjust stock");
    }
  };

  if (isLoadingProduct) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading product...</div>;
  if (!product) return <div className="p-8 text-center text-destructive">Product not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={`Stock Adjustment: ${product.name}`} description="Adjust inventory levels." icon={Boxes} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Adjustment Form */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col gap-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Current Stock</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${product.quantity <= 0 ? "text-red-500" : product.quantity <= product.reorderLevel ? "text-orange-500" : "text-green-600"}`}>
                {product.quantity}
              </span>
              <span className="text-muted-foreground">{product.unit}</span>
            </div>
            {product.quantity <= product.reorderLevel && (
              <span className="flex items-center gap-1 text-xs text-orange-500 font-medium mt-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Low Stock Warning
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-primary" /> Make Adjustment
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                <Button type="button" variant={type === 'Add' ? "default" : "outline"} className={`flex-1 ${type === 'Add' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} onClick={() => setType('Add')}>Add (+)</Button>
                <Button type="button" variant={type === 'Remove' ? "default" : "outline"} className={`flex-1 ${type === 'Remove' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`} onClick={() => setType('Remove')}>Remove (-)</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity ({product.unit})</label>
              <Input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" value={reason} onChange={(e) => setReason(e.target.value)}>
                {type === 'Add' ? (
                  <>
                    <option value="New Stock">New Stock Received</option>
                    <option value="Return">Customer Return</option>
                    <option value="Correction">Inventory Correction</option>
                  </>
                ) : (
                  <>
                    <option value="Damage">Damaged Goods</option>
                    <option value="Loss">Lost / Stolen</option>
                    <option value="Correction">Inventory Correction</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks (Optional)</label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[80px]"
                placeholder="Any additional details..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isAdjusting}>
              <Save className="mr-2 h-4 w-4" /> {isAdjusting ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </form>
        </div>

        {/* History Table */}
        <div className="md:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-muted/30">
            <h2 className="text-base font-semibold">Adjustment History</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Loading history...</TableCell></TableRow>
                ) : historyData?.data?.adjustments?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No adjustments recorded yet.</TableCell></TableRow>
                ) : (
                  historyData?.data?.adjustments?.map((adj) => (
                    <TableRow key={adj._id}>
                      <TableCell data-label="Date" className="text-sm text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{new Date(adj.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          <span className="text-xs text-muted-foreground">{new Date(adj.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                        </div>
                      </TableCell>
                      <TableCell data-label="Type">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${adj.type === 'Add' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                          {adj.type === 'Add' ? '+' : '-'} {adj.type}
                        </span>
                      </TableCell>
                      <TableCell data-label="Qty" className="font-medium">{adj.quantity}</TableCell>
                      <TableCell data-label="Reason">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{adj.reason}</span>
                          {adj.remarks && <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={adj.remarks}>{adj.remarks}</span>}
                        </div>
                      </TableCell>
                      <TableCell data-label="User" className="text-xs">{adj.user?.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {historyData?.pagination && historyData.pagination.pages > 1 && (
            <PaginationControls 
            currentPage={page}
            totalPages={historyData.pagination.pages}
            onPageChange={setPage}
          />
          )}
        </div>
        
      </div>
    </div>
  );
};

