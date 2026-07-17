import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetCustomersQuery, useCreateCustomerMutation } from "../../features/customers/customersApi";
import { useGetReferralsQuery, useCreateReferralMutation } from "../../features/referrals/referralsApi";
import { useCreateInvoiceMutation, useUpdateInvoiceMutation, useGetInvoiceByIdQuery } from "../../features/sales/salesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Trash2, Save } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { AsyncSearchDropdown } from "../../components/ui/AsyncSearchDropdown";
import toast from "react-hot-toast";

export const NewSale = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { data: invoiceData, isLoading: invoiceLoading } = useGetInvoiceByIdQuery(id, { skip: !isEditing });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();

  const isSubmitting = isCreating || isUpdating;

  const [customerId, setCustomerId] = useState("");
  const [referralId, setReferralId] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");

  const [items, setItems] = useState([
    { productId: "", quantity: 1, maxQty: 0, sellingPrice: 0, gstPercent: 0, originalQty: 0 }
  ]);

  useEffect(() => {
    if (isEditing && invoiceData?.data?.invoice) {
      const inv = invoiceData.data.invoice;
      setCustomerId(inv.customerId?._id || inv.customerId || "");
      setReferralId(inv.referralId?._id || inv.referralId || "");
      setPaymentMode(inv.paymentMode || "Cash");
      setAmountPaid(inv.amountPaid || "");
      
      const loadedItems = inv.items.map(item => {
        const p = item.productId || {};
        const pId = p._id || item.productId;
        return {
          productId: pId,
          quantity: item.quantity,
          maxQty: p ? (p.quantity || 0) + item.quantity : item.quantity,
          sellingPrice: item.sellingPrice,
          gstPercent: item.gstPercent || 18,
          originalQty: item.quantity
        };
      });
      setItems(loadedItems.length > 0 ? loadedItems : [{ productId: "", quantity: 1, maxQty: 0, sellingPrice: 0, gstPercent: 0, originalQty: 0 }]);
    }
  }, [isEditing, invoiceData]);

  const handleAddCustomer = async (name) => {
    try {
      const res = await createCustomer({ name }).unwrap();
      toast.success("Customer added");
      setCustomerId(res.data?.customer?._id || res.customer?._id || res._id);
    } catch (err) { toast.error("Failed to add customer"); }
  };

  const handleAddReferral = async (name) => {
    try {
      const res = await createReferral({ name }).unwrap();
      toast.success("Referral added");
      setReferralId(res.data?.referral?._id || res.referral?._id || res._id);
    } catch (err) { toast.error("Failed to add referral"); }
  };

  const handleProductSelect = (index, productId, product) => {
    const newItems = [...items];
    if (product) {
      const gstPercent = product.gstSlabId?.totalPercent || 18; 
      
      newItems[index] = {
        ...newItems[index],
        productId,
        maxQty: product.quantity,
        sellingPrice: product.sellingPrice,
        gstPercent,
        originalQty: 0
      };
    } else {
      newItems[index] = { productId: "", quantity: 1, maxQty: 0, sellingPrice: 0, gstPercent: 0, originalQty: 0 };
    }
    setItems(newItems);
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...items];
    newItems[index].quantity = Number(qty) || 0;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: "", quantity: 1, maxQty: 0, sellingPrice: 0, gstPercent: 0, originalQty: 0 }]);
  
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculations
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      const lineTotal = item.sellingPrice * item.quantity;
      const gstAmount = (lineTotal * item.gstPercent) / (100 + item.gstPercent); // Reverse calc if sellingPrice includes GST
      return {
        ...item,
        lineTotal,
        gstAmount
      };
    });
  }, [items]);

  const { subTotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0, gst = 0;
    calculatedItems.forEach(item => {
      if (item.productId) {
        sub += (item.lineTotal - item.gstAmount);
        gst += item.gstAmount;
      }
    });
    const grand = sub + gst;
    const roundOff = Math.round(grand) - grand;
    return {
      subTotal: sub,
      totalGst: gst,
      grandTotal: Math.round(grand),
      roundOff
    };
  }, [calculatedItems]);

  const onSubmit = async () => {
    // Validations
    if (!items[0].productId) return toast.error("Please add at least one product");
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId) return toast.error(`Product is required for row ${i + 1}`);
      if (item.quantity <= 0) return toast.error(`Quantity must be > 0 in row ${i + 1}`);
      if (item.quantity > item.maxQty) return toast.error(`Insufficient stock in row ${i + 1}. Available: ${item.maxQty}`);
    }

    const payloadItems = calculatedItems.filter(i => i.productId).map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      sellingPrice: i.sellingPrice,
      gstPercent: i.gstPercent,
      lineTotal: i.lineTotal
    }));

    try {
      if (isEditing) {
        await updateInvoice({
          id,
          customerId: customerId || undefined,
          referralId: referralId || undefined,
          items: payloadItems,
          subTotal,
          totalGst,
          grandTotal,
          paymentMode,
          amountPaid: Number(amountPaid) || 0
        }).unwrap();
        toast.success("Invoice updated successfully");
      } else {
        await createInvoice({
          customerId: customerId || undefined,
          referralId: referralId || undefined,
          items: payloadItems,
          subTotal,
          totalGst,
          grandTotal,
          paymentMode,
          amountPaid: Number(amountPaid) || 0
        }).unwrap();
        toast.success("Invoice generated successfully");
      }
      navigate("/sales");
    } catch (err) {
      toast.error(err?.data?.message || `Error ${isEditing ? 'updating' : 'generating'} invoice`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <BackButton to="/sales" />
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Sale" : "New Sale"}</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Customer Details</h2>
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Select Customer (Optional)</label>
                <AsyncSearchDropdown 
                  fetchHook={useGetCustomersQuery}
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Walk-in Customer (Select...)"
                  emptyText="No customers found."
                  allowAdd={true}
                  onAdd={handleAddCustomer}
                  formatOption={(c) => ({
                    value: c._id,
                    label: `${c.name} ${c.phone ? `- ${c.phone}` : ''}`,
                    raw: c
                  })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Referral (Optional)</label>
                <AsyncSearchDropdown 
                  fetchHook={useGetReferralsQuery}
                  value={referralId}
                  onChange={setReferralId}
                  placeholder="None"
                  emptyText="No referrals found."
                  allowAdd={true}
                  onAdd={handleAddReferral}
                  formatOption={(r) => ({
                    value: r._id,
                    label: r.name,
                    raw: r
                  })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Line Items</h2>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end border p-3 sm:p-0 rounded-lg sm:border-0 sm:rounded-none bg-card/50 sm:bg-transparent">
                  <div className="w-full sm:flex-1 space-y-2">
                    <label className="text-sm font-medium">Product</label>
                    <AsyncSearchDropdown
                      fetchHook={useGetProductsQuery}
                      value={item.productId}
                      onChange={(val, raw) => handleProductSelect(index, val, raw)}
                      placeholder="Search Product..."
                      emptyText="No products found."
                      formatOption={(p) => ({
                        value: p._id,
                        label: `${p.name} (Stock: ${p._id === item.productId && isEditing ? item.maxQty : p.quantity}) - ₹${p.sellingPrice}`,
                        raw: p,
                        disabled: p.quantity <= 0 && (!isEditing || p._id !== item.productId)
                      })}
                    />
                  </div>
                  <div className="flex items-end gap-3 w-full sm:w-auto">
                    <div className="flex-1 sm:w-24 space-y-2">
                      <label className="text-sm font-medium text-center block">Qty</label>
                      <Input 
                        type="number" 
                        min="1" 
                        max={item.maxQty || 1} 
                        value={item.quantity} 
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={item.quantity > item.maxQty ? 'border-red-500' : ''}
                      />
                    </div>
                    <div className="flex-1 sm:w-32 space-y-2">
                      <label className="text-sm font-medium text-right block">Total (₹)</label>
                      <div className="flex h-10 w-full items-center justify-end rounded-md border border-input bg-muted px-3 text-sm font-medium">
                        {(item.sellingPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1} className="h-10 w-10 shrink-0 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addItem} className="mt-2 text-sm">
                + Add Row
              </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total GST:</span>
                <span>₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t text-base font-semibold">
                <span>Grand Total:</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Amount Paid (₹)</label>
                  <Input 
                    type="number" 
                    placeholder={grandTotal.toFixed(2)} 
                    value={amountPaid} 
                    onChange={(e) => setAmountPaid(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-orange-500 pt-2">
                <span>Balance Due:</span>
                <span>₹{Math.max(0, grandTotal - (Number(amountPaid) || 0)).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={onSubmit} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Sale" : "Complete Sale"}
              </Button>
            </div>
                  </div>
                </div>
        </div>
      </div>
    </div>
  );
};
