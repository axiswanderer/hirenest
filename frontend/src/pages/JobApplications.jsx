import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Download, Eye, User, MessageSquare, Send, X, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useWS } from '../context/WSContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const statusClass = (s) => {
    if (s === 'Accepted') return 'badge-accepted';
    if (s === 'Rejected') return 'badge-rejected';
    if (s === 'Interviewing') return 'badge-interviewing';
    return 'badge-pending';
};

const JobApplications = () => {
    const { jobId } = useParams();
    const [applications, setApplications] = useState([]);
    const [statusError, setStatusError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [screeningResults, setScreeningResults] = useState({});
    const [screeningLoading, setScreeningLoading] = useState(new Set());
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatError, setChatError] = useState('');

    const { sendMessage: wsSend, lastMessage } = useWS();

    useEffect(() => { fetchApplications(); }, [jobId]);

    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'message') return;
        const msg = lastMessage.data;
        if (activeChat && (msg.sender_id === activeChat.id || msg.receiver_id === activeChat.id)) {
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        }
    }, [lastMessage, activeChat]);

    const fetchApplications = () => {
        api.get(`/applications/${jobId}`)
            .then(res => setApplications(res.data))
            .catch(() => setStatusError('Failed to load applications.'));
    };

    const handleStatusChange = async (appId, newStatus) => {
        setStatusError('');
        try {
            await api.put(`/applications/${appId}/status`, { status: newStatus });
            fetchApplications();
        } catch (err) {
            setStatusError(err.response?.data?.detail || 'Failed to update status.');
        }
    };

    const openPreview = async (filename) => {
        if (!filename) return;
        setPreviewLoading(true);
        try {
            const res = await api.get(`/files/resume/${filename}`, { responseType: 'blob' });
            setPreviewUrl(URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
        } catch { setStatusError('Failed to load resume preview.'); }
        finally { setPreviewLoading(false); }
    };

    const closePreview = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); };

    const downloadResume = async (filename) => {
        if (!filename) return;
        try {
            const res = await api.get(`/files/resume/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url; a.setAttribute('download', filename);
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch { setStatusError('Failed to download resume.'); }
    };

    const handleAIScreen = async (appId) => {
        setScreeningLoading(prev => new Set([...prev, appId]));
        try {
            const res = await api.post(`/ai/screen/${appId}`);
            setScreeningResults(prev => ({ ...prev, [appId]: res.data }));
        } catch (err) {
            setStatusError(err.response?.data?.detail || 'AI screening failed.');
        } finally {
            setScreeningLoading(prev => { const s = new Set(prev); s.delete(appId); return s; });
        }
    };

    const getAvatarUrl = (avatarFilename) => {
        if (!avatarFilename) return null;
        return `${API_URL}/static/avatars/${avatarFilename.split(/[\\/]/).pop()}`;
    };

    const openChat = async (applicantId, applicantName) => {
        setChatError('');
        setActiveChat({ id: applicantId, name: applicantName });
        try {
            const res = await api.get(`/messages/${applicantId}`);
            setMessages(res.data);
        } catch { setChatError('Failed to load chat.'); }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        wsSend({ type: 'message', data: { receiver_id: activeChat.id, content: newMessage } });
        setNewMessage('');
    };

    const aiScoreColor = (score) => {
        if (score >= 7) return { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' };
        if (score >= 4) return { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' };
        return { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.3)' };
    };

    return (
        <div className="min-h-screen grid-bg py-12 px-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-10 left-10 w-80 h-80 orb-violet animate-glow-pulse pointer-events-none" style={{ opacity: 0.35 }} />
            <div className="absolute bottom-10 right-10 w-72 h-72 orb-cyan animate-orb-1 pointer-events-none" style={{ opacity: 0.3 }} />

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Applicant <span className="gradient-text">Management</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{applications.length} candidates for this position</p>
                </motion.div>

                {statusError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle className="w-4 h-4" /> {statusError}
                    </motion.div>
                )}

                <div className="grid gap-5">
                    {applications.map((app, i) => {
                        const profile = app.applicant?.profile || {};
                        const resumeFilename = app.resume_path ? app.resume_path.split(/[\\/]/).pop() : null;
                        const result = screeningResults[app.id];

                        return (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.45 }}
                                className="glass rounded-xl overflow-hidden"
                            >
                                <div className="p-6 flex flex-col md:flex-row gap-5">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {profile.avatar_url
                                                ? <img src={getAvatarUrl(profile.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                                                : <User className="w-10 h-10 text-slate-700" />
                                            }
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{profile.full_name || app.applicant_name}</h3>
                                                <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">{profile.bio || 'No bio available'}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                                                <select
                                                    value={app.status}
                                                    onChange={e => handleStatusChange(app.id, e.target.value)}
                                                    className={`text-xs font-bold py-1.5 px-3 rounded-full cursor-pointer focus:outline-none border-0 ${statusClass(app.status)}`}
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <option value="Pending" style={{ background: '#0a0e1a' }}>Pending</option>
                                                    <option value="Interviewing" style={{ background: '#0a0e1a' }}>Interviewing</option>
                                                    <option value="Accepted" style={{ background: '#0a0e1a' }}>Accepted</option>
                                                    <option value="Rejected" style={{ background: '#0a0e1a' }}>Rejected</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Mail className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                                                <span className="truncate">{app.applicant?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Phone className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                                                <span>{profile.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <button
                                                onClick={() => openPreview(resumeFilename)}
                                                disabled={!resumeFilename || previewLoading}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 transition-all duration-200 disabled:opacity-50 hover:text-slate-200"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Preview
                                            </button>
                                            <button
                                                onClick={() => downloadResume(resumeFilename)}
                                                disabled={!resumeFilename}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                                                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.22)', color: '#22d3ee' }}
                                            >
                                                <Download className="w-3.5 h-3.5" /> Resume
                                            </button>
                                            <button
                                                onClick={() => openChat(app.applicant_id, profile.full_name || 'Applicant')}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', color: '#60a5fa' }}
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" /> Message
                                            </button>
                                            <button
                                                onClick={() => handleAIScreen(app.id)}
                                                disabled={screeningLoading.has(app.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-60"
                                                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)', color: '#a78bfa' }}
                                            >
                                                {screeningLoading.has(app.id)
                                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Screening...</>
                                                    : <><Sparkles className="w-3.5 h-3.5" /> AI Screen</>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Result Panel */}
                                <AnimatePresence>
                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.05)' }}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                                    <span className="font-semibold text-slate-200 text-sm">AI Screening Result</span>
                                                    {(() => {
                                                        const sc = aiScoreColor(result.score);
                                                        return (
                                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                                {result.score}/10
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-5 text-sm">
                                                    <div>
                                                        <p className="font-semibold text-emerald-400 mb-2 text-xs uppercase tracking-wider">Strengths</p>
                                                        <ul className="space-y-1.5">
                                                            {result.strengths.map((s, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-slate-500">
                                                                    <span className="text-emerald-400 mt-px text-xs">✓</span>
                                                                    <span className="text-xs">{s}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    {result.gaps.length > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-amber-400 mb-2 text-xs uppercase tracking-wider">Gaps / Concerns</p>
                                                            <ul className="space-y-1.5">
                                                                {result.gaps.map((g, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-slate-500">
                                                                        <span className="text-amber-400 mt-px text-xs">!</span>
                                                                        <span className="text-xs">{g}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mt-4 text-slate-500 text-xs italic pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>{result.recommendation}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {applications.length === 0 && !statusError && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-24 glass rounded-2xl">
                            <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No applications yet for this job.</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── RESUME PREVIEW MODAL ── */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col"
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                    >
                        <div className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid rgba(6,182,212,0.15)', background: 'rgba(5,8,22,0.9)' }}>
                            <span className="font-semibold text-sm text-white">Resume Preview</span>
                            <button onClick={closePreview} className="text-slate-500 hover:text-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <iframe src={previewUrl} className="flex-1 w-full border-0" title="Resume Preview" />
                    </motion.div>
                )}
            </AnimatePresence>

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
                                <span className="font-semibold text-sm text-white">{activeChat.name}</span>
                            </div>
                            <button onClick={() => setActiveChat(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {chatError && (
                            <div className="px-3 py-2 text-rose-400 text-xs flex items-center gap-1" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.06)' }}>
                                <AlertCircle className="w-3 h-3" /> {chatError}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scroll" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            {messages.length === 0 && (
                                <p className="text-center text-xs text-slate-600 mt-8">Start the conversation...</p>
                            )}
                            {messages.map(msg => {
                                const isMe = msg.sender_id !== activeChat.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className="max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed"
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

export default JobApplications;
