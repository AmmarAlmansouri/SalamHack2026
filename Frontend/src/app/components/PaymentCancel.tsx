import { useNavigate, useSearchParams } from "react-router";
import { XCircle, ArrowLeft } from "lucide-react";

export function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkCode = searchParams.get("link");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Cancelled</h2>
        <p className="text-gray-600 mb-8">
          The payment process was cancelled. You haven't been charged.
        </p>

        <div className="space-y-3">
          {linkCode && (
            <button
              onClick={() => navigate(`/pay/${linkCode}`)}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = "/"}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
