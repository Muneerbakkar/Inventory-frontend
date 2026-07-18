import { PageHeader } from '../../components/ui/PageHeader';
import { useNavigate, useParams, Link } from "react-router-dom";
import { Edit, Package, Hash, Tag, Building2, Clock, AlertTriangle, Banknote, ShieldAlert } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { useGetProductByIdQuery } from "../../features/products/productApi";
import { Button } from "../../components/ui/Button";

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">{label}</p>
    <p className="text-sm font-semibold text-foreground break-words">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-2 border-b pb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
    </div>
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </div>
  </div>
);

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetProductByIdQuery(id);

  const product = data?.data?.product;

  if (isLoading) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading product details...</div>;
  if (isError || !product) return <div className="flex h-60 items-center justify-center text-destructive">Failed to load product details.</div>;

  const isLowStock = product.quantity <= product.reorderLevel;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader 
        title={
          <>
            {product.name}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                product.isActive !== false
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
              {product.isActive !== false ? "Active" : "Inactive"}
            </span>
          </>
        } 
        description="View product details and history." 
        icon={Package}
      >
        <Button size="sm" onClick={() => navigate(-1)}>
          Back
        </Button>
      </PageHeader>

      {/* Basic Info */}
      <Section icon={Package} title="Basic Information">
        <DetailRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
        <DetailRow label="Category" value={product.category?.name || product.category} />
        <DetailRow label="Brand" value={product.brand} />
        <DetailRow label="HSN Code" value={product.hsnCode} />
        <DetailRow label="Unit" value={product.unit} />
        <DetailRow label="Supplier" value={product.supplierId?.name || "Unknown"} />
      </Section>

      {/* Pricing Details */}
      <Section icon={Banknote} title="Pricing Details">
        <DetailRow label="Purchase Price" value={`₹${product.purchasePrice?.toFixed(2)}`} />
        <DetailRow label="GST" value={product.gstSlabId ? `${product.gstSlabId.label} (${product.gstSlabId.totalPercent}%)` : 'None'} />
        <DetailRow label="Price After GST" value={`₹${product.priceAfterGst?.toFixed(2)}`} />
        <DetailRow label="Max Retail Price (MRP)" value={`₹${product.maxSellingPrice?.toFixed(2)}`} />
        <DetailRow label="Selling Price" value={<span className="text-green-600 font-semibold text-base">₹{product.sellingPrice?.toFixed(2)}</span>} />
        <DetailRow label="Commission Per Unit" value={`₹${product.commissionPerUnit?.toFixed(2)}`} />
      </Section>

      {/* Inventory & Stock */}
      <Section icon={ShieldAlert} title="Inventory & Stock">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">Current Stock</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
              {product.quantity} {product.unit}
            </span>
            {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-500" title="Low Stock!" />}
          </div>
        </div>
        <DetailRow label="Reorder Level" value={`${product.reorderLevel} ${product.unit}`} />
        <DetailRow label="Stock Status" value={
          product.quantity <= 0 ? <span className="text-red-500 font-medium">Out of Stock</span> :
          isLowStock ? <span className="text-orange-500 font-medium">Low Stock</span> : 
          <span className="text-green-600 font-medium">In Stock</span>
        } />
      </Section>

      {/* Meta */}
      <div className="flex gap-6 text-xs text-muted-foreground px-1">
        <span>Created: {new Date(product.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        <span>Last Updated: {new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
};
