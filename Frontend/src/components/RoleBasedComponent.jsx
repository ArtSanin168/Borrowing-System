"use client"

import { useAuth } from "../context/AuthContext"

const RoleBasedComponent = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  anyPermission = null,
  fallback = null,
}) => {
  const { hasRole, hasPermission } = useAuth()

  // Check if user has the required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback
  }

  // Check if user has the required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback
  }

  // Check if user has any of the specified permissions
  if (anyPermission && Array.isArray(anyPermission)) {
    const hasAnyPermission = anyPermission.some((permission) => hasPermission(permission))
    if (!hasAnyPermission) {
      return fallback
    }
  }

  // If all checks pass, render the children
  return children
}

export default RoleBasedComponent
