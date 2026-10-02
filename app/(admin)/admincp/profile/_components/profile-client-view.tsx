"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  User,
  KeyRound,
  Mail,
  Calendar,
  Bell,
  Shield,
  ShieldCheck,
  Edit,
  Phone,
  Fingerprint,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import EditProfileModal from "./edit-profile-modal";
import UpdatePassForm from "./update-pass-form";
import TwoFactorSettings from "./two-factor-settings";
import NotificationSettingsModal from "./notification-settings-modal";
import PasskeySettings from "./passkey-settings";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  twoFactorEnabled?: boolean | null;
  createdAt: string | Date;
  role?: string | null;
  notificationTx?: boolean;
  notificationSecurity?: boolean;
  notificationPromo?: boolean;
  phoneNumber?: string | null;
  biometricEnabled?: boolean | null;
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
  const [activeTab, setActiveTab] = useState<"identity" | "security" | "notifications">("identity");

  // Screen Options & Help toggles
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpdatePassOpen, setIsUpdatePassOpen] = useState(false);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isPasskeyOpen, setIsPasskeyOpen] = useState(false);

  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      window.location.href = "/cms-login";
    }
  };

  return (
    <div className="space-y-4 text-start">
      {/* ========================================================================= */}
      {/* 1. SCREEN OPTIONS & HELP DRAWERS                                          */}
      {/* ========================================================================= */}
      {showScreenOptions && (
        <div className="bg-white border border-[#c3c4c7] p-4 shadow-2xs text-[13px] text-[#2c3338] rounded-[3px]">
          <h4 className="font-bold text-[#1d2327] mb-1.5">
            {dict["admin.common.screen_options"] || "Screen Options"}
          </h4>
          <p className="text-[#646970] leading-relaxed mb-3">
            {dict["admin.profile.screen_options_help"] ||
              "Manage administrator account settings, update personal details, change passwords, and configure two-factor authentication."}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[#50575e] pt-2 border-t border-[#dcdcde] text-[12px]">
            <span>
              {dict["admin.profile.display_name"] || "Name"}:{" "}
              <strong className="text-[#1d2327]">{user.name}</strong>
            </span>
            <span>|</span>
            <span>
              {dict["admin.profile.email"] || "Email"}:{" "}
              <strong className="font-mono text-[#1d2327]">{user.email}</strong>
            </span>
            <span>|</span>
            <span>
              {dict["admin.profile.two_factor"] || "Two-Factor Auth"}:{" "}
              <strong className="text-[#1d2327]">
                {user.twoFactorEnabled
                  ? dict["admin.profile.two_factor_active"] || "Active"
                  : dict["admin.profile.two_factor_disabled"] || "Disabled"}
              </strong>
            </span>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="bg-white border border-[#c3c4c7] p-4 shadow-2xs text-[13px] text-[#2c3338] leading-relaxed rounded-[3px]">
          <h4 className="font-bold text-[#1d2327] mb-1.5">
            {dict["admin.common.help"] || "Help"}
          </h4>
          <ul className="text-[#646970] space-y-1 list-disc list-inside text-[12px]">
            <li>
              <strong>{dict["admin.profile.change_password"] || "Password"}:</strong>{" "}
              {dict["admin.profile.change_password_desc"] ||
                "Updating your password automatically signs out any other active browser sessions."}
            </li>
            <li>
              <strong>{dict["admin.profile.two_factor"] || "Two-Factor Authentication"}:</strong>{" "}
              {dict["admin.profile.two_factor_desc"] ||
                "Protects your account with a time-based code from an authenticator app."}
            </li>
            <li>
              <strong>{dict["admin.profile.passkeys"] || "Passkeys"}:</strong>{" "}
              {dict["admin.profile.passkeys_desc"] ||
                "Passwordless authentication using Touch ID, Face ID, or Windows Hello."}
            </li>
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PAGE HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            {dict["admin.profile.title"] || "Profile"}
          </h1>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="inline-flex items-center gap-1.5 border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] px-3 py-1 text-[13px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
          >
            <Edit className="size-3.5" />
            <span>{dict["admin.profile.edit_profile"] || "Edit Profile"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUpdatePassOpen(true)}
            className="inline-flex items-center gap-1.5 border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] px-3 py-1 text-[13px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
          >
            <Lock className="size-3.5" />
            <span>{dict["admin.profile.change_password"] || "Change Password"}</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 border border-[#c3c4c7] bg-white hover:bg-[#fcf0f1] text-[#50575e] hover:text-[#b32d2e] hover:border-[#d63638] px-3 py-1 text-[13px] font-semibold rounded-[3px] shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>{dict["admin.profile.log_out"] || "Log Out"}</span>
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
            className={`flex items-center gap-1 rounded-[3px] border px-2.5 py-1 text-[13px] transition-colors cursor-pointer ${
              showScreenOptions
                ? "bg-[#2271b1] text-white border-[#2271b1]"
                : "border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            }`}
          >
            <span>{dict["admin.common.screen_options"] || "Screen Options"}</span>
            <span className="text-[9px]">▼</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowHelp(!showHelp);
              setShowScreenOptions(false);
            }}
            className={`flex items-center gap-1 rounded-[3px] border px-2.5 py-1 text-[13px] transition-colors cursor-pointer ${
              showHelp
                ? "bg-[#2271b1] text-white border-[#2271b1]"
                : "border-[#c3c4c7] bg-white text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            }`}
          >
            <span>{dict["admin.common.help"] || "Help"}</span>
            <span className="text-[9px]">▼</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBSUBSUB NAVIGATION TABS                                              */}
      {/* ========================================================================= */}
      <ul className="flex flex-wrap items-center text-[13px] text-[#646970] list-none p-0 m-0 gap-1.5 border-b border-[#c3c4c7] pb-2">
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
            {dict["admin.profile.personal_options"] || "Personal Options"}
          </button>
          <span className="text-[#8c8f94] ms-1.5">|</span>
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
            {dict["admin.profile.account_security"] || "Account Security"}
          </button>
          <span className="text-[#8c8f94] ms-1.5">|</span>
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
            {dict["admin.profile.notifications"] || "Notifications"}
          </button>
        </li>
      </ul>

      {/* ========================================================================= */}
      {/* 4. TAB 1: PERSONAL OPTIONS & IDENTITY                                     */}
      {/* ========================================================================= */}
      {activeTab === "identity" && (
        <div className="space-y-4">
          <div className="border border-[#c3c4c7] bg-white rounded-[3px] p-5 shadow-2xs">
            <h2 className="text-[15px] font-semibold text-[#1d2327] border-b border-[#c3c4c7] pb-3 mb-4">
              {dict["admin.profile.account_info"] || "Account Information"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-center">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.picture"] || "Profile Picture"}
              </span>
              <div className="flex items-center gap-3">
                <Avatar className="size-16 rounded-[4px] border border-[#c3c4c7]">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback className="bg-[#2271b1] text-white font-bold text-lg rounded-[4px]">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-[12px] text-[#646970] space-y-1">
                  <p className="font-semibold text-[#1d2327]">
                    {user.name} ({user.role || "admin"})
                  </p>
                  <p>
                    {dict["admin.profile.picture_desc"] || "You can change your profile picture on Gravatar."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.username"] || "Username"}
              </span>
              <div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={user.id}
                  className="w-full max-w-md rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 text-[13px] font-mono text-[#50575e] cursor-not-allowed"
                />
                <p className="text-[12px] text-[#646970] mt-1">
                  {dict["admin.profile.username_desc"] || "Usernames cannot be changed."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.display_name"] || "Display Name"}
              </span>
              <div className="flex flex-wrap items-center gap-2 max-w-md">
                <input
                  type="text"
                  readOnly
                  value={user.name}
                  className="flex-1 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338]"
                />
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] px-3 py-1.5 text-[13px] font-semibold rounded-[3px] cursor-pointer"
                >
                  {dict["common.edit"] || "Edit"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.email"] || "Email"}
              </span>
              <div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="email"
                    readOnly
                    value={user.email}
                    className="flex-1 rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 text-[13px] font-mono text-[#50575e] cursor-not-allowed"
                    dir="ltr"
                  />
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#a7e3b2] bg-[#edfaef] px-2 py-0.5 text-[11px] font-semibold text-[#007017]">
                      <CheckCircle2 className="size-3" />
                      {dict["admin.profile.verified"] || "Verified"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#f5c6cb] bg-[#fcf0f1] px-2 py-0.5 text-[11px] font-semibold text-[#d63638]">
                      <AlertTriangle className="size-3" />
                      {dict["admin.profile.unverified"] || "Unverified"}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#646970] mt-1">
                  {dict["admin.profile.email_desc"] || "Used for administration, password recovery, and email notifications."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.phone"] || "Phone Number"}
              </span>
              <div>
                <span className="font-mono text-[13px] text-[#2c3338]" dir="ltr">
                  {user.phoneNumber || dict["admin.profile.not_specified"] || "Not specified"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 border-b border-[#f0f0f1] items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.role"] || "Role"}
              </span>
              <div>
                <span className="inline-block rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 py-0.5 text-[12px] font-semibold text-[#1d2327]">
                  {user.role || "admin"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-3 items-baseline">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.registered"] || "Registered"}
              </span>
              <div className="text-[13px] text-[#50575e]">
                {new Date(user.createdAt).toLocaleDateString(direction === "rtl" ? "ar-EG" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
          <div className="border border-[#c3c4c7] bg-white rounded-[3px] p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between border-b border-[#c3c4c7] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-[#2271b1]" />
                <h2 className="text-[15px] font-semibold text-[#1d2327]">
                  {dict["admin.profile.two_factor"] || "Two-Factor Authentication (2FA)"}
                </h2>
              </div>
              {user.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#a7e3b2] bg-[#edfaef] px-2.5 py-0.5 text-[11px] font-bold text-[#007017]">
                  <CheckCircle2 className="size-3" />
                  {dict["admin.profile.two_factor_active"] || "Active & Protected"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-[2px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#646970]">
                  {dict["admin.profile.two_factor_disabled"] || "Currently Disabled"}
                </span>
              )}
            </div>

            <p className="text-[13px] text-[#50575e] leading-relaxed mb-4">
              {dict["admin.profile.two_factor_desc"] ||
                "Two-factor authentication adds an extra layer of protection using a time-based code (TOTP) from an authenticator app."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIs2FAOpen(true)}
                className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] text-[13px] font-semibold px-4 py-1.5 rounded-[3px] shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Smartphone className="size-3.5" />
                <span>
                  {user.twoFactorEnabled
                    ? dict["admin.profile.manage_two_factor"] || "Manage 2FA Settings"
                    : dict["admin.profile.enable_two_factor"] || "Enable Two-Factor Auth"}
                </span>
              </button>
            </div>
          </div>

          {/* Password Management Card */}
          <div className="border border-[#c3c4c7] bg-white rounded-[3px] p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#c3c4c7] pb-3 mb-4">
              <KeyRound className="size-4 text-[#2271b1]" />
              <h2 className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.change_password"] || "Account Password"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-2 items-center">
              <span className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.current_password"] || "Current Password"}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[#646970]">••••••••••••</span>
                <button
                  type="button"
                  onClick={() => setIsUpdatePassOpen(true)}
                  className="border border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] text-[13px] font-semibold px-3 py-1 rounded-[3px] cursor-pointer shadow-2xs"
                >
                  {dict["admin.profile.change_password"] || "Set New Password"}
                </button>
              </div>
            </div>
          </div>

          {/* Passkeys (WebAuthn) Card */}
          <div className="border border-[#c3c4c7] bg-white rounded-[3px] p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#c3c4c7] pb-3 mb-4">
              <Fingerprint className="size-4 text-[#2271b1]" />
              <h2 className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.passkeys"] || "Passkeys & Biometrics (WebAuthn)"}
              </h2>
            </div>

            <p className="text-[13px] text-[#50575e] leading-relaxed mb-4">
              {dict["admin.profile.passkeys_desc"] ||
                "Passwordless authentication using Touch ID, Face ID, Windows Hello, or hardware security keys."}
            </p>

            <button
              type="button"
              onClick={() => setIsPasskeyOpen(true)}
              className="border border-[#c3c4c7] bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] text-[13px] font-semibold px-3.5 py-1.5 rounded-[3px] cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
            >
              <Fingerprint className="size-3.5" />
              <span>{dict["admin.profile.setup_passkey"] || "Set up Passkey"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: NOTIFICATIONS & ALERTS                                          */}
      {/* ========================================================================= */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="border border-[#c3c4c7] bg-white rounded-[3px] p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#c3c4c7] pb-3 mb-4">
              <Bell className="size-4 text-[#2271b1]" />
              <h2 className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.notifications"] || "Email Notification Preferences"}
              </h2>
            </div>

            <div className="space-y-3 mb-4 text-[13px]">
              <div className="flex items-start justify-between gap-4 p-3.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px]">
                <div>
                  <h4 className="font-semibold text-[#1d2327]">
                    {dict["admin.profile.security_alerts"] || "Security & Sign-in Alerts"}
                  </h4>
                  <p className="text-[12px] text-[#646970]">
                    {dict["admin.profile.security_alerts_desc"] ||
                      "Instant alerts when logging in from an unrecognized device, changing passwords, or modifying 2FA."}
                  </p>
                </div>
                <span className="text-[#007017] font-semibold text-[12px]">
                  {dict["admin.profile.always_active"] || "Always Active"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 p-3.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px]">
                <div>
                  <h4 className="font-semibold text-[#1d2327]">
                    {dict["admin.profile.content_alerts"] || "Content & Editorial Notifications"}
                  </h4>
                  <p className="text-[12px] text-[#646970]">
                    {dict["admin.profile.content_alerts_desc"] ||
                      "Notifications when comments require moderation or new articles are published."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotifsOpen(true)}
                  className="text-[#2271b1] hover:underline font-semibold text-[12px]"
                >
                  {dict["admin.profile.manage"] || "Configure"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNotifsOpen(true)}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] text-[13px] font-semibold px-4 py-1.5 rounded-[3px] shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Bell className="size-3.5" />
              <span>{dict["admin.profile.manage"] || "Configure Notifications"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user as any}
        onUpdate={handleUpdateUser}
        dict={dict}
        direction={direction}
      />

      <UpdatePassForm
        isOpen={isUpdatePassOpen}
        onClose={() => setIsUpdatePassOpen(false)}
        dict={dict}
        direction={direction}
      />

      <TwoFactorSettings
        isOpen={is2FAOpen}
        onClose={() => setIs2FAOpen(false)}
        user={{ twoFactorEnabled: user.twoFactorEnabled }}
        onUpdate={() => {
          handleUpdateUser({ twoFactorEnabled: !user.twoFactorEnabled });
        }}
        dict={dict}
        direction={direction}
      />

      <NotificationSettingsModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        user={user as any}
        onUpdate={handleUpdateUser}
        dict={dict}
        direction={direction}
      />

      <PasskeySettings
        isOpen={isPasskeyOpen}
        onClose={() => setIsPasskeyOpen(false)}
        dict={dict}
        direction={direction}
      />
    </div>
  );
}
