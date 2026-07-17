import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { Save, User, Mail, Phone, Shield, Lock } from "lucide-react";
import { BackButton } from "../../components/ui/BackButton";
import { useCreateUserMutation, useUpdateUserMutation, useGetUserByIdQuery } from "../../features/users/userApi";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const ROLES = ["SuperAdmin", "Admin", "SalesStaff", "WarehouseStaff", "Accountant"];

const createSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
  role: yup.string().required("Role is required"),
});

const editSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone is required"),
  role: yup.string().required("Role is required"),
});

export const UserForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data, isLoading } = useGetUserByIdQuery(id, { skip: !isEditing });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(isEditing ? editSchema : createSchema),
  });

  useEffect(() => {
    if (isEditing && data?.data?.user) {
      const u = data.data.user;
      reset({ name: u.name, email: u.email, phone: u.phone, role: u.role });
    }
  }, [data, isEditing, reset]);

  const onSubmit = async (formData) => {
    try {
      if (isEditing) {
        await updateUser({ id, ...formData }).unwrap();
        toast.success("User updated successfully!");
      } else {
        await createUser(formData).unwrap();
        toast.success("User created successfully!");
      }
      navigate("/users");
    } catch (err) {
      toast.error(err?.data?.message || "An error occurred.");
    }
  };

  if (isLoading) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <span className="text-muted-foreground">/</span>
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit User" : "Add New User"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold border-b pb-3">User Information</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
            </label>
            <Input {...register("name")} placeholder="Full name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> Email <span className="text-destructive">*</span>
            </label>
            <Input {...register("email")} type="email" placeholder="Email address" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> Phone <span className="text-destructive">*</span>
            </label>
            <Input {...register("phone")} placeholder="Phone number" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Role <span className="text-destructive">*</span>
            </label>
            <select
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select role...</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {!isEditing && (
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" /> Password <span className="text-destructive">*</span>
              </label>
              <Input {...register("password")} type="password" placeholder="Minimum 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/users")}>Cancel</Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            {isCreating || isUpdating ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};
