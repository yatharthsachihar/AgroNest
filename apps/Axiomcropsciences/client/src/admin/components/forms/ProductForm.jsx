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
import RichTextEditor from "../common/RichTextEditor";

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
      // Strip the UI-only `priceTouched` tracking flag before saving —
      // it's not part of the Product schema, just used locally to know
      // whether auto-calculated price should keep syncing to weight.
      variations: variations.map(({ priceTouched, ...v }) => v),
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

  // ── Variations Logic ──
  // Converts a weight/volume string into a common base unit (grams or ml)
  // so two different units can be compared as a ratio. Deliberately
  // forgiving about formatting since admins will type "250g", "250 g",
  // "250G", "0.25kg", or even just "250" without thinking about it.
  const parseWeight = (w) => {
    if (!w) return null;
    const cleaned = String(w).trim().toLowerCase().replace(/\s+/g, '');
    if (!cleaned) return null;

    // Bare number with no unit at all → assume grams (the most common
    // case for produce/seeds sold by small weight increments).
    if (/^[\d.]+$/.test(cleaned)) {
      const val = parseFloat(cleaned);
      return Number.isFinite(val) && val > 0 ? val : null;
    }

    const match = cleaned.match(/^([\d.]+)([a-z]+)$/);
    if (!match) return null;

    const val = parseFloat(match[1]);
    const unit = match[2];
    if (!Number.isFinite(val) || val <= 0) return null;

    // Everything normalizes to grams as the common base unit.
    if (['kg', 'kgs'].includes(unit))                                return val * 1000;
    if (['g', 'gm', 'gms', 'gram', 'grams'].includes(unit))          return val;

    return null; // unrecognized unit (e.g. "litre", "ml") — restricted to kg/g
  };

  const baseWeightG  = parseWeight(watch("weight"));
  const basePriceVal = parseFloat(watch("price"));

  const addVariation = () => {
    setVariations(prev => [...prev, { weight: "", price: "", stock: "", sku: "" }]);
  };
  const removeVariation = (i) => setVariations(prev => prev.filter((_, idx) => idx !== i));
  const updateVariation = (i, field, val) => {
    setVariations(prev => {
      const newVars = [...prev];
      newVars[i] = { ...newVars[i], [field]: val };

      // Auto-calculate price whenever the weight changes, as long as the
      // base weight/price are valid and this row's price hasn't been
      // hand-typed by the admin yet. Re-derives every time (not just when
      // empty) so fixing a typo in the weight re-syncs the price too.
      if (field === 'weight') {
        const newW = parseWeight(val);
        if (baseWeightG && basePriceVal && newW && !newVars[i].priceTouched) {
          newVars[i].price = Math.round((basePriceVal / baseWeightG) * newW);
        }
      }

      // Once the admin manually edits price, stop auto-overwriting it —
      // they may intentionally want a different price than the strict ratio.
      if (field === 'price') {
        newVars[i].priceTouched = true;
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
        <div className="form-grid-2">
          <Select
            label="Category"
            required
            options={categoryOptions}
            error={errors.category?.message}
            {...register("category", { required: "Category is required" })}
          />
          <Input
            label="Short Description"
            {...register("shortDescription")}
          />
        </div>
        <RichTextEditor
          label="Full Description"
          value={watch("description")}
          onChange={(val) => setValue("description", val)}
        />
      </FormSection>

      {/* Images */}
      <FormSection title="Product Images">
        <ProductImageManager images={images} onChange={setImages} />
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
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Adding variations (like 100g, 250g) will automatically attach them to this product. Prices are auto-calculated from the Base Weight/Price but you can override them manually.
        </p>

        {!baseWeightG && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", marginBottom: 16,
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, fontSize: 13, color: "#b45309",
          }}>
            Set a valid Base Weight above (e.g. "1kg", "500g") so variation prices can be auto-calculated from it.
          </div>
        )}

        {variations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {variations.map((v, i) => {
              const parsedW = parseWeight(v.weight);
              const weightInvalid = v.weight && !parsedW;
              const ratioPct = baseWeightG && parsedW ? Math.round((parsedW / baseWeightG) * 100) : null;

              return (
                <div key={v._id || i} style={{
                  display: "flex", flexDirection: "column", gap: 8,
                  background: "var(--bg-secondary)", padding: 16,
                  borderRadius: 12, border: `1px solid ${weightInvalid ? "var(--danger)" : "var(--border)"}`,
                }}>
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10,
                    alignItems: "flex-end",
                  }}>
                    <Input label="Weight (e.g. 100g)" value={v.weight || ""} onChange={e => updateVariation(i, "weight", e.target.value)} required />
                    <Input label="Price (₹)" type="number" value={v.price} onChange={e => updateVariation(i, "price", e.target.value)} required />
                    <Input label="Stock" type="number" value={v.stock} onChange={e => updateVariation(i, "stock", e.target.value)} />
                    <Input label="SKU" value={v.sku} onChange={e => updateVariation(i, "sku", e.target.value)} />
                    <Button type="button" variant="danger" onClick={() => removeVariation(i)}>Remove</Button>
                  </div>

                  {weightInvalid && (
                    <span style={{ fontSize: 12, color: "var(--danger)" }}>
                      Couldn't read this weight — please use only kg or g, like "250g" or "1kg".
                    </span>
                  )}
                  {!weightInvalid && ratioPct !== null && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {ratioPct}% of base weight
                      {!v.priceTouched && ` — auto-priced at ${ratioPct}% of ₹${basePriceVal || 0}`}
                      {v.priceTouched && " — manually overridden"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <Button type="button" variant="secondary" onClick={addVariation}>+ Add Variation</Button>
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

      {/* Publish Settings */}
      <FormSection title="Publish Settings">
        <div className="form-grid-2" style={{ marginBottom: 20 }}>
          <Select
            label="Status"
            options={[
              { label: "Active",   value: "active"   },
              { label: "Inactive", value: "inactive" },
            ]}
            {...register("status")}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Switch label="Visible in B2B" sub="Show to business customers"
              checked={flags.visibleInB2B} onChange={() => toggleFlag("visibleInB2B")} />
            <Switch label="Visible in B2C" sub="Show to retail customers"
              checked={flags.visibleInB2C} onChange={() => toggleFlag("visibleInB2C")} />
          </div>
        </div>
        <div className="form-grid-2">
          <Switch label="Featured Product"  checked={flags.isFeatured}   onChange={() => toggleFlag("isFeatured")} />
          <Switch label="Top Product"       checked={flags.isTopProduct} onChange={() => toggleFlag("isTopProduct")} />
          <Switch label="New Arrival"       checked={flags.isNewArrival} onChange={() => toggleFlag("isNewArrival")} />
          <Switch label="Best Seller"       checked={flags.isBestSeller} onChange={() => toggleFlag("isBestSeller")} />
          <Switch label="Trending"          checked={flags.isTrending}   onChange={() => toggleFlag("isTrending")} />
          <Switch label="Seasonal"          checked={flags.isSeasonal}   onChange={() => toggleFlag("isSeasonal")} />
        </div>
      </FormSection>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <Button type="submit" loading={mutation.isPending} size="lg" className="w-full-mobile">
          {isEdit ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="secondary" size="lg" className="w-full-mobile" onClick={() => navigate("/admin/products")}>
          Cancel
        </Button>
      </div>

    </form>
  );
}
