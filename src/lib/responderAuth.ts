export interface ResponderSession {
  token: string;
  expiresAt: number;
  user: {
    id: string;
    name: string;
    username: string;
    role: "RESPONDER";
  };
}

const STORAGE_KEY = "digikhizir_responder_session";

export function saveResponderSession(
  token: string,
  expiresIn: number,
  user: ResponderSession["user"],
) {
  const session: ResponderSession = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getResponderSession(): ResponderSession | null {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as ResponderSession;

    if (
      !session.token ||
      !session.expiresAt ||
      session.expiresAt <= Date.now() ||
      session.user?.role !== "RESPONDER"
    ) {
      clearResponderSession();
      return null;
    }

    return session;
  } catch {
    clearResponderSession();
    return null;
  }
}

export function clearResponderSession() {
  localStorage.removeItem(STORAGE_KEY);
}
