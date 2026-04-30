import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Copy, Check, Link as LinkIcon, ArrowLeft, Download } from "lucide-react";
import QRCode from "qrcode";
import { createLink } from "../api";

const FEE_RATE = 0.02;

export function CreateLink() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETH");
  const [withFees, setWithFees] = useState(true);
  const [description, setDescription] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // The API takes the final exact amount.
      // If "withFees" is selected, the recipient receives amount - fee,
      // but the link is generated for the full `amount` requested.
      const res = await createLink({
        name,
        amount: parsedAmount,
        currency,
        description: description || undefined,
      });

      const link = res.data.link.paymentUrl;
      setGeneratedLink(link);

      const qrUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: "#4f46e5",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.download = `barq-payment-${name || "link"}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const handleReset = () => {
    setName("");
    setAmount("");
    setWithFees(true);
    setDescription("");
    setGeneratedLink("");
    setQrCodeUrl("");
    setCopied(false);
    setError("");
  };

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * FEE_RATE;
  // "With fees" means the entered amount already includes the fee
  const receivedAmount = withFees ? parsedAmount - (parsedAmount * FEE_RATE) : parsedAmount;
  const claimedAmount = withFees ? parsedAmount : parsedAmount + (parsedAmount * FEE_RATE);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Payment Link</h1>
        <p className="mt-1 text-sm text-gray-500">Generate a secure payment link to share with others</p>
      </div>

      {!generatedLink ? (
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Link Name
              </label>
              <input
                type="text"
                id="name"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                placeholder="e.g., Payment for John, Invoice #123"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="amount"
                  required
                  min="0"
                  step="any"
                  disabled={loading}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="0.00"
                />
                <select
                  id="currency"
                  value={currency}
                  disabled={loading}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-700 rounded-r-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value="ETH">ETH</option>
                  <option value="BTC">BTC</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                  <option value="BNB">BNB</option>
                </select>
              </div>

              {/* Fee toggle */}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-gray-600">Amount includes:</span>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setWithFees(true)}
                    className={`px-3 py-1 text-xs font-medium rounded-l-md border ${
                      withFees
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    With Fees
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setWithFees(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-r-md border border-l-0 ${
                      !withFees
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    Without Fees
                  </button>
                </div>
              </div>

              {/* Fee note */}
              {parsedAmount > 0 && (
                <div className={`mt-2 text-sm rounded-md px-3 py-2 ${
                  withFees ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {withFees ? (
                    <>
                      <span className="font-medium">Recipient receives:</span>{" "}
                      {receivedAmount.toFixed(2)}$ {" "}
                      <span className="text-xs opacity-75">(1% fee: {fee.toFixed(2)}$)</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Total claimed:</span>{" "}
                      {claimedAmount.toFixed(2)}${" "}
                      <span className="text-xs opacity-75">(includes {FEE_RATE*100}% fee: {(parsedAmount * FEE_RATE).toFixed(2)}$)</span>
                    </>
                  )}
                </div>
              )}
                <div className={`mt-2 text-sm rounded-md px-3 py-2 bg-green-50 text-green-800 border border-green-200`}>
                  <span>Amount will be sent into your wallet in <strong>{currency}</strong></span>
                </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                disabled={loading}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                placeholder="What is this payment for?"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <LinkIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">How it works</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Share the generated link with anyone</li>
                      <li>They can pay the exact amount specified</li>
                      <li>Links expire once paid</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Payment Link"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Link Created!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Share this link to receive {currency} payments
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Payment Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 inline mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 inline mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-900 mb-4">QR Code</h3>
              {qrCodeUrl && (
                <>
                  <img src={qrCodeUrl} alt="Payment QR Code" className="mb-4 rounded-lg border-2 border-gray-200" />
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">{parsedAmount} {currency}</span>
              </div>
              {parsedAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{withFees ? "Recipient receives:" : "Total claimed:"}</span>
                  <span className="font-medium text-gray-900">
                    {withFees ? receivedAmount.toFixed(6) : claimedAmount.toFixed(6)} {currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium text-gray-900">{currency}</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium text-gray-900">{description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Another Link
            </button>
            <button
              onClick={() => navigate("/app")}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
