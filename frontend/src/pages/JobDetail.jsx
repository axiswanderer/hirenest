import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Building2, Calendar, ArrowLeft, Bookmark, BookmarkCheck, User, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [file, setFile] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        api.get(`/jobs/${id}`)
            .then(res => { setJob(res.data); setLoading(false); })
            .catch(err => { setLoading(false); if (err.response?.status === 404) setNotFound(true); });
    }, [id]);

    useEffect(() => {
        if (!user || user.isRecruiter) return;
        api.get('/applications/my-job-ids').then(res => setHasApplied(res.data.includes(Number(id)))).catch(() => {});
        api.get('/jobs/saved').then(res => setSaved(res.data.some(s => s.job_id === Number(id)))).catch(() => {});
    }, [user, id]);

    const handleFileChange = (e) => {
        setApplyError('');
        const f = e.target.files[0];
        if (!f) return;
        if (f.type !== 'application/pdf') { setApplyError('Only PDF files are accepted.'); e.target.value = ''; return; }
        if (f.size > MAX_RESUME_SIZE) { setApplyError('File too large. Max 10 MB.'); e.target.value = ''; return; }
        setFile(f);
    };

    const handleApply = async () => {
        if (!file) { setApplyError('Select a PDF first.'); return; }
        setApplyError('');
        setApplying(true);
        const fd = new FormData();
        fd.append('job_id', id);
        fd.append('applicant_name', 'Applicant');
        fd.append('file', file);
        try {
            await api.post('/applications/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setApplySuccess(true);
            setHasApplied(true);
            setFile(null);
        } catch (err) {
            setApplyError(err.response?.data?.detail || 'Application failed.');
        } finally {
            setApplying(false);
        }
    };

    const toggleSave = async () => {
        if (saved) { await api.delete(`/jobs/${id}/save`).catch(() => {}); setSaved(false); }
        else { await api.post(`/jobs/${id}/save`).catch(() => {}); setSaved(true); }
    };

    const avatarUrl = (avatarFilename) => {
        if (!avatarFilename) return null;
        return `${API_URL}/static/avatars/${avatarFilename.split(/[\\/]/).pop()}`;
    };

    if (loading) return (
        <div className="min-h-screen grid-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading job details...</p>
            </div>
        </div>
    );

    if (notFound) return (
        <div className="min-h-screen grid-bg flex items-center justify-center">
            <div className="text-center glass rounded-2xl p-12">
                <p className="text-slate-400 mb-4">Job not found.</p>
                <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">← Back to jobs</Link>
            </div>
        </div>
    );

    const recruiter = job.recruiter;
    const recruiterProfile = recruiter?.profile;

    return (
        <div className="min-h-screen grid-bg py-12 px-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-10 left-10 w-72 h-72 orb-cyan animate-glow-pulse pointer-events-none" style={{ opacity: 0.3 }} />
            <div className="absolute bottom-10 right-10 w-80 h-80 orb-violet animate-orb-1 pointer-events-none" style={{ opacity: 0.28 }} />

            <div className="max-w-2xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 mb-6 transition-colors text-sm group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Jobs
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="glass rounded-2xl p-8"
                >
                    {/* Job header */}
                    <div className="flex justify-between items-start gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">{job.title}</h1>
                            <div className="flex flex-wrap gap-4 text-slate-500 text-sm">
                                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {user && !user.isRecruiter && (
                            <button onClick={toggleSave} className="flex-shrink-0 mt-1 transition-colors duration-200">
                                {saved
                                    ? <BookmarkCheck className="w-6 h-6 text-cyan-400" />
                                    : <Bookmark className="w-6 h-6 text-slate-600 hover:text-cyan-400" />
                                }
                            </button>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px mb-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {/* Description */}
                    <div className="mb-8">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Job Description</h2>
                        <p className="text-slate-400 leading-relaxed whitespace-pre-line text-sm">{job.description}</p>
                    </div>

                    {/* Recruiter card */}
                    {recruiter && (
                        <>
                            <div className="h-px mb-6" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <div className="mb-8">
                                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Posted By</h2>
                                <div className="flex items-center gap-3 p-4 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        {recruiterProfile?.avatar_url
                                            ? <img src={avatarUrl(recruiterProfile.avatar_url)} alt="" className="w-full h-full object-cover" />
                                            : <User className="w-5 h-5 text-slate-700" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-200 text-sm">{recruiterProfile?.full_name || 'Recruiter'}</p>
                                        <p className="text-slate-600 text-xs">{recruiter.email}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Apply section */}
                    <div className="h-px mb-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

                    {!user && (
                        <Link to="/login" className="btn-primary btn-shimmer inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold">
                            Login to Apply
                        </Link>
                    )}
                    {user && user.isRecruiter && (
                        <p className="text-slate-600 text-sm italic">Recruiters cannot apply for jobs.</p>
                    )}
                    {user && !user.isRecruiter && (
                        <>
                            {applySuccess || hasApplied ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-emerald-400 text-sm font-medium"
                                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Application submitted successfully!
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Apply Now</h2>
                                    {applyError && (
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-rose-400 text-sm"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                                            <AlertCircle className="w-4 h-4" /> {applyError}
                                        </div>
                                    )}
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }}>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-slate-500 cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:cursor-pointer file:transition-colors"
                                        />
                                        <p className="text-slate-600 text-xs mt-2">PDF only · max 10 MB</p>
                                    </div>
                                    <button
                                        onClick={handleApply}
                                        disabled={applying || !file}
                                        className="btn-primary btn-shimmer flex items-center gap-2 px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {applying ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                        ) : 'Submit Application'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default JobDetail;
