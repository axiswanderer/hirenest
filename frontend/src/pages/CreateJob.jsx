import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Building2, FileText, ArrowRight } from 'lucide-react';

const CreateJob = () => {
    const [form, setForm] = useState({ title: '', company: '', description: '', location: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/jobs/', form);
            navigate('/recruiter-dashboard');
        } catch {
            alert('Failed to post job. Are you logged in as a Recruiter?');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 orb-cyan animate-orb-1 pointer-events-none" style={{ opacity: 0.3 }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 orb-violet animate-orb-2 pointer-events-none" style={{ opacity: 0.25 }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="relative rounded-2xl p-px" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(59,130,246,0.15), rgba(124,58,237,0.35))' }}>
                    <div className="rounded-2xl p-8" style={{ background: 'rgba(5,8,22,0.94)' }}>
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
                                    <Briefcase className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Post a <span className="gradient-text">New Job</span></h2>
                            </div>
                            <p className="text-slate-500 text-sm">Fill in the details to publish your job listing.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Job Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <input
                                        className="neon-input pl-10"
                                        placeholder="e.g. Senior Frontend Engineer"
                                        required
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Company</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <input
                                        className="neon-input pl-10"
                                        placeholder="e.g. Acme Corporation"
                                        required
                                        onChange={e => setForm({ ...form, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <input
                                        className="neon-input pl-10"
                                        placeholder="e.g. Remote / San Francisco, CA"
                                        required
                                        onChange={e => setForm({ ...form, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Job Description</label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <textarea
                                        className="neon-input pl-10 resize-none"
                                        placeholder="Describe the role, responsibilities, and requirements..."
                                        rows={5}
                                        required
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary btn-shimmer flex justify-center items-center gap-2 py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Publish Job Listing <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateJob;
