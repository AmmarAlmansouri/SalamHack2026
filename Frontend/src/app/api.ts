const API_BASE = "http://localhost:3000/api";

// ── Token helpers ──────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function saveTokens(token: string, refreshToken?: string) {
  localStorage.setItem("token", token);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function saveUser(user: Record<string, unknown>) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): Record<string, unknown> | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Generic fetch wrapper ──────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong") as Error & {
      status: number;
      data: T;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth API ───────────────────────────────────────────────────
export interface LoginResponse {
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      is_verified: boolean;
    };
    token: string;
    refreshToken: string;
  };
}

export interface SignupResponse {
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      is_verified: boolean;
    };
    token: string;
  };
  warning?: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ConfirmEmailResponse {
  message: string;
  data?: { email: string };
}

export interface ResendConfirmationResponse {
  message: string;
}

export async function login(email: string, password: string) {
  const res = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveTokens(res.data.token, res.data.refreshToken);
  saveUser(res.data.user);
  return res;
}

export async function signup(
  name: string,
  email: string,
  password: string,
) {
  const res = await request<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return res;
}

export async function forgotPassword(email: string) {
  return request<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmEmail(token: string) {
  return request<ConfirmEmailResponse>("/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendConfirmation(email: string) {
  return request<ResendConfirmationResponse>("/auth/resend-confirmation", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  clearTokens();
}
