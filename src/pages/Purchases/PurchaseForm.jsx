import { PageHeader } from '../../components/ui/PageHeader';
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetSuppliersQuery } from "../../features/suppliers/supplierApi";
import { useCreatePurchaseBillMutation, useUpdatePurchaseBillMutation, useGetPurchaseBillByIdQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {  Trash2, Save, Plus , ShoppingCart } from 'lucide-react';
import { AsyncSearchDropdown } from "../../components/ui/AsyncSearchDropdown";
import toast from "react-hot-toast";

export const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: billData, isLoading: isFetchingBill } = useGetPurchaseBillByIdQuery(id, { skip: !id });
  const [createPurchaseBill, { isLoading: isCreating }] = useCreatePurchaseBillMutation();
  const [updatePurchaseBill, { isLoading: isUpdating }] = useUpdatePurchaseBillMutation();

  const isSubmitting = isCreating || isUpdating;

  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierRefNumber, setSupplierRefNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");

  const [items, setItems] = useState([
    { productId: "", quantity: 1, purchasePrice: 0, gstPercent: 0 }
  ]);

  useEffect(() => {
    if (isEditMode && billData?.data?.purchaseBill) {
      const bill = billData.data.purchaseBill;
      setSupplierId(bill.supplierId?._id || bill.supplierId || "");
      setSupplierName(bill.supplierId?.name || "");
      setSupplierRefNumber(bill.supplierRefNumber || "");
      setPaymentMode(bill.paymentMode || "Cash");
      setAmountPaid(bill.amountPaid || "");
      if (bill.items && bill.items.length > 0) {
        setItems(bill.items.map(item => ({
          productId: item.productId?._id || item.productId,
          productName: item.productId?.name || "",
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          gstPercent: item.gstPercent
        })));
      }
    }
  }, [isEditMode, billData]);

  const handleProductSelect = (index, productId, product) => {
    const newItems = [...items];
    if (product) {
      newItems[index] = {
        ...newItems[index],
        productId,
        productName: product.name || "",
        purchasePrice: product.purchasePrice || 0,
        gstPercent: product.gstSlabId?.totalPercent || 18
      };
    } else {
      newItems[index] = { productId: "", productName: "", quantity: 1, purchasePrice: 0, gstPercent: 0 };
    }
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: "", productName: "", quantity: 1, purchasePrice: 0, gstPercent: 0 }]);
  
  const removeItem = (index) => {
    if (items.length === 1) {
      setItems([{ productId: "", productName: "", quantity: 1, purchasePrice: 0, gstPercent: 0 }]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const { subTotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    items.forEach(item => {
      if (item.productId) {
        const lineTotal = item.quantity * item.purchasePrice;
        sub += lineTotal;
        gst += lineTotal * (item.gstPercent / 100);
      }
    });
    return {
      subTotal: sub,
      totalGst: gst,
      grandTotal: Math.round(sub + gst)
    };
  }, [items]);

  const onSubmit = async () => {
    if (!supplierId) return toast.error("Please select a supplier");
    if (items.some(i => !i.productId)) return toast.error("Please select valid products");
    if (items.some(i => i.quantity <= 0)) return toast.error("Quantity must be greater than 0");

    const payloadItems = items.map(item => ({
      ...item,
      lineTotal: item.quantity * item.purchasePrice * (1 + item.gstPercent / 100)
    }));

    try {
      const payload = {
        supplierId,
        supplierRefNumber,
        items: payloadItems,
        subTotal,
        totalGst,
        grandTotal,
        paymentMode,
        amountPaid: Number(amountPaid) || 0
      };

      if (isEditMode) {
        await updatePurchaseBill({ id, ...payload }).unwrap();
        toast.success("Purchase bill updated successfully");
      } else {
        await createPurchaseBill(payload).unwrap();
        toast.success("Purchase bill generated successfully");
      }
      navigate("/purchases");
    } catch (err) {
      toast.error(err?.data?.message || `Error ${isEditMode ? 'updating' : 'generating'} bill`);
    }
  };

  if (isEditMode && isFetchingBill) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading bill details...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={isEditMode ? 'Edit Purchase Bill' : 'New Purchase Bill'} description="Create or edit a purchase." icon={ShoppingCart} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Products</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col lg:flex-row items-start lg:items-center gap-3 bg-muted/30 p-3 lg:p-2 rounded-lg border">
                  <div className="w-full lg:w-auto flex-1 min-w-[200px] space-y-2">
                    <label className="text-sm font-medium block">Product</label>
                    <AsyncSearchDropdown
                      fetchHook={useGetProductsQuery}
                      value={item.productId}
                      onChange={(val, raw) => handleProductSelect(index, val, raw)}
                      placeholder="Search Product..."
                      emptyText="No products found."
                      defaultDisplay={item.productName}
                      formatOption={(p) => ({
                        value: p._id,
                        label: `${p.name} (Stock: ${p.quantity})`,
                        raw: p
                      })}
                    />
                  </div>
                  <div className="flex items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                    <div className="flex-1 sm:w-24 space-y-2">
                      <label className="text-sm font-medium block">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex-1 sm:w-28 space-y-2">
                      <label className="text-sm font-medium block">Price (₹)</label>
                      <Input
                        type="number"
                        min="0"
                        value={item.purchasePrice || ''}
                        onChange={(e) => updateItem(index, 'purchasePrice', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                      />
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive h-9 w-9 p-0 shrink-0 mb-1" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="font-semibold border-b pb-2">Bill Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Supplier</label>
                <AsyncSearchDropdown
                  fetchHook={useGetSuppliersQuery}
                  value={supplierId}
                  onChange={(val, raw) => {
                    setSupplierId(val);
                    setSupplierName(raw?.name || "");
                  }}
                  placeholder="Search Supplier..."
                  emptyText="No suppliers found."
                  defaultDisplay={supplierName}
                  formatOption={(s) => ({
                    value: s._id,
                    label: `${s.name} ${s.phone ? `- ${s.phone}` : ''}`,
                    raw: s
                  })}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium mb-1 block">Supplier Ref Number</label>
                <Input 
                  value={supplierRefNumber}
                  onChange={(e) => setSupplierRefNumber(e.target.value)}
                  placeholder="e.g. INV-2023-001"
                />
              </div>

              <div className="pt-2 space-y-1.5 text-sm border-t mt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST)</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 border-t mt-2">
                <label className="text-xs font-medium mb-1 block">Payment Mode</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Amount Paid Today</label>
                <Input 
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="₹ 0.00"
                />
              </div>

            </div>

            <Button className="w-full mt-6" onClick={onSubmit} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Update Bill' : 'Save Bill'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
