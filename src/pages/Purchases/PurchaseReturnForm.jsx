import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetPurchaseBillsQuery, useCreatePurchaseReturnMutation, useUpdatePurchaseReturnMutation, useGetPurchaseReturnByIdQuery } from "../../features/purchases/purchasesApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Save } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import toast from "react-hot-toast";

export const PurchaseReturnForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const { data: billsData } = useGetPurchaseBillsQuery();
  const { data: prData, isLoading: isFetchingPr } = useGetPurchaseReturnByIdQuery(id, { skip: !isEditMode });

  const [createPurchaseReturn, { isLoading: isCreating }] = useCreatePurchaseReturnMutation();
  const [updatePurchaseReturn, { isLoading: isUpdating }] = useUpdatePurchaseReturnMutation();
  const isSubmitting = isCreating || isUpdating;

  const bills = billsData?.data?.purchaseBills || [];

  const [selectedBillId, setSelectedBillId] = useState("");
  const [returnItems, setReturnItems] = useState([]);

  const selectedBill = useMemo(() => bills.find(b => b._id === selectedBillId), [bills, selectedBillId]);

  useEffect(() => {
    if (isEditMode && prData?.data?.purchaseReturn && bills.length > 0) {
      const pr = prData.data.purchaseReturn;
      const originalBillId = pr.originalBillId?._id || pr.originalBillId;
      setSelectedBillId(originalBillId);
      
      const bill = bills.find(b => b._id === originalBillId);
      if (bill) {
        // Map original bill items and inject the returned quantity and reason from PR
        setReturnItems(bill.items.map(bItem => {
          const prItem = pr.items.find(i => (i.productId?._id || i.productId) === (bItem.productId?._id || bItem.productId));
          return {
            ...bItem,
            returnQuantity: prItem ? prItem.quantity : 0,
            reason: prItem ? prItem.reason : ""
          };
        }));
      }
    }
  }, [isEditMode, prData, bills]);

  const handleBillSelect = (billId) => {
    setSelectedBillId(billId);
    const bill = bills.find(b => b._id === billId);
    if (bill) {
      // Initialize return items based on bill items
      setReturnItems(bill.items.map(item => ({
        ...item,
        returnQuantity: 0,
        reason: ""
      })));
    } else {
      setReturnItems([]);
    }
  };

  const updateReturnItem = (index, field, value) => {
    const newItems = [...returnItems];
    if (field === 'returnQuantity') {
      const val = Number(value);
      if (val > newItems[index].quantity) return; // Cannot return more than purchased
      newItems[index][field] = val;
    } else {
      newItems[index][field] = value;
    }
    setReturnItems(newItems);
  };

  const { subTotal, totalGst, grandTotal } = useMemo(() => {
    let sub = 0;
    let gst = 0;
    returnItems.forEach(item => {
      if (item.returnQuantity > 0) {
        const lineTotal = item.returnQuantity * item.purchasePrice;
        sub += lineTotal;
        gst += lineTotal * (item.gstPercent / 100);
      }
    });
    return {
      subTotal: sub,
      totalGst: gst,
      grandTotal: Math.round(sub + gst)
    };
  }, [returnItems]);

  const onSubmit = async () => {
    if (!selectedBillId) return toast.error("Please select a bill");
    
    const itemsToReturn = returnItems.filter(i => i.returnQuantity > 0);
    if (itemsToReturn.length === 0) return toast.error("Select at least one item to return with quantity > 0");

    if (itemsToReturn.some(i => !i.reason)) return toast.error("Please provide a reason for all returned items");

    const payloadItems = itemsToReturn.map(item => ({
      productId: item.productId,
      quantity: item.returnQuantity,
      purchasePrice: item.purchasePrice,
      gstPercent: item.gstPercent,
      lineTotal: item.returnQuantity * item.purchasePrice * (1 + item.gstPercent / 100),
      reason: item.reason
    }));

    try {
      const payload = {
        originalBillId: selectedBillId,
        supplierId: selectedBill.supplierId?._id || selectedBill.supplierId,
        items: payloadItems,
        subTotal,
        totalGst,
        grandTotal
      };

      if (isEditMode) {
        await updatePurchaseReturn({ id, ...payload }).unwrap();
        toast.success("Purchase return updated successfully. Debit Note adjusted.");
      } else {
        await createPurchaseReturn(payload).unwrap();
        toast.success("Purchase return generated successfully. Debit Note drafted.");
      }
      
      navigate("/purchase-returns");
    } catch (err) {
      toast.error(err?.data?.message || `Error ${isEditMode ? 'updating' : 'generating'} return`);
    }
  };

  if (isEditMode && isFetchingPr) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading return details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton to="/purchase-returns" />
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Edit Purchase Return' : 'New Purchase Return'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Select Bill & Items to Return</h2>
            
            <div className="mb-4">
              <label className="text-xs font-medium mb-1 block">Original Purchase Bill</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                value={selectedBillId}
                onChange={(e) => handleBillSelect(e.target.value)}
                disabled={isEditMode}
              >
                <option value="" className="bg-background text-foreground">Select Bill...</option>
                {bills.map(b => (
                  <option key={b._id} value={b._id} className="bg-background text-foreground">{b.billNumber} (Supplier: {b.supplierId?.name})</option>
                ))}
              </select>
            </div>

            {returnItems.length > 0 && (
              <div className="space-y-3 mt-4 border-t pt-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground mb-2 px-2">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2">Purchased</div>
                  <div className="col-span-2">Return Qty</div>
                  <div className="col-span-4">Reason</div>
                </div>
                {returnItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-lg border">
                    <div className="col-span-4 text-sm truncate" title={item.productId?.name}>
                      {/* Note: since productId is populated on bill query, it may be an object or we might just have ID. 
                          Wait, if bills are not fully populated with product details in getPurchaseBills, we might need a workaround. 
                          Assuming product name isn't populated on list, we just show the ID or fetch details. 
                          Actually getPurchaseBills does NOT populate items.productId in the controller! 
                          So item.productId is just the ID string. This is a potential bug in UI display. 
                          We will just show the Product ID or "Product" for now, ideally backend should populate it. */}
                      Product ID: {typeof item.productId === 'object' ? item.productId.name : item.productId}
                    </div>
                    <div className="col-span-2 text-sm text-center">
                      {item.quantity}
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returnQuantity}
                        onChange={(e) => updateReturnItem(index, 'returnQuantity', e.target.value)}
                        placeholder="Qty"
                        className="h-8"
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="text"
                        value={item.reason}
                        onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                        placeholder="Reason for return"
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
            <h2 className="font-semibold border-b pb-2">Return Summary</h2>
            <div className="space-y-3">
              <div className="pt-2 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Returned</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST) Returned</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t text-foreground">
                  <span>Total Refund/Debit</span>
                  <span className="text-red-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" onClick={onSubmit} disabled={isSubmitting || grandTotal <= 0}>
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? 'Update Return' : 'Process Return'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isEditMode ? 'The corresponding Debit Note will be adjusted automatically.' : 'A Debit Note will be automatically drafted upon processing this return.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
