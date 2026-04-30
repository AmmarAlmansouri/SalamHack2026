import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Mail, CheckCircle, Loader2, XCircle } from "lucide-react";
import { confirmEmail, resendConfirmation } from "../api";

export function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [confirming, setConfirming] = useState(!!token);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");

  // Auto-confirm if token is present in URL
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        await confirmEmail(token);
        setConfirmed(true);
      } catch (err: unknown) {
        const error = err as Error;
        setConfirmError(error.message || "Invalid or expired confirmation token.");
      } finally {
        setConfirming(false);
      }
    })();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendError("");
    setResendSuccess(false);
    setResending(true);

    try {
      await resendConfirmation(resendEmail);
      setResendSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setResendError(error.message || "Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  // If we're confirming via token from URL
  if (token) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            {confirming ? (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Confirming Email...</h2>
                <p className="mt-2 text-sm text-gray-600">Please wait while we verify your email.</p>
              </>
            ) : confirmed ? (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Email Confirmed!</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your email has been verified. You can now sign in.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Confirmation Failed</h2>
                <p className="mt-2 text-sm text-red-600">{confirmError}</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: after signup, show "check your email" UI
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a confirmation link to your email address
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Next steps</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check your inbox for the confirmation email</li>
                  <li>Click the confirmation link in the email</li>
                  <li>Return here to sign in to your account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Didn't receive the email? Enter your email to resend:
          </p>

          {resendError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{resendError}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">Confirmation email sent successfully!</p>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={resending}
            />
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !resendEmail}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="w-full flex justify-center py-2 px-4 text-sm text-gray-700 hover:text-gray-900"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
