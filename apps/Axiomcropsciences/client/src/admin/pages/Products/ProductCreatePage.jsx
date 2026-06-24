import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/forms/ProductForm";

export default function ProductCreatePage() {
  return (
    <div className="dash-section">
      <PageHeader title="Add Product" subtitle="Create a new product in your catalog" />
      <ProductForm />
    </div>
  );
}
