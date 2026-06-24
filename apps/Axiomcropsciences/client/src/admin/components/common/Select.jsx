export default function Select({
  label,
  options = [],
  error,
  className = "",
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}

      <select
        className={error ? "input-error" : ""}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
}