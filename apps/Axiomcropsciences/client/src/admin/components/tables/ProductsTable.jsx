import {
  FiEdit,
  FiTrash2
} from "react-icons/fi";

import DataTable from "./DataTable";

export default function ProductsTable({
  products
}) {
  const columns = [
    {
      key: "name",
      label: "Product"
    },
    {
      key: "category",
      label: "Category"
    },
    {
      key: "price",
      label: "Price"
    },
    {
      key: "stock",
      label: "Stock"
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <div className="table-actions">

          <button className="btn-edit">
            <FiEdit />
          </button>

          <button className="btn-delete">
            <FiTrash2 />
          </button>

        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
    />
  );
}