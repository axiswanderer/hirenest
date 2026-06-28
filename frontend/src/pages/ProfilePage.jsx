import { useEffect, useState } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { User, Phone, Camera, AlertCircle, CheckCircle, Globe, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ProfilePage = () => {
    const [profile, setProfile] = useState({ full_name: '', phone: '', portfolio: '', bio: '', avatar_url: '' });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        api.get('/profile/').then(res => {
            setProfile(res.data);
            if (res.data.avatar_url) {
                const filename = res.data.avatar_url.split(/[\\/]/).pop();
                setPreview(`${API_URL}/static/avatars/${filename}`);
            }
        }).catch(() => setError('Failed to load profile.'));
    }, []);

    const handleFileChange = (e) => {
        setError('');
        const selected = e.target.files[0];
        if (!selected) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(selected.type)) { setError('Only JPEG, PNG, or WebP images are accepted.'); e.target.value = ''; return; }
        if (selected.size > MAX_AVATAR_SIZE) { setError('Image too large. Maximum size is 5 MB.'); e.target.value = ''; return; }
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const formData = new FormData();
        formData.append('full_name', profile.full_name || '');
        formData.append('phone', profile.phone || '');
        formData.append('portfolio', profile.portfolio || '');
        formData.append('bio', profile.bio || '');
        if (file) formData.append('file', file);
        try {
            await api.put('/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess('Profile updated successfully!');
            setFile(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Update failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen grid-bg py-12 px-4 flex justify-center relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-10 right-10 w-80 h-80 orb-cyan animate-glow-pulse pointer-events-none" style={{ opacity: 0.3 }} />
            <div className="absolute bottom-10 left-10 w-72 h-72 orb-violet animate-orb-2 pointer-events-none" style={{ opacity: 0.25 }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-2xl relative z-10"
            >
                <div className="glass rounded-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-1">
                            My <span className="gradient-text">Profile</span>
                        </h1>
                        <p className="text-slate-500 text-sm">Update your personal information and avatar.</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg text-rose-400 text-sm"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg text-emerald-400 text-sm"
                            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
                            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-5">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.2)' }}>
                                {preview
                                    ? <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                    : <User className="w-9 h-9 text-slate-700" />
                                }
                            </div>
                            <div>
                                <label className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 text-cyan-400"
                                    style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)' }}>
                                    <Camera className="w-4 h-4" /> Change Photo
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                                </label>
                                <p className="text-xs text-slate-600 mt-1.5">JPEG, PNG or WebP · max 5 MB</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

                        {/* Name + Phone */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <input
                                        className="neon-input pl-10"
                                        maxLength={200}
                                        placeholder="Your full name"
                                        value={profile.full_name || ''}
                                        onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                    <input
                                        className="neon-input pl-10"
                                        maxLength={20}
                                        placeholder="+1 (555) 000-0000"
                                        value={profile.phone || ''}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Portfolio */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Portfolio Link</label>
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                                <input
                                    type="url"
                                    className="neon-input pl-10"
                                    maxLength={500}
                                    placeholder="https://yourportfolio.com"
                                    value={profile.portfolio || ''}
                                    onChange={e => setProfile({ ...profile, portfolio: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">About / Bio</label>
                            <div className="relative">
                                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-700 pointer-events-none" />
                                <textarea
                                    rows={4}
                                    maxLength={2000}
                                    className="neon-input pl-10 resize-none"
                                    placeholder="A brief description about yourself..."
                                    value={profile.bio || ''}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-primary btn-shimmer flex justify-center items-center gap-2 py-3 text-sm font-semibold"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
