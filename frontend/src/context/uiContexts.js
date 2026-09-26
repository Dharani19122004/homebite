import { createContext } from "react";

// Contexts for the shared UI feedback components. The providers live in
// components/ui/, and pages use the hooks in hooks/useToast.js and
// hooks/useConfirm.js.
export const ToastContext = createContext(null);
export const ConfirmContext = createContext(null);
