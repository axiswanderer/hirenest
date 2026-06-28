import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Zap } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const userData = await login(email, password);
            if (userData.isAdmin) navigate('/admin');
            else if (userData.isRecruiter) navigate('/recruiter-dashboard');
            else navigate('/applicant-dashboard');
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 400) {
                setError('Invalid email or password.');
            } else {
                setError('Unable to connect. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 orb-cyan animate-orb-1 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 orb-violet animate-orb-2 pointer-events-none" />
            <div className="absolute top-3/4 left-1/2 w-64 h-64 orb-blue animate-glow-pulse pointer-events-none" />

            {/* Scan line */}
            <div className="scan-container absolute inset-0 pointer-events-none">
                <div className="scan-line" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Card with gradient border */}
                <div className="relative rounded-2xl p-px" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(59,130,246,0.15), rgba(124,58,237,0.35))' }}>
                    <div className="glass rounded-2xl p-8" style={{ background: 'rgba(5,8,22,0.92)' }}>

                        {/* Logo */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="inline-flex items-center gap-2 mb-4"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center glow-cyan-sm">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <Link to="/" className="text-2xl font-extrabold text-white tracking-tight">
                                    Hire<span className="gradient-text">Nest</span>
                                </Link>
                            </motion.div>
                            <h2 className="text-slate-400 text-sm">Welcome back. Sign in to continue.</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                                    <input
                                        type="email"
                                        required
                                        className="neon-input pl-10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        className="neon-input pl-10"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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
                                ) : (
                                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-600">
                            No account?{' '}
                            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200">
                                Create one free
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
