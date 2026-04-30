import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { verifyNewEmail } from "../api";

export function VerifyNewEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No verification token provided.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await verifyNewEmail(token);
        setOldEmail(res.data.oldEmail);
        setNewEmail(res.data.newEmail);
        setSuccess(true);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Invalid or expired verification token.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {loading ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Verifying Email...</h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your new email address.
              </p>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Email Updated!</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully changed.
              </p>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Email Change Details</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="text-gray-500">Previous:</span>{" "}
                    <span className="line-through">{oldEmail}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">New:</span>{" "}
                    <span className="font-medium text-gray-900">{newEmail}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Link
              to="/app/account"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Account Settings
            </Link>
            <Link
              to="/app"
              className="w-full flex justify-center py-2 px-4 text-sm text-gray-700 hover:text-gray-900"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
