import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, AlertCircle, Zap } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', is_recruiter: false });
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/auth/register', formData);
            setTimeout(() => navigate('/login'), 500);
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) setError(detail.map(d => d.msg).join(', '));
            else setError(detail || 'Registration failed. That email may already be taken.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-0 right-1/3 w-96 h-96 orb-violet animate-orb-1 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 orb-cyan animate-orb-2 pointer-events-none" />

            {/* Scan line */}
            <div className="scan-container absolute inset-0 pointer-events-none">
                <div className="scan-line" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                <div className="relative rounded-2xl p-px" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(59,130,246,0.15), rgba(6,182,212,0.35))' }}>
                    <div className="glass rounded-2xl p-8" style={{ background: 'rgba(5,8,22,0.92)' }}>

                        {/* Logo */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center glow-violet" style={{ boxShadow: '0 0 15px rgba(124,58,237,0.4)' }}>
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <Link to="/" className="text-2xl font-extrabold text-white tracking-tight">
                                    Hire<span className="gradient-text">Nest</span>
                                </Link>
                            </div>
                            <h2 className="text-slate-400 text-sm">Create your account and start your journey.</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Role Toggle */}
                            <div className="relative p-1 rounded-xl flex" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-lg"
                                    initial={false}
                                    animate={{
                                        left: formData.is_recruiter ? '50%' : '4px',
                                        right: formData.is_recruiter ? '4px' : '50%',
                                    }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                                    style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_recruiter: false })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg relative z-10 transition-colors duration-200 ${!formData.is_recruiter ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <User className="w-4 h-4" /> Applicant
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_recruiter: true })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg relative z-10 transition-colors duration-200 ${formData.is_recruiter ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Briefcase className="w-4 h-4" /> Recruiter
                                </button>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                    <input
                                        type="email"
                                        required
                                        className="neon-input pl-10"
                                        placeholder="name@company.com"
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="neon-input pl-10"
                                        placeholder="Min 8 characters"
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-rose-400 text-sm"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary btn-shimmer flex justify-center items-center gap-2 py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
