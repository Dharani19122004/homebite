import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { ConfirmContext } from "../../context/uiContexts";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import "./ConfirmDialog.css";

const DEFAULTS = {
  title: "Please confirm",
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  tone: "primary", // "primary" | "danger"
};

// Replaces window.confirm: `await confirm("Delete this?")` resolves to
// true / false. Accepts a string or { title, message, confirmLabel,
// cancelLabel, tone }.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const confirmRef = useRef(null);

  const settle = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback(
    (input) =>
      new Promise((resolve) => {
        // A new request supersedes an unanswered one.
        resolver.current?.(false);
        resolver.current = resolve;

        const options = typeof input === "string" ? { message: input } : input;
        setDialog({ ...DEFAULTS, ...options });
      }),
    [],
  );

  useEscapeKey(() => {
    if (dialog) settle(false);
  });

  useEffect(() => {
    if (dialog) confirmRef.current?.focus();
  }, [dialog]);

  const api = useMemo(() => confirm, [confirm]);
  const Icon = dialog?.tone === "danger" ? AlertTriangle : HelpCircle;

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      {dialog && (
        <div className="confirm-overlay" onClick={() => settle(false)}>
          <div
            className="confirm-dialog card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`confirm-icon confirm-icon-${dialog.tone}`}>
              <Icon size={22} />
            </span>

            <div className="confirm-body">
              <h3 id="confirm-title">{dialog.title}</h3>
              {dialog.message && <p id="confirm-message">{dialog.message}</p>}
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => settle(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmRef}
                className={
                  dialog.tone === "danger"
                    ? "btn btn-danger"
                    : "btn btn-primary"
                }
                onClick={() => settle(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
