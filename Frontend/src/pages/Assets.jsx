"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { itemsAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "../components/LoadingSpinner"
import RoleBasedComponent from "../components/RoleBasedComponent"

// SVG icon components
const Laptop = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="4" width="20" height="12" rx="2" />
    <rect x="6" y="16" width="12" height="4" />
  </svg>
)

const Monitor = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const Smartphone = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const Tablet = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const Plus = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14"></path>
  </svg>
)

export default function Assets() {
  const [filter, setFilter] = useState("all")
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { hasPermission, user } = useAuth()
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const [imageLoadErrors, setImageLoadErrors] = useState({})
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const endpoint = hasPermission("view_all_assets") ? "getAll" : "getAvailable"
        const response = await itemsAPI[endpoint]()

        let assetsData = []
        if (response?.data?.data) {
          assetsData = response.data.data
        } else if (Array.isArray(response?.data)) {
          assetsData = response.data
        } else if (response?.data) {
          assetsData = [response.data]
        }

        // Fetch all borrow records
        let borrowRecords = []
        const borrowResponse = await fetch(`${apiUrl}/borrow`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (borrowResponse.ok) {
          const borrowData = await borrowResponse.json()
          borrowRecords = borrowData.data || []
        }

        assetsData = assetsData.map((asset) => {
          // Find all borrow records for this asset that are active
          const borrowedCount = borrowRecords.filter(
            (item) =>
              item.item?._id === asset._id &&
              ["borrowed", "active", "approved"].includes(item.status)
          ).length

          let availableQuantity = asset.quantity || 1
          if (asset.category === "accessory") {
            availableQuantity = Math.max(0, (asset.quantity || 1) - borrowedCount)
          }

          // Pending request check
          const hasPendingRequest = borrowRecords.some(
            (req) => req.item?._id === asset._id && req.status === "pending"
          )

          let displayStatus = asset.status
          if (asset.category === "accessory") {
            displayStatus = availableQuantity > 0 ? "available" : "borrowed"
          }

          return {
            ...asset,
            displayStatus: hasPendingRequest ? "pending" : displayStatus,
            availableQuantity,
            totalQuantity: asset.quantity || 1,
          }
        })

        setAssets(assetsData)
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load assets")
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [hasPermission, user])

  const searchAssets = (assetsList) => {
    if (!search.trim()) return assetsList
    const lower = search.trim().toLowerCase()
    return assetsList.filter(
      (asset) =>
        asset.name?.toLowerCase().includes(lower) ||
        asset._id?.toLowerCase().includes(lower) ||
        asset.serialNumber?.toLowerCase().includes(lower)
    )
  }

  const filteredAssets =
    filter === "all"
      ? searchAssets(assets)
      : searchAssets(
          assets.filter(
            (asset) => asset.category === filter || asset.status === filter
          )
        )

  const getIcon = (type) => {
    switch (type) {
      case "laptop":
        return <Laptop className="text-gray-500" />
      case "monitor":
        return <Monitor className="text-gray-500" />
      case "phone":
        return <Smartphone className="text-gray-500" />
      case "tablet":
        return <Tablet className="text-gray-500" />
      default:
        return <Laptop className="text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "borrowed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "maintenance":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getImageUrl = (assetId) => {
    if (!assetId) return "/placeholder.svg?height=200&width=300"
    return `${apiUrl}/items/${assetId}/photo`
  }

  const handleImageError = (assetId) => {
    setImageLoadErrors((prev) => ({
      ...prev,
      [assetId]: true,
    }))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Inventory</h1>
          <p className="text-gray-500 mt-1">Browse and manage available IT equipment</p>
        </div>

        <div className="w-full md:w-auto flex flex-col gap-3">
          {/* Search input and action buttons in one row */}
          <div className="flex flex-row gap-2 items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, ID or serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Action buttons */}
            <RoleBasedComponent requiredPermission="create_asset">
              <Link
                to="/assets/new"
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
              >
                <Plus className="mr-2 w-4 h-4" /> Add Asset
              </Link>
              <Link
                to="/assets/edit"
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
              >
                Edit Assets
              </Link>
            </RoleBasedComponent>
          </div>

          {/* Filter buttons under search */}
          <div className="flex flex-wrap gap-2 items-center mt-2">
            <div className="inline-flex rounded-md shadow-sm border border-gray-200">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("laptop")}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === "laptop"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Laptop className="w-4 h-4" /> Laptops
              </button>
              <button
                onClick={() => setFilter("phone")}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === "phone"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Smartphone className="w-4 h-4" /> Phones
              </button>
              <button
                onClick={() => setFilter("available")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${
                  filter === "available"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Available
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start">
          <svg
            className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets && filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => {
            const isAccessory = asset.category === "accessory";
            const availableQuantity = asset.availableQuantity || 1;
            const totalQuantity = asset.totalQuantity || 1;

            return (
              <Link
                key={asset._id}
                to={`/assets/${asset._id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow hover:-translate-y-1 transition-transform border border-gray-200 hover:border-blue-200 group"
              >
                <div className="h-48 bg-gray-50 relative flex items-center justify-center p-4">
                  {!imageLoadErrors[asset._id] ? (
                    <img
                      src={getImageUrl(asset._id) || "/placeholder.svg"}
                      alt={asset.name}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                      onError={() => handleImageError(asset._id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                      <span className="text-gray-400 text-4xl">
                        {getIcon(asset.category)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {asset.name}
                    </h3>
                    <div className="flex gap-2">
                      {isAccessory && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {`${asset.availableQuantity}/${asset.totalQuantity}`}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          asset.displayStatus === 'available' 
                            ? 'bg-green-100 text-green-800'
                            : asset.displayStatus === 'borrowed'
                            ? 'bg-blue-100 text-blue-800'
                            : asset.displayStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {asset.displayStatus || asset.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    {getIcon(asset.category)}
                    <span className="capitalize">{asset.category}</span>
                    {asset.serialNumber && (
                      <span className="ml-auto text-xs bg-gray-50 px-2 py-1 rounded text-gray-500">
                        #{asset.serialNumber}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No assets found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {filter === "all"
                ? "There are currently no assets in the inventory."
                : `No ${filter} assets found. Try adjusting your search or filter.`}
            </p>
            <RoleBasedComponent requiredPermission="create_asset">
              <Link
                to="/assets/new"
                className="mt-4 inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="mr-2 w-4 h-4" /> Add your first asset
              </Link>
            </RoleBasedComponent>
          </div>
        )}
      </div>
    </div>
  )
}