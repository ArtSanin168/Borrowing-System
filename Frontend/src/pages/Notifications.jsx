import { useEffect, useState } from "react";
    import { useNavigate } from "react-router-dom";
    import {
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification
    } from "../services/api";

    export default function Notifications({ onUnreadCountChange }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
        const res = await getUserNotifications();
        setNotifications(res.data || []);
        updateUnreadCount(res.data || []);
        } catch (err) {
        console.error("Failed to fetch notifications:", err);
        }
        setLoading(false);
    };

    const updateUnreadCount = (notifications) => {
        if (onUnreadCountChange) {
        const unreadCount = notifications.filter(n => !n.read).length;
        onUnreadCountChange(unreadCount);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
        await markNotificationAsRead(id);
        setNotifications(prev => {
            const updated = prev.map(n =>
            n._id === id ? { ...n, read: true } : n
            );
            updateUnreadCount(updated);
            return updated;
        });
        } catch (err) {
        console.error("Failed to mark as read:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
        await deleteNotification(id);
        setNotifications(prev => {
            const updated = prev.filter(n => n._id !== id);
            updateUnreadCount(updated);
            return updated;
        });
        } catch (err) {
        console.error("Failed to delete notification:", err);
        }
    };

    const handleViewDetail = (notification) => {
        if (!notification.read) {
        handleMarkAsRead(notification._id);
        }
        navigate(`/requests/${notification.relatedTo}`);
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        
        switch (status?.toLowerCase()) {
        case "pending":
            return (
            <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                Pending
            </span>
            );
        case "approved":
            return (
            <span className={`${baseClasses} bg-green-100 text-green-800`}>
                Approved
            </span>
            );
        case "rejected":
            return (
            <span className={`${baseClasses} bg-red-100 text-red-800`}>
                Rejected
            </span>
            );
        case "error":
            return (
            <span className={`${baseClasses} bg-red-100 text-red-800`}>
                Error
            </span>
            );
        default:
            return (
            <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                {status || "Unknown"}
            </span>
            );
        }
    };

    const formatTimestamp = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
        });
    };

    const NotificationItem = ({ notification }) => {
        // Determine color based on status
        let borderColor = "border-l-4 border-transparent";
        let statusTextClass = "";
        if (notification.status?.toLowerCase() === "approved") {
            borderColor = "border-l-4 border-green-500";
            statusTextClass = "text-green-600 font-semibold";
        } else if (notification.status?.toLowerCase() === "rejected") {
            borderColor = "border-l-4 border-red-500";
            statusTextClass = "text-red-600 font-semibold";
        } else if (!notification.read) {
            borderColor = "border-l-4 border-blue-500";
        }

        // Highlight status word in message
        let message = notification.message;
        if (notification.status) {
            const status = notification.status.toLowerCase();
            const regex = new RegExp(`\\b(${status})\\b`, "i");
            message = message.replace(
                regex,
                `<span class="${statusTextClass}">$1</span>`
            );
        }

        return (
            <div
                className={`relative p-4 border rounded-lg mb-3 bg-white ${borderColor} ${!notification.read && notification.status !== "approved" && notification.status !== "rejected" ? "bg-blue-50" : ""}`}
            >
                {!notification.read && !["approved", "rejected"].includes(notification.status?.toLowerCase()) && (
                    <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="pl-4">
                    <div className="flex items-center gap-2 mb-1">
                        {notification.status && getStatusBadge(notification.status)}
                        <h3
                            className="font-medium text-gray-900"
                            dangerouslySetInnerHTML={{ __html: message }}
                        />
                    </div>
                    {notification.details && (
                        <p className="text-sm text-gray-600 mb-2">
                            {notification.details}
                        </p>
                    )}
                    {notification.error && (
                        <p className="text-xs text-red-600 mb-2">
                            Error: {notification.error}
                        </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4">
                            {notification.relatedTo && (
                                <button
                                    onClick={() => handleViewDetail(notification)}
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    View Detail
                                </button>
                            )}
                            <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.createdAt)}
                            </span>
                        </div>
                        <div className="flex space-x-3">
                            {!notification.read && (
                                <button
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Mark as read
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(notification._id)}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">NOTIFICATIONS</h1>
            <button 
            onClick={fetchNotifications}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
            </button>
        </div>

        {notifications.length === 0 ? (
            <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You'll see notifications here when you have them</p>
            </div>
        ) : (
            <div className="space-y-2">
            {notifications.map((notification) => (
                <NotificationItem key={notification._id} notification={notification} />
            ))}
            </div>
        )}
        </div>
    );
    }