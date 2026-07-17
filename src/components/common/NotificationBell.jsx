import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { cn } from '../../utils/cn';
import { logout } from '../../features/auth/authSlice';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('notifications-updated', fetchNotifications);
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => {
      window.removeEventListener('notifications-updated', fetchNotifications);
      clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      if (res.status === 401) {
        dispatch(logout());
        return;
      }
      const data = await res.json();
      if (data.status === 'success') {
        setNotifications(data.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-[72px] inset-x-4 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 rounded-md border bg-card shadow-lg z-[100] overflow-hidden">
          <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Unread Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No unread notifications</div>
            ) : (
              unreadNotifications.map(notif => (
                <div 
                  key={notif._id} 
                  className="p-3 border-b text-sm bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => {
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  <p className="font-medium text-foreground mb-1">
                    {notif.type === 'LowStock' ? 'Low Stock Warning' : notif.type === 'OverduePayment' ? 'Overdue Payment' : notif.type}
                  </p>
                  <p className="text-xs">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
