import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../../../api/productApi";
import PageHeader from "../../components/common/PageHeader";
import ProductForm from "../../components/forms/ProductForm";
import Skeleton from "../../components/common/Skeleton";

export default function ProductEditPage() {
  const { id } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getOne(id).then(r => r.data),
  });

  if (isLoading) return (
    <div className="dash-section">
      <Skeleton height={60} radius={16} />
      <Skeleton height={400} radius={20} style={{ marginTop: 24 }} />
    </div>
  );

  return (
    <div className="dash-section">
      <PageHeader title="Edit Product" subtitle={`Editing: ${product?.name}`} />
      <ProductForm product={product} />
    </div>
  );
}
