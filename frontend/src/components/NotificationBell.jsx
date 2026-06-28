import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useWS } from '../context/WSContext';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const { lastMessage } = useWS();
    const ref = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        api.get('/notifications/').then(res => setNotifications(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'notification') {
            setNotifications(prev => [{ ...lastMessage.data, is_read: false }, ...prev]);
        }
    }, [lastMessage]);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`).catch(() => {});
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all').catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const typeIcon = (type) => {
        if (type === 'new_message') return '💬';
        if (type === 'status_change') return '📋';
        if (type === 'new_application') return '📥';
        return '🔔';
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-cyan-400"
                style={{ background: open ? 'rgba(6,182,212,0.08)' : 'transparent' }}
            >
                <Bell className="w-5 h-5" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-1 right-1 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 rounded-xl z-50 overflow-hidden"
                        style={{
                            background: 'rgba(5,8,22,0.96)',
                            border: '1px solid rgba(6,182,212,0.18)',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 0 30px rgba(6,182,212,0.08), 0 20px 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid rgba(6,182,212,0.12)', background: 'rgba(6,182,212,0.05)' }}>
                            <div className="flex items-center gap-2">
                                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-semibold text-sm text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors font-medium">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto chat-scroll">
                            {notifications.length === 0 && (
                                <p className="text-slate-600 text-sm text-center py-10">No notifications yet</p>
                            )}
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => markRead(n.id)}
                                    className="flex gap-3 px-4 py-3 cursor-pointer transition-all duration-200"
                                    style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: !n.is_read ? 'rgba(6,182,212,0.04)' : 'transparent'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.07)'}
                                    onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? 'rgba(6,182,212,0.04)' : 'transparent'}
                                >
                                    <span className="text-base mt-0.5 flex-shrink-0">{typeIcon(n.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-semibold text-slate-200' : 'text-slate-500'}`}>
                                            {n.content}
                                        </p>
                                        <p className="text-[10px] text-slate-700 mt-1">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 animate-glow-pulse"
                                            style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(6,182,212,0.8)' }} />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
