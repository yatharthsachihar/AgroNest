import { FiSearch, FiX } from "react-icons/fi";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search..."
}) {
  return (
    <div className="search-input">
      <FiSearch className="search-icon" />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {value && (
        <button
          type="button"
          className="search-clear"
          onClick={() =>
            onChange({
              target: { value: "" }
            })
          }
        >
          <FiX />
        </button>
      )}
    </div>
  );
}