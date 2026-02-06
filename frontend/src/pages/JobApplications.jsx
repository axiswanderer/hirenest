import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Phone, Globe, Download, User, MessageSquare, Send, X } from 'lucide-react';

const JobApplications = () => {
    const { jobId } = useParams();
    const [applications, setApplications] = useState([]);
    
    // Chat State
    const [activeChat, setActiveChat] = useState(null); // Stores the applicant ID we are chatting with
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        fetchApplications();
    }, [jobId]);

    const fetchApplications = () => {
        api.get(`/applications/${jobId}`).then(res => setApplications(res.data));
    };

    // --- STATUS LOGIC ---
    const handleStatusChange = async (appId, newStatus) => {
        try {
            await api.put(`/applications/${appId}/status`, { status: newStatus });
            fetchApplications(); // Refresh UI
            alert(`Status updated to ${newStatus}`);
        } catch (err) {
            alert("Failed to update status");
        }
    };

    // --- CHAT LOGIC ---
    const openChat = async (applicantId, applicantName) => {
        setActiveChat({ id: applicantId, name: applicantName });
        const res = await api.get(`/messages/${applicantId}`);
        setMessages(res.data);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await api.post('/messages/', { receiver_id: activeChat.id, content: newMessage });
            setNewMessage("");
            // Refresh chat
            const res = await api.get(`/messages/${activeChat.id}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to send");
        }
    };

    const getStaticUrl = (path) => {
        if (!path) return null;
        const filename = path.split(/[\\/]/).pop();
        return `http://localhost:8000/static/${filename}`;
    };

    return (
        <div className="max-w-6xl mx-auto p-8 min-h-screen bg-slate-50 relative">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Applicants Management</h1>
            
            <div className="grid gap-6">
                {applications.map((app) => {
                    const profile = app.applicant?.profile || {};
                    return (
                        <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                    {profile.avatar_url ? (
                                        <img src={getStaticUrl(profile.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-400 m-auto mt-5" />
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{profile.full_name || app.applicant_name}</h3>
                                        <p className="text-slate-500 text-sm">{profile.bio || "No bio available"}</p>
                                    </div>
                                    
                                    {/* STATUS DROPDOWN */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Status:</label>
                                        <select 
                                            value={app.status}
                                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            className={`text-sm font-bold py-1 px-3 rounded-full border-none focus:ring-2 focus:ring-blue-500 cursor-pointer
                                                ${app.status === 'Accepted' ? 'bg-green-100 text-green-700' : 
                                                  app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
                                                  'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Interviewing">Interviewing</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {app.applicant?.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {profile.phone || "N/A"}</div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                                    <a href={getStaticUrl(app.resume_path)} target="_blank" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
                                        <Download className="w-4 h-4" /> Resume
                                    </a>
                                    <button 
                                        onClick={() => openChat(app.applicant_id, profile.full_name || "Applicant")}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- CHAT MODAL --- */}
            {activeChat && (
                <div className="fixed bottom-4 right-4 w-96 bg-white rounded-t-xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[500px]">
                    {/* Chat Header */}
                    <div className="bg-slate-900 text-white p-4 rounded-t-xl flex justify-between items-center">
                        <div className="font-bold flex items-center gap-2">
                            <User className="w-4 h-4" /> {activeChat.name}
                        </div>
                        <button onClick={() => setActiveChat(null)} className="hover:text-slate-300"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                        {messages.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">Start the conversation...</p>}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id !== activeChat.id; // If sender is NOT the applicant, it's me (recruiter)
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                        <input 
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default JobApplications;