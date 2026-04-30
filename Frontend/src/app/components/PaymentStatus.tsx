import { useSearchParams, Link } from "react-router";
import { CheckCircle, XCircle, Home } from "lucide-react";

export function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "success";

  const isSuccess = status === "success";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="text-center">
            <div
              className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${
                isSuccess ? "bg-green-100" : "bg-red-100"
              } mb-4`}
            >
              {isSuccess ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? "Payment Successful!" : "Payment Failed"}
            </h2>

            <p className="text-gray-600 mb-6">
              {isSuccess
                ? "Your transaction has been completed successfully."
                : "There was an issue processing your payment. Please try again."}
            </p>

            {isSuccess && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-gray-900">TXN-{Date.now()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">0.05 ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">Confirmed</span>
                  </div>
                </div>
              </div>
            )}

            {!isSuccess && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details</h3>
                <p className="text-sm text-red-700">
                  Insufficient funds or network connectivity issue. Please check your wallet
                  balance and try again.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/app"
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>

              {!isSuccess && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
