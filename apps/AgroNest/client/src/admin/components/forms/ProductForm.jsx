import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { productApi } from "../../../api/productApi";
import { categoryApi } from "../../../api/categoryApi";

import Input from "../common/Input";
import Textarea from "../common/Textarea";
import Select from "../common/Select";
import Button from "../common/Button";
import Switch from "../common/Switch";
import FormSection from "./FormSection";
import ProductImageManager from "./ProductImageManager";

const UNITS = ["kg", "g", "litre", "ml", "piece", "dozen", "quintal", "tonne", "bag", "bundle"];

export default function ProductForm({ product = null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [images, setImages] = useState(product?.images || []);
  const [specs, setSpecs] = useState(product?.specifications || []);
  const [variations, setVariations] = useState(product?.variations || []);
  const [flags, setFlags] = useState({
    isFeatured:   product?.isFeatured   || false,
    isTopProduct: product?.isTopProduct || false,
    isNewArrival: product?.isNewArrival || false,
    isBestSeller: product?.isBestSeller || false,
    isTrending:   product?.isTrending   || false,
    isSeasonal:   product?.isSeasonal   || false,
    visibleInB2B: product?.visibleInB2B ?? true,
    visibleInB2C: product?.visibleInB2C ?? true,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll().then(r => r.data),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name:             product?.name             || "",
      slug:             product?.slug             || "",
      shortDescription: product?.shortDescription || "",
      description:      product?.description      || "",
      category:         product?.category?._id    || product?.category || "",
      price:            product?.price            || "",
      weight:           product?.weight           || "1kg",
      stock:            product?.stock            || "",
      brand:            product?.brand            || "",
      badge:            product?.badge            || "",
      status:           product?.status           || "active",
      // SEO
      seoTitle:        product?.seoTitle        || "",
      seoDescription:  product?.seoDescription  || "",
      seoKeywords:     product?.seoKeywords      || "",
    },
  });

  const watchName = watch("name");
  useEffect(() => {
    if (!isEdit && watchName) {
      setValue("slug", watchName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
    }
  }, [watchName, isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? productApi.update(product._id, data) : productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Product updated!" : "Product created!");
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Error saving product"),
  });

  const onSubmit = (data) => {
    mutation.mutate({
      ...data,
      ...flags,
      images,
      specifications: specs,
      variations,
    });
  };

  const toggleFlag = (key) => setFlags(prev => ({ ...prev, [key]: !prev[key] }));

  const addSpec = () => setSpecs(prev => [...prev, { key: "", value: "" }]);
  const removeSpec = (i) => setSpecs(prev => prev.filter((_, idx) => idx !== i));
  const updateSpec = (i, field, val) =>
    setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const categoryOptions = [
    { label: "Select Category", value: "" },
    ...categories.map(c => ({ label: c.name, value: c._id })),
  ];

  // Variations Logic
  const parseWeight = (w) => {
    if (!w) return null;
    const match = String(w).toLowerCase().replace(/\s+/g, '').match(/^([\d.]+)([a-z]+)$/);
    if (!match) return null;
    const val = parseFloat(match[1]);
    const unit = match[2];
    if (['kg', 'l', 'litre', 'litres'].includes(unit)) return val * 1000;
    if (['g', 'gm', 'ml'].includes(unit)) return val;
    return null;
  };

  const addVariation = () => {
    setVariations(prev => [...prev, { weight: "", price: "", stock: "", sku: "" }]);
  };
  const removeVariation = (i) => setVariations(prev => prev.filter((_, idx) => idx !== i));
  const updateVariation = (i, field, val) => {
    setVariations(prev => {
      const newVars = [...prev];
      newVars[i] = { ...newVars[i], [field]: val };
      
      // Auto-calculate price if weight changes and base weight/price are valid
      if (field === 'weight' && watch("weight") && watch("price")) {
        const baseW = parseWeight(watch("weight"));
        const baseP = parseFloat(watch("price"));
        const newW = parseWeight(val);
        if (baseW && baseP && newW && !newVars[i].price) { // Only auto-calc if price is empty
          newVars[i].price = Math.round((baseP / baseW) * newW);
        }
      }
      return newVars;
    });
  };

  return (
    <form className="product-form" onSubmit={handleSubmit(onSubmit)}>

      {/* Basic Info */}
      <FormSection title="Basic Information">
        <div className="form-grid-2">
          <Input
            label="Product Name"
            required
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Slug (URL)"
            {...register("slug")}
          />
        </div>
        <Input
          label="Short Description"
          {...register("shortDescription")}
        />
        <Textarea
          label="Full Description"
          rows={5}
          {...register("description")}
        />
      </FormSection>

      {/* Pricing & Inventory */}
      <FormSection title="Pricing & Inventory">
        <div className="form-grid-3">
          <Input
            label="Price (₹)"
            type="number"
            required
            error={errors.price?.message}
            {...register("price", { required: "Price is required", min: 0 })}
          />
          <Input
            label="Stock"
            type="number"
            {...register("stock", { min: 0 })}
          />
          <Input
            label="Base Weight (e.g. 1kg)"
            required
            {...register("weight", { required: "Weight is required" })}
          />
        </div>
        <div className="form-grid-2">
          <Input label="Brand" {...register("brand")} />
          <Input label="Badge (e.g. Organic)" {...register("badge")} />
        </div>
      </FormSection>

      {/* Variations Builder */}
      <FormSection title="Product Variations">
        <p style={{ fontSize: 13, color: "var(--site-text-muted)", marginBottom: 16 }}>
          Adding variations (like 100g, 250g) will automatically attach them to this product. Prices are auto-calculated from the Base Weight/Price but you can override them manually.
        </p>
        
        {variations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {variations.map((v, i) => (
              <div key={v._id || i} style={{ 
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, 
                alignItems: "flex-end", background: "var(--site-bg-secondary)", padding: 16, 
                borderRadius: 12, border: "1px solid var(--site-border)"
              }}>
                <Input label="Weight (e.g. 100g)" value={v.weight || ""} onChange={e => updateVariation(i, "weight", e.target.value)} required />
                <Input label="Price (₹)" type="number" value={v.price} onChange={e => updateVariation(i, "price", e.target.value)} required />
                <Input label="Stock" type="number" value={v.stock} onChange={e => updateVariation(i, "stock", e.target.value)} />
                <Input label="SKU" value={v.sku} onChange={e => updateVariation(i, "sku", e.target.value)} />
                <Button type="button" variant="danger" onClick={() => removeVariation(i)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
        
        <Button type="button" variant="secondary" onClick={addVariation}>+ Add Variation</Button>
      </FormSection>

      {/* Category & Status */}
      <FormSection title="Category & Status">
        <div className="form-grid-2">
          <Select
            label="Category"
            required
            options={categoryOptions}
            error={errors.category?.message}
            {...register("category", { required: "Category is required" })}
          />
          <Select
            label="Status"
            options={[
              { label: "Active",   value: "active"   },
              { label: "Inactive", value: "inactive" },
            ]}
            {...register("status")}
          />
        </div>
      </FormSection>

      {/* Visibility */}
      <FormSection title="Visibility & Business Model">
        <Switch label="Visible in B2B" sub="Show to business customers"
          checked={flags.visibleInB2B} onChange={() => toggleFlag("visibleInB2B")} />
        <Switch label="Visible in B2C" sub="Show to retail customers"
          checked={flags.visibleInB2C} onChange={() => toggleFlag("visibleInB2C")} />
      </FormSection>

      {/* Feature Flags */}
      <FormSection title="Homepage Feature Flags">
        <div className="form-grid-2">
          <Switch label="Featured Product"  checked={flags.isFeatured}   onChange={() => toggleFlag("isFeatured")} />
          <Switch label="Top Product"       checked={flags.isTopProduct} onChange={() => toggleFlag("isTopProduct")} />
          <Switch label="New Arrival"       checked={flags.isNewArrival} onChange={() => toggleFlag("isNewArrival")} />
          <Switch label="Best Seller"       checked={flags.isBestSeller} onChange={() => toggleFlag("isBestSeller")} />
          <Switch label="Trending"          checked={flags.isTrending}   onChange={() => toggleFlag("isTrending")} />
          <Switch label="Seasonal"          checked={flags.isSeasonal}   onChange={() => toggleFlag("isSeasonal")} />
        </div>
      </FormSection>

      {/* Images */}
      <FormSection title="Product Images">
        <ProductImageManager images={images} onChange={setImages} />
      </FormSection>

      {/* Specifications */}
      <FormSection title="Specifications">
        {specs.map((spec, i) => (
          <div key={i} className="form-grid-2" style={{ alignItems: "flex-end" }}>
            <Input
              label="Key"
              value={spec.key}
              onChange={e => updateSpec(i, "key", e.target.value)}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <Input
                label="Value"
                value={spec.value}
                onChange={e => updateSpec(i, "value", e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="button" variant="danger" size="sm" onClick={() => removeSpec(i)}>×</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={addSpec}>+ Add Specification</Button>
      </FormSection>

      {/* SEO */}
      <FormSection title="SEO Metadata">
        <Input label="SEO Title"       {...register("seoTitle")} />
        <Textarea label="SEO Description" rows={3} {...register("seoDescription")} />
        <Input label="Keywords (comma separated)" {...register("seoKeywords")} />
      </FormSection>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12 }}>
        <Button type="submit" loading={mutation.isPending} size="lg">
          {isEdit ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/admin/products")}>
          Cancel
        </Button>
      </div>

    </form>
  );
}
