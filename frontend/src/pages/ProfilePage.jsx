import { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Mail, Phone, Globe, FileText, Camera } from 'lucide-react';

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        full_name: '', phone: '', portfolio: '', bio: '', avatar_url: ''
    });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        api.get('/profile/').then(res => {
            setProfile(res.data);
            if (res.data.avatar_url) {
                // Convert backend path to frontend URL
                const filename = res.data.avatar_url.split(/[\\/]/).pop();
                setPreview(`http://localhost:8000/static/${filename}`);
            }
        });
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('full_name', profile.full_name || "");
        formData.append('phone', profile.phone || "");
        formData.append('portfolio', profile.portfolio || "");
        formData.append('bio', profile.bio || "");
        if (file) formData.append('file', file);

        try {
            await api.put('/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Profile Updated Successfully!");
        } catch (err) {
            alert("Update Failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-sm border border-slate-200 p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                            {preview ? (
                                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                        </div>
                        <div>
                            <label className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-50 transition flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Change Photo
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                            <input 
                                className="w-full border p-2 rounded-lg"
                                value={profile.full_name || ''} 
                                onChange={e => setProfile({...profile, full_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                            <input 
                                className="w-full border p-2 rounded-lg"
                                value={profile.phone || ''} 
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Portfolio Link</label>
                        <input 
                            className="w-full border p-2 rounded-lg"
                            value={profile.portfolio || ''} 
                            onChange={e => setProfile({...profile, portfolio: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">About / Bio</label>
                        <textarea 
                            rows="4"
                            className="w-full border p-2 rounded-lg"
                            value={profile.bio || ''} 
                            onChange={e => setProfile({...profile, bio: e.target.value})}
                        />
                    </div>

                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition w-full">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;