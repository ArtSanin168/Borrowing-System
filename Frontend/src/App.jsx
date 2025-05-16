import { Suspense, useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"
import Footer from "./components/Footer"
import LoadingSpinner from "./components/LoadingSpinner"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Pages
import Home from "./pages/Public/Home"
import Login from "./pages/Public/Login"
import Register from "./pages/Public/Register"
import Dashboard from "./pages/Dashboard"
import Employees from "./pages/Employees"
import Assets from "./pages/Assets"
import AssetDetails from "./pages/AssetDetails"
import NewAsset from "./pages/NewAsset"
import Requests from "./pages/Requests"
import RequestDetails from "./pages/RequestDetails"
import Unauthorized from "./pages/Public/Unauthorized"
// Add the import for Profile
import Profile from "./pages/Profile"

// Add the import statements for the new pages with correct capitalization
import ForgotPassword from "./pages/Public/ForgotPassword"
import ResetPassword from "./pages/Public/ResetPassword"
// Import the EditAsset component
import EditAsset from "./pages/EditAsset"
// Import the Notifications component
import Notifications from "./pages/Notifications"
// Import the Report component
import Report from "./pages/Report"

export default function App() {
  const [unreadCount, setUnreadCount] = useState(0)

  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar notifCount={unreadCount} />
            <main className="flex-1 overflow-y-auto p-4">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:resettoken" element={<ResetPassword />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/employees"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Employees />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets"
                    element={
                      <ProtectedRoute>
                        <Assets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets/new"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <NewAsset />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets/:id"
                    element={
                      <ProtectedRoute>
                        <AssetDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assets/edit"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <EditAsset />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/requests"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Requests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/requests/:id"
                    element={
                      <ProtectedRoute>
                        <RequestDetails />
                      </ProtectedRoute>
                    }
                  />
                  {/* Profile and Notifications routes remain */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications onUnreadCountChange={setUnreadCount} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "manager"]}>
                        <Report />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </div>
        <ToastContainer />
      </Router>
    </AuthProvider>
  )
}

// After successful logout:
// toast.info("Logged out successfully!");
