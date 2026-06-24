export default function FormSection({
  title,
  children
}) {
  return (
    <div className="form-section">

      <div className="form-section-header">
        {title}
      </div>

      <div className="form-section-content">
        {children}
      </div>

    </div>
  );
}