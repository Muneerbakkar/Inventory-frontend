import { PageHeader } from '../../components/ui/PageHeader';
import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {  Save , Tags } from 'lucide-react';
import toast from "react-hot-toast";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { 
  useGetCategoryQuery, 
  useCreateCategoryMutation, 
  useUpdateCategoryMutation,
  useGetCategoriesQuery
} from "../../features/categories/categoryApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const schema = yup.object().shape({
  name: yup.string().required("Category name is required"),
  description: yup.string(),
  isActive: yup.boolean(),
  parentCategory: yup.string().nullable(),
});

export const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: categoryData, isLoading: isLoadingCategory } = useGetCategoryQuery(id, { skip: !isEdit });
  const { data: allCategoriesData } = useGetCategoriesQuery({ pagination: false });
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      parentCategory: "",
    }
  });

  useEffect(() => {
    if (categoryData?.data?.category) {
      const cat = categoryData.data.category;
      reset({
        name: cat.name,
        description: cat.description || "",
        isActive: cat.isActive ?? true,
        parentCategory: cat.parentCategory?._id || cat.parentCategory || "",
      });
    }
  }, [categoryData, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      if (!payload.parentCategory) {
        payload.parentCategory = null;
      }
      
      if (isEdit) {
        await updateCategory({ id, data: payload }).unwrap();
        toast.success("Category updated successfully!");
      } else {
        await createCategory(payload).unwrap();
        toast.success("Category created successfully!");
      }
      navigate("/categories");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save category");
    }
  };

  const isLoading = isCreating || isUpdating || (isEdit && isLoadingCategory);

  return (
    <div className="w-full space-y-6">
      <PageHeader title={isEdit ? "Edit Category" : "Add Category"} description="Manage category information." icon={Tags} 
        >
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Discard
        </Button>
      </PageHeader>

      <div className="rounded-md border bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              placeholder="e.g. Electronics"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Description
            </label>
            <Input
              id="description"
              placeholder="Description (Optional)"
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="parentCategory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Parent Category (Optional)
            </label>
            <select
              id="parentCategory"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("parentCategory")}
            >
              <option value="">-- None (Top Level Category) --</option>
              {allCategoriesData?.data?.categories
                ?.filter(cat => cat._id !== id)
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.parentCategory ? `${cat.parentCategory.name} > ` : ''}{cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link to="/categories">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Update" : "Save"} Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
