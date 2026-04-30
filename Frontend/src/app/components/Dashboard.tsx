import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, Loader2, AlertCircle } from "lucide-react";
import { getTransactionStats, type TransactionStatsSummary, type MonthlyStat } from "../api";

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<TransactionStatsSummary | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getTransactionStats();
        setSummary(res.data.summary);
        // Backend returns newest first. Reverse to show chronological order in the chart
        setMonthlyStats(res.data.monthlyStats.reverse());
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 flex items-start">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Failed to load dashboard</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-medium text-red-800 underline hover:text-red-900"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back to Barq Transfer</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/app/transactions")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Transactions
          </button>
          <button
            onClick={() => navigate("/app/create-link")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-indigo-500 p-3">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{summary?.totalTransactions || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Received</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">${summary?.totalReceived?.toFixed(2) || "0.00"}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Payouts</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">${summary?.totalPayout?.toFixed(2) || "0.00"}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-amber-500 p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Platform Fees</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">${summary?.totalFees?.toFixed(2) || "0.00"}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History (Last 12 Months)</h2>
        </div>

        {monthlyStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280" 
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString(undefined, { month: 'short' });
                }}
              />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReceived)"
              />
              <Area
                type="monotone"
                dataKey="payout"
                name="Payouts"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPayout)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500">No transaction data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
