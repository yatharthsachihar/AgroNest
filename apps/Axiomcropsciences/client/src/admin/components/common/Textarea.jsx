export default function Textarea({
  label,
  error,
  rows = 5,
  className = "",
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label>{label}</label>}

      <textarea
        rows={rows}
        className={error ? "input-error" : ""}
        {...props}
      />

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
}