import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Plus, Users, MapPin, Trash2, AlertCircle, Building2,
    MessageSquare, Send, X, User
} from 'lucide-react';
import { useWS } from '../context/WSContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RecruiterDashboard = () => {
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState('');

    // Messages state
    const [conversations, setConversations] = useState([]);
    const [convLoading, setConvLoading] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatError, setChatError] = useState('');

    const { sendMessage: wsSend, lastMessage } = useWS();

    useEffect(() => {
        api.get('/jobs/my-jobs')
            .then(res => setJobs(res.data))
            .catch(() => setError('Failed to load your jobs.'));
    }, []);

    useEffect(() => {
        if (activeTab === 'messages') {
            setConvLoading(true);
            api.get('/messages/conversations/list')
                .then(res => setConversations(res.data))
                .catch(() => {})
                .finally(() => setConvLoading(false));
        }
    }, [activeTab]);

    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'message') return;
        const msg = lastMessage.data;
        if (activeChat && (msg.sender_id === activeChat.user_id || msg.receiver_id === activeChat.user_id)) {
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
    }, [lastMessage, activeChat]);

    const handleDelete = async (jobId) => {
        if (!window.confirm('Delete this job and all its applications?')) return;
        try {
            await api.delete(`/jobs/${jobId}`);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete job.');
        }
    };

    const openChat = async (conv) => {
        setChatError('');
        setActiveChat(conv);
        try {
            const res = await api.get(`/messages/${conv.user_id}`);
            setMessages(res.data);
        } catch { setChatError('Failed to load messages.'); }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        wsSend({ type: 'message', data: { receiver_id: activeChat.user_id, content: newMessage } });
        setNewMessage('');
    };

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        return `${API_URL}/static/avatars/${avatarPath.split(/[\\/]/).pop()}`;
    };

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
    };

    const tabs = [
        { id: 'jobs', label: 'My Jobs' },
        { id: 'messages', label: 'Messages' },
    ];

    return (
        <div className="min-h-screen grid-bg py-12 px-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-0 right-0 w-80 h-80 orb-cyan animate-glow-pulse pointer-events-none" style={{ opacity: 0.5 }} />
            <div className="absolute bottom-0 left-0 w-96 h-96 orb-violet animate-orb-2 pointer-events-none" style={{ opacity: 0.4 }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="flex justify-between items-center mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Recruiter <span className="gradient-text">Portal</span>
                        </h1>
                        <p className="text-slate-500 text-sm">Manage your listings and communicate with candidates.</p>
                    </div>
                    <Link
                        to="/post-job"
                        className="btn-primary btn-shimmer flex items-center gap-2 px-5 py-2.5 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Post New Job
                    </Link>
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="recruiter-tab"
                                    className="absolute inset-0 rounded-lg"
                                    style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.28)' }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                {tab.id === 'messages' && <MessageSquare className="w-3.5 h-3.5" />}
                                {tab.label}
                                {tab.id === 'messages' && conversations.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                                        style={{ background: 'rgba(6,182,212,0.25)', color: '#22d3ee' }}>
                                        {conversations.length}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── JOBS TAB ── */}
                    {activeTab === 'jobs' && (
                        <motion.div key="jobs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            {/* Stats bar */}
                            {jobs.length > 0 && (
                                <div className="glass rounded-xl p-5 mb-6 flex items-center gap-6">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                                            <Briefcase className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-white">{jobs.length}</div>
                                            <div className="text-slate-500 text-xs">Active Listings</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {jobs.length === 0 ? (
                                <div className="text-center py-24 glass rounded-2xl">
                                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                                        style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)' }}>
                                        <Briefcase className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No Active Jobs</h3>
                                    <p className="text-slate-600 mb-6 text-sm">You haven't posted any positions yet.</p>
                                    <Link to="/post-job" className="btn-primary btn-shimmer px-5 py-2.5 text-sm inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Post Your First Job
                                    </Link>
                                </div>
                            ) : (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4">
                                    {jobs.map(job => (
                                        <motion.div
                                            key={job.id}
                                            variants={itemVariants}
                                            className="glass glass-hover rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                                                    <Briefcase className="w-5 h-5 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <Link to={`/applications/${job.id}`}
                                                        className="text-lg font-bold text-white hover:text-cyan-400 transition-colors duration-200">
                                                        {job.title}
                                                    </Link>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-0.5">
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5 text-slate-600" /> {job.company}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-slate-600" /> {job.location}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 items-center flex-shrink-0">
                                                <Link
                                                    to={`/applications/${job.id}`}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                                                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}
                                                >
                                                    <Users className="w-4 h-4" /> View Applicants
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    className="btn-danger flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ── MESSAGES TAB ── */}
                    {activeTab === 'messages' && (
                        <motion.div key="messages" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            {convLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-24 glass rounded-2xl">
                                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500 text-sm">No conversations yet.</p>
                                    <p className="text-slate-700 text-xs mt-1">Messages from applicants will appear here.</p>
                                </div>
                            ) : (
                                <div className="glass rounded-xl overflow-hidden">
                                    {conversations.map((conv, i) => (
                                        <motion.button
                                            key={conv.user_id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => openChat(conv)}
                                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-200 hover:bg-cyan-500/5"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                                                {conv.avatar_url
                                                    ? <img src={getAvatarUrl(conv.avatar_url)} alt="" className="w-full h-full object-cover" />
                                                    : <User className="w-5 h-5 text-cyan-400/60" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate">
                                                    {conv.full_name || conv.email}
                                                </p>
                                                <p className="text-xs text-slate-600 truncate mt-0.5">{conv.latest_message}</p>
                                            </div>
                                            <MessageSquare className="w-4 h-4 text-cyan-500/40 flex-shrink-0" />
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── CHAT MODAL ── */}
            <AnimatePresence>
                {activeChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.25 }}
                        className="fixed bottom-4 right-4 w-96 rounded-2xl z-50 flex flex-col overflow-hidden"
                        style={{ height: '500px', background: 'rgba(5,8,22,0.95)', border: '1px solid rgba(6,182,212,0.2)', backdropFilter: 'blur(24px)', boxShadow: '0 0 40px rgba(6,182,212,0.1), 0 25px 60px rgba(0,0,0,0.5)' }}
                    >
                        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.06)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                                    <User className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <span className="font-semibold text-sm text-white">{activeChat.full_name || activeChat.email}</span>
                            </div>
                            <button onClick={() => setActiveChat(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {chatError && (
                            <div className="px-3 py-2 text-rose-400 text-xs flex items-center gap-1"
                                style={{ borderBottom: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.06)' }}>
                                <AlertCircle className="w-3 h-3" /> {chatError}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scroll" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            {messages.length === 0 && (
                                <p className="text-center text-xs text-slate-600 mt-8">Start the conversation...</p>
                            )}
                            {messages.map(msg => {
                                const isMe = msg.sender_id !== activeChat.user_id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed"
                                            style={isMe
                                                ? { background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.3)', color: '#e2e8f0', borderBottomRightRadius: '4px' }
                                                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderBottomLeftRadius: '4px' }
                                            }
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={sendMessage} className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <input
                                className="flex-1 neon-input text-sm py-2"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RecruiterDashboard;
