"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getUserNotifications } from "../services/api" // Add this import

// SVG icon components (optimized with better props handling)
const Icon = ({ children, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
)

const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
)

const MenuIcon = () => (
  <Icon>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </Icon>
)

const UserIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)

const LogOutIcon = () => (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
)

const BellIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("") // <-- Add this
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate() // <-- Add this
  const location = useLocation() // Add this
  const [notifCount, setNotifCount] = useState(0)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isUserMenuOpen) setIsUserMenuOpen(false)
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isUserMenuOpen])

  useEffect(() => {
    if (isAuthenticated) {
      getUserNotifications().then(res => {
        const unread = (res.data || []).filter(n => !n.read).length
        setNotifCount(unread)
      })
    }
  }, [isAuthenticated, location]) // Add location here

  const handleLogout = () => {
    if (window.confirm("Do you want to log out?")) {
      logout()
      setIsUserMenuOpen(false)
    }
  }

  // Handle search submit
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-3 shadow-sm w-full">
      <div className="flex items-center justify-between w-full">
        {/* Left section - Logo only, removed menu icon */}
        <div className="flex items-center space-x-4">
          {/* You can put your logo here if needed */}
        </div>

        {/* Center section - Search (desktop) */}
        <div className={`items-center ${isSearchOpen ? "absolute inset-x-0 px-6 z-50" : "hidden lg:flex"} mx-4`}>
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200"
              placeholder="Search assets, users..."
              onBlur={() => isSearchOpen && setIsSearchOpen(false)}
            />
          </div>
        </div>

        {/* Right section - Navigation items */}
        <div className="flex items-center space-x-3">
          {/* Notification Icon */}
          {isAuthenticated && (
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-50">
              <BellIcon className="w-6 h-6 text-gray-600" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {notifCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile search toggle */}
          <button
            className="p-2 rounded-lg hover:bg-gray-50 lg:hidden"
            onClick={(e) => {
              e.stopPropagation()
              setIsSearchOpen(!isSearchOpen)
            }}
          >
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </button>

          {isAuthenticated ? (
            <>
              {/* User dropdown */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 group"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsUserMenuOpen(!isUserMenuOpen)
                  }}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 flex items-center justify-center border border-blue-50">
                    {user?.avatar ? (
                      <img
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {user?.name || "User"}
                  </span>
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg z-50 border border-gray-100 overflow-hidden">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors border-t border-gray-100"
                      >
                        <div className="flex items-center">
                          <LogOutIcon className="w-4 h-4 mr-2" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
