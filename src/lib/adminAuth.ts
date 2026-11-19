export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: "ADMIN";
}

export interface AdminSession {
  token: string;
  expiresAt: number;
  user: AdminUser;
}

const ADMIN_SESSION_KEY = "digikhizir_admin_session";

export function saveAdminSession(
  token: string,
  expiresIn: number,
  user: AdminUser,
) {
  const session: AdminSession = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as AdminSession;

    if (
      !session.token ||
      !session.expiresAt ||
      session.expiresAt <= Date.now() ||
      session.user?.role !== "ADMIN"
    ) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
