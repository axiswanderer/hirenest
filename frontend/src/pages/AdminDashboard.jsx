import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, FileText, Trash2, AlertCircle, Shield } from 'lucide-react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [tab, setTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        setError('');
        if (tab === 'stats') api.get('/admin/stats').then(r => setStats(r.data)).catch(() => setError('Failed to load stats.'));
        else if (tab === 'users') api.get('/admin/users').then(r => setUsers(r.data)).catch(() => setError('Failed to load users.'));
        else if (tab === 'jobs') api.get('/admin/jobs').then(r => setJobs(r.data)).catch(() => setError('Failed to load jobs.'));
    }, [tab]);

    const deleteUser = async (id) => {
        if (!window.confirm('Delete this user and all their data?')) return;
        try { await api.delete(`/admin/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)); }
        catch (err) { setError(err.response?.data?.detail || 'Failed to delete user.'); }
    };

    const deleteJob = async (id) => {
        if (!window.confirm('Delete this job and all its applications?')) return;
        try { await api.delete(`/admin/jobs/${id}`); setJobs(prev => prev.filter(j => j.id !== id)); }
        catch (err) { setError(err.response?.data?.detail || 'Failed to delete job.'); }
    };

    const tabs = [
        { id: 'stats', label: 'Statistics' },
        { id: 'users', label: 'Users' },
        { id: 'jobs', label: 'Jobs' },
    ];

    const roleStyle = (u) => {
        if (u.is_admin) return { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.3)' };
        if (u.is_recruiter) return { bg: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: 'rgba(6,182,212,0.3)' };
        return { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' };
    };

    const statCards = stats ? [
        { label: 'Total Users', value: stats.total_users, icon: <Users className="w-5 h-5" />, color: '#22d3ee', glow: 'rgba(6,182,212,0.15)' },
        { label: 'Recruiters', value: stats.recruiter_count, icon: <Briefcase className="w-5 h-5" />, color: '#a78bfa', glow: 'rgba(124,58,237,0.15)' },
        { label: 'Applicants', value: stats.applicant_count, icon: <Users className="w-5 h-5" />, color: '#34d399', glow: 'rgba(16,185,129,0.15)' },
        { label: 'Total Jobs', value: stats.total_jobs, icon: <Briefcase className="w-5 h-5" />, color: '#fb923c', glow: 'rgba(249,115,22,0.15)' },
        { label: 'Applications', value: stats.total_applications, icon: <FileText className="w-5 h-5" />, color: '#38bdf8', glow: 'rgba(56,189,248,0.15)' },
    ] : [];

    return (
        <div className="min-h-screen grid-bg py-12 px-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-10 right-10 w-80 h-80 orb-violet animate-glow-pulse pointer-events-none" style={{ opacity: 0.35 }} />
            <div className="absolute bottom-10 left-10 w-72 h-72 orb-cyan animate-orb-2 pointer-events-none" style={{ opacity: 0.3 }} />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                        <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Admin <span className="gradient-text">Dashboard</span></h1>
                        <p className="text-slate-500 text-sm">Platform management & oversight</p>
                    </div>
                </motion.div>

                {/* Error */}
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle className="w-4 h-4" /> {error}
                    </motion.div>
                )}

                {/* Tab bar */}
                <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t.id ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === t.id && (
                                <motion.div layoutId="admin-tab" className="absolute inset-0 rounded-lg"
                                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)' }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 35 }} />
                            )}
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── STATS ── */}
                    {tab === 'stats' && stats && (
                        <motion.div key="stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {statCards.map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                        className="glass rounded-xl p-6 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: s.glow, border: '1px solid rgba(255,255,255,0.06)', color: s.color }}>
                                            {s.icon}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                            <p className="text-slate-500 text-xs">{s.label}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── USERS ── */}
                    {tab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="cyber-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Email</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => {
                                            const rs = roleStyle(u);
                                            return (
                                                <tr key={u.id}>
                                                    <td className="text-slate-700 text-xs font-mono">{u.id}</td>
                                                    <td className="font-medium text-slate-300">{u.email}</td>
                                                    <td>{u.profile?.full_name || <span className="text-slate-700">—</span>}</td>
                                                    <td>
                                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                                            style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                                                            {u.is_admin ? 'Admin' : u.is_recruiter ? 'Recruiter' : 'Applicant'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {!u.is_admin && (
                                                            <button onClick={() => deleteUser(u.id)} className="text-slate-700 hover:text-rose-400 transition-colors duration-200">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {users.length === 0 && <p className="p-10 text-center text-slate-600 text-sm">No users found.</p>}
                            </div>
                        </motion.div>
                    )}

                    {/* ── JOBS ── */}
                    {tab === 'jobs' && (
                        <motion.div key="jobs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <div className="glass rounded-xl overflow-hidden">
                                <table className="cyber-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Company</th>
                                            <th>Posted By</th>
                                            <th>Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map(j => (
                                            <tr key={j.id}>
                                                <td className="text-slate-700 text-xs font-mono">{j.id}</td>
                                                <td className="font-medium text-slate-300">{j.title}</td>
                                                <td>{j.company}</td>
                                                <td className="text-slate-600">{j.recruiter?.email || '—'}</td>
                                                <td className="text-slate-700">{new Date(j.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => deleteJob(j.id)} className="text-slate-700 hover:text-rose-400 transition-colors duration-200">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {jobs.length === 0 && <p className="p-10 text-center text-slate-600 text-sm">No jobs found.</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
