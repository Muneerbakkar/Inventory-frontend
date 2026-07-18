import { PageHeader } from '../../components/ui/PageHeader';
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { Save, Package, Tag, Hash, Building2, Banknote, Calculator } from "lucide-react";
import { useCreateProductMutation, useUpdateProductMutation, useGetProductByIdQuery, useGetUniqueBrandsQuery } from "../../features/products/productApi";
import { useGetGstSlabsQuery } from "../../features/gst/gstApi";
import { useGetSuppliersQuery } from "../../features/suppliers/supplierApi";
import { useGetCategoriesQuery } from "../../features/categories/categoryApi";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  category: yup.string().required("Category is required"),
  brand: yup.string(),
  hsnCode: yup.string(),
  sku: yup.string(),
  supplierId: yup.string().required("Supplier is required"),
  purchasePrice: yup.number().typeError("Must be a number").min(0).required("Purchase price is required"),
  gstSlabId: yup.string().required("GST Slab is required"),
  maxSellingPrice: yup.number().typeError("Must be a number").min(0).required("MRP is required"),
  sellingPrice: yup.number().typeError("Must be a number").min(0).required("Selling price is required"),
  unit: yup.string().required("Unit is required"),
  reorderLevel: yup.number().typeError("Must be a number").min(0).required("Reorder level is required"),
  commissionPerUnit: yup.number().typeError("Must be a number").min(0).default(0),
});

export const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: productData, isLoading: isLoadingProduct } = useGetProductByIdQuery(id, { skip: !isEditing });
  const { data: gstData, isLoading: isLoadingGst } = useGetGstSlabsQuery();
  const { data: supplierData, isLoading: isLoadingSuppliers } = useGetSuppliersQuery({ limit: 100 });
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ pagination: false });
  const categories = categoriesData?.data?.categories || [];
  const { data: brandsData } = useGetUniqueBrandsQuery();
  const uniqueBrands = brandsData?.data?.brands || [];
  
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [calculatedGst, setCalculatedGst] = useState(0);

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { unit: 'pcs', reorderLevel: 10, purchasePrice: 0, commissionPerUnit: 0 }
  });

  const watchPurchasePrice = watch("purchasePrice", 0);
  const watchGstSlabId = watch("gstSlabId", "");

  useEffect(() => {
    if (isEditing && productData?.data?.product) {
      const p = productData.data.product;
      reset({
        name: p.name, 
        category: p.category?._id || p.category, 
        brand: p.brand, 
        hsnCode: p.hsnCode, 
        sku: p.sku,
        supplierId: p.supplierId?._id || p.supplierId,
        purchasePrice: p.purchasePrice,
        gstSlabId: p.gstSlabId?._id || p.gstSlabId,
        maxSellingPrice: p.maxSellingPrice, sellingPrice: p.sellingPrice,
        unit: p.unit, reorderLevel: p.reorderLevel,
        commissionPerUnit: p.commissionPerUnit || 0
      });
    }
  }, [productData, isEditing, reset]);

  // Client-side auto calculation for immediate UI feedback
  useEffect(() => {
    if (watchPurchasePrice && watchGstSlabId && gstData?.data?.slabs) {
      const slab = gstData.data.slabs.find(s => s._id === watchGstSlabId);
      if (slab) {
        const gstAmount = (Number(watchPurchasePrice) * slab.totalPercent) / 100;
        setCalculatedGst(Number(watchPurchasePrice) + gstAmount);
      }
    } else {
      setCalculatedGst(0);
    }
  }, [watchPurchasePrice, watchGstSlabId, gstData]);

  const onSubmit = async (formData) => {
    try {
      if (isEditing) {
        await updateProduct({ id, ...formData }).unwrap();
        toast.success("Product updated successfully!");
      } else {
        await createProduct(formData).unwrap();
        toast.success("Product created successfully!");
      }
      navigate("/products");
    } catch (err) {
      toast.error(err?.data?.message || "An error occurred.");
    }
  };

  if (isEditing && isLoadingProduct) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={isEditing ? "Edit Product" : "Add New Product"} description="Add or edit a product." icon={Package} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Info */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Basic Information</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium flex items-center h-5">Product Name *</label>
              <Input {...register("name")} placeholder="Product name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1 h-5"><Hash className="h-3.5 w-3.5" /> SKU</label>
              <Input {...register("sku")} placeholder={isEditing ? "" : "Auto-generated if empty"} disabled={isEditing} />
            </div>
            <div className="space-y-2 relative">
              <label className="text-sm font-medium flex items-center gap-1 h-5"><Tag className="h-3.5 w-3.5" /> Category *</label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => {
                  const [search, setSearch] = useState("");
                  const [isOpen, setIsOpen] = useState(false);
                  const dropdownRef = useRef(null);

                  useEffect(() => {
                    const handleClickOutside = (event) => {
                      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsOpen(false);
                      }
                    };
                    document.addEventListener("mousedown", handleClickOutside);
                    return () => document.removeEventListener("mousedown", handleClickOutside);
                  }, []);

                  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
                  const selectedCat = categories.find(c => c._id === field.value);

                  return (
                    <div className="relative" ref={dropdownRef}>
                      <div 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm cursor-pointer ${errors.category ? 'border-destructive' : 'border-input'}`}
                      >
                        <span className={selectedCat ? "" : "text-muted-foreground"}>
                          {selectedCat ? (selectedCat.parentCategory ? `${selectedCat.parentCategory.name} > ${selectedCat.name}` : selectedCat.name) : (isLoadingCategories ? "Loading..." : "Select category...")}
                        </span>
                      </div>
                      
                      {isOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                          <div className="p-2 border-b">
                             <input 
                               autoFocus
                               className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground" 
                               placeholder="Search categories..." 
                               value={search}
                               onChange={(e) => setSearch(e.target.value)}
                             />
                          </div>
                          <div className="max-h-48 overflow-auto p-1">
                             {filtered.length === 0 ? (
                               <div className="px-2 py-2 text-sm text-muted-foreground">No categories found.</div>
                             ) : (
                               filtered.map(cat => (
                                 <div 
                                   key={cat._id} 
                                   className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                   onClick={() => { field.onChange(cat._id); setIsOpen(false); setSearch(""); }}
                                 >
                                   {cat.parentCategory ? <span className="text-muted-foreground text-xs">{cat.parentCategory.name} &gt; </span> : ''}
                                   {cat.name}
                                 </div>
                               ))
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
            <div className="space-y-2 relative">
              <label className="text-sm font-medium flex items-center h-5">Brand</label>
              <Controller
                name="brand"
                control={control}
                render={({ field }) => {
                  const [search, setSearch] = useState("");
                  const [isOpen, setIsOpen] = useState(false);
                  const dropdownRef = useRef(null);

                  useEffect(() => {
                    const handleClickOutside = (event) => {
                      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsOpen(false);
                      }
                    };
                    document.addEventListener("mousedown", handleClickOutside);
                    return () => document.removeEventListener("mousedown", handleClickOutside);
                  }, []);

                  const filtered = uniqueBrands.filter(b => b.toLowerCase().includes(search.toLowerCase()));

                  return (
                    <div className="relative" ref={dropdownRef}>
                      <div 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm cursor-pointer border-input`}
                      >
                        <span className={field.value ? "" : "text-muted-foreground"}>
                          {field.value || "Select or type brand..."}
                        </span>
                      </div>
                      
                      {isOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                          <div className="p-2 border-b">
                             <input 
                               autoFocus
                               className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground" 
                               placeholder="Search or add brand..." 
                               value={search}
                               onChange={(e) => setSearch(e.target.value)}
                             />
                          </div>
                          <div className="max-h-48 overflow-auto p-1">
                             {search && !filtered.some(b => b.toLowerCase() === search.toLowerCase()) && (
                               <div 
                                 className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground font-medium text-primary"
                                 onClick={() => { field.onChange(search); setIsOpen(false); setSearch(""); }}
                               >
                                 Add "{search}"
                               </div>
                             )}
                             {filtered.length === 0 && !search && (
                               <div className="px-2 py-2 text-sm text-muted-foreground">No brands found. Type to add.</div>
                             )}
                             {filtered.map(b => (
                               <div 
                                 key={b} 
                                 className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                 onClick={() => { field.onChange(b); setIsOpen(false); setSearch(""); }}
                               >
                                 {b}
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">HSN Code</label>
              <Input {...register("hsnCode")} placeholder="HSN" />
            </div>
          </div>
        </div>

        {/* Pricing & Supplier */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> Pricing & Supplier</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-3 relative">
              <label className="text-sm font-medium flex items-center gap-1 h-5"><Building2 className="h-3.5 w-3.5" /> Supplier *</label>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => {
                  const [search, setSearch] = useState("");
                  const [isOpen, setIsOpen] = useState(false);
                  const dropdownRef = useRef(null);

                  useEffect(() => {
                    const handleClickOutside = (event) => {
                      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsOpen(false);
                      }
                    };
                    document.addEventListener("mousedown", handleClickOutside);
                    return () => document.removeEventListener("mousedown", handleClickOutside);
                  }, []);

                  const suppliers = supplierData?.data?.suppliers || [];
                  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
                  const selectedSupplier = suppliers.find(s => s._id === field.value);

                  return (
                    <div className="relative" ref={dropdownRef}>
                      <div 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm cursor-pointer ${errors.supplierId ? 'border-destructive' : 'border-input'}`}
                      >
                        <span className={selectedSupplier ? "" : "text-muted-foreground"}>
                          {selectedSupplier ? selectedSupplier.name : (isLoadingSuppliers ? "Loading..." : "Select a supplier...")}
                        </span>
                      </div>
                      
                      {isOpen && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                          <div className="p-2 border-b">
                             <input 
                               autoFocus
                               className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground" 
                               placeholder="Search suppliers..." 
                               value={search}
                               onChange={(e) => setSearch(e.target.value)}
                             />
                          </div>
                          <div className="max-h-48 overflow-auto p-1">
                             {filtered.length === 0 ? (
                               <div className="px-2 py-2 text-sm text-muted-foreground">No suppliers found.</div>
                             ) : (
                               filtered.map(sup => (
                                 <div 
                                   key={sup._id} 
                                   className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                   onClick={() => { field.onChange(sup._id); setIsOpen(false); setSearch(""); }}
                                 >
                                   {sup.name}
                                 </div>
                               ))
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">Purchase Price (ex. GST) *</label>
              <Input type="number" step="0.01" {...register("purchasePrice")} placeholder="0.00" />
              {errors.purchasePrice && <p className="text-xs text-destructive">{errors.purchasePrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between h-5">
                <span>GST Slab *</span>
                <a href="/settings/gst" target="_blank" className="text-xs text-blue-500 hover:underline">Manage</a>
              </label>
              <select {...register("gstSlabId")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                <option value="">Select GST</option>
                {!isLoadingGst && gstData?.data?.slabs?.map(g => (
                  <option key={g._id} value={g._id}>{g.label} ({g.totalPercent}%)</option>
                ))}
              </select>
              {errors.gstSlabId && <p className="text-xs text-destructive">{errors.gstSlabId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1 text-muted-foreground h-5">
                <Calculator className="h-3.5 w-3.5" /> Calculated Price (inc. GST)
              </label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-accent/50 px-3 text-sm font-semibold">
                ₹{calculatedGst.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">Max Retail Price (MRP) *</label>
              <Input type="number" step="0.01" {...register("maxSellingPrice")} placeholder="0.00" />
              {errors.maxSellingPrice && <p className="text-xs text-destructive">{errors.maxSellingPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">Your Selling Price *</label>
              <Input type="number" step="0.01" {...register("sellingPrice")} placeholder="0.00" />
              {errors.sellingPrice && <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5 text-orange-600">Referral Commission</label>
              <Input type="number" step="0.01" {...register("commissionPerUnit")} placeholder="0.00" />
              {errors.commissionPerUnit && <p className="text-xs text-destructive">{errors.commissionPerUnit.message}</p>}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold border-b pb-3 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Inventory Settings</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">Measurement Unit *</label>
              <select {...register("unit")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="box">Boxes</option>
                <option value="dozen">Dozen</option>
              </select>
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center h-5">Reorder Level *</label>
              <Input type="number" {...register("reorderLevel")} placeholder="10" />
              <p className="text-[10px] text-muted-foreground">Alert when stock drops below this.</p>
              {errors.reorderLevel && <p className="text-xs text-destructive">{errors.reorderLevel.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/products")}>Cancel</Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            {isCreating || isUpdating ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};
