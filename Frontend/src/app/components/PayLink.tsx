import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  getPublicLink,
  processPayment,
  PublicLinkResponse,
} from "../api";
import { Loader2, AlertCircle, CreditCard, User, Mail } from "lucide-react";

export function PayLink() {
  const { code } = useParams<{ code: string }>();
  const [linkData, setLinkData] = useState<PublicLinkResponse["data"]["link"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!code) return;

    getPublicLink(code)
      .then((res) => {
        setLinkData(res.data.link);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load payment link");
        setLoading(false);
      });
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !customerEmail) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await processPayment(code, { customerName, customerEmail });
      if (res.data && res.data.hostedUrl) {
        window.location.href = res.data.hostedUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500">Loading payment details...</p>
      </div>
    );
  }

  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!linkData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {linkData.merchantName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">is requesting payment for</p>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            {linkData.name}
          </h3>
          {linkData.description && (
            <p className="text-gray-600 mt-2 text-sm">{linkData.description}</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-1">
            Amount Due
          </p>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-4xl font-extrabold text-gray-900">
              {linkData.amount}$
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="pl-10 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !customerEmail}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Secure payments powered by Triple-A
          </p>
        </div>
      </div>
    </div>
  );
}
