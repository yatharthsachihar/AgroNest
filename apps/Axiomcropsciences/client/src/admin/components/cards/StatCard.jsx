import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

export default function StatCard({
  title,
  value,
  icon,
  change,
  positive = true
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          {icon}
        </div>

        <div
          className={`stat-change ${
            positive ? "positive" : "negative"
          }`}
        >
          {positive ? (
            <FiTrendingUp />
          ) : (
            <FiTrendingDown />
          )}

          <span>{change}</span>
        </div>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-label">
        {title}
      </div>
    </div>
  );
}