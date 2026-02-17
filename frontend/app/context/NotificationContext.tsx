'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSocketContext } from './SocketContext';
import { toast } from 'react-toastify';

export interface Notification {
    id: string;
    type: 'message' | 'friend_request' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    data?: any;
}

export interface NotificationPreferences {
    messages: boolean;
    friendRequests: boolean;
    security: boolean;
    browserNotifications: boolean;
    soundNotifications: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences;
    addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
    requestBrowserPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: NotificationPreferences = {
    messages: true,
    friendRequests: true,
    security: true,
    browserNotifications: false,
    soundNotifications: true,
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const { socket, isConnected } = useSocketContext();

    // Load preferences from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('notificationPreferences');
        if (saved) {
            try {
                setPreferences(JSON.parse(saved));
            } catch (error) {
                console.error('Failed to parse notification preferences:', error);
            }
        }
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((title: string, message: string) => {
        if (!preferences.browserNotifications || Notification.permission !== 'granted') {
            return;
        }

        try {
            new Notification(title, {
                body: message,
                icon: '/logo.png',
                badge: '/logo.png',
            });
        } catch (error) {
            console.error('Failed to show browser notification:', error);
        }
    }, [preferences.browserNotifications]);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (!preferences.soundNotifications) return;

        try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Could not play sound:', err));
        } catch (error) {
            console.log('Notification sound not available');
        }
    }, [preferences.soundNotifications]);

    // Add notification
    const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
        const newNotification: Notification = {
            ...notif,
            id: `${Date.now()}-${Math.random()}`,
            read: false,
            createdAt: new Date(),
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Show toast notification
        const shouldShowToast =
            (notif.type === 'message' && preferences.messages) ||
            (notif.type === 'friend_request' && preferences.friendRequests) ||
            (notif.type === 'system' && preferences.security);

        if (shouldShowToast) {
            toast.info(`${notif.title}: ${notif.message}`, {
                position: 'top-right',
                autoClose: 4000,
            });

            playNotificationSound();
            showBrowserNotification(notif.title, notif.message);
        }
    }, [preferences, playNotificationSound, showBrowserNotification]);

    // Listen to socket events
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewMessage = (data: any) => {
            if (preferences.messages) {
                addNotification({
                    type: 'message',
                    title: 'New Message',
                    message: `${data.senderName}: ${data.message}`,
                    data,
                });
            }
        };

        const handleFriendRequest = (data: any) => {
            if (preferences.friendRequests) {
                addNotification({
                    type: 'friend_request',
                    title: 'Friend Request',
                    message: `${data.senderName} sent you a friend request`,
                    data,
                });
            }
        };

        socket.on('notification:message', handleNewMessage);
        socket.on('notification:friendRequest', handleFriendRequest);

        return () => {
            socket.off('notification:message', handleNewMessage);
            socket.off('notification:friendRequest', handleFriendRequest);
        };
    }, [socket, isConnected, preferences, addNotification]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
        setPreferences(prev => {
            const updated = { ...prev, ...prefs };
            localStorage.setItem('notificationPreferences', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            toast.error('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            toast.error('Notification permission was denied. Please enable it in your browser settings.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                toast.success('Browser notifications enabled!');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        updatePreferences,
        requestBrowserPermission,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
