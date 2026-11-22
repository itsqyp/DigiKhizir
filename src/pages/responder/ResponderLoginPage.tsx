import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

import { API_BASE_URL } from "../../lib/api";
import {
  getResponderSession,
  saveResponderSession,
} from "../../lib/responderAuth";

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  expiresIn?: number;
  user?: {
    id: string;
    name: string;
    username: string;
    role: "ADMIN" | "RESPONDER" | "RESIDENT";
  };
}

export default function ResponderLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If a valid responder session already exists, go straight to the inbox.
  useEffect(() => {
    if (getResponderSession()) {
      navigate("/responder/sos", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid username or password.");
      }

      if (!data.token || !data.expiresIn || !data.user) {
        throw new Error("The server returned an incomplete login response.");
      }

      if (data.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
        return;
      }

      if (data.user.role !== "RESPONDER") {
        throw new Error("This account does not have responder access.");
      }

      saveResponderSession(data.token, data.expiresIn, {
        id: data.user.id,
        name: data.user.name,
        username: data.user.username,
        role: "RESPONDER",
      });

      navigate("/responder/sos", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mint-cream px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-deep-sea-blue/10 bg-white p-7 shadow-xl sm:p-9">
          <div className="mb-7 flex justify-center">
            <div className="rounded-2xl bg-deep-sea-blue p-4 text-white">
              <ShieldCheck size={30} />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-deep-sea-blue">
              Responder Login
            </h1>
            <p className="mt-2 text-sm text-deep-sea-blue/60">
              Sign in to access incoming SOS requests.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-deep-sea-blue"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                required
                className="w-full rounded-xl border border-deep-sea-blue/15 px-4 py-3 text-sm text-deep-sea-blue outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-deep-sea-blue"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-deep-sea-blue/15 px-4 py-3 pr-12 text-sm text-deep-sea-blue outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/15"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-sea-blue/50 hover:text-deep-sea-blue"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-deep-sea-blue px-5 py-3 font-semibold text-white transition hover:bg-deep-sea-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-7 border-t border-deep-sea-blue/10 pt-5 text-center">
            <Link
              to="/admin/login"
              className="text-sm font-medium text-amethyst hover:underline"
            >
              Administrator login
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-deep-sea-blue/45">
          DigiKhizir Emergency Response
        </p>
      </div>
    </main>
  );
}
