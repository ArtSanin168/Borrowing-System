import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { formatDate } from "../utils/formatters"

const AssetCard = ({ asset }) => {
  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "borrowed":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "retired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Function to get condition color
  const getConditionColor = (condition) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate available quantity
  const calculateAvailableQuantity = () => {
    const total = asset.quantity || 0;
    const borrowed = asset.borrowHistory
      ? asset.borrowHistory.filter(
          (item) => ["borrowed", "active", "approved"].includes(item.status)
        ).length
      : 0;
    return total - borrowed;
  }

  const getDisplayStatus = () => {
    const available = calculateAvailableQuantity();
    if (available > 0) {
      return "available"
    }
    return asset.status || "borrowed"
  }

  // When borrowing:
  const handleBorrow = async () => {
    if (asset.quantity > 0) {
      // Call API to decrease quantity by 1
      await itemsAPI.update(asset._id, { quantity: asset.quantity - 1 })
      // Optionally, update status to "unavailable" if quantity === 1 before borrow
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48 bg-gray-200">
        {asset.image && asset.image.url ? (
          <img
            src={asset.image.url || "/placeholder.svg"}
            alt={asset.name}
            className="w-full h-full object-contain" // changed from object-cover
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/placeholder.svg"
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <span className="text-gray-400 text-lg">No image</span>
          </div>
        )}
        {/* Quantity badge: show available / total if quantity > 1 */}
        {asset.quantity > 1 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1 shadow z-10">
            {calculateAvailableQuantity()} / {asset.quantity}
          </span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(getDisplayStatus())}`}>
            {getDisplayStatus().charAt(0).toUpperCase() + getDisplayStatus().slice(1)}
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getConditionColor(asset.condition)}`}>
            {asset.condition?.charAt(0).toUpperCase() + asset.condition?.slice(1)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold">
          {asset.name}
          {asset.quantity > 1 && (
            <span className="ml-2 text-xs text-blue-600 font-semibold">x{asset.quantity}</span>
          )}
        </h3>
        <div className="flex items-center mb-2">
          <p className="text-sm text-gray-500 mb-2 truncate">
            {asset.category?.charAt(0).toUpperCase() + asset.category?.slice(1)}
          </p>
          {asset.quantity > 1 && (
            <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {asset.quantity}
            </span>
          )}
        </div>

        {asset.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{asset.description}</p>}

        <div className="flex flex-col text-xs text-gray-500 space-y-1 mb-3">
          {asset.serialNumber && (
            <div className="flex justify-between">
              <span>Serial:</span>
              <span className="font-medium">{asset.serialNumber}</span>
            </div>
          )}
          {asset.location && (
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{asset.location}</span>
            </div>
          )}
          {asset.purchaseDate && (
            <div className="flex justify-between">
              <span>Purchased:</span>
              <span className="font-medium">{formatDate(asset.purchaseDate)}</span>
            </div>
          )}
        </div>

        <Link
          to={`/assets/${asset._id}`}
          className="block w-full text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={handleBorrow}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

const AssetList = () => {
  const [assets, setAssets] = useState([])

  useEffect(() => {
    fetch("/api/assets") // Update with your actual API endpoint
      .then((res) => res.json())
      .then((data) => setAssets(data))
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard key={asset._id} asset={asset} />
      ))}
    </div>
  )
}

export default AssetList