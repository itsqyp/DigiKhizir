import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Lock,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";
import { clearAdminSession, getAdminSession } from "../../../lib/adminAuth";

export default function SettingsSection() {
  const navigate = useNavigate();
  const session = getAdminSession();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    const token = session?.token;

    if (!token) {
      setError("Your session has expired. Please log in again.");
      handleLogout();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }

        throw new Error(data.message || "Failed to change password.");
      }

      setMessage(data.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-deep-sea-blue/15 bg-white px-4 py-3 pr-11 text-sm text-deep-sea-blue outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/15";

  const passwordField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggle: () => void,
    placeholder: string,
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-deep-sea-blue">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          required
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-sea-blue/50 transition hover:text-deep-sea-blue"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-deep-sea-blue">Settings</h2>
        <p className="mt-1 text-sm text-deep-sea-blue/60">
          Manage your account and application settings.
        </p>
      </div>

      {/* Admin Profile */}
      <section className="rounded-2xl border border-deep-sea-blue/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amethyst/10 p-3 text-amethyst">
            <UserRound size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-deep-sea-blue">Admin Profile</h3>
            <p className="text-sm text-deep-sea-blue/50">
              Your administrator account information.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-mint-cream p-4">
            <p className="text-xs font-medium text-deep-sea-blue/50">
              Username
            </p>
            <p className="mt-1 font-semibold text-deep-sea-blue">
              {session?.user?.username || "Admin"}
            </p>
          </div>

          <div className="rounded-xl bg-mint-cream p-4">
            <p className="text-xs font-medium text-deep-sea-blue/50">
              Account Role
            </p>
            <p className="mt-1 font-semibold text-deep-sea-blue">
              Administrator
            </p>
          </div>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-2xl border border-deep-sea-blue/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amethyst/10 p-3 text-amethyst">
            <Lock size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-deep-sea-blue">
              Change Password
            </h3>
            <p className="text-sm text-deep-sea-blue/50">
              Keep your administrator account secure.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordField(
            "Current Password",
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent((prev) => !prev),
            "Enter current password",
          )}

          {passwordField(
            "New Password",
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew((prev) => !prev),
            "Enter new password",
          )}

          {passwordField(
            "Confirm New Password",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            () => setShowConfirm((prev) => !prev),
            "Confirm new password",
          )}

          <p className="text-xs text-deep-sea-blue/50">
            Password must contain at least 8 characters.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-deep-sea-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-deep-sea-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Application Information */}
      <section className="rounded-2xl border border-deep-sea-blue/10 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amethyst/10 p-3 text-amethyst">
            <Info size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-deep-sea-blue">
              Application Information
            </h3>
            <p className="text-sm text-deep-sea-blue/50">About DigiKhizir.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-deep-sea-blue/10 pb-3">
            <span className="text-sm text-deep-sea-blue/60">Application</span>
            <span className="text-sm font-semibold text-deep-sea-blue">
              DigiKhizir
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-deep-sea-blue/10 pb-3">
            <span className="text-sm text-deep-sea-blue/60">Version</span>
            <span className="text-sm font-semibold text-deep-sea-blue">
              1.0.0
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-amber-800">
              Some shelter, food relief, and animal shelter information
              currently uses demonstration data. Always verify resource
              availability and contact details before relying on them during an
              emergency.
            </p>
          </div>
        </div>
      </section>

      {/* Logout */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h3 className="font-semibold text-deep-sea-blue">Sign Out</h3>
          <p className="mt-1 text-sm text-deep-sea-blue/50">
            Sign out of your administrator account on this device.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </section>
    </div>
  );
}
