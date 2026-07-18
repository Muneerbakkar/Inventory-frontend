import { PageHeader } from '../../components/ui/PageHeader';
import { useState } from "react";
import {  Plus, Edit, Trash2, CheckCircle2, XCircle , Percent } from 'lucide-react';
import toast from "react-hot-toast";
import { useGetGstSlabsQuery, useCreateGstSlabMutation, useUpdateGstSlabMutation, useDeleteGstSlabMutation } from "../../features/gst/gstApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

export const GstSettings = () => {
  const { data, isLoading, isError } = useGetGstSlabsQuery();
  const [createSlab] = useCreateGstSlabMutation();
  const [updateSlab] = useUpdateGstSlabMutation();
  const [deleteSlab] = useDeleteGstSlabMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ label: '', cgst: '', sgst: '', igst: '' });

  const handleEdit = (slab) => {
    setIsEditing(true);
    setCurrentId(slab._id);
    setFormData({ label: slab.label, cgst: slab.cgst, sgst: slab.sgst, igst: slab.igst });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ label: '', cgst: '', sgst: '', igst: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        label: formData.label,
        cgst: Number(formData.cgst),
        sgst: Number(formData.sgst),
        igst: Number(formData.igst),
      };
      
      if (isEditing) {
        await updateSlab({ id: currentId, ...payload }).unwrap();
        toast.success("GST Slab updated successfully");
      } else {
        await createSlab(payload).unwrap();
        toast.success("GST Slab created successfully");
      }
      handleCancel();
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this GST slab?")) {
      try {
        await deleteSlab(id).unwrap();
        toast.success("GST Slab deleted successfully");
      } catch (err) {
        toast.error("Failed to delete GST Slab");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="GST Master Settings" description="Configure GST rates." icon={Percent} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border rounded-lg p-5 bg-card shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-4">{isEditing ? "Edit GST Slab" : "Add New Slab"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label (e.g., 18% GST)</label>
              <Input
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Label"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">CGST (%)</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cgst}
                  onChange={(e) => setFormData({ ...formData, cgst: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SGST (%)</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sgst}
                  onChange={(e) => setFormData({ ...formData, sgst: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">IGST (%)</label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.igst}
                onChange={(e) => setFormData({ ...formData, igst: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">{isEditing ? "Update" : "Create"}</Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              )}
            </div>
          </form>
        </div>

        <div className="<div md:col-span-2 md:rounded-lg md:border md:bg-card md:shadow-sm overflow-x-auto w-full">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>CGST</TableHead>
                <TableHead>SGST</TableHead>
                <TableHead>IGST</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={7} className="text-center text-destructive h-24">Failed to load GST Slabs</TableCell></TableRow>
              ) : data?.data?.slabs?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground h-24">No GST Slabs found.</TableCell></TableRow>
              ) : (
                data?.data?.slabs?.map((slab) => (
                  <TableRow key={slab._id}>
                    <TableCell data-label="Label" className="font-medium">{slab.label}</TableCell>
                    <TableCell data-label="CGST">{slab.cgst}%</TableCell>
                    <TableCell data-label="SGST">{slab.sgst}%</TableCell>
                    <TableCell data-label="IGST">{slab.igst}%</TableCell>
                    <TableCell data-label="Total" className="font-bold">{slab.totalPercent}%</TableCell>
                    <TableCell data-label="Status">
                      {slab.isActive ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                    <TableCell data-label="Actions" className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(slab)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(slab._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
