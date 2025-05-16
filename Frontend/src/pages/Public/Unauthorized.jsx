import { Link } from "react-router-dom"

export default function Unauthorized() {
  return (
    <div className="max-w-7xl mx-auto text-center py-12">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-xl text-gray-600 mb-6">You do not have permission to access this page.</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link to="/" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
