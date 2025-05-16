import axios from "axios"

// Create axios instance with enhanced configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable credentials for cookies
  timeout: 15000, // 15 second timeout
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase() || "GET"} request to ${config.url}`)

    // Add auth token if exists
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add Content-Type for FormData requests
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"] // Let browser set the boundary
    }

    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Check if the response has success: false in the body
    if (response.data && response.data.success === false) {
      // Create an error object with the response data
      const error = new Error(response.data.error || "Request failed")
      error.response = response
      return Promise.reject(error)
    }
    // Return the entire response
    return response
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      console.error("API Error Response:", error.response.status, error.response.data)

      switch (error.response.status) {
        case 401:
          // Handle unauthorized (token expired)
          console.error("Unauthorized access")
          // Check if the error is due to an expired token
          if (error.response.data.error === "Token expired") {
            // Clear local storage
            localStorage.removeItem("token")
            localStorage.removeItem("user")

            // Redirect to login page
            window.location.href = "/login"
          }
          break
        case 403:
          // Handle forbidden (no permission)
          console.error("Forbidden access")
          break
        case 404:
          // Handle not found
          console.error("Resource not found")
          break
        case 500:
          // Handle server error
          console.error("Server error occurred")
          break
      }

      return Promise.reject(error)
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received", error.request)
      return Promise.reject({ error: "Network error. Please check your connection." })
    } else {
      // Something happened in setting up the request
      console.error("Request error", error.message)
      return Promise.reject({ error: error.message })
    }
  },
)

// Auth API calls
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials)
  return response.data
}

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData)
  return response.data
}

export const logout = async () => {
  const response = await api.get("/auth/logout")
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me")
  return response.data
}

export const updateUserDetails = async (userData) => {
  const response = await api.put("/auth/updatedetails", userData)
  return response.data
}

export const updatePassword = async (passwordData) => {
  const response = await api.put("/auth/updatepassword", passwordData)
  return response.data
}

// Asset API calls
export const getAssets = async () => {
  console.log("Fetching assets...")
  try {
    const response = await api.get("/items")
    console.log("Assets fetched successfully:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching assets:", error)
    throw error
  }
}

export const getAsset = async (id) => {
  const response = await api.get(`/items/${id}`)
  return response.data
}

export const createAsset = async (assetData) => {
  console.log("Creating asset with data:", assetData)
  try {
    const response = await api.post("/items", assetData)
    console.log("Asset created successfully:", response.data)
    return response.data
  } catch (error) {
    console.error("Error creating asset:", error.response?.data || error.message)
    throw error
  }
}

export const updateAsset = async (id, assetData) => {
  const response = await api.put(`/items/${id}`, assetData)
  return response.data
}

export const deleteAsset = async (id) => {
  const response = await api.delete(`/items/${id}`)
  return response.data
}

export const uploadAssetPhoto = async (id, photoFile) => {
  const formData = new FormData()
  formData.append("file", photoFile)

  const response = await api.put(`/items/${id}/photo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return response.data
}

// User API calls
export const getUsers = async () => {
  const response = await api.get("/users")
  return response.data
}

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData)
  return response.data
}

// Borrow request API calls
export const getBorrowRequests = async () => {
  const response = await api.get("/borrow")
  return response.data
}

export const createBorrowRequest = async (requestData) => {
  const response = await api.post("/borrow", requestData)
  return response.data
}

export const updateBorrowRequest = async (id, requestData) => {
  const response = await api.put(`/borrow/${id}`, requestData)
  return response.data
}

// API endpoints with enhanced error handling
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => api.get("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateDetails: (userData) => api.put("/auth/updatedetails", userData),
  updatePassword: (passwordData) => api.put("/auth/updatepassword", passwordData),
  forgotPassword: (email) => api.post("/auth/forgotpassword", { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
  verifyPassword: (password) => api.post("/auth/verify-password", { password }),
}

export const usersAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post("/users", userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get("/users/stats"),
  getByDepartment: (department) => api.get(`/users/department/${department}`),
}

export const itemsAPI = {
  getAll: (params) => api.get("/items", { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (itemData) => {
    console.log("Creating item with data:", itemData)
    return api.post("/items", itemData)
  },
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  delete: (id) => api.delete(`/items/${id}`),
  uploadPhoto: (id, photoData) => {
    console.log("Uploading photo for item:", id)
    const formData = new FormData()
    formData.append("file", photoData)
    return api.put(`/items/${id}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },
  getAvailable: (params) => api.get("/items/available", { params }),
  getStats: () => api.get("/items/stats"),
  getPhoto: (id) => `${API_URL}/items/${id}/photo`, // Now returns the URL directly
}

// Add retry logic for failed requests
const MAX_RETRIES = 2
const retryRequest = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    return retryRequest(fn, retries - 1)
  }
}

// Enhanced borrowAPI with retry logic
export const borrowAPI = {
  getAll: (params) => retryRequest(() => api.get("/borrow", { params })),
  getById: (id) => retryRequest(() => api.get(`/borrow/${id}`)),
  create: (borrowData) => api.post("/borrow", borrowData),
  update: (id, borrowData) => api.put(`/borrow/${id}`, borrowData),
  approve: (id) => api.put(`/borrow/${id}/approve`),
  reject: (id, data) => api.put(`/borrow/${id}/reject`, data),
  return: (id, returnData) => api.put(`/borrow/${id}/return`, returnData),
  cancel: (id) => api.put(`/borrow/${id}/cancel`),
  getMyActive: () => api.get("/borrow/me/active"),
  getMyHistory: () => api.get("/borrow/me/history"),
  getStats: () => api.get("/borrow/stats"),
  getRecentActivity: () => api.get("/borrow/recent-activity"),
  getMyRequests: () => api.get("/borrow/me/history"), // Alias for getMyHistory for clarity
}

// Add request cancellation support
const CancelToken = axios.CancelToken
export const createCancelToken = () => CancelToken.source()

// Notification API calls
export const getUserNotifications = async () => {
  const response = await api.get("/notifications") // This is correct if api.baseURL = .../api
  return response.data
}

export const markNotificationAsRead = (id) =>
  api.put(`/notifications/${id}/read`);

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`)
  return response.data
}

export default api
