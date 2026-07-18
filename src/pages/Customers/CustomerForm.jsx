import { PageHeader } from '../../components/ui/PageHeader';
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateCustomerMutation, useUpdateCustomerMutation, useGetCustomerByIdQuery } from "../../features/customers/customersApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {  Save , Users } from 'lucide-react';
import toast from "react-hot-toast";

export const CustomerForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const { data: customerData, isLoading: isFetching } = useGetCustomerByIdQuery(id, { skip: !isEditing });
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");


  useEffect(() => {
    if (isEditing && customerData?.data?.customer) {
      const { name, phone, email, address } = customerData.data.customer;
      setName(name || "");
      setPhone(phone || "");
      setEmail(email || "");
      setAddress(address || "");
    }
  }, [isEditing, customerData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Customer name is required");
    try {
      if (isEditing) {
        await updateCustomer({ id, data: { name, phone, email, address } }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await createCustomer({ name, phone, email, address }).unwrap();
        toast.success("Customer added successfully");
      }
      navigate("/customers");
    } catch (error) {
      toast.error(error.data?.message || `Error ${isEditing ? 'updating' : 'creating'} customer`);
    }
  };

  if (isEditing && isFetching) return <div className="flex h-60 items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={isEditing ? "Edit Customer" : "Add New Customer"} description="Manage customer information." icon={Users} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name <span className="text-red-500">*</span></label>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="e.g. customer@example.com" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Address</label>
            <Input 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Enter complete address" 
            />
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isCreating || isUpdating}>
              <Save className="mr-2 h-4 w-4" /> {isEditing ? "Update Customer" : "Save Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
