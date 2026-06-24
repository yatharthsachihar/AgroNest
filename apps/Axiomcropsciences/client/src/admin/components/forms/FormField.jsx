export default function FormField({
  label,
  children,
  required = false
}) {
  return (
    <div className="form-field">

      <label>
        {label}

        {required && (
          <span className="required">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
}