import React, { useState, useEffect } from "react";
import axios from "axios";
import { itemsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom"; // <-- Add this import

const API_URL = "http://localhost:5000/api/assets";

const initialForm = {
  name: "",
  serialNumber: "",
  category: "laptop",
  status: "available",
  condition: "good",
  location: "Head office", // Match NewAsset default
  purchaseDate: "",
  purchasePrice: "",
  description: "",
  specs: [],
  quantity: 1, // Add quantity
};

const EditAsset = () => {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate(); // <-- Add this line

  // Fetch all assets
  const fetchAssets = async () => {
    try {
      const res = await itemsAPI.getAll();
      setAssets(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Handle edit button - Fixed to properly populate all fields
  const handleEdit = (asset) => {
    setForm({
      name: asset.name || "",
      serialNumber: asset.serialNumber || "",
      category: asset.category || "laptop",
      status: asset.status || "available",
      condition: asset.condition || "good",
      location: asset.location || "",
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split("T")[0] : "",
      purchasePrice: asset.purchasePrice || "",
      description: asset.description || "",
      specs: asset.specs || [],
    });
    setEditingId(asset._id);
    setImagePreview(asset.imageUrl || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle add new asset button
  const handleAddNew = () => {
    setForm(initialForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare asset data
      const assetData = { ...form };
      if (!assetData.purchasePrice) assetData.purchasePrice = 0;
      if (!assetData.serialNumber) assetData.serialNumber = "N/A";
      if (!assetData.purchaseDate) {
        const today = new Date();
        assetData.purchaseDate = today.toISOString().split("T")[0];
      }

      // Remove quantity if your API doesn't support it, otherwise keep it
      // const { quantity, ...singleAssetData } = assetData;

      if (editingId) {
        await itemsAPI.update(editingId, assetData);
        if (imageFile) {
          await itemsAPI.uploadPhoto(editingId, imageFile);
        }
      } else {
        const response = await itemsAPI.create(assetData);
        if (imageFile && response.data && response.data.data._id) {
          await itemsAPI.uploadPhoto(response.data.data._id, imageFile);
        }
      }
      setForm(initialForm);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      fetchAssets();
    } catch (error) {
      console.error("Error saving asset:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete asset
  const deleteAsset = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        await itemsAPI.delete(id);
        fetchAssets();
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...form.specs];
    newSpecs[index][field] = value;
    setForm({ ...form, specs: newSpecs });
  };

  const handleAddSpec = () => {
    setForm({ ...form, specs: [...form.specs, { name: "", value: "" }] });
  };

  const handleRemoveSpec = (index) => {
    const newSpecs = [...form.specs];
    newSpecs.splice(index, 1);
    setForm({ ...form, specs: newSpecs });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-3 py-1 mr-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-500"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Asset Management</h2>
      </div>
      
      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search assets..."
          className="w-64 p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Asset
        </button>
      </div>
      
      {/* Asset Form (Conditionally Rendered) */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit Asset" : "Add New Asset"}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(initialForm);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left Column */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                  <input
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={(e) => setForm({...form, serialNumber: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="laptop">Laptop</option>
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="monitor">Monitor</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="available">Available</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input
                    name="purchaseDate"
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input
                    name="purchasePrice"
                    type="number"
                    value={form.purchasePrice}
                    onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-auto rounded-md"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            
            {/* Specs Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
              {form.specs.map((spec, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    placeholder="Spec name"
                    value={spec.name}
                    onChange={(e) => handleSpecChange(index, 'name', e.target.value)}
                    className="w-1/2 p-2 border border-gray-300 rounded-md mr-2"
                  />
                  <input
                    type="text"
                    placeholder="Spec value"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    className="w-1/2 p-2 border border-gray-300 rounded-md mr-2"
                  />
                  <button
                    onClick={() => handleRemoveSpec(index)}
                    className="text-red-600 hover:text-red-900"
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <button
                onClick={handleAddSpec}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                type="button"
              >
                Add Specification
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(initialForm);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-md ${
                  editingId ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    {editingId ? "Updating..." : "Adding..."}
                  </span>
                ) : editingId ? (
                  "Update Asset"
                ) : (
                  "Add Asset"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Assets List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">All Assets</h3>
          <span className="text-sm text-gray-500">
            {filteredAssets.length} {filteredAssets.length === 1 ? "item" : "items"}
          </span>
        </div>
        
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="mt-2 text-lg font-medium text-gray-900">No assets found</h4>
            <p className="mt-1 text-gray-500">Try adding a new asset or adjusting your search</p>
            <button
              onClick={handleAddNew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Asset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{asset.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{asset.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{asset.serialNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        asset.status === 'available' ? 'bg-green-100 text-green-800' :
                        asset.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-16">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAsset(asset._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditAsset;