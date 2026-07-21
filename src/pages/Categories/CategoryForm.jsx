import { PageHeader } from '../../components/ui/PageHeader';
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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

const renderPath = (parentCat) => {
  if (!parentCat) return null;
  const parts = [];
  let current = parentCat;
  while (current) {
    parts.unshift(current.name);
    current = current.parentCategory;
  }
  return parts.join(" > ") + " > ";
};

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
    control,
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

          <div className="space-y-2 relative">
            <label htmlFor="parentCategory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Parent Category (Optional)
            </label>
            <Controller
              name="parentCategory"
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

                const categories = allCategoriesData?.data?.categories?.filter(cat => cat._id !== id) || [];
                const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
                const selectedCat = categories.find(c => c._id === field.value);

                return (
                  <div className="relative" ref={dropdownRef}>
                    <div 
                      onClick={() => setIsOpen(!isOpen)}
                      className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm cursor-pointer border-input`}
                    >
                      <span className={selectedCat ? "" : "text-muted-foreground"}>
                        {selectedCat ? (
                          <>
                            {renderPath(selectedCat.parentCategory)}
                            {selectedCat.name}
                          </>
                        ) : "Select Parent Category..."}
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
                           <div 
                             className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                             onClick={() => { field.onChange(""); setIsOpen(false); setSearch(""); }}
                           >
                             -- None (Top Level Category) --
                           </div>
                           {filtered.map(cat => (
                             <div 
                               key={cat._id} 
                               className="cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                               onClick={() => { field.onChange(cat._id); setIsOpen(false); setSearch(""); }}
                             >
                               {cat.parentCategory ? <span className="text-muted-foreground text-xs">{renderPath(cat.parentCategory)}</span> : ''}
                               {cat.name}
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
