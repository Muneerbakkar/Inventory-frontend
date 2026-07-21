import { PageHeader } from '../../components/ui/PageHeader';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import { Save, User, Mail, Phone, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useCreateUserMutation, useUpdateUserMutation, useGetUserByIdQuery, useUpdateUserPasswordMutation } from "../../features/users/userApi";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import api from "../../lib/api";

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
  password: yup.string().transform(v => v === '' ? undefined : v).notRequired().min(8, "Password must be at least 8 characters"),
});

export const UserForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data, isLoading } = useGetUserByIdQuery(id, { skip: !isEditing });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [updateUserPassword] = useUpdateUserPasswordMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(isEditing ? editSchema : createSchema),
  });

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.get("/roles")
      .then(res => {
        setRoles(res.data.data.roles);
        setLoadingRoles(false);
      })
      .catch(err => {
        toast.error("Failed to load roles");
        setLoadingRoles(false);
      });
  }, []);

  useEffect(() => {
    if (isEditing && data?.data?.user) {
      const u = data.data.user;
      reset({ name: u.name, email: u.email, phone: u.phone, role: u.role });
    }
  }, [data, isEditing, reset]);

  const onSubmit = async (formData) => {
    try {
      if (isEditing) {
        const { password, ...updateData } = formData;
        await updateUser({ id, ...updateData }).unwrap();
        if (password) {
          await updateUserPassword({ id, password }).unwrap();
        }
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
      <PageHeader title={isEditing ? "Edit User" : "Add New User"} description="Manage user access." icon={User}>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border bg-card p-6 shadow-sm space-y-6" autoComplete="off">
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
            <Input {...register("email")} type="email" placeholder="Email address" autoComplete="off" />
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
              <option value="">{loadingRoles ? "Loading roles..." : "Select role..."}</option>
              {roles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
            </select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" /> {isEditing ? "New Password" : "Password"} {!isEditing && <span className="text-destructive">*</span>}
            </label>
            <div className="relative">
              <Input {...register("password")} type={showPassword ? "text" : "password"} placeholder={isEditing ? "Leave blank to keep current password" : "Minimum 8 characters"} className="pr-10" autoComplete="new-password" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex="-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
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
