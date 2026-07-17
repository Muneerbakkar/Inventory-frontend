import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetCustomersQuery } from "../../features/customers/customersApi";
import { useCreateQuotationMutation, useGetQuotationByIdQuery, useUpdateQuotationMutation } from "../../features/quotations/quotationsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Trash2, Save, Plus, Calendar } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { AsyncSearchDropdown } from "../../components/ui/AsyncSearchDropdown";
import toast from "react-hot-toast";

export const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { data: quotationData, isLoading: isLoadingQuotation } = useGetQuotationByIdQuery(id, { skip: !isEdit });
  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation();
  const isSubmitting = isCreating || isUpdating;

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [validTillDate, setValidTillDate] = useState("");
  const dateRef = useRef(null);

  const [items, setItems] = useState([
    { productId: "", productName: "", quantity: 1, sellingPrice: 0, gstPercent: 0 }
  ]);


  useEffect(() => {
    if (isEdit && quotationData?.data?.quotation) {
      const q = quotationData.data.quotation;
      setCustomerId(q.customerId?._id || q.customerId || "");
      setCustomerName(q.customerId?.name || "");
      setValidTillDate(q.validTillDate ? new Date(q.validTillDate).toISOString().split('T')[0] : "");
      if (q.items && q.items.length > 0) {
        setItems(q.items.map(item => ({
          productId: item.productId?._id || item.productId || "",
          productName: item.productId?.name || "",
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          gstPercent: item.gstPercent,
        })));
      }
    }
  }, [isEdit, quotationData]);

  const handleProductSelect = (index, productId, product) => {
    const newItems = [...items];
    if (product) {
      const gstPercent = product.gstSlabId?.totalPercent || 18;
      newItems[index] = {
        ...newItems[index],
        productId,
        productName: product.name || "",
        sellingPrice: product.sellingPrice,
        gstPercent,
      };
    } else {
      newItems[index] = { productId: "", productName: "", quantity: 1, sellingPrice: 0, gstPercent: 0 };
    }
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: "", productName: "", quantity: 1, sellingPrice: 0, gstPercent: 0 }]);
  
  const removeItem = (index) => {
    if (items.length === 1) {
      setItems([{ productId: "", productName: "", quantity: 1, sellingPrice: 0, gstPercent: 0 }]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const { subTotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    items.forEach(item => {
      if (item.productId) {
        const lineTotal = item.quantity * item.sellingPrice;
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
    if (!customerId) return toast.error("Please select a customer");
    if (items.some(i => !i.productId)) return toast.error("Please select valid products");
    if (items.some(i => i.quantity <= 0)) return toast.error("Quantity must be greater than 0");

    const payloadItems = items.map(item => ({
      ...item,
      lineTotal: item.quantity * item.sellingPrice * (1 + item.gstPercent / 100)
    }));

    try {
      const payload = {
        customerId,
        validTillDate: validTillDate || undefined,
        items: payloadItems,
        subTotal,
        totalGst,
        grandTotal
      };

      if (isEdit) {
        await updateQuotation({ id, data: payload }).unwrap();
        toast.success("Quotation updated successfully");
      } else {
        await createQuotation(payload).unwrap();
        toast.success("Quotation generated successfully");
      }
      
      navigate("/quotations");
    } catch (err) {
      toast.error(err?.data?.message || "Error generating quotation");
    }
  };

  if (isEdit && isLoadingQuotation) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton to="/quotations" />
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Quotation" : "New Quotation"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Products</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col lg:flex-row items-start lg:items-center gap-3 bg-muted/30 p-3 lg:p-2 rounded-lg border">
                  <div className="w-full lg:w-auto flex-1 min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Product</label>
                    <AsyncSearchDropdown
                      fetchHook={useGetProductsQuery}
                      value={item.productId}
                      onChange={(val, raw) => handleProductSelect(index, val, raw)}
                      placeholder="Search Product..."
                      emptyText="No products found."
                      defaultDisplay={item.productName}
                      formatOption={(p) => ({
                        value: p._id,
                        label: `${p.name} (Stock: ${p.quantity}) - ₹${p.sellingPrice}`,
                        raw: p,
                        disabled: p.quantity <= 0
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
                        value={item.sellingPrice || ''}
                        onChange={(e) => updateItem(index, 'sellingPrice', e.target.value === '' ? '' : Number(e.target.value))}
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
            <h2 className="font-semibold border-b pb-2">Quotation Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Customer</label>
                <AsyncSearchDropdown 
                  fetchHook={useGetCustomersQuery}
                  value={customerId}
                  onChange={(val, raw) => {
                    setCustomerId(val);
                    setCustomerName(raw?.name || "");
                  }}
                  placeholder="Walk-in Customer (Select...)"
                  emptyText="No customers found."
                  allowAdd={true}
                  onAdd={handleAddCustomer}
                  defaultDisplay={customerName}
                  formatOption={(c) => ({
                    value: c._id,
                    label: `${c.name} ${c.phone ? `- ${c.phone}` : ''}`,
                    raw: c
                  })}
                />
              </div>
              
              <div>
                <label className="text-xs font-medium mb-1 block">Valid Till Date</label>
                <div className="relative">
                  <Input 
                    ref={dateRef}
                    type="date"
                    value={validTillDate}
                    onChange={(e) => setValidTillDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.target.showPicker();
                      } catch(err) {
                        // ignore if showPicker is unsupported
                      }
                    }}
                    className="pl-10 cursor-pointer w-full"
                  />
                  <Calendar 
                    className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" 
                  />
                </div>
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
                  <span>Total Estimate</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" onClick={onSubmit} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : isEdit ? "Update Quotation" : "Save Quotation"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Quotations do not affect stock until converted to an invoice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
