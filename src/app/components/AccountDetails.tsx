import { useState } from "react";
import { User, Mail, Lock, Edit2, Save, X, Wallet } from "lucide-react";

export function AccountDetails() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingWalletAddress, setIsEditingWalletAddress] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [name, setName] = useState("John Doe");
  const [walletAddress, setWalletAddress] = useState("gkjsfdhgkjsdhjgdlkghsdkljghsfdl5");
  const [email, setEmail] = useState("john.doe@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveName = () => {
    setIsEditingName(false);
  };

  const handleSaveEmail = () => {
    setIsEditingEmail(false);
  };

  const handleSaveWalletAddress = () => {
    setIsEditingWalletAddress(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

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
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveName}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {name}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex items-center space-x-3">
                {isEditingEmail ? (
                  <>
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveEmail}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setIsEditingEmail(false)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {email}
                    </div>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
              <div className="flex items-center space-x-3">
                {isEditingWalletAddress ? (
                  <>
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Wallet className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveWalletAddress}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setIsEditingWalletAddress(false)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {walletAddress}
                    </div>
                    <button
                      onClick={() => setIsEditingWalletAddress(true)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
