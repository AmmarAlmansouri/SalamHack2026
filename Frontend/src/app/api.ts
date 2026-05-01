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

// ── Account API ────────────────────────────────────────────────
export interface CryptoAddress {
  id: number;
  currency: string;
  network: string;
  address: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  crypto_addresses: CryptoAddress[];
  is_verified: boolean;
  email_verified_at: string | null;
  new_email: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface ProfileResponse {
  user: UserProfile;
}

export interface UpdateNameResponse {
  message: string;
  data: { name: string };
}

export interface UpdateEmailResponse {
  message: string;
  data: { oldEmail: string; pendingEmail: string };
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateCryptoAddressResponse {
  message: string;
  data: { crypto_addresses: CryptoAddress[] };
}

export interface DeleteCryptoAddressResponse {
  message: string;
}

export interface CancelEmailChangeResponse {
  message: string;
}

export async function getProfile() {
  return request<ProfileResponse>("/account/profile", {
    method: "GET",
  });
}

export async function updateName(name: string) {
  const res = await request<UpdateNameResponse>("/account/name", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  // Update cached user
  const user = getUser();
  if (user) {
    user.name = res.data.name;
    saveUser(user);
  }
  return res;
}

export async function updateEmail(newEmail: string, password: string) {
  return request<UpdateEmailResponse>("/account/email", {
    method: "PUT",
    body: JSON.stringify({ newEmail, password }),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  return request<ChangePasswordResponse>("/account/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function updateCryptoAddress(
  address: string,
  currency: string = "BTC",
  network: string = "Bitcoin",
  label: string = "",
) {
  return request<UpdateCryptoAddressResponse>("/account/crypto-address", {
    method: "PUT",
    body: JSON.stringify({ address, currency, network, label }),
  });
}

export async function deleteCryptoAddress(id: number) {
  return request<DeleteCryptoAddressResponse>(`/account/crypto-address/${id}`, {
    method: "DELETE",
  });
}

export async function cancelEmailChange() {
  return request<CancelEmailChangeResponse>("/account/cancel-email-change", {
    method: "POST",
  });
}

export interface VerifyNewEmailResponse {
  message: string;
  data: { oldEmail: string; newEmail: string };
}

export async function verifyNewEmail(token: string) {
  return request<VerifyNewEmailResponse>("/account/verify-new-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// ── Links API ────────────────────────────────────────────────
export interface PaymentLink {
  id: number;
  name: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  uniqueCode: string;
  paymentUrl: string;
  transactionCount: number;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetLinksResponse {
  data: {
    links: PaymentLink[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CreateLinkParams {
  name: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface CreateLinkResponse {
  message: string;
  data: {
    link: PaymentLink;
  };
}

export async function getLinks(params?: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.append(key, String(value));
    });
  }
  const queryString = query.toString();
  return request<GetLinksResponse>(`/links${queryString ? `?${queryString}` : ""}`);
}

export async function createLink(data: CreateLinkParams) {
  return request<CreateLinkResponse>("/links", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Transactions API ───────────────────────────────────────────
export interface Transaction {
  id: number;
  user_id: number;
  link_id: number | null;
  type: string;
  status: string;
  payment_id: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_network: string | null;
  payment_address: string | null;
  customer_email: string | null;
  customer_name: string | null;
  payout_amount: number | null;
  payout_currency: string | null;
  payout_address: string | null;
  payout_tx_hash: string | null;
  platform_fee: number | null;
  network_fee: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  link_name?: string;
  link_description?: string;
}

export interface TransactionStatsSummary {
  totalTransactions: number;
  totalReceived: number;
  totalPayout: number;
  totalFees: number;
  activeDays: number;
  firstTransaction: string | null;
  lastTransaction: string | null;
}

export interface MonthlyStat {
  month: string;
  count: number;
  received: number;
  payout: number;
}

export interface GetTransactionsResponse {
  data: {
    transactions: Transaction[];
    summary: {
      totalTransactions: number;
      totalReceived: number;
      totalPayout: number;
      totalFees: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetTransactionStatsResponse {
  data: {
    summary: TransactionStatsSummary;
    monthlyStats: MonthlyStat[];
  };
}

export async function getTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.append(key, String(value));
    });
  }
  const queryString = query.toString();
  return request<GetTransactionsResponse>(`/transactions${queryString ? `?${queryString}` : ""}`);
}

export async function getTransactionStats() {
  return request<GetTransactionStatsResponse>("/transactions/stats/summary", {
    method: "GET",
  });
}



