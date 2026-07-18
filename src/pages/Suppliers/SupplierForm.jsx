import { PageHeader } from '../../components/ui/PageHeader';
import { Truck } from 'lucide-react';
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { 
  useCreateSupplierMutation, 
  useUpdateSupplierMutation, 
  useGetSupplierByIdQuery 
} from "../../features/suppliers/supplierApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const schema = yup.object({
  name: yup.string().required("Supplier name is required"),
  phone: yup.string().required("Phone number is required"),
  alternatePhone: yup.string(),
  gstNumber: yup.string().matches(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    { message: "Invalid GST format", excludeEmptyString: true }
  ),
  gstType: yup.string(),
  address: yup.object({
    street: yup.string(),
    city: yup.string(),
    state: yup.string(),
    pincode: yup.string(),
  }),
  bankDetails: yup.object({
    accountNumber: yup.string(),
    ifsc: yup.string(),
    bankName: yup.string(),
  }),
  notes: yup.string(),
}).required();

export const SupplierForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: supplierData, isLoading: isFetching } = useGetSupplierByIdQuery(id, { skip: !isEditing });
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      gstType: "Regular",
    }
  });

  useEffect(() => {
    if (supplierData?.data?.supplier) {
      reset(supplierData.data.supplier);
    }
  }, [supplierData, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await updateSupplier({ id, ...data }).unwrap();
        toast.success("Supplier updated successfully!");
      } else {
        await createSupplier(data).unwrap();
        toast.success("Supplier created successfully!");
      }
      navigate("/suppliers");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "An error occurred. Please try again.");
    }
  };

  if (isEditing && isFetching) return <div>Loading...</div>;

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title={isEditing ? "Edit Supplier" : "Add Supplier"} 
        description="Manage supplier information." 
        icon={Truck}
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-md border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
            <Input {...register("name")} placeholder="Supplier Name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone <span className="text-destructive">*</span></label>
            <Input {...register("phone")} placeholder="Phone Number" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alternate Phone</label>
            <Input {...register("alternatePhone")} placeholder="Alternate Phone" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">GST Number</label>
            <Input {...register("gstNumber")} placeholder="22AAAAA0000A1Z5" />
            {errors.gstNumber && <p className="text-xs text-destructive">{errors.gstNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">GST Type</label>
            <select
              {...register("gstType")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Regular">Regular</option>
              <option value="Composition">Composition</option>
              <option value="Unregistered">Unregistered</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Address details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Street</label>
              <Input {...register("address.street")} placeholder="Street Address" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input {...register("address.city")} placeholder="City" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input {...register("address.state")} placeholder="State" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode</label>
              <Input {...register("address.pincode")} placeholder="Pincode" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Bank details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Account Number</label>
              <Input {...register("bankDetails.accountNumber")} placeholder="Account Number" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IFSC Code</label>
              <Input {...register("bankDetails.ifsc")} placeholder="IFSC Code" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Name</label>
              <Input {...register("bankDetails.bankName")} placeholder="Bank Name" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b pb-2">Additional info</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input {...register("notes")} placeholder="Any additional notes..." />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? "Saving..." : "Save Supplier"}
          </Button>
        </div>
      </form>
    </div>
  );
};
