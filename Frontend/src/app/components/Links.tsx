import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Filter, Plus, ExternalLink, CheckCircle, Clock } from "lucide-react";

interface PaymentLink {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  link: string;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

const mockLinks: PaymentLink[] = [
  {
    id: "1",
    name: "Invoice #1234",
    amount: 15,
    currency: "ETH",
    description: "Web development services",
    link: "https://barq.transfer/pay/abc123",
    createdAt: new Date("2026-04-20"),
    used: true,
    usedAt: new Date("2026-04-21"),
  },
  {
    id: "2",
    name: "Payment for John",
    amount: 54,
    currency: "BTC",
    description: "Consulting fee",
    link: "https://barq.transfer/pay/def456",
    createdAt: new Date("2026-04-25"),
    used: false,
  },
  {
    id: "3",
    name: "Freelance Project",
    amount: 457,
    currency: "USDT",
    description: "Logo design work",
    link: "https://barq.transfer/pay/ghi789",
    createdAt: new Date("2026-04-26"),
    used: true,
    usedAt: new Date("2026-04-27"),
  },
  {
    id: "4",
    name: "Client Payment - ABC Corp",
    amount: 75,
    currency: "ETH",
    description: "Monthly retainer",
    link: "https://barq.transfer/pay/jkl012",
    createdAt: new Date("2026-04-27"),
    used: false,
  },
  {
    id: "5",
    name: "Product Sale",
    amount: 585,
    currency: "USDC",
    description: "E-commerce transaction",
    link: "https://barq.transfer/pay/mno345",
    createdAt: new Date("2026-04-28"),
    used: false,
  },
];

export function Links() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "unused">("all");

  const filteredLinks = mockLinks.filter((link) => {
    const matchesSearch =
      searchTerm === "" ||
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateFrom = dateFrom === "" || link.createdAt >= new Date(dateFrom);
    const matchesDateTo = dateTo === "" || link.createdAt <= new Date(dateTo);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "used" && link.used) ||
      (statusFilter === "unused" && !link.used);

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track your payment links</p>
        </div>
        <button
          onClick={() => navigate("/app/create-link")}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Link
        </button>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search links..."
                />
              </div>
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

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "used" | "unused")}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Links</option>
                <option value="used">Used Only</option>
                <option value="unused">Unused Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No payment links found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{link.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {link.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{link.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {link.used ? (
                        <div className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-700">Used</span>
                          {link.usedAt && (
                            <span className="text-gray-500 ml-2">
                              ({link.usedAt.toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-yellow-700">Unused</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleCopyLink(link.link)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Copy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredLinks.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredLinks.length}</span> of{" "}
              <span className="font-medium">{mockLinks.length}</span> links
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
