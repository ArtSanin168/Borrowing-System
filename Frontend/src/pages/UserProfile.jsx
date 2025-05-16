"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"

const UserProfile = () => {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState("info")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        // If viewing own profile, use auth user data
        if (!id || id === currentUser.id) {
          setUser(currentUser)

          // Fetch user's borrow requests
          const requestsResponse = await api.get("/borrow/me/history")
          setRequests(requestsResponse.data.data)
        } else {
          // Fetch other user's data (for admins/managers)
          const userResponse = await api.get(`/users/${id}`)
          setUser(userResponse.data.data)

          // Fetch user's borrow requests
          const requestsResponse = await api.get(`/borrow?user=${id}`)
          setRequests(requestsResponse.data.data)
        }
        setLoading(false)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load user data. Please try again.")
        setLoading(false)
      }
    }

    fetchUserData()
  }, [id, currentUser])

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      returned: "bg-blue-100 text-blue-800",
      cancelled: "bg-gray-100 text-gray-800",
      overdue: "bg-orange-100 text-orange-800",
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-center text-red-500">{error}</div>
  if (!user) return <div className="text-center">User not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gray-50 p-6 border-b">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="mt-1">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                {user.department && (
                  <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "info" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              User Information
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "requests"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Borrow Requests
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                <p className="mt-1 text-sm text-gray-900">{user.department || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p className="mt-1 text-sm text-gray-900">{user.phone || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="mt-1 text-sm text-gray-900">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="mt-1 text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Borrow History</h2>

              {requests.length === 0 ? (
                <p className="text-gray-500 italic">No borrow requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Request Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {request.item?.image ? (
                                <img
                                  src={`${process.env.REACT_APP_API_URL}/uploads/${request.item.image}`}
                                  alt={request.item.name}
                                  className="w-10 h-10 rounded-md object-cover mr-3"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = "/placeholder.svg?height=40&width=40"
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                                  <span className="text-gray-500 text-xs">No img</span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {request.item?.name || "Unknown Item"}
                                </div>
                                <div className="text-sm text-gray-500">{request.item?.category || ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {request.startDate && request.endDate ? (
                              <>
                                {new Date(request.startDate).toLocaleDateString()} -{" "}
                                {new Date(request.endDate).toLocaleDateString()}
                              </>
                            ) : (
                              "Not specified"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/requests/${request._id}`} className="text-blue-600 hover:text-blue-900">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
