import { PageHeader } from '../../components/ui/PageHeader';
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";
import {  User, Mail, Phone, Shield, KeyRound, Save , UserCircle } from 'lucide-react';
import { useUpdateMeMutation, useUpdatePasswordMutation } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { BackButton } from "../../components/ui/BackButton";

const profileSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone is required"),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm your new password"),
});

export const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("profile");

  const [updateMe, { isLoading: isUpdatingProfile }] = useUpdateMeMutation();
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const onProfileSubmit = async (data) => {
    try {
      const res = await updateMe(data).unwrap();
      dispatch(setCredentials({ user: res.data.user, token }));
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile.");
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      toast.success("Password changed successfully!");
      resetPassword();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile Info", icon: User },
    { id: "password", label: "Change Password", icon: KeyRound },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <span className="text-muted-foreground">/</span>
        <div>
          <PageHeader title="My Profile" description="Manage your personal account." icon={UserCircle} />
          <p className="text-sm text-muted-foreground mt-1">Manage your account details and security settings.</p>
        </div>
      </div>



      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-card p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Info Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold border-b pb-3">Personal Information</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
              </label>
              <Input {...registerProfile("name")} placeholder="Your full name" />
              {profileErrors.name && <p className="text-xs text-destructive">{profileErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email <span className="text-destructive">*</span>
              </label>
              <Input {...registerProfile("email")} type="email" placeholder="Your email" />
              {profileErrors.email && <p className="text-xs text-destructive">{profileErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> Phone <span className="text-destructive">*</span>
              </label>
              <Input {...registerProfile("phone")} placeholder="Your phone number" />
              {profileErrors.phone && <p className="text-xs text-destructive">{profileErrors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Role
              </label>
              <Input value={user?.role} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Role can only be changed by a SuperAdmin.</p>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button type="submit" disabled={isUpdatingProfile}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}

      {/* Change Password Tab */}
      {activeTab === "password" && (
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold border-b pb-3">Change Password</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Current Password <span className="text-destructive">*</span></label>
              <Input {...registerPassword("currentPassword")} type="password" placeholder="Enter your current password" />
              {passwordErrors.currentPassword && <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password <span className="text-destructive">*</span></label>
              <Input {...registerPassword("newPassword")} type="password" placeholder="Enter new password" />
              {passwordErrors.newPassword && <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password <span className="text-destructive">*</span></label>
              <Input {...registerPassword("confirmPassword")} type="password" placeholder="Confirm new password" />
              {passwordErrors.confirmPassword && <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>}
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t">
            <Button type="submit" disabled={isUpdatingPassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
