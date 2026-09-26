import { RefreshCw } from "lucide-react";

function AdminPageHeader({ title, subtitle, onRefresh, refreshing, children }) {
  return (
    <div className="admin-page-header">
      <div className="catalog-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="admin-page-header-actions">
        {children}
        {onRefresh && (
          <button
            type="button"
            className="btn btn-outline admin-refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminPageHeader;
