import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";

export default function ProductsFilters() {
  return (
    <div className="products-filters">

      <Input
        placeholder="Search products..."
      />

      <Select
        options={[
          {
            label: "All Categories",
            value: ""
          },
          {
            label: "Seeds",
            value: "seeds"
          },
          {
            label: "Fertilizers",
            value: "fertilizers"
          }
        ]}
      />

      <Select
        options={[
          {
            label: "All Status",
            value: ""
          },
          {
            label: "Active",
            value: "active"
          },
          {
            label: "Inactive",
            value: "inactive"
          }
        ]}
      />

    </div>
  );
}