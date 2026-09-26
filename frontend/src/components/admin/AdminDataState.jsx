import { AlertCircle } from "lucide-react";
import { SkeletonList } from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";

// Renders loading / error / empty states, otherwise its children.
function AdminDataState({ loading, error, isEmpty, emptyMessage, children }) {
  if (loading) {
    return <SkeletonList count={3} label="Loading..." />;
  }

  if (error) {
    return (
      <p className="catalog-error" role="alert">
        <AlertCircle size={16} /> {error}
      </p>
    );
  }

  if (isEmpty) {
    return <EmptyState title="Nothing here yet" message={emptyMessage} />;
  }

  return children;
}

export default AdminDataState;
