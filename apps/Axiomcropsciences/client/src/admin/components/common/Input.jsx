import "./Input.css";

export default function Input({
  label,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <input
        className={`input-field ${error ? "input-error" : ""}`}
        {...props}
      />

      {error && (
        <span className="input-error-text">
          {error}
        </span>
      )}
    </div>
  );
}