import { useEffect, useState, useRef } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { NotificationItem } from '../../types';
import { formatDateTime } from '../../utils/format';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.list();
      setNotifications(res.data);
      setUnreadCount(res.meta.unreadCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute -right-12 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-scale-in">
          <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 hover:bg-slate-50 transition text-xs ${
                    !n.readAt ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <p className="text-slate-800 font-medium leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
