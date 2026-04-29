import { Link } from "react-router";
import { Mail, CheckCircle } from "lucide-react";

export function ConfirmEmail() {
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
            Didn't receive the email? Check your spam folder or
          </p>
          <button
            type="button"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Resend confirmation email
          </button>
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
