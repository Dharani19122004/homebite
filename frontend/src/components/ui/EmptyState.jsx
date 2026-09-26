import { Inbox } from "lucide-react";
import "./EmptyState.css";

// Friendly "nothing here" block. `action` is an optional button / link.
function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
