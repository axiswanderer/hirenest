import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, X, User, AlertCircle,
    Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Search, MapPin, Building2
} from 'lucide-react';
import api from '../api/axios';
import { useWS } from '../context/WSContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const JOBS_PER_PAGE = 10;

const statusClass = (s) => {
    if (s === 'Accepted') return 'badge-accepted';
    if (s === 'Rejected') return 'badge-rejected';
    if (s === 'Interviewing') return 'badge-interviewing';
    return 'badge-pending';
};

const ApplicantDashboard = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [jobs, setJobs] = useState([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQ, setSearchQ] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    const [myApplications, setMyApplications] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [savedJobIds, setSavedJobIds] = useState(new Set());

    const [file, setFile] = useState(null);
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [applyError, setApplyError] = useState('');
    const [fetchError, setFetchError] = useState('');

    const [conversations, setConversations] = useState([]);
    const [convLoading, setConvLoading] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatError, setChatError] = useState('');

    const { sendMessage: wsSend, lastMessage } = useWS();

    useEffect(() => {
        api.get('/applications/my-job-ids').then(res => setAppliedJobIds(new Set(res.data))).catch(() => {});
        api.get('/jobs/saved').then(res => {
            setSavedJobs(res.data);
            setSavedJobIds(new Set(res.data.map(s => s.job_id)));
        }).catch(() => {});
    }, []);

    const fetchJobs = useCallback(async () => {
        const params = { skip: (page - 1) * JOBS_PER_PAGE, limit: JOBS_PER_PAGE };
        if (searchQ) params.q = searchQ;
        if (filterLocation) params.location = filterLocation;
        try {
            const [jr, cr] = await Promise.all([
                api.get('/jobs/', { params }),
                api.get('/jobs/count', { params: { q: params.q, location: params.location } }),
            ]);
            setJobs(jr.data);
            setTotalJobs(cr.data.total);
        } catch { setFetchError('Failed to load jobs.'); }
    }, [page, searchQ, filterLocation]);

    useEffect(() => { if (activeTab === 'browse') fetchJobs(); }, [activeTab, fetchJobs]);
    useEffect(() => { setPage(1); }, [searchQ, filterLocation]);

    useEffect(() => {
        if (activeTab === 'history') {
            api.get('/applications/me').then(res => setMyApplications(res.data)).catch(() => setFetchError('Failed to load applications.'));
        }
        if (activeTab === 'saved') {
            api.get('/jobs/saved').then(res => { setSavedJobs(res.data); setSavedJobIds(new Set(res.data.map(s => s.job_id))); }).catch(() => {});
        }
        if (activeTab === 'messages') {
            setConvLoading(true);
            api.get('/messages/conversations/list').then(res => setConversations(res.data)).catch(() => {}).finally(() => setConvLoading(false));
        }
    }, [activeTab]);

    useEffect(() => {
        if (!lastMessage || lastMessage.type !== 'message') return;
        const msg = lastMessage.data;
        if (activeChat && (msg.sender_id === activeChat.user_id || msg.receiver_id === activeChat.user_id)) {
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        }
    }, [lastMessage, activeChat]);

    const handleFileChange = (e) => {
        setApplyError('');
        const f = e.target.files[0];
        if (!f) return;
        if (f.type !== 'application/pdf') { setApplyError('Only PDF files accepted.'); e.target.value = ''; return; }
        if (f.size > MAX_RESUME_SIZE) { setApplyError('Max file size is 10 MB.'); e.target.value = ''; return; }
        setFile(f);
    };

    const handleApply = async (jobId) => {
        if (!file) { setApplyError('Upload a PDF first.'); return; }
        setApplyError('');
        const fd = new FormData();
        fd.append('job_id', jobId);
        fd.append('applicant_name', 'Me');
        fd.append('file', file);
        try {
            await api.post('/applications/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setApplyingJobId(null);
            setFile(null);
            setAppliedJobIds(prev => new Set([...prev, jobId]));
        } catch (e) {
            setApplyError(e.response?.data?.detail || 'Error applying.');
        }
    };

    const handleWithdraw = async (appId) => {
        if (!window.confirm('Withdraw this application?')) return;
        try {
            await api.delete(`/applications/${appId}`);
            setMyApplications(prev => prev.filter(a => a.id !== appId));
        } catch (err) {
            setFetchError(err.response?.data?.detail || 'Failed to withdraw.');
        }
    };

    const toggleSave = async (jobId) => {
        if (savedJobIds.has(jobId)) {
            await api.delete(`/jobs/${jobId}/save`).catch(() => {});
            setSavedJobIds(prev => { const s = new Set(prev); s.delete(jobId); return s; });
            setSavedJobs(prev => prev.filter(s => s.job_id !== jobId));
        } else {
            await api.post(`/jobs/${jobId}/save`).catch(() => {});
            setSavedJobIds(prev => new Set([...prev, jobId]));
        }
    };

    const getAvatarUrl = (avatarPath) => {
        if (!avatarPath) return null;
        return `${API_URL}/static/avatars/${avatarPath.split(/[\\/]/).pop()}`;
    };

    const openChat = async (recruiterId, nameOrConv) => {
        if (!recruiterId) { setChatError('Recruiter not found.'); return; }
        setChatError('');
        const convObj = typeof nameOrConv === 'object' && nameOrConv !== null
            ? nameOrConv
            : { user_id: recruiterId, full_name: nameOrConv, email: '', avatar_url: null };
        setActiveChat(convObj);
        try {
            const res = await api.get(`/messages/${recruiterId}`);
            setMessages(res.data);
        } catch { setChatError('Failed to load chat.'); }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        wsSend({ type: 'message', data: { receiver_id: activeChat.user_id, content: newMessage } });
        setNewMessage('');
    };

    const totalPages = Math.max(1, Math.ceil(totalJobs / JOBS_PER_PAGE));

    const tabs = [
        { id: 'browse', label: 'Browse Jobs' },
        { id: 'history', label: 'My Applications' },
        { id: 'saved', label: 'Saved Jobs' },
        { id: 'messages', label: 'Messages' },
    ];

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-h-screen grid-bg py-12 px-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-20 right-10 w-72 h-72 orb-cyan animate-glow-pulse pointer-events-none" style={{ opacity: 0.4 }} />
            <div className="absolute bottom-20 left-10 w-64 h-64 orb-violet animate-orb-1 pointer-events-none" style={{ opacity: 0.35 }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-white">
                        Applicant <span className="gradient-text">Portal</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track your applications, browse openings, and save favorites.</p>
                </motion.div>

                {/* Error */}
                {fetchError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle className="w-4 h-4" /> {fetchError}
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
                                    layoutId="tab-indicator"
                                    className="absolute inset-0 rounded-lg"
                                    style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.28)' }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── BROWSE TAB ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'browse' && (
                        <motion.div key="browse" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            <div className="grid md:grid-cols-2 gap-3 mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                    <input className="neon-input pl-10 text-sm" placeholder="Search job title..."
                                        value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                    <input className="neon-input pl-10 text-sm" placeholder="Filter by location..."
                                        value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
                                </div>
                            </div>

                            {applyError && (
                                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <AlertCircle className="w-4 h-4" /> {applyError}
                                </div>
                            )}

                            <div className="grid gap-4">
                                {jobs.map((job, i) => (
                                    <motion.div
                                        key={job.id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ y: -2 }}
                                        className="glass glass-hover rounded-xl p-5"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <Link to={`/jobs/${job.id}`} className="text-base font-bold text-white hover:text-cyan-400 transition-colors">{job.title}</Link>
                                                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3" /> {job.company}
                                                    <span className="text-slate-700">·</span>
                                                    <MapPin className="w-3 h-3" /> {job.location}
                                                </p>
                                            </div>
                                            <button onClick={() => toggleSave(job.id)} className="transition-colors duration-200 ml-2 flex-shrink-0">
                                                {savedJobIds.has(job.id)
                                                    ? <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                                                    : <Bookmark className="w-5 h-5 text-slate-600 hover:text-cyan-400" />
                                                }
                                            </button>
                                        </div>

                                        {appliedJobIds.has(job.id) ? (
                                            <span className="badge-accepted text-xs">Applied</span>
                                        ) : applyingJobId === job.id ? (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                                className="rounded-lg p-3 flex gap-2 flex-wrap items-center"
                                                style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}>
                                                <input type="file" accept="application/pdf" onChange={handleFileChange}
                                                    className="text-xs text-slate-500 cursor-pointer flex-shrink-0" />
                                                <button onClick={() => handleApply(job.id)}
                                                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-400"
                                                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}>
                                                    Confirm
                                                </button>
                                                <button onClick={() => { setApplyingJobId(null); setApplyError(''); }}
                                                    className="text-slate-600 text-xs hover:text-slate-400 transition-colors">Cancel</button>
                                            </motion.div>
                                        ) : (
                                            <button
                                                onClick={() => { setApplyingJobId(job.id); setApplyError(''); }}
                                                className="btn-primary btn-shimmer py-2 px-4 text-xs"
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                                {jobs.length === 0 && (
                                    <div className="text-center py-16 glass rounded-xl">
                                        <p className="text-slate-500">No jobs match your search.</p>
                                    </div>
                                )}
                            </div>

                            {totalJobs > JOBS_PER_PAGE && (
                                <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <p className="text-xs text-slate-600">{Math.min((page-1)*JOBS_PER_PAGE+1,totalJobs)}–{Math.min(page*JOBS_PER_PAGE,totalJobs)} of {totalJobs}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p=>p-1)} disabled={page===1}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-40 hover:text-cyan-400 transition-colors"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <ChevronLeft className="w-3.5 h-3.5"/>Prev
                                        </button>
                                        <span className="text-xs text-slate-600 px-2 py-1.5">{page}/{totalPages}</span>
                                        <button onClick={() => setPage(p=>p+1)} disabled={page>=totalPages}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 disabled:opacity-40 hover:text-cyan-400 transition-colors"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            Next<ChevronRight className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── HISTORY TAB ── */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="cyber-table">
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myApplications.map(app => (
                                            <tr key={app.id}>
                                                <td className="font-medium text-slate-200">
                                                    {app.job
                                                        ? <Link to={`/jobs/${app.job_id}`} className="hover:text-cyan-400 transition-colors">{app.job.title}</Link>
                                                        : `Job #${app.job_id}`
                                                    }
                                                </td>
                                                <td>
                                                    <span className={statusClass(app.status)}>{app.status}</span>
                                                </td>
                                                <td>
                                                    <div className="flex gap-3 items-center">
                                                        {app.job?.recruiter_id && (
                                                            <button onClick={() => openChat(app.job.recruiter_id, app.job.recruiter?.profile?.full_name || app.job.recruiter?.email || 'Recruiter')}
                                                                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                                                                <MessageSquare className="w-3.5 h-3.5" /> Message
                                                            </button>
                                                        )}
                                                        {app.status === 'Pending' && (
                                                            <button onClick={() => handleWithdraw(app.id)}
                                                                className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium">
                                                                Withdraw
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {myApplications.length === 0 && (
                                    <div className="p-12 text-center text-slate-600 text-sm">No applications yet.</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── SAVED TAB ── */}
                    {activeTab === 'saved' && (
                        <motion.div key="saved" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                            <div className="grid gap-4">
                                {savedJobs.length === 0 && (
                                    <div className="text-center py-16 glass rounded-xl">
                                        <Bookmark className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">No saved jobs yet. Bookmark jobs while browsing!</p>
                                    </div>
                                )}
                                {savedJobs.map(s => s.job && (
                                    <motion.div key={s.id} variants={itemVariants} initial="hidden" animate="visible"
                                        whileHover={{ y: -2 }}
                                        className="glass glass-hover rounded-xl p-5 flex justify-between items-center">
                                        <div>
                                            <Link to={`/jobs/${s.job_id}`} className="text-base font-bold text-white hover:text-cyan-400 transition-colors">{s.job.title}</Link>
                                            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3" /> {s.job.company}
                                                <span className="text-slate-700">·</span>
                                                <MapPin className="w-3 h-3" /> {s.job.location}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            {appliedJobIds.has(s.job_id) ? (
                                                <span className="badge-accepted text-xs">Applied</span>
                                            ) : (
                                                <Link to={`/jobs/${s.job_id}`} className="btn-primary btn-shimmer py-2 px-4 text-xs">Apply</Link>
                                            )}
                                            <button onClick={() => toggleSave(s.job_id)} className="text-cyan-400 hover:text-slate-500 transition-colors">
                                                <BookmarkCheck className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
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
                                    <p className="text-slate-700 text-xs mt-1">Apply to a job and message the recruiter from the My Applications tab.</p>
                                </div>
                            ) : (
                                <div className="glass rounded-xl overflow-hidden">
                                    {conversations.map((conv, i) => (
                                        <motion.button
                                            key={conv.user_id}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => openChat(conv.user_id, conv)}
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
                        {/* Chat header */}
                        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.06)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                                    <User className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <span className="font-semibold text-sm text-white truncate max-w-[200px]">{activeChat.full_name || activeChat.email || 'Recruiter'}</span>
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

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-scroll" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            {messages.length === 0 && (
                                <p className="text-center text-xs text-slate-600 mt-8">Say hello to the recruiter!</p>
                            )}
                            {messages.map(msg => {
                                const isMe = msg.sender_id !== activeChat.user_id;
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

                        {/* Input */}
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

export default ApplicantDashboard;
