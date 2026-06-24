import { useEffect, useRef } from "react";
import { 
  FiPackage, FiUser, FiBox, FiDollarSign, 
  FiInfo, FiCheck, FiTrash2 
} from "react-icons/fi";
import useNotificationStore from "../../store/notificationStore";

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'order': return <div className="nc-icon order"><FiPackage /></div>;
    case 'customer': return <div className="nc-icon customer"><FiUser /></div>;
    case 'product': return <div className="nc-icon product"><FiBox /></div>;
    case 'inventory': return <div className="nc-icon inventory"><FiInfo /></div>;
    case 'payment': return <div className="nc-icon payment"><FiDollarSign /></div>;
    default: return <div className="nc-icon system"><FiInfo /></div>;
  }
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  return `${diffInDays}d ago`;
};

export default function NotificationCenter({ onClose }) {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotificationStore();

  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="notification-center-dropdown" ref={ref}>
      <div className="nc-header">
        <h3>Notifications</h3>
        <div className="nc-actions">
          <button onClick={markAllAsRead}>Mark all read</button>
          <button onClick={clearAll}>Clear all</button>
        </div>
      </div>

      <div className="nc-list">
        {notifications.length === 0 ? (
          <div className="nc-empty">
            <FiInfo size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
            <br />
            No notifications right now.
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif._id} className={`nc-item ${!notif.read ? 'unread' : ''}`}>
              <NotificationIcon type={notif.type} />
              
              <div className="nc-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <div className="nc-meta">
                  <span>{formatTimeAgo(notif.createdAt)}</span>
                  
                  <div className="nc-item-actions">
                    {!notif.read && (
                      <button title="Mark as read" onClick={() => markAsRead(notif._id)}>
                        <FiCheck />
                      </button>
                    )}
                    <button className="delete-btn" title="Delete" onClick={() => deleteNotification(notif._id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}