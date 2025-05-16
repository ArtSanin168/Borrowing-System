"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { itemsAPI, borrowAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AssetRequestForm from "../components/forms/AssetRequestForm";
import LoadingSpinner from "../components/LoadingSpinner";

// Updated SVG icon components with modern styling
const ArrowLeft = (props) => (
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
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const Calendar = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const User = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const Clock = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const CheckCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const AlertCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default function AssetDetails() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchAssetAndRequests = async () => {
      try {
        // Fetch asset details
        const assetResponse = await itemsAPI.getById(id);
        console.log("Asset data:", assetResponse.data.data);

        // Fetch borrow requests to check for pending ones
        const borrowResponse = await borrowAPI.getAll();
        const requests = borrowResponse.data?.data || [];

        // Filter pending requests for this asset
        const pendingForAsset = requests.filter(
          (req) => req.item?._id === id && req.status === "pending"
        );

        setPendingRequests(pendingForAsset);

        // Update asset with display status
        const assetData = assetResponse.data.data;
        const total = assetData.quantity || 0;
        const borrowed = assetData.borrowHistory
          ? assetData.borrowHistory.filter(
              (item) =>
                ["borrowed", "active", "approved"].includes(item.status)
            ).length
          : 0;
        const available = total - borrowed;

        if (pendingForAsset.length > 0) {
          assetData.displayStatus = "pending";
        } else if (available > 0) {
          assetData.displayStatus = "available";
        } else {
          assetData.displayStatus = assetData.status;
        }

        setAsset(assetData);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load asset details");
        console.error("Error fetching asset:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetAndRequests();
  }, [id]);

  const handleRequestSubmit = async (values) => {
    setRequestSubmitting(true);
    setRequestError(null);

    try {
      // Format dates to ISO string for API submission
      const formattedValues = {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        item: asset._id,
      };

      // Create borrow request
      await borrowAPI.create(formattedValues);

      setRequestModalOpen(false);

      // Refresh asset data to show updated status
      const assetResponse = await itemsAPI.getById(id);
      const borrowResponse = await borrowAPI.getAll();
      const requests = borrowResponse.data?.data || [];

      // Filter pending requests for this asset
      const pendingForAsset = requests.filter(
        (req) => req.item?._id === id && req.status === "pending"
      );

      setPendingRequests(pendingForAsset);

      // Update asset with display status
      const assetData = assetResponse.data.data;
      const total = assetData.quantity || 0;
      const borrowed = assetData.borrowHistory
        ? assetData.borrowHistory.filter(
            (item) =>
              ["borrowed", "active", "approved"].includes(item.status)
          ).length
        : 0;
      const available = total - borrowed;

      if (pendingForAsset.length > 0) {
        assetData.displayStatus = "pending";
      } else if (available > 0) {
        assetData.displayStatus = "available";
      } else {
        assetData.displayStatus = assetData.status;
      }

      setAsset(assetData);
    } catch (err) {
      console.error("Error submitting request:", err);
      setRequestError(err.response?.data?.error || "Failed to submit request");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-600";
      case "borrowed":
        return "bg-blue-500/10 text-blue-600";
      case "pending":
        return "bg-amber-500/10 text-amber-600";
      case "maintenance":
        return "bg-orange-500/10 text-orange-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "borrowed":
        return <User className="text-blue-500" />;
      case "returned":
        return <CheckCircle className="text-emerald-500" />;
      case "maintenance":
        return <AlertCircle className="text-orange-500" />;
      case "pending":
        return <Clock className="text-amber-500" />;
      default:
        return <Clock />;
    }
  };

  const getImageUrl = (assetId) => {
    if (!assetId) return "/placeholder.svg?height=400&width=600";
    return `${apiUrl}/items/${assetId}/photo`;
  };

  const getAvailableQuantity = () => {
    if (!asset) return 0;
    const total = asset.quantity || 0;
    // Count all borrow requests that are not returned yet
    const borrowed = asset.borrowHistory
      ? asset.borrowHistory.filter(
          (item) =>
            ["borrowed", "active", "approved"].includes(item.status)
        ).length
      : 0;
    return total - borrowed;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayStatus = asset.displayStatus || asset.status;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/assets"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="mr-2" />
        <span className="font-medium">Back to Assets</span>
      </Link>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="flex flex-col">
            <div className="relative h-80 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={getImageUrl(asset._id) || "/placeholder.svg"}
                alt={asset.name}
                className="max-w-full max-h-full object-contain p-4"
                onError={(e) => {
                  console.error("Image failed to load:", e.target.src);
                  e.target.onerror = null;
                  e.target.src = "/placeholder.svg?height=400&width=600";
                }}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
                {asset.quantity > 1 && (
                  <span className="ml-3 bg-red-600 text-white text-base font-bold rounded-full px-4 py-1">
                    x{getAvailableQuantity()} / {asset.quantity}
                  </span>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(
                  displayStatus
                )}`}
              >
                {displayStatus}
              </span>
            </div>

            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mr-3">
                Details
              </h2>
            </div>

            <div className="mb-8">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </p>
                  <p className="font-medium text-gray-900">{asset.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </p>
                  <p className="font-medium text-gray-900">{asset.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="font-medium text-gray-900">{asset.location}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </p>
                  <p className="font-medium text-gray-900">{asset.condition}</p>
                </div>
                {asset.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </p>
                    <p className="font-medium text-gray-900">{asset.description}</p>
                  </div>
                )}
              </div>
            </div>

            {asset.specs && asset.specs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Specifications
                </h2>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                  {asset.specs.map((spec) => (
                    <div key={spec.name}>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {spec.name}
                      </p>
                      <p className="font-medium text-gray-900">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show request button if available quantity > 0 */}
            {user && getAvailableQuantity() > 0 && (
              <button
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm font-medium"
                onClick={() => setRequestModalOpen(true)}
              >
                Request This Asset
              </button>
            )}

            {pendingRequests.length > 0 && (
              <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      This asset has {pendingRequests.length} pending request
                      {pendingRequests.length > 1 ? "s" : ""} awaiting approval.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Borrowing History
          </h2>
          {asset.borrowHistory && asset.borrowHistory.length > 0 ? (
            <div className="space-y-4">
              {asset.borrowHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-white rounded-lg shadow-xs border border-gray-100"
                >
                  <div className="mr-4 mt-1">{getActionIcon(item.status)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      <span>{item.user?.name || "User"}</span>{" "}
                      <span className="font-normal text-gray-600">
                        {item.status} this asset
                      </span>
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="mr-1.5" />
                        {new Date(item.startDate).toLocaleDateString()}
                      </span>
                      {item.endDate && (
                        <span className="flex items-center">
                          <Clock className="mr-1.5" />
                          {Math.ceil(
                            (new Date(item.endDate) -
                              new Date(item.startDate)) /
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
      </div>

      {/* Modern Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Request Asset</h2>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="mb-6 text-gray-600">
              You are requesting to borrow:{" "}
              <strong className="text-gray-900">{asset.name}</strong>
            </p>

            <AssetRequestForm
              onSubmit={handleRequestSubmit}
              isSubmitting={requestSubmitting}
              error={requestError}
              initialValues={{
                startDate: new Date().toISOString().split("T")[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
