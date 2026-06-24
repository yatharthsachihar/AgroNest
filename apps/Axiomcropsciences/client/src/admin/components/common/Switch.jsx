export default function Switch({ label, sub, checked, onChange }) {
  return (
    <div className="switch-wrap">
      <div>
        <div className="switch-label">{label}</div>
        {sub && <div className="switch-sub">{sub}</div>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider" />
      </label>
    </div>
  );
}
