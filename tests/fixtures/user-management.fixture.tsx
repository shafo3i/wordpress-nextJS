import { createRoot } from "react-dom/client";
import { useState } from "react";
import { CreateUserModal } from "../../app/(admin)/admincp/users/_components/create-user-modal";
import { ResetPasswordModal } from "../../app/(admin)/admincp/users/_components/reset-password-modal";
import { ManageRolesModal } from "../../app/(admin)/admincp/users/_components/manage-roles-modal";
import en from "../../templates/language/en.json";
import ar from "../../templates/language/ar.json";
const root = createRoot(document.getElementById("fixture")!);
const roles = [
  { value: "admin", label: "admin", isDefault: true },
  { value: "subscriber", label: "subscriber", isDefault: true },
  {
    value: "reviewer",
    label: '<img src=x onerror="window.__userXss=true">',
    isDefault: false,
  },
];
const user = {
  id: "user-2",
  name: "Reader",
  email: "reader@example.test",
  role: "subscriber",
  image: null,
  emailVerified: true,
  banned: false,
  banReason: null,
  banExpires: null,
  twoFactorEnabled: true,
  createdAt: new Date(),
  _count: { posts: 0, comments: 0 },
};
function Fixture({ mode, locale }: { mode: string; locale: string }) {
  const [open, setOpen] = useState(true);
  const props = {
    open,
    onOpenChange: setOpen,
    direction: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
    dict: locale === "ar" ? ar : en,
    onSuccess: () => {},
  };
  return mode === "reset" ? (
    <ResetPasswordModal {...props} user={user} />
  ) : mode === "roles" ? (
    <ManageRolesModal {...props} roles={roles} />
  ) : (
    <CreateUserModal {...props} roles={roles} />
  );
}
let version = 0;
export function render(mode: string, locale: string) {
  root.render(<Fixture key={++version} mode={mode} locale={locale} />);
}
