'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Circle, MessageCircle, Heart, Star, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, deleteDoc, where } from 'firebase/firestore';
import { AppNotification, NotificationType } from '@/lib/notification-service';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      let unread = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const notif = {
          id: doc.id,
          ...data,
          // Handle Firestore Timestamp
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        } as AppNotification;

        notifs.push(notif);
        if (!notif.isRead) unread++;
      });

      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        if (!notif.isRead) {
          const ref = doc(db, 'users', user.uid, 'notifications', notif.id);
          batch.update(ref, { isRead: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'welcome': return <Star className="h-4 w-4 text-amber-400" />;
      case 'purchase_success': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'rank_up': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'reminder': return <MessageCircle className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-4 right-4 top-[4.5rem] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-card border border-border rounded-xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-muted/50 transition-colors relative group ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-border/50`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteNotification(e, notif.id)}
                      className="absolute -top-1 right-2 p-1.5 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {!notif.isRead && (
                      <div className="absolute top-4 right-2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-border bg-muted/30 text-center">
            <Link
              href="/settings?tab=preferences"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Manage notification preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
