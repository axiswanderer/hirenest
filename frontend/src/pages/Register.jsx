import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, Check, Loader2 } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ email: '', password: '', is_recruiter: false });
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/register', formData);
            // small delay to show success state before redirect
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            alert("Registration failed. Email might be taken.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Join Hire<span className="text-blue-500">Nest</span></h2>
                    <p className="text-slate-400 text-sm">Create your account and start your journey.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Role Selection Toggle */}
                    <div className="bg-slate-900/50 p-1 rounded-lg flex relative">
                        <motion.div 
                            className="absolute top-1 bottom-1 bg-slate-700 rounded-md shadow-sm"
                            initial={false}
                            animate={{ 
                                left: formData.is_recruiter ? '50%' : '4px',
                                right: formData.is_recruiter ? '4px' : '50%'
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, is_recruiter: false})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md relative z-10 transition-colors ${!formData.is_recruiter ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <User className="w-4 h-4" /> Applicant
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, is_recruiter: true})}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md relative z-10 transition-colors ${formData.is_recruiter ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Briefcase className="w-4 h-4" /> Recruiter
                        </button>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-500" />
                            </div>
                            <input 
                                type="email" 
                                required 
                                className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="name@company.com"
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500" />
                            </div>
                            <input 
                                type="password" 
                                required 
                                className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="••••••••"
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Sign in
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;