"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import RoleBasedComponent from "../components/RoleBasedComponent"

// Add this helper for image URL
const getImageUrl = (assetId) => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  if (!assetId) return "/placeholder.svg?height=400&width=600"
  return `${apiUrl}/items/${assetId}/photo`
}

const RequestDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [returnCondition, setReturnCondition] = useState("same")
  const [returnNotes, setReturnNotes] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  // Add asset state if you want to fetch more details
  const [asset, setAsset] = useState(null)

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        console.log("Fetching request details for ID:", id)
        const response = await api.get(`/borrow/${id}`)
        console.log("Request details response:", response.data)

        if (user.role !== "admin" && user.role !== "manager" && response.data.data.user._id !== user.id) {
          setError("You don't have permission to view this request")
          setLoading(false)
          return
        }

        setRequest(response.data.data)
        // Optionally fetch asset details for more info/specs/history
        const assetId = response.data.data.item._id
        const assetRes = await api.get(`/items/${assetId}`)
        setAsset(assetRes.data.data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching request details:", err)
        setError(err.response?.data?.error || "Failed to fetch request details")
        setLoading(false)
      }
    }

    fetchRequestDetails()
  }, [id, user?.id, user?.permissions, user?.role])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const response = await api.put(`/borrow/${id}/approve`)
      setRequest(response.data.data)
      setActionLoading(false)
    } catch (err) {
      console.error("Error approving request:", err)
      setError(err.response?.data?.error || "Failed to approve request")
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection")
      return
    }

    setActionLoading(true)
    try {
      const response = await api.put(`/borrow/${id}/reject`, {
        rejectionReason,
      })
      setRequest(response.data.data)
      setActionLoading(false)
    } catch (err) {
      console.error("Error rejecting request:", err)
      setError(err.response?.data?.error || "Failed to reject request")
      setActionLoading(false)
    }
  }

  const handleReturn = async () => {
    setActionLoading(true)
    try {
      const response = await api.put(`/borrow/${id}/return`, {
        returnCondition,
        returnNotes,
      })
      setRequest(response.data.data)
      setActionLoading(false)
    } catch (err) {
      console.error("Error returning item:", err)
      setError(err.response?.data?.error || "Failed to return item")
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      const response = await api.put(`/borrow/${id}/cancel`)
      setRequest(response.data.data)
      setActionLoading(false)
    } catch (err) {
      console.error("Error cancelling request:", err)
      setError(err.response?.data?.error || "Failed to cancel request")
      setActionLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800"
      case "approved":
        return "bg-emerald-100 text-emerald-800"
      case "rejected":
        return "bg-rose-100 text-rose-800"
      case "returned":
        return "bg-sky-100 text-sky-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "overdue":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg shadow-sm mb-6">
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 rounded-lg shadow-sm mb-6">
          <p className="font-medium">Request not found</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/requests"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        {/* SVG for back */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Back to Requests</span>
      </Link>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Asset Image */}
          <div className="flex flex-col">
            <div className="relative h-80 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={getImageUrl(request.item._id)}
                alt={request.item.name}
                className="max-w-full max-h-full object-contain p-4"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = "/placeholder.svg?height=400&width=600"
                }}
              />
            </div>
          </div>

          {/* Asset & Request Info */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Request #{request._id.substring(request._id.length - 6).toUpperCase()}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusBadgeClass(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Details</h2>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</p>
                  <p className="font-medium text-gray-900">{request.item.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</p>
                  <p className="font-medium text-gray-900">{request.item.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</p>
                  <p className="font-medium text-gray-900">{asset?.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</p>
                  <p className="font-medium text-gray-900">{asset?.condition || "N/A"}</p>
                </div>
                {request.item.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                    <p className="font-medium text-gray-900">{request.item.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Specs */}
            {asset?.specs && asset.specs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                  {asset.specs.map((spec) => (
                    <div key={spec.name}>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{spec.name}</p>
                      <p className="font-medium text-gray-900">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</p>
                  <p className="font-medium text-gray-900">{request.user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900">{request.user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</p>
                  <p className="font-medium text-gray-900">{request.user.department || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Position</p>
                  <p className="font-medium text-gray-900">{request.user.position || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Request Timeline */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Request Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Requested On</p>
              <p className="text-gray-800">{formatDate(request.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-gray-800">{formatDate(request.startDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="text-gray-800">{formatDate(request.endDate)}</p>
            </div>
            {request.status === "approved" && (
              <div>
                <p className="text-sm font-medium text-gray-500">Approved On</p>
                <p className="text-gray-800">{formatDate(request.approvalDate)}</p>
              </div>
            )}
            {request.status === "rejected" && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rejected On</p>
                  <p className="text-gray-800">{formatDate(request.rejectedAt)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                  <p className="text-gray-800">{request.rejectionReason}</p>
                </div>
              </>
            )}
            {request.status === "returned" && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500">Returned On</p>
                  <p className="text-gray-800">{formatDate(request.actualReturnDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Return Condition</p>
                  <p className="text-gray-800 capitalize">{request.returnCondition}</p>
                </div>
                {request.returnNotes && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Return Notes</p>
                    <p className="text-gray-800">{request.returnNotes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Purpose */}
        <div className="border-t border-gray-200 px-8 py-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Purpose</h3>
          <p className="text-gray-800 whitespace-pre-line">{request.purpose || "No purpose provided"}</p>
        </div>

        {/* Borrowing History */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Borrowing History</h2>
          {asset?.borrowHistory && asset.borrowHistory.length > 0 ? (
            <div className="space-y-4">
              {asset.borrowHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-white rounded-lg shadow-xs border border-gray-100"
                >
                  <div className="mr-4 mt-1">
                    {/* You can use icons like in AssetDetails */}
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      <span>{item.user?.name || "User"}</span>{" "}
                      <span className="font-normal text-gray-600">
                        {item.status} this asset
                      </span>
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                      <span className="flex items-center">
                        {new Date(item.startDate).toLocaleDateString()}
                      </span>
                      {item.endDate && (
                        <span className="flex items-center">
                          {Math.ceil(
                            (new Date(item.endDate) - new Date(item.startDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No borrowing history available.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!actionLoading ? (
          <div className="mt-8 space-y-4">
            {/* Admin/Manager Actions */}
            <RoleBasedComponent allowedRoles={["admin", "manager"]}>
              {request.status === "pending" && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Approve Request
                  </button>
                  <div className="flex flex-col md:flex-row gap-3 flex-grow">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection"
                      className="flex-grow border border-gray-300 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 rounded-lg p-2.5 outline-none transition-all duration-200"
                    />
                    <button
                      onClick={handleReject}
                      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
            </RoleBasedComponent>

            {/* User Actions */}
            {request.user._id === user.id && request.status === "pending" && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Cancel Request
              </button>
            )}

            {/* Return Actions */}
            {request.status === "approved" &&
              (request.user._id === user.id || ["admin", "manager"].includes(user.role)) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={returnCondition}
                      onChange={(e) => setReturnCondition(e.target.value)}
                      className="border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 rounded-lg p-2.5 outline-none transition-all duration-200"
                    >
                      <option value="same">Same (No Change)</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="damaged">Damaged</option>
                      <option value="lost">Lost</option>
                    </select>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="Return notes (optional)"
                      className="border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 rounded-lg p-2.5 outline-none transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleReturn}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    Return Item
                  </button>
                </div>
              )}
          </div>
        ) : (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  )
}

export default RequestDetails