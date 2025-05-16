"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { borrowAPI } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"

const Profile = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("userInfo")
  const [ setBorrowRequests] = useState([])
  const [ setLoading] = useState(false)
  const [ setError] = useState(null)

  useEffect(() => {
    const fetchBorrowRequests = async () => {
      if (activeTab === "borrowRequests") {
        try {
          setLoading(true)
          const response = await borrowAPI.getMyRequests()
          if (response.data && response.data.data) {
            setBorrowRequests(response.data.data)
          }
        } catch (err) {
          console.error("Error fetching borrow requests:", err)
          setError("Failed to load borrow requests")
        } finally {
          setLoading(false)
        }
      }
    }

    fetchBorrowRequests()
  }, [activeTab])

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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center text-blue-800 text-3xl font-bold shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{user.name}</h1>
                <p className="text-gray-600 mt-1">{user.email}</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  {user.department && (
                    <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {user.department}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("userInfo")}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === "userInfo"
                    ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                } transition-colors duration-200`}
              >
                <i className="fas fa-user-circle mr-2"></i>
                User Information
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === "userInfo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Personal Info</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email Address</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Department</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.department || <span className="text-gray-400">Not specified</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.phone || <span className="text-gray-400">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Member Since</p>
                      <p className="mt-1 text-sm text-gray-900 font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : "Invalid Date"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
