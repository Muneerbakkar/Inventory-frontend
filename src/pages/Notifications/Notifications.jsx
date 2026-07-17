import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Eye, Clock, ShieldAlert, Trash2, Calendar, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // Filter to only show unread notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('notifications-updated', fetchNotifications);
    return () => {
      window.removeEventListener('notifications-updated', fetchNotifications);
    };
  }, [startDate, endDate, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        page,
        limit: 10
      });
      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNotifications(data.data.notifications);
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination({ page: 1, pages: 1, total: 0 });
        }
        // Clear selection when list updates
        setSelectedIds([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        toast.success("Notification marked as read");
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = unreadNotifications;
    if (unread.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await Promise.all(
        unread.map(n =>
          fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/notifications/${n._id}/read`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setSelectedIds([]);
      toast.success("All notifications marked as read");
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteSingle = async (id) => {
    toast((t) => (
      <div className="flex w-full flex-col gap-3 text-left">
        <p className="text-base font-semibold">Delete this notification?</p>
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = localStorage.getItem('token');
                await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/notifications/${id}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                setNotifications(prev => prev.filter(n => n._id !== id));
                setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
                toast.success("Notification deleted");
                window.dispatchEvent(new Event('notifications-updated'));
              } catch (err) {
                console.error(err);
                toast.error("Failed to delete notification");
              }
            }}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 rounded border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: "top-center" });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    toast((t) => (
      <div className="flex w-full flex-col gap-3 text-left">
        <p className="text-base font-semibold">Delete {selectedIds.length} notifications?</p>
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = localStorage.getItem('token');
                await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/notifications/bulk-delete`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ ids: selectedIds })
                });
                setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
                setSelectedIds([]);
                toast.success("Selected notifications deleted");
                window.dispatchEvent(new Event('notifications-updated'));
              } catch (err) {
                console.error(err);
                toast.error("Failed to delete selected notifications");
              }
            }}
            className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 rounded border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: "top-center" });
  };

  const handleSelectToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button onClick={handleDeleteSelected} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.length})
            </Button>
          )}
          {unreadNotifications.length > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Date Filters block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 rounded-md bg-card p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-auto">
            <input 
              type="date" 
              ref={startDateRef}
              className="rounded-md border border-input bg-background pl-3 pr-9 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Calendar 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => startDateRef.current?.showPicker()}
            />
          </div>
          <span className="text-muted-foreground text-sm">to</span>
          <div className="relative flex items-center w-full sm:w-auto">
            <input 
              type="date" 
              ref={endDateRef}
              className="rounded-md border border-input bg-background pl-3 pr-9 py-1.5 text-sm w-full sm:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Calendar 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={() => endDateRef.current?.showPicker()}
            />
          </div>
          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm divide-y">
        {notifications.length > 0 && (
          <div className="p-4 flex items-center gap-3 bg-muted/40 font-medium text-sm">
            <input 
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              checked={notifications.length > 0 && selectedIds.length === notifications.length}
              onChange={handleSelectAllToggle}
            />
            <span>Select All ({selectedIds.length} of {notifications.length} selected)</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No notifications found</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                notif.isRead ? 'bg-background/50 text-muted-foreground' : 'bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={selectedIds.includes(notif._id)}
                  onChange={() => handleSelectToggle(notif._id)}
                />
                <div className={`mt-0.5 rounded-full p-2 ${
                  notif.type === 'LowStock' ? 'bg-amber-100 text-amber-800' :
                  notif.type === 'OverduePayment' ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {notif.type === 'LowStock' ? <AlertTriangle className="h-4 w-4" /> :
                   notif.type === 'OverduePayment' ? <CreditCard className="h-4 w-4" /> :
                   <Bell className="h-4 w-4" />}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {notif.type === 'LowStock' ? 'Low Stock Warning' : notif.type === 'OverduePayment' ? 'Overdue Payment' : notif.type}
                  </p>
                  <p className="text-sm">{notif.message}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(notif.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!notif.isRead && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleMarkAsRead(notif._id)} title="Mark as read">
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSingle(notif._id)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && pagination.pages > 1 && !loading && (
        <div className="flex items-center justify-end space-x-2 mt-4 print:hidden">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages}>Next</Button>
        </div>
      )}
    </div>
  );
};
