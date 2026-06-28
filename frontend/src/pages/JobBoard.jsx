import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Briefcase, UploadCloud, Users, CheckCircle, Search, ArrowRight,
    AlertCircle, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
    Zap, Shield, TrendingUp, MapPin, Building2
} from 'lucide-react';

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const JOBS_PER_PAGE = 10;

const JobBoard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [totalJobs, setTotalJobs] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQ, setSearchQ] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [file, setFile] = useState(null);
    const [activeJobId, setActiveJobId] = useState(null);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [savedJobIds, setSavedJobIds] = useState(new Set());

    useEffect(() => {
        if (!user || user.isRecruiter) return;
        api.get('/applications/my-job-ids').then(res => setAppliedJobIds(new Set(res.data))).catch(() => {});
        api.get('/jobs/saved').then(res => setSavedJobIds(new Set(res.data.map(s => s.job_id)))).catch(() => {});
    }, [user]);

    const fetchJobs = useCallback(async () => {
        setFetchError('');
        const params = { skip: (page - 1) * JOBS_PER_PAGE, limit: JOBS_PER_PAGE };
        if (searchQ) params.q = searchQ;
        if (filterLocation) params.location = filterLocation;
        if (filterCompany) params.company = filterCompany;
        try {
            const [jobsRes, countRes] = await Promise.all([
                api.get('/jobs/', { params }),
                api.get('/jobs/count', { params: { q: params.q, location: params.location, company: params.company } }),
            ]);
            setJobs(jobsRes.data);
            setTotalJobs(countRes.data.total);
        } catch {
            setFetchError('Failed to load jobs. Please refresh.');
        }
    }, [page, searchQ, filterLocation, filterCompany]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);
    useEffect(() => { setPage(1); }, [searchQ, filterLocation, filterCompany]);

    const handleFileChange = (e) => {
        setApplyError('');
        const f = e.target.files[0];
        if (!f) return;
        if (f.type !== 'application/pdf') { setApplyError('Only PDF files accepted.'); e.target.value = ''; return; }
        if (f.size > MAX_RESUME_SIZE) { setApplyError('File too large. Max 10 MB.'); e.target.value = ''; return; }
        setFile(f);
    };

    const handleApply = async (jobId) => {
        if (!file) { setApplyError('Select a PDF file first.'); return; }
        setApplyError('');
        const fd = new FormData();
        fd.append('job_id', jobId);
        fd.append('applicant_name', 'Applicant');
        fd.append('file', file);
        try {
            await api.post('/applications/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setApplySuccess('Application submitted!');
            setAppliedJobIds(prev => new Set([...prev, jobId]));
            setFile(null);
            setActiveJobId(null);
            setTimeout(() => setApplySuccess(''), 3000);
        } catch (err) {
            setApplyError(err.response?.data?.detail || 'Application failed.');
        }
    };

    const toggleSave = async (jobId) => {
        if (savedJobIds.has(jobId)) {
            await api.delete(`/jobs/${jobId}/save`).catch(() => {});
            setSavedJobIds(prev => { const s = new Set(prev); s.delete(jobId); return s; });
        } else {
            await api.post(`/jobs/${jobId}/save`).catch(() => {});
            setSavedJobIds(prev => new Set([...prev, jobId]));
        }
    };

    const totalPages = Math.max(1, Math.ceil(totalJobs / JOBS_PER_PAGE));

    const avatarUrl = (job) => {
        const av = job.recruiter?.profile?.avatar_url;
        if (!av) return null;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/static/avatars/${av.split(/[\\/]/).pop()}`;
    };

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
    };

    const stats = [
        { label: 'Active Jobs', value: '1,200+', icon: <Briefcase className="w-5 h-5" />, color: 'text-cyan-400' },
        { label: 'Companies', value: '450+', icon: <Building2 className="w-5 h-5" />, color: 'text-violet-400' },
        { label: 'Hired', value: '12k+', icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
        { label: 'Success Rate', value: '98%', icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400' },
    ];

    const features = [
        { icon: <Search className="w-7 h-7 text-cyan-400" />, title: 'Smart Discovery', desc: 'AI-powered matching connects you with roles that fit your exact skill set and career goals.', glow: 'rgba(6,182,212,0.15)' },
        { icon: <UploadCloud className="w-7 h-7 text-violet-400" />, title: 'One-Click Apply', desc: 'Upload your resume once and apply to multiple companies in seconds — no repetitive forms.', glow: 'rgba(124,58,237,0.15)' },
        { icon: <Shield className="w-7 h-7 text-blue-400" />, title: 'Verified Listings', desc: 'Every company and job listing is verified, so you can focus on what matters most.', glow: 'rgba(59,130,246,0.15)' },
    ];

    const testimonials = [
        { name: 'Sarah J.', role: 'Software Engineer', quote: 'HireNest made finding a remote role effortless. The entire process felt like it was built for humans, not bots.' },
        { name: 'David K.', role: 'Product Manager', quote: 'As a recruiter, the quality of candidates I find here is unmatched. The AI screening alone saves me hours.' },
        { name: 'Elena R.', role: 'UX Designer', quote: 'I love the clean experience and speed. No more filling out 10-page forms — just apply and wait.' },
    ];

    return (
        <div className="grid-bg min-h-screen text-white">

            {/* ── HERO ── */}
            <section className="relative pt-24 pb-36 overflow-hidden">
                {/* Background glow blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.06) 40%, transparent 70%)' }} />
                <div className="absolute -top-40 -left-40 w-96 h-96 orb-violet animate-orb-1 pointer-events-none" />
                <div className="absolute -bottom-20 -right-40 w-96 h-96 orb-cyan animate-orb-2 pointer-events-none" />

                {/* Scan line */}
                <div className="scan-container absolute inset-0 pointer-events-none">
                    <div className="scan-line" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
                            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.28)', color: '#22d3ee' }}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            AI-Powered Recruiting Platform
                        </motion.span>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                            Find Your Next<br />
                            <span className="gradient-text-animated animate-gradient-x">Big Opportunity</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            HireNest connects top-tier talent with world-class companies. Seamless, intelligent, and built for the modern workforce.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="#jobs"
                                className="btn-primary btn-shimmer flex items-center gap-2 px-8 py-3.5 text-sm font-semibold"
                            >
                                Browse Jobs <ArrowRight className="w-4 h-4" />
                            </a>
                            {!user && (
                                <Link
                                    to="/register"
                                    className="btn-ghost flex items-center gap-2 px-8 py-3.5 text-sm font-semibold"
                                >
                                    Join HireNest
                                </Link>
                            )}
                            {user?.isRecruiter && (
                                <Link
                                    to="/post-job"
                                    className="btn-ghost flex items-center gap-2 px-8 py-3.5 text-sm font-semibold"
                                >
                                    + Post a Job
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── STATS ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                            className="text-center"
                        >
                            <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
                            <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</div>
                            <div className="text-slate-500 text-xs uppercase tracking-widest font-medium">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── FEATURES ── */}
            <section className="py-28">
                <div className="max-w-7xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose <span className="gradient-text">HireNest?</span></h2>
                        <p className="text-slate-500 max-w-xl mx-auto">Everything you need to accelerate your career or hiring pipeline — in one platform.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                whileHover={{ y: -4 }}
                                className="glass glass-hover rounded-2xl p-8"
                            >
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: f.glow, border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── JOB BOARD ── */}
            <section id="jobs" className="py-24" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Latest Openings</h2>
                            <p className="text-slate-500 mt-1 text-sm">{totalJobs} positions available right now</p>
                        </div>
                        {user?.isRecruiter && (
                            <Link to="/post-job" className="btn-primary btn-shimmer text-sm px-5 py-2.5 flex items-center gap-2">
                                <span className="text-base">+</span> Post New Job
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="grid md:grid-cols-3 gap-3 mb-8">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                            <input
                                className="neon-input pl-10 text-sm"
                                placeholder="Search job title..."
                                value={searchQ}
                                onChange={e => setSearchQ(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                            <input
                                className="neon-input pl-10 text-sm"
                                placeholder="Filter by location..."
                                value={filterLocation}
                                onChange={e => setFilterLocation(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                            <input
                                className="neon-input pl-10 text-sm"
                                placeholder="Filter by company..."
                                value={filterCompany}
                                onChange={e => setFilterCompany(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Alerts */}
                    {fetchError && (
                        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle className="w-4 h-4" /> {fetchError}
                        </div>
                    )}
                    {applySuccess && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-emerald-400 text-sm"
                            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle className="w-4 h-4" /> {applySuccess}
                        </motion.div>
                    )}
                    {applyError && (
                        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle className="w-4 h-4" /> {applyError}
                        </div>
                    )}

                    {/* Job Cards */}
                    {jobs.length === 0 && !fetchError ? (
                        <div className="text-center py-24 glass rounded-2xl">
                            <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No jobs match your search. Try different filters.</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-4"
                        >
                            {jobs.map(job => (
                                <motion.div
                                    key={job.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -2 }}
                                    className="glass glass-hover rounded-xl p-6 group"
                                >
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <Link
                                                    to={`/jobs/${job.id}`}
                                                    className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-200"
                                                >
                                                    {job.title}
                                                </Link>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
                                                    New
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-2 flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5" /> {job.company}
                                                <span className="text-slate-700">·</span>
                                                <MapPin className="w-3.5 h-3.5" /> {job.location}
                                            </p>
                                            {job.recruiter?.profile?.full_name && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                                        {avatarUrl(job)
                                                            ? <img src={avatarUrl(job)} alt="" className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full bg-slate-700" />
                                                        }
                                                    </div>
                                                    <span className="text-slate-600 text-xs">{job.recruiter.profile.full_name}</span>
                                                </div>
                                            )}
                                            <p className="text-slate-600 text-sm line-clamp-2">{job.description}</p>
                                        </div>

                                        <div className="min-w-[200px] flex flex-col items-end gap-2">
                                            {user && !user.isRecruiter && (
                                                <button onClick={() => toggleSave(job.id)} className="transition-colors duration-200 mb-1">
                                                    {savedJobIds.has(job.id)
                                                        ? <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                                                        : <Bookmark className="w-5 h-5 text-slate-600 hover:text-cyan-400" />
                                                    }
                                                </button>
                                            )}

                                            {user?.isRecruiter ? (
                                                <Link to={`/applications/${job.id}`} className="w-full text-center py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
                                                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#22d3ee' }}>
                                                    View Applicants
                                                </Link>
                                            ) : user ? (
                                                <div className="w-full">
                                                    {appliedJobIds.has(job.id) ? (
                                                        <div className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium text-slate-600"
                                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                            Applied
                                                        </div>
                                                    ) : activeJobId !== job.id ? (
                                                        <button
                                                            onClick={() => { setActiveJobId(job.id); setApplyError(''); }}
                                                            className="w-full btn-primary btn-shimmer py-2 text-sm"
                                                        >
                                                            Apply Now
                                                        </button>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="rounded-xl p-3"
                                                            style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.18)' }}
                                                        >
                                                            <input
                                                                type="file"
                                                                accept="application/pdf"
                                                                className="block w-full text-xs text-slate-500 mb-2 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold cursor-pointer"
                                                                style={{ '--file-bg': 'rgba(6,182,212,0.15)' }}
                                                                onChange={handleFileChange}
                                                            />
                                                            <button
                                                                onClick={() => handleApply(job.id)}
                                                                className="w-full py-1.5 rounded-lg text-xs font-semibold text-emerald-400 transition-all duration-200 mb-1"
                                                                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}
                                                            >
                                                                Confirm Upload
                                                            </button>
                                                            <button
                                                                onClick={() => { setActiveJobId(null); setApplyError(''); }}
                                                                className="w-full text-slate-600 text-xs hover:text-slate-400 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link to="/login" className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                                                    Login to Apply →
                                                </Link>
                                            )}
                                            <Link to={`/jobs/${job.id}`} className="text-slate-600 text-xs hover:text-cyan-400 transition-colors">
                                                View details →
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {totalJobs > JOBS_PER_PAGE && (
                        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-sm text-slate-600">
                                {Math.min((page - 1) * JOBS_PER_PAGE + 1, totalJobs)}–{Math.min(page * JOBS_PER_PAGE, totalJobs)} of {totalJobs} jobs
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:text-cyan-400"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Prev
                                </button>
                                <span className="text-sm text-slate-500 px-3">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= totalPages}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:text-cyan-400"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section className="py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="max-w-7xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by <span className="gradient-text">Professionals</span></h2>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, duration: 0.5 }}
                                className="glass rounded-2xl p-8 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 opacity-30" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), transparent)' }} />
                                <div className="text-4xl text-cyan-400/20 font-serif mb-4 leading-none">"</div>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white text-sm">{t.name}</div>
                                        <div className="text-cyan-400 text-xs">{t.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="text-2xl font-black tracking-tight text-white mb-1">
                            Hire<span className="gradient-text">Nest</span>
                        </div>
                        <p className="text-slate-600 text-sm">© 2026 HireNest Inc. All rights reserved.</p>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-600">
                        <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Privacy Policy</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Terms of Service</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors duration-200">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default JobBoard;
