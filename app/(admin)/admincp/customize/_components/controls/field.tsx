import type { ReactNode } from "react";
import { HINT_CLASS, LABEL_CLASS } from "./styles";

/** Label + hint wrapper used by controls that don't render their own label row. */
export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {description && <p className={`${HINT_CLASS} mb-1.5`}>{description}</p>}
      {children}
    </div>
  );
}
