"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { borrowAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import RoleBasedComponent from "../components/RoleBasedComponent"

export default function Requests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const { hasPermission, user } = useAuth()

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        let response

        if (hasPermission("view_all_requests")) {
          response = await borrowAPI.getAll()
        } else {
          response = await borrowAPI.getMyHistory()
        }

        // Sort by createdAt descending (newest first)
        const sorted = response.data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        setRequests(sorted)
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load requests")
        console.error("Error fetching requests:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [hasPermission, user])

  const handleApprove = async (id) => {
    try {
      await borrowAPI.approve(id)
      // Refresh and sort requests
      const response = hasPermission("view_all_requests") ? await borrowAPI.getAll() : await borrowAPI.getMyHistory()
      const sorted = response.data.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setRequests(sorted)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve request")
      console.error("Error approving request:", err)
    }
  }

  const handleReject = async (id) => {
    try {
      const reason = window.prompt("Please provide a reason for rejection:")
      if (!reason) return // Cancel if no reason provided

      await borrowAPI.reject(id, { rejectionReason: reason })
      // Refresh and sort requests
      const response = hasPermission("view_all_requests") ? await borrowAPI.getAll() : await borrowAPI.getMyHistory()
      const sorted = response.data.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
      setRequests(sorted)
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject request")
      console.error("Error rejecting request:", err)
    }
  }

  const filteredRequests = filter === "all" ? requests : requests.filter((request) => request.status === filter)

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-amber-50 text-amber-800 border-amber-200",
      approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
      rejected: "bg-red-50 text-red-800 border-red-200",
      active: "bg-blue-50 text-blue-800 border-blue-200",
      returned: "bg-gray-50 text-gray-800 border-gray-200",
      overdue: "bg-orange-50 text-orange-800 border-orange-200",
      cancelled: "bg-gray-50 text-gray-800 border-gray-200",
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusClasses[status] || "bg-gray-50"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    // Allow access to both users with view_all_requests and view_own_requests permissions
    <RoleBasedComponent
      anyPermission={["view_all_requests", "view_own_requests"]}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center p-6 max-w-md bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to view this page</p>
          </div>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {hasPermission("view_all_requests") ? "All Borrowing Requests" : "My Borrowing Requests"}
            </h1>
            <p className="text-gray-500 mt-1">
              {hasPermission("view_all_requests")
                ? "Manage and review asset borrowing requests"
                : "View and manage your asset borrowing requests"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "returned","overdue" ].map((filterOption) => (
              <button
                key={filterOption}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setFilter(filterOption)}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {hasPermission("view_all_requests") ? "User" : "Item"}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {hasPermission("view_all_requests") ? "Item" : "Request Date"}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      {/* First column - User for admins, Item for regular users */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPermission("view_all_requests") ? (
                          // Show user info for admins/managers
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {request.user?.name?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.user?.name || "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500">{request.user?.email}</div>
                            </div>
                          </div>
                        ) : (
                          // Show item info for regular users
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                              {request.item?.image ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}/items/${request.item._id}/photo`}
                                  alt={request.item.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = "/placeholder.svg?height=40&width=40"
                                  }}
                                />
                              ) : (
                                <span className="text-gray-500">No img</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.item?.name || "Unknown Item"}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">{request.item?.category}</div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Second column - Item for admins, Request Date for regular users */}
                      <td className="px-6 py-4">
                        {hasPermission("view_all_requests") ? (
                          // Show item info for admins/managers
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.item?.name || "Unknown Item"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 capitalize">{request.item?.category}</div>
                          </div>
                        ) : (
                          // Show request date for regular users
                          <div className="text-sm text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} –{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24))}{" "}
                          days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-4">
                          {request.status === "pending" && hasPermission("approve_request") && (
                            <>
                              <button
                                onClick={() => handleApprove(request._id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request._id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link
                            to={`/requests/${request._id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center"
                          >
                            Details
                            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {filter === "all" ? "There are no borrowing requests yet." : `No ${filter} requests found.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleBasedComponent>
  )
}
