"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { safeMediaUrl } from "@/lib/post-media";
import { authClient } from "@/lib/auth-client";
import {
  KeyRound,
  Shield,
  Edit,
  Fingerprint,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import EditProfileModal from "./edit-profile-modal";
import UpdatePassForm from "./update-pass-form";
import TwoFactorSettings from "./two-factor-settings";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  twoFactorEnabled?: boolean | null;
  createdAt: string | Date;
  role?: string | null;
};

interface ProfileClientViewProps {
  initialUser: UserProfile;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ProfileClientView({
  initialUser,
  dict = {},
  direction = "ltr",
}: ProfileClientViewProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<
    "identity" | "security" | "notifications"
  >("identity");

  // Screen Options & Help toggles
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpdatePassOpen, setIsUpdatePassOpen] = useState(false);
  const [is2FAOpen, setIs2FAOpen] = useState(false);

  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const [signOutError, setSignOutError] = useState(false);
  const handleSignOut = async () => {
    setSignOutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(true);
        return;
      }
      router.replace("/cms-login");
      router.refresh();
    } catch {
      setSignOutError(true);
    }
  };

  return (
    <div className="space-y-4 text-start">
      {signOutError && (
        <p role="alert">{dict["admin.profile.signout_error"]}</p>
      )}
      {/* ========================================================================= */}
      {/* 1. SCREEN OPTIONS & HELP DRAWERS                                          */}
      {/* ========================================================================= */}
      {showScreenOptions && (
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 text-[13px] text-[#2c3338] shadow-2xs">
          <h4 className="mb-1.5 font-bold text-[#1d2327]">
            {dict["admin.common.screen_options"]}
          </h4>
          <p className="mb-3 leading-relaxed text-[#646970]">
            {dict["admin.profile.screen_options_help"]}
          </p>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#dcdcde] pt-2 text-[12px] text-[#50575e]">
            <span>
              {dict["admin.profile.display_name"]}:{" "}
              <strong className="text-[#1d2327]">{user.name}</strong>
            </span>
            <span>|</span>
            <span>
              {dict["admin.profile.email"]}:{" "}
              <strong className="font-mono text-[#1d2327]">{user.email}</strong>
            </span>
            <span>|</span>
            <span>
              {dict["admin.profile.two_factor"]}:{" "}
              <strong className="text-[#1d2327]">
                {user.twoFactorEnabled
                  ? dict["admin.profile.two_factor_active"]
                  : dict["admin.profile.two_factor_disabled"]}
              </strong>
            </span>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-4 text-[13px] leading-relaxed text-[#2c3338] shadow-2xs">
          <h4 className="mb-1.5 font-bold text-[#1d2327]">
            {dict["admin.common.help"]}
          </h4>
          <ul className="list-inside list-disc space-y-1 text-[12px] text-[#646970]">
            <li>
              <strong>{dict["admin.profile.change_password"]}:</strong>{" "}
              {dict["admin.profile.change_password_desc"]}
            </li>
            <li>
              <strong>{dict["admin.profile.two_factor"]}:</strong>{" "}
              {dict["admin.profile.two_factor_desc"]}
            </li>
            <li>
              <strong>{dict["admin.profile.passkeys"]}:</strong>{" "}
              {dict["admin.profile.passkeys_unavailable"]}
            </li>
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
            {dict["admin.profile.title"]}
          </h1>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[13px] font-semibold text-[#2271b1] shadow-2xs transition-colors hover:bg-[#f0f0f1] hover:text-[#135e96]"
          >
            <Edit className="size-3.5" />
            <span>{dict["admin.profile.edit_profile"]}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUpdatePassOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[13px] font-semibold text-[#2271b1] shadow-2xs transition-colors hover:bg-[#f0f0f1] hover:text-[#135e96]"
          >
            <Lock className="size-3.5" />
            <span>{dict["admin.profile.change_password"]}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1 text-[13px] font-semibold text-[#50575e] shadow-2xs transition-colors hover:border-[#d63638] hover:bg-[#fcf0f1] hover:text-[#b32d2e]"
          >
            <LogOut className="size-3.5" />
            <span>{dict["admin.profile.log_out"]}</span>
          </button>
        </div>

        {/* Screen Options & Help */}
        <div className="flex items-center gap-1 text-[13px]">
          <button
            type="button"
            onClick={() => {
              setShowScreenOptions(!showScreenOptions);
              setShowHelp(false);
            }}
            className={`flex cursor-pointer items-center gap-1 rounded-[3px] border px-2.5 py-1 text-[13px] transition-colors ${
              showScreenOptions
                ? "border-[#2271b1] bg-[#2271b1] text-white"
                : "border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            }`}
          >
            <span>{dict["admin.common.screen_options"]}</span>
            <span className="text-[9px]">▼</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowHelp(!showHelp);
              setShowScreenOptions(false);
            }}
            className={`flex cursor-pointer items-center gap-1 rounded-[3px] border px-2.5 py-1 text-[13px] transition-colors ${
              showHelp
                ? "border-[#2271b1] bg-[#2271b1] text-white"
                : "border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            }`}
          >
            <span>{dict["admin.common.help"]}</span>
            <span className="text-[9px]">▼</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBSUBSUB NAVIGATION TABS                                              */}
      {/* ========================================================================= */}
      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 border-b border-[#c3c4c7] p-0 pb-2 text-[13px] text-[#646970]">
        <li>
          <button
            type="button"
            onClick={() => setActiveTab("identity")}
            className={`cursor-pointer ${
              activeTab === "identity"
                ? "font-semibold text-[#1d2327]"
                : "text-[#2271b1] hover:text-[#135e96] hover:underline"
            }`}
          >
            {dict["admin.profile.personal_options"]}
          </button>
          <span className="ms-1.5 text-[#8c8f94]">|</span>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`cursor-pointer ${
              activeTab === "security"
                ? "font-semibold text-[#1d2327]"
                : "text-[#2271b1] hover:text-[#135e96] hover:underline"
            }`}
          >
            {dict["admin.profile.account_security"]}
          </button>
          <span className="ms-1.5 text-[#8c8f94]">|</span>
        </li>
        <li>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`cursor-pointer ${
              activeTab === "notifications"
                ? "font-semibold text-[#1d2327]"
                : "text-[#2271b1] hover:text-[#135e96] hover:underline"
            }`}
          >
            {dict["admin.profile.notifications"]}
          </button>
        </li>
      </ul>

      {/* ========================================================================= */}
      {/* 4. TAB 1: PERSONAL OPTIONS & IDENTITY                                     */}
      {/* ========================================================================= */}
      {activeTab === "identity" && (
        <div className="space-y-4">
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-2xs">
            <h2 className="mb-4 border-b border-[#c3c4c7] pb-3 text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.account_info"]}
            </h2>

            <div className="grid grid-cols-1 items-center gap-4 border-b border-[#f0f0f1] py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.picture"]}
              </span>
              <div className="flex items-center gap-3">
                <Avatar className="size-16 rounded-[4px] border border-[#c3c4c7]">
                  <AvatarImage
                    src={user.image ? safeMediaUrl(user.image) || "" : ""}
                    alt={user.name}
                  />
                  <AvatarFallback className="rounded-[4px] bg-[#2271b1] text-lg font-bold text-white">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-[12px] text-[#646970]">
                  <p className="font-semibold text-[#1d2327]">
                    {user.name} ({user.role || ""})
                  </p>
                  <p>{dict["admin.profile.picture_desc"]}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-baseline gap-4 border-b border-[#f0f0f1] py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.username"]}
              </span>
              <div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.id}
                  className="w-full max-w-md cursor-not-allowed rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 font-mono text-[13px] text-[#50575e]"
                />
                <p className="mt-1 text-[12px] text-[#646970]">
                  {dict["admin.profile.username_desc"]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 items-baseline gap-4 border-b border-[#f0f0f1] py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.display_name"]}
              </span>
              <div className="flex max-w-md flex-wrap items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={user.name}
                  className="flex-1 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338]"
                />
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1.5 text-[13px] font-semibold text-[#2271b1] hover:bg-[#f0f0f1]"
                >
                  {dict["common.edit"]}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 items-baseline gap-4 border-b border-[#f0f0f1] py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.email"]}
              </span>
              <div>
                <div className="flex max-w-md items-center gap-2">
                  <input
                    type="email"
                    readOnly
                    value={user.email}
                    className="flex-1 cursor-not-allowed rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 font-mono text-[13px] text-[#50575e]"
                    dir="ltr"
                  />
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#a7e3b2] bg-[#edfaef] px-2 py-0.5 text-[11px] font-semibold text-[#007017]">
                      <CheckCircle2 className="size-3" />
                      {dict["admin.profile.verified"]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#f5c6cb] bg-[#fcf0f1] px-2 py-0.5 text-[11px] font-semibold text-[#d63638]">
                      <AlertTriangle className="size-3" />
                      {dict["admin.profile.unverified"]}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-[#646970]">
                  {dict["admin.profile.email_desc"]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 items-baseline gap-4 border-b border-[#f0f0f1] py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.role"]}
              </span>
              <div>
                <span className="inline-block rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 py-0.5 text-[12px] font-semibold text-[#1d2327]">
                  {user.role || ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 items-baseline gap-4 py-3 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.registered"]}
              </span>
              <div className="text-[13px] text-[#50575e]">
                {new Date(user.createdAt).toLocaleDateString(
                  direction === "rtl" ? "ar-EG" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: SECURITY & TWO-FACTOR AUTH                                      */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Two-Factor Authentication Card */}
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-2xs">
            <div className="mb-4 flex flex-wrap items-center justify-between border-b border-[#c3c4c7] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-[#2271b1]" />
                <h2 className="text-[15px] font-semibold text-[#1d2327]">
                  {dict["admin.profile.two_factor"]}
                </h2>
              </div>
              {user.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#a7e3b2] bg-[#edfaef] px-2.5 py-0.5 text-[11px] font-bold text-[#007017]">
                  <CheckCircle2 className="size-3" />
                  {dict["admin.profile.two_factor_active"]}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#646970]">
                  {dict["admin.profile.two_factor_disabled"]}
                </span>
              )}
            </div>

            <p className="mb-4 text-[13px] leading-relaxed text-[#50575e]">
              {dict["admin.profile.two_factor_desc"]}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIs2FAOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#135e96]"
              >
                <Smartphone className="size-3.5" />
                <span>
                  {user.twoFactorEnabled
                    ? dict["admin.profile.manage_two_factor"]
                    : dict["admin.profile.enable_two_factor"]}
                </span>
              </button>
            </div>
          </div>

          {/* Password Management Card */}
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 border-b border-[#c3c4c7] pb-3">
              <KeyRound className="size-4 text-[#2271b1]" />
              <h2 className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.change_password"]}
              </h2>
            </div>

            <div className="grid grid-cols-1 items-center gap-4 py-2 md:grid-cols-[220px_1fr]">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.current_password"]}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[#646970]">••••••••••••</span>
                <button
                  type="button"
                  onClick={() => setIsUpdatePassOpen(true)}
                  className="cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[13px] font-semibold text-[#2271b1] shadow-2xs hover:bg-[#f0f0f1] hover:text-[#135e96]"
                >
                  {dict["admin.profile.change_password"]}
                </button>
              </div>
            </div>
          </div>

          {/* Passkeys (WebAuthn) Card */}
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 shadow-2xs">
            <div className="mb-4 flex items-center gap-2 border-b border-[#c3c4c7] pb-3">
              <Fingerprint className="size-4 text-[#2271b1]" />
              <h2 className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.passkeys"]}
              </h2>
            </div>

            <p className="mb-4 text-[13px] leading-relaxed text-[#50575e]">
              {dict["admin.profile.passkeys_unavailable"]}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: NOTIFICATIONS & ALERTS                                          */}
      {/* ========================================================================= */}
      {activeTab === "notifications" && (
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-5 text-[13px] text-[#50575e]">
          {dict["admin.profile.notifications_unavailable"]}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          user={user}
          onUpdate={handleUpdateUser}
          dict={dict}
          direction={direction}
        />
      )}

      {isUpdatePassOpen && (
        <UpdatePassForm
          isOpen={isUpdatePassOpen}
          onClose={() => setIsUpdatePassOpen(false)}
          dict={dict}
          direction={direction}
        />
      )}

      {is2FAOpen && (
        <TwoFactorSettings
          isOpen={is2FAOpen}
          onClose={() => setIs2FAOpen(false)}
          user={{ twoFactorEnabled: user.twoFactorEnabled }}
          onUpdate={() => {
            void authClient
              .getSession({ query: { disableCookieCache: true } })
              .then((result) => {
                if (result.data)
                  handleUpdateUser({
                    twoFactorEnabled: !!result.data.user.twoFactorEnabled,
                  });
                router.refresh();
              })
              .catch(() => router.refresh());
          }}
          dict={dict}
          direction={direction}
        />
      )}
    </div>
  );
}
