export default function PageHeader({
  title,
  subtitle,
  actions
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="page-actions">
        {actions}
      </div>
    </div>
  );
}