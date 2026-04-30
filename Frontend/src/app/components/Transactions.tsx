import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Loader2, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { getTransactions, type Transaction } from "../api";
import { format } from "date-fns";

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "payment_received" | "payout_sent" | "fee_deducted">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getTransactions({
        type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        currency: currencyFilter || undefined,
        dateFrom,
        dateTo,
        limit: 50,
      });
      setTransactions(res.data.transactions);
      setTotal(res.data.pagination.total);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce filters
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [typeFilter, statusFilter, currencyFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">View and filter your account activity</p>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="payment_received">Payment Received</option>
                <option value="payout_sent">Payout Sent</option>
                <option value="fee_deducted">Fee Deducted</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Currencies</option>
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                id="date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                id="date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type / Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer / Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isReceived = t.type === "payment_received";
                  const isPayout = t.type === "payout_sent";
                  const isFee = t.type === "fee_deducted";

                  const amount = isReceived ? t.payment_amount : isPayout ? t.payout_amount : t.platform_fee;
                  const currency = isReceived ? t.payment_currency : isPayout ? t.payout_currency : "USD";

                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isReceived ? (
                            <ArrowDownRight className="h-5 w-5 text-green-500 mr-2" />
                          ) : isPayout ? (
                            <ArrowUpRight className="h-5 w-5 text-blue-500 mr-2" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {t.type.replace("_", " ")}
                            </div>
                            {t.link_name && (
                              <div className="text-xs text-gray-500">Link: {t.link_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isReceived ? "text-green-600" : isPayout ? "text-blue-600" : "text-red-600"}`}>
                          {isReceived ? "+" : "-"}{amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {t.status === "completed" ? (
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-green-700">Completed</span>
                          </div>
                        ) : t.status === "pending" ? (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 text-amber-500 mr-1" />
                            <span className="text-amber-700">Pending</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-sm">
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-red-700 capitalize">{t.status}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate">
                          {isReceived && t.customer_email ? t.customer_email : 
                           isPayout && t.payout_address ? t.payout_address : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(t.created_at), "MMM d, yyyy HH:mm")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && !loading && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{transactions.length}</span> of{" "}
              <span className="font-medium">{total}</span> transactions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
