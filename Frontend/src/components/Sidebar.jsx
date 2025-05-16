"use client"

import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { MdAssessment } from "react-icons/md" // Import the icon you want to use

// SVG icon components
const Home = (props) => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
)

const Building = (props) => (
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
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
)

const Users = (props) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const Package = (props) => (
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
    <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
  </svg>
)

const LogOut = (props) => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

const ClipboardList = (props) => (
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
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <path d="M12 11h4"></path>
    <path d="M12 16h4"></path>
    <path d="M8 11h.01"></path>
    <path d="M8 16h.01"></path>
  </svg>
)

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()

  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }

  // Modify the getNavItems function to ensure Assets link is always included for authenticated users
  const getNavItems = () => {
    const items = [{ name: "Home", path: "/", icon: Home, public: true }]

    if (isAuthenticated) {
      items.push({ name: "Dashboard", path: "/dashboard", icon: Building })

      // Always include Assets for all authenticated users
      items.push({
        name: "Assets",
        path: "/assets",
        icon: Package,
      })

      // Add My Requests for all users
      items.push({
        name: "Requests",
        path: "/requests",
        icon: ClipboardList,
      })

      // Admin and manager can see employees
      if (user.role === "admin" || user.role === "manager") {
        items.push({
          name: "Employees",
          path: "/employees",
          icon: Users,
        })
      }

      // Add Report item
      items.push({
        name: "Report",
        path: "/report",
        icon: MdAssessment, // Use the imported icon
        allowedRoles: ["admin"], // Only admin can see
      })
    } 

    return items
  }

  const navItems = getNavItems()

  // If not authenticated, show a minimal sidebar
  if (!isAuthenticated) {
    return (
      <aside className="hidden lg:flex flex-col w-64 bg-gray-800 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Borrowing System</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems
              .filter((item) => item.public)
              .map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                      isActive(item.path)
                        ? "bg-gray-700 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </aside>
    )
  }

  // Hamburger for mobile
  const Hamburger = () => (
    <button
      className="lg:hidden p-4"
      onClick={() => setOpen(true)}
      aria-label="Open sidebar"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>
  )

  // Sidebar content as a component
  const SidebarContent = () => (
    <div className="flex flex-col w-64 bg-gray-800 text-white h-full">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold">Borrowing System</h1>
        {/* Close button for mobile */}
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
      </div>
      {user && isAuthenticated && (
        <div className="mt-2 text-sm text-gray-400 px-4">
          Role: <span className="capitalize">{user.role}</span>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems
            .filter(
              (item) =>
                !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
            )
            .map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  )

  return (
    <>
      {/* Hamburger menu for mobile */}
      <Hamburger />

      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-800 text-white">
        <SidebarContent />
      </aside>

      {/* Sidebar drawer for mobile */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black opacity-40" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <aside className="relative z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
