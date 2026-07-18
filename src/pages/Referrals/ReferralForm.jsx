import { PageHeader } from '../../components/ui/PageHeader';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUpdateReferralMutation, useGetReferralByIdQuery } from "../../features/referrals/referralsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {  Save , UsersRound } from 'lucide-react';
import toast from "react-hot-toast";

export const ReferralForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const { data: referralData, isLoading: isFetching } = useGetReferralByIdQuery(id, { skip: !isEditing });
  const [updateReferral, { isLoading: isUpdating }] = useUpdateReferralMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (isEditing && referralData?.data?.referral) {
      const { name, phone } = referralData.data.referral;
      setName(name || "");
      setPhone(phone || "");
    }
  }, [isEditing, referralData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Referral name is required");
    try {
      if (isEditing) {
        await updateReferral({ id, data: { name, phone } }).unwrap();
        toast.success("Referral updated successfully");
      }
      navigate("/referrals");
    } catch (error) {
      toast.error(error.data?.message || `Error updating referral`);
    }
  };

  if (isEditing && isFetching) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Referral Person" description="Manage referral information." icon={UsersRound} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter full name" 
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="e.g. +91 9876543210" 
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              <Save className="mr-2 h-4 w-4" /> Update Referral
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
