import { useState } from "react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Link as LinkIcon, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";

const mockDataDaily = [
  { id: "mon", date: "Mon", transactions: 12 },
  { id: "tue", date: "Tue", transactions: 19 },
  { id: "wed", date: "Wed", transactions: 15 },
  { id: "thu", date: "Thu", transactions: 25 },
  { id: "fri", date: "Fri", transactions: 22 },
  { id: "sat", date: "Sat", transactions: 30 },
  { id: "sun", date: "Sun", transactions: 28 },
];

const mockDataWeekly = [
  { id: "w1", date: "Week 1", transactions: 85 },
  { id: "w2", date: "Week 2", transactions: 120 },
  { id: "w3", date: "Week 3", transactions: 95 },
  { id: "w4", date: "Week 4", transactions: 140 },
];

const mockDataMonthly = [
  { id: "jan", date: "Jan", transactions: 320 },
  { id: "feb", date: "Feb", transactions: 380 },
  { id: "mar", date: "Mar", transactions: 420 },
  { id: "apr", date: "Apr", transactions: 490 },
  { id: "may", date: "May", transactions: 530 },
  { id: "jun", date: "Jun", transactions: 610 },
];

const mockDataYearly = [
  { id: "2022", date: "2022", transactions: 2400 },
  { id: "2023", date: "2023", transactions: 3800 },
  { id: "2024", date: "2024", transactions: 5200 },
  { id: "2025", date: "2025", transactions: 6800 },
  { id: "2026", date: "2026", transactions: 7500 },
];

type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

export function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  const getChartData = () => {
    switch (timeRange) {
      case "daily":
        return mockDataDaily;
      case "weekly":
        return mockDataWeekly;
      case "monthly":
        return mockDataMonthly;
      case "yearly":
        return mockDataYearly;
      default:
        return mockDataDaily;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back to Barq Transfer</p>
        </div>
        <button
          onClick={() => navigate("/app/create-link")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Link
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-indigo-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">1,247</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-0.5" />
                      12%
                    </div>
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
                  <LinkIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Payment Links</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">342</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpRight className="h-4 w-4 mr-0.5" />
                      8%
                    </div>
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
                <div className="rounded-md bg-yellow-500 p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">98.5%</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <ArrowDownRight className="h-4 w-4 mr-0.5" />
                      1.2%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Transaction Activity</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("daily")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "daily"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange("weekly")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "weekly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange("monthly")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "monthly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange("yearly")}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === "yearly"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350} key={timeRange}>
          <AreaChart data={getChartData()}>
            <defs>
              <linearGradient id={`colorTransactions-${timeRange}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            />
            <Area
              type="monotone"
              dataKey="transactions"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#colorTransactions-${timeRange})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
