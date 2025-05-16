"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { itemsAPI, borrowAPI, usersAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  Activity, 
  Users, 
  ArrowRight, 
  Plus, 
  List 
} from "lucide-react";
import { 
  PieChart, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Pie, 
  Cell 
} from "recharts"

// Chart Components
const AssetStatusChart = ({ total, borrowed, loading }) => {
  const data = [
    { name: 'Available', value: total - borrowed },
    { name: 'Borrowed', value: borrowed },
  ];

  const COLORS = ['#0088FE', '#00C49F'];

  if (loading) {
    return <ChartSkeleton title="Asset Status" />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold mb-4">Asset Status</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const CombinedAssetsChart = ({ stats, loading }) => {
  const data = [
    {
      name: 'Assets',
      total: stats.totalAssets,
      borrowed: stats.borrowedAssets,
    },
    {
      name: 'Accessories',
      total: stats.totalAccessories,
      borrowed: stats.borrowedAccessories,
    },
  ];

  if (loading) {
    return <ChartSkeleton title="Inventory Overview" />
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold mb-4">Inventory Overview</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#8884d8" name="Total Items" />
          <Bar dataKey="borrowed" fill="#82ca9d" name="Borrowed Items" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ActivityTimelineChart = ({ activities, loading }) => {
  const processActivities = (activities) => {
    const activityCounts = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt).toLocaleDateString();
      if (!activityCounts[date]) {
        activityCounts[date] = {
          date,
          requested: 0,
          borrowed: 0,
          returned: 0,
          approved: 0,
          rejected: 0
        };
      }
      activityCounts[date][activity.action] += 1;
    });
    
    return Object.values(activityCounts).slice(-7); // Last 7 days
  };

  const data = processActivities(activities);

  if (loading) {
    return <ChartSkeleton title="Recent Activity Trends" />
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity data</h3>
          <p className="mt-1 text-sm text-gray-500">Activity chart will appear here when data is available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
      <h3 className="text-lg font-semibold mb-4">Recent Activity Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="requested" stackId="a" fill="#FFBB28" name="Requested" />
          <Bar dataKey="borrowed" stackId="a" fill="#0088FE" name="Borrowed" />
          <Bar dataKey="returned" stackId="a" fill="#00C49F" name="Returned" />
          <Bar dataKey="approved" stackId="a" fill="#8884d8" name="Approved" />
          <Bar dataKey="rejected" stackId="a" fill="#FF8042" name="Rejected" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ChartSkeleton = ({ title }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center w-full">
      <h3 className="text-lg font-semibold mb-4 h-6 w-3/4 bg-gray-200 rounded"></h3>
      <div className="h-40 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    borrowedAssets: 0,
    pendingRequests: 0,
    activeUsers: 0,
    totalAccessories: 0,
    borrowedAccessories: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, hasPermission } = useAuth()

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let assetsResponse, requestsResponse, usersResponse, activitiesResponse

      if (hasPermission("view_all_requests")) {
        try {
          assetsResponse = await itemsAPI.getStats()
        } catch (err) {
          assetsResponse = { data: { data: { total: 0, borrowed: 0 } } }
        }
        try {
          requestsResponse = await borrowAPI.getStats()
        } catch (err) {
          requestsResponse = { data: { data: { pending: 0 } } }
        }
      } else {
        try {
          const myHistory = await borrowAPI.getMyHistory()
          const myData = myHistory?.data?.data || []
          const borrowedAssets = myData.filter(
            (r) => r.status === "borrowed" || r.status === "approved"
          ).length
          const pendingRequests = myData.filter((r) => r.status === "pending").length
          assetsResponse = { data: { data: { total: borrowedAssets, borrowed: borrowedAssets } } }
          requestsResponse = { data: { data: { pending: pendingRequests } } }
        } catch (err) {
          assetsResponse = { data: { data: { total: 0, borrowed: 0 } } }
          requestsResponse = { data: { data: { pending: 0 } } }
        }
      }

      let usersCount = 0
      if (hasPermission("manage_users")) {
        try {
          usersResponse = await usersAPI.getStats()
          usersCount = usersResponse?.data?.data?.activeUsers || 0
        } catch (err) {}
      }

      try {
        if (hasPermission("view_all_requests")) {
          activitiesResponse = await borrowAPI.getRecentActivity()
        } else {
          activitiesResponse = await borrowAPI.getMyHistory()
        }
      } catch (err) {
        activitiesResponse = { data: { data: [] } }
      }

      const assetData = assetsResponse?.data?.data || {}
      const requestData = requestsResponse?.data?.data || {}

      setStats({
        totalAssets: assetData.total || 0,
        borrowedAssets: assetData.borrowed || 0,
        pendingRequests: requestData.pending || 0,
        activeUsers: usersCount,
        totalAccessories: assetData.totalAccessories || 0,
        borrowedAccessories: assetData.borrowedAccessories || 0,
      })

      let formattedActivities = []
      if (activitiesResponse?.data?.data) {
        formattedActivities = activitiesResponse.data.data.map((item) => {
          if (item.item && !item.action) {
            return {
              _id: item._id,
              user: item.user,
              item: item.item,
              action: item.status === "pending" ? "requested" : item.status,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }
          }
          return item
        })
      }

      setRecentActivities(formattedActivities)
    } catch (err) {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  useEffect(() => {
    fetchDashboardData()
    const intervalId = setInterval(fetchDashboardData, 30 * 1000)
    return () => clearInterval(intervalId)
  }, [fetchDashboardData])

  const getActionColor = (action) => {
    switch (action) {
      case "borrowed":
        return "bg-blue-100 text-blue-800"
      case "returned":
        return "bg-green-100 text-green-800"
      case "requested":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-purple-100 text-purple-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading && !stats.totalAssets) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here's what's happening with your assets.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Assets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
              <BarChartIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Assets</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalAssets}</h3>
              <p className="text-xs text-gray-400 mt-1">All items in inventory</p>
            </div>
          </div>
        </div>

        {/* Borrowed Assets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4">
              <PieChartIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Borrowed Assets</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.borrowedAssets}</h3>
              <p className="text-xs text-gray-400 mt-1">Currently checked out</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600 mr-4">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Requests</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</h3>
              <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
            </div>
          </div>
        </div>

        {hasPermission("view_all_requests") && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 mr-4">
                <PieChartIcon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Borrowed</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.borrowedAssets + stats.borrowedAccessories}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Assets & Accessories borrowed</p>
              </div>
            </div>
          </div>
        )}

        {hasPermission("view_all_requests") && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-pink-50 text-pink-600 mr-4">
                  <BarChartIcon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Accessories</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalAccessories}</h3>
                  <p className="text-xs text-gray-400 mt-1">All accessories in inventory</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4">
                  <PieChartIcon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Borrowed Accessories</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.borrowedAccessories}</h3>
                  <p className="text-xs text-gray-400 mt-1">Accessories currently borrowed</p>
                </div>
              </div>
            </div>
          </>
        )}

        {hasPermission("manage_users") && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Users</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.activeUsers}</h3>
                <p className="text-xs text-gray-400 mt-1">Using the system</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssetStatusChart 
              total={stats.totalAssets} 
              borrowed={stats.borrowedAssets}
              loading={loading}
            />
            {hasPermission("view_all_requests") && (
              <CombinedAssetsChart stats={stats} loading={loading} />
            )}
          </div>
          
          <ActivityTimelineChart activities={recentActivities} loading={loading} />
        </div>

        {/* Recent Activities and Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/requests" className="text-sm flex items-center text-blue-600 hover:text-blue-800">
                View all <ArrowRight className="ml-1" size={16} />
              </Link>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity._id || index}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Users size={16} className="text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium text-gray-900">{activity.user?.name || "My Request"}</span>{" "}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>{" "}
                        <span className="font-medium text-gray-900">{activity.item?.name || "Unknown Asset"}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Activity will appear here as it happens.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/assets/new"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={18} />
                <span>Add New Asset</span>
              </Link>
              <Link
                to="/assets"
                className="w-full py-3 px-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <List size={18} />
                <span>View All Assets</span>
              </Link>
              <Link
                to="/requests"
                className="w-full py-3 px-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Activity size={18} />
                <span>View Pending Requests</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}