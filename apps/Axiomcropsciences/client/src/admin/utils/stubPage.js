// Lightweight stub generator — each module gets a real placeholder
// that will be replaced with full implementation in next phases.

const stub = (title, subtitle, icon = "🔧") => `
export default function ${title.replace(/\s/g, "")}Page() {
  return (
    <div className="dash-section">
      <div className="page-header">
        <div>
          <h1>${icon} ${title}</h1>
          <p>${subtitle}</p>
        </div>
      </div>
      <div className="dashboard-widget" style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <h3 style={{ color: "var(--text-muted)" }}>Coming next phase</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>This module is scaffolded and will be fully built shortly.</p>
      </div>
    </div>
  );
}
`;

export default stub;
