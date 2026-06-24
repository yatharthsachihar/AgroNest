import { FiPlus } from "react-icons/fi";

import SearchInput from "../../../components/common/SearchInput";
import Button from "../../../components/common/Button";

export default function ProductsToolbar({
  search,
  setSearch,
  onAdd
}) {
  return (
    <div className="products-toolbar">

      <SearchInput
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <Button onClick={onAdd}>
        <FiPlus />
        Add Product
      </Button>

    </div>
  );
}