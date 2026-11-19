import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LockKeyhole, User, ArrowLeft } from "lucide-react";

import { API_BASE_URL } from "../../lib/api";
import { saveAdminSession, type AdminUser } from "../../lib/adminAuth";

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  expiresIn?: number;
  user?: AdminUser;
}

function AdminLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = (await response.json()) as LoginResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.token ||
        !result.expiresIn ||
        !result.user
      ) {
        setError(result.message || "Unable to sign in.");
        return;
      }

      saveAdminSession(result.token, result.expiresIn, result.user);

      navigate("/admin", { replace: true });
    } catch {
      setError(
        "Unable to connect to the server. Please check that the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mint-cream px-5 py-10 font-inter text-deep-sea-blue">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-deep-sea-blue/70 transition hover:text-amethyst"
        >
          <ArrowLeft size={17} />
          Back to homepage
        </Link>

        <div className="rounded-3xl border border-deep-sea-blue/10 bg-white p-7 shadow-xl shadow-deep-sea-blue/5 sm:p-9">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-deep-sea-blue text-mint-cream">
              <ShieldCheck size={34} />
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amethyst">
              DigiKhizir
            </p>

            <h1 className="font-poppins text-2xl font-bold">Admin Portal</h1>

            <p className="mt-2 text-sm leading-6 text-deep-sea-blue/60">
              Sign in to manage disaster response and community resources.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold"
              >
                Username
              </label>

              <div className="flex items-center rounded-xl border border-deep-sea-blue/15 bg-mint-cream/50 px-4 transition focus-within:border-amethyst">
                <User size={18} className="shrink-0 text-deep-sea-blue/40" />

                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-deep-sea-blue/35"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>

              <div className="flex items-center rounded-xl border border-deep-sea-blue/15 bg-mint-cream/50 px-4 transition focus-within:border-amethyst">
                <LockKeyhole
                  size={18}
                  className="shrink-0 text-deep-sea-blue/40"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-deep-sea-blue/35"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-night-bordeaux/15 bg-night-bordeaux/5 px-4 py-3 text-sm text-night-bordeaux"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-deep-sea-blue px-5 py-3.5 font-semibold text-mint-cream transition hover:bg-amethyst disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in to dashboard"}
            </button>
          </form>

          <p className="mt-7 text-center text-xs leading-5 text-deep-sea-blue/45">
            Restricted access. Only authorized DigiKhizir administrators can
            sign in.
          </p>
        </div>
      </div>
    </main>
  );
}

export default AdminLoginPage;
