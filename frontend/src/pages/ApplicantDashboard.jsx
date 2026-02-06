import { useEffect, useState } from 'react';
import api from '../api/axios';
import { MessageSquare, Send, X, User } from 'lucide-react';

const ApplicantDashboard = () => {
    const [activeTab, setActiveTab] = useState('browse');
    const [jobs, setJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [file, setFile] = useState(null);
    const [applyingJobId, setApplyingJobId] = useState(null);

    // --- CHAT STATE ---
    const [activeChat, setActiveChat] = useState(null); // { recruiterId, jobTitle }
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        api.get('/jobs/').then(res => setJobs(res.data));
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            api.get('/applications/me').then(res => setMyApplications(res.data));
        }
    }, [activeTab]);

    // Apply Logic
    const handleApply = async (jobId) => {
        if (!file) return alert("Upload PDF first");
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('applicant_name', "Me");
        formData.append('file', file);
        try {
            await api.post('/applications/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            alert("Applied!");
            setApplyingJobId(null);
        } catch(e) { alert("Error applying"); }
    };

    // --- CHAT LOGIC ---
    const openChat = async (recruiterId, jobTitle) => {
        if (!recruiterId) return alert("Error: Recruiter not found for this job.");
        
        setActiveChat({ id: recruiterId, title: jobTitle });
        try {
            const res = await api.get(`/messages/${recruiterId}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to load chat", err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await api.post('/messages/', { receiver_id: activeChat.id, content: newMessage });
            setNewMessage("");
            // Refresh chat immediately
            const res = await api.get(`/messages/${activeChat.id}`);
            setMessages(res.data);
        } catch (err) { 
            console.error("Failed to send"); 
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 relative">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">Applicant Portal</h1>
                
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-200 pb-1">
                    <button onClick={() => setActiveTab('browse')} className={`pb-3 px-4 font-medium ${activeTab === 'browse' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Browse Jobs</button>
                    <button onClick={() => setActiveTab('history')} className={`pb-3 px-4 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>My Applications</button>
                </div>

                {activeTab === 'browse' ? (
                    <div className="grid gap-4">
                        {jobs.map(job => (
                            <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold">{job.title}</h3>
                                <p className="text-slate-500 text-sm mb-4">{job.company} • {job.location}</p>
                                {applyingJobId === job.id ? (
                                    <div className="flex gap-2">
                                        <input type="file" onChange={e => setFile(e.target.files[0])} className="text-sm"/>
                                        <button onClick={() => handleApply(job.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Confirm</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setApplyingJobId(job.id)} className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium">Apply Now</button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {myApplications.map(app => (
                                    <tr key={app.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {app.job ? app.job.title : `Job #${app.job_id}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                app.status === 'Accepted' ? 'bg-green-100 text-green-800' : 
                                                app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {app.job && app.job.recruiter_id ? (
                                                <button 
                                                    onClick={() => openChat(app.job.recruiter_id, app.job.title)}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Message Recruiter
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs">Chat Unavailable</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {myApplications.length === 0 && <div className="p-8 text-center text-slate-500">No applications yet.</div>}
                    </div>
                )}
            </div>

            {/* --- CHAT MODAL --- */}
            {activeChat && (
                <div className="fixed bottom-4 right-4 w-96 bg-white rounded-t-xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[500px]">
                    <div className="bg-slate-900 text-white p-4 rounded-t-xl flex justify-between items-center">
                        <div className="font-bold flex items-center gap-2 text-sm">
                            <User className="w-4 h-4" /> Chatting about: {activeChat.title}
                        </div>
                        <button onClick={() => setActiveChat(null)} className="hover:text-slate-300"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                        {messages.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">Say hello to the recruiter!</p>}
                        {messages.map((msg) => {
                            // If I am the SENDER, it appears on the right
                            const isMe = msg.sender_id !== activeChat.id; 
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

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

export default ApplicantDashboard;