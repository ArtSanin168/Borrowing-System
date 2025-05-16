"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { authAPI } from "../services/api"

const AuthContext = createContext()

// Update the PERMISSIONS object to include view_own_requests permission for users
// Define role-based permissions
const PERMISSIONS = {
  admin: [
    "create_asset",
    "edit_asset",
    "delete_asset",
    "approve_request",
    "reject_request",
    "manage_users",
    "generate_reports",
    "configure_settings",
    "view_all_requests",
  ],
  manager: ["create_asset", "edit_asset", "approve_request", "reject_request", "view_all_requests", "generate_reports"],
  user: [
    "browse_assets",
    "submit_request",
    "view_personal_history",
    "return_item",
    "report_damage",
    "view_own_requests",
  ],
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const storedUser = JSON.parse(localStorage.getItem("user"))
          if (storedUser) {
            setUser(storedUser)
          } else {
            // If no user in localStorage, fetch from API
            const res = await authAPI.getMe()
            setUser(res.data.data)
            localStorage.setItem("user", JSON.stringify(res.data.data))
          }
        } catch (err) {
          console.error("Error loading user:", err)
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [token])

  // Register user
  const register = async (userData) => {
    setLoading(true)
    setError(null)
    try {
      console.log("Sending registration request with:", userData.email) // Debug log
      const res = await authAPI.register(userData)
      console.log("Registration response:", res.data) // Debug log

      if (res.data && res.data.success) {
        setToken(res.data.token)
        setUser(res.data.user)
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        setLoading(false)
        return res.data
      } else {
        throw new Error(res.data?.error || "Registration failed")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.response?.data?.error || err.message || "Registration failed")
      setLoading(false)
      throw err
    }
  }

  // Login user
  const login = async (credentials) => {
    setLoading(true)
    setError(null)
    try {
      console.log("Sending login request with:", credentials.email) // Debug log
      const res = await authAPI.login(credentials)
      console.log("Login response:", res.data) // Debug log

      // Check if the response has the expected structure
      if (res.data && res.data.success) {
        // Extract token and user from the response
        const { token, user } = res.data

        // Store in state
        setToken(token)
        setUser(user)

        // Store in localStorage
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(user))

        setLoading(false)
        return res.data
      } else {
        throw new Error(res.data?.error || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err.response?.data?.error || err.message || "Login failed. Please check your credentials.")
      setLoading(false)
      throw err
    }
  }

  // Logout user
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setToken(null)
      setUser(null)
    }
  }

  // Update user details
  const updateUserDetails = async (userData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authAPI.updateDetails(userData)
      setUser(res.data.data)
      localStorage.setItem("user", JSON.stringify(res.data.data))
      setLoading(false)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Update failed")
      setLoading(false)
      throw err
    }
  }

  // Update password
  const updatePassword = async (passwordData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authAPI.updatePassword(passwordData)
      setLoading(false)
      return res.data
    } catch (err) {
      setError(err.response?.data?.error || "Password update failed")
      setLoading(false)
      throw err
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user

  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!user) return false
    if (typeof roles === "string") return user.role === roles
    return roles.includes(user.role)
  }

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!user || !user.role) return false
    return PERMISSIONS[user.role]?.includes(permission) || false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        register,
        login,
        logout,
        updateUserDetails,
        updatePassword,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
