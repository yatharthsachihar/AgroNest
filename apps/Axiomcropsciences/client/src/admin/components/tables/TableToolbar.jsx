import SearchInput from "../common/SearchInput";

export default function TableToolbar({
  search,
  setSearch,
  children
}) {
  return (
    <div className="table-toolbar">

      <SearchInput
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      <div className="table-toolbar-actions">
        {children}
      </div>

    </div>
  );
}