import { useContext } from "react";
import { ConfirmContext } from "../context/uiContexts";

// const confirm = useConfirm();
// if (!(await confirm("Delete this?"))) return;
// if (!(await confirm({ title, message, confirmLabel, tone: "danger" }))) return;
export function useConfirm() {
  const ctx = useContext(ConfirmContext);

  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }

  return ctx;
}
