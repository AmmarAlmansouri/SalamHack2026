import { useState, useEffect } from "react";
import { User, Mail, Lock, Edit2, Save, X, Wallet, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import {
  getProfile,
  updateName,
  updateEmail,
  changePassword,
  updateCryptoAddress,
  deleteCryptoAddress,
  cancelEmailChange,
  type UserProfile,
  type CryptoAddress,
} from "../api";

function StatusMessage({ type, message }: { type: "success" | "error"; message: string }) {
  if (!message) return null;
  return (
    <div
      className={`mt-2 p-2 rounded-md text-sm flex items-center gap-2 ${
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-red-50 border border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

export function AccountDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingWalletAddress, setIsEditingWalletAddress] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Field values
  const [name, setName] = useState("");
  const [newCurrency, setNewCurrency] = useState("BTC");
  const [newNetwork, setNewNetwork] = useState("Bitcoin");
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading/status per field
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [nameStatus, setNameStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [walletStatus, setWalletStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [cancellingEmail, setCancellingEmail] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        setProfile(res.user);
        setName(res.user.name);
      } catch (err: unknown) {
        const error = err as Error;
        setLoadError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveName = async () => {
    setNameStatus(null);
    setSavingName(true);
    try {
      const res = await updateName(name);
      setProfile((prev) => (prev ? { ...prev, name: res.data.name } : prev));
      setNameStatus({ type: "success", message: "Name updated successfully." });
      setIsEditingName(false);
    } catch (err: unknown) {
      const error = err as Error;
      setNameStatus({ type: "error", message: error.message || "Failed to update name." });
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailStatus(null);
    if (!emailPassword) {
      setEmailStatus({ type: "error", message: "Password is required to change email." });
      return;
    }
    setSavingEmail(true);
    try {
      const res = await updateEmail(newEmail, emailPassword);
      setProfile((prev) => (prev ? { ...prev, new_email: newEmail.toLowerCase() } : prev));
      setEmailStatus({
        type: "success",
        message: res.message || "Verification email sent to your new address.",
      });
      setIsEditingEmail(false);
      setEmailPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      setEmailStatus({ type: "error", message: error.message || "Failed to update email." });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleCancelEmailChange = async () => {
    setCancellingEmail(true);
    setEmailStatus(null);
    try {
      await cancelEmailChange();
      setProfile((prev) => (prev ? { ...prev, new_email: null } : prev));
      setEmailStatus({ type: "success", message: "Pending email change cancelled." });
    } catch (err: unknown) {
      const error = err as Error;
      setEmailStatus({ type: "error", message: error.message || "Failed to cancel email change." });
    } finally {
      setCancellingEmail(false);
    }
  };

  const handleSaveCryptoAddress = async () => {
    setWalletStatus(null);
    setSavingWallet(true);
    try {
      const res = await updateCryptoAddress(newAddress, newCurrency, newNetwork, newLabel);
      setProfile((prev) => (prev ? { ...prev, crypto_addresses: res.data.crypto_addresses } : prev));
      setWalletStatus({ type: "success", message: "Crypto address saved successfully." });
      setIsEditingWalletAddress(false);
      setNewAddress("");
      setNewLabel("");
    } catch (err: unknown) {
      const error = err as Error;
      setWalletStatus({ type: "error", message: error.message || "Failed to save crypto address." });
    } finally {
      setSavingWallet(false);
    }
  };

  const handleDeleteCryptoAddress = async (id: number) => {
    setWalletStatus(null);
    try {
      await deleteCryptoAddress(id);
      setProfile((prev) => 
        prev ? { ...prev, crypto_addresses: prev.crypto_addresses.filter(a => a.id !== id) } : prev
      );
      setWalletStatus({ type: "success", message: "Crypto address deleted successfully." });
    } catch (err: unknown) {
      const error = err as Error;
      setWalletStatus({ type: "error", message: error.message || "Failed to delete crypto address." });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: "success", message: res.message || "Password updated successfully." });
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      setPasswordStatus({ type: "error", message: error.message || "Failed to change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account details and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          </div>
          <div className="px-6 py-5 space-y-6">
            {/* ── Name ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="flex items-center space-x-3">
                {isEditingName ? (
                  <>
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={savingName}
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                    >
                      {savingName ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setName(profile?.name || "");
                        setNameStatus(null);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {profile?.name}
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {nameStatus && <StatusMessage type={nameStatus.type} message={nameStatus.message} />}
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex items-center space-x-3">
                {isEditingEmail ? (
                  <>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          disabled={savingEmail}
                          placeholder="New email address"
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          disabled={savingEmail}
                          placeholder="Current password to confirm"
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveEmail}
                      disabled={savingEmail}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                    >
                      {savingEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setNewEmail("");
                        setEmailPassword("");
                        setEmailStatus(null);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {profile?.email}
                    </div>
                    <button
                      onClick={() => {
                        setNewEmail(profile?.email || "");
                        setIsEditingEmail(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {emailStatus && <StatusMessage type={emailStatus.type} message={emailStatus.message} />}

              {/* Pending email change banner */}
              {profile?.new_email && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">Pending email change</p>
                      <p className="text-sm text-amber-700 mt-1">
                        A verification email was sent to{" "}
                        <span className="font-medium">{profile.new_email}</span>.
                        Please check your inbox to confirm the change.
                      </p>
                      <button
                        onClick={handleCancelEmailChange}
                        disabled={cancellingEmail}
                        className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingEmail ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        Cancel email change
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Crypto Addresses ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Crypto Addresses</label>
                <button
                  onClick={() => setIsEditingWalletAddress(!isEditingWalletAddress)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {isEditingWalletAddress ? "Cancel" : "+ Add Address"}
                </button>
              </div>

              {isEditingWalletAddress && (
                <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                      <select 
                        value={newCurrency} 
                        onChange={(e) => setNewCurrency(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                         <option value="BTC">BTC</option>
                         <option value="ETH">ETH</option>
                         <option value="USDT">USDT</option>
                         <option value="USDC">USDC</option>
                         <option value="BNB">BNB</option>
                         <option value="XRP">XRP</option>
                         <option value="SOL">SOL</option>
                         <option value="ADA">ADA</option>
                         <option value="DOGE">DOGE</option>
                         <option value="DOT">DOT</option>
                         <option value="TRX">TRX</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Network</label>
                      <input 
                        type="text" 
                        value={newNetwork} 
                        onChange={(e) => setNewNetwork(e.target.value)}
                        placeholder="e.g. Bitcoin, ERC20"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <input 
                      type="text" 
                      value={newAddress} 
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Crypto address"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Label (Optional)</label>
                    <input 
                      type="text" 
                      value={newLabel} 
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Main Wallet"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveCryptoAddress}
                      disabled={savingWallet || !newAddress.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                    >
                      {savingWallet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Address
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {profile?.crypto_addresses && profile.crypto_addresses.length > 0 ? (
                  profile.crypto_addresses.map((addr) => (
                    <div key={addr.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                      <div className="flex items-center space-x-3 truncate">
                        <div className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">
                          {addr.currency}
                        </div>
                        <div className="flex flex-col truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {addr.address} 
                            {addr.label && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-normal">{addr.label}</span>}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Network: {addr.network}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCryptoAddress(addr.id)}
                        className="ml-4 p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 flex-shrink-0"
                        title="Delete address"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                    No crypto addresses saved.
                  </div>
                )}
              </div>

              {walletStatus && <StatusMessage type={walletStatus.type} message={walletStatus.message} />}
            </div>
          </div>
        </div>

        {/* ── Security / Change Password ── */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Security</h2>
          </div>
          <div className="px-6 py-5">
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordStatus(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {passwordStatus && <StatusMessage type={passwordStatus.type} message={passwordStatus.message} />}
          </div>
        </div>
      </div>
    </div>
  );
}
