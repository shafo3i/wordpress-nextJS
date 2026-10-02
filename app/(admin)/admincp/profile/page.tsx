import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { isAuthenticated } from "@/lib/authMIddleware";
import { ProfileClientView, UserProfile } from "./_components/profile-client-view";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await isAuthenticated();
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const userProfile: UserProfile = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email,
    image: session.user.image,
    emailVerified: session.user.emailVerified,
    twoFactorEnabled: (session.user as any).twoFactorEnabled,
    role: (session.user as any).role || "admin",
    createdAt: session.user.createdAt,
    notificationTx: true,
    notificationSecurity: true,
    notificationPromo: false,
    phoneNumber: null,
    biometricEnabled: false,
  };

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        <ProfileClientView
          initialUser={userProfile}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  );
}
