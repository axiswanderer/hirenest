import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; 
import { Briefcase, UploadCloud, Users, CheckCircle, Search, ArrowRight } from 'lucide-react';

const JobBoard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [file, setFile] = useState(null);
    const [activeJobId, setActiveJobId] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs/');
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch jobs");
            }
        };
        fetchJobs();
    }, []);

    const handleApply = async (jobId) => {
        if (!file) return alert("Please select a PDF file first.");
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('applicant_name', "Applicant"); 
        formData.append('file', file);

        try {
            await api.post('/applications/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Application Sent Successfully!");
            setFile(null);
            setActiveJobId(null);
        } catch (err) {
            alert("Application Failed.");
        }
    };

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="bg-slate-900 min-h-screen font-sans text-white">
            
            {/* --- HERO SECTION --- */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 radial-gradient"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div 
                        initial="hidden" 
                        animate="visible" 
                        variants={fadeInUp}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-sm font-semibold mb-6">
                            🚀 The Future of Hiring is Here
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                            Find Your Next <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                Big Opportunity
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                            HireNest connects top-tier talent with world-class companies. 
                            Seamless, fast, and built for the modern workforce.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="#jobs" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-blue-500/25 flex items-center">
                                Browse Jobs <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                            {!user && (
                                <Link to="/register" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-medium border border-slate-700 transition">
                                    Join Now
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- STATS SECTION --- */}
            <div className="border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { label: "Active Jobs", value: "1,200+" },
                        { label: "Companies", value: "450+" },
                        { label: "Hired Candidates", value: "12k+" },
                        { label: "Success Rate", value: "98%" },
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-slate-400 text-sm uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- VALUE PROPOSITION --- */}
            <section className="py-24 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Why Choose HireNest?</h2>
                        <p className="text-slate-400">Everything you need to manage your career or your hiring pipeline.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <Search className="w-8 h-8 text-blue-400" />, title: "Smart Discovery", desc: "Our algorithm matches you with jobs that fit your exact skill set." },
                            { icon: <UploadCloud className="w-8 h-8 text-blue-400" />, title: "Easy Apply", desc: "Upload your resume once and apply to multiple companies in one click." },
                            { icon: <Briefcase className="w-8 h-8 text-blue-400" />, title: "Top Companies", desc: "Get access to exclusive listings from Fortune 500 tech giants." },
                        ].map((feature, i) => (
                            <motion.div 
                                key={i} 
                                whileHover={{ y: -5 }}
                                className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50"
                            >
                                <div className="bg-slate-900 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- LIVE JOB BOARD (Functional Part) --- */}
            <section id="jobs" className="py-24 bg-slate-50 text-slate-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Latest Openings</h2>
                            <p className="text-slate-500 mt-2">Explore the newest roles posted by our partners.</p>
                        </div>
                        {user && user.isRecruiter && (
                             <Link to="/post-job" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                                + Post New Job
                             </Link>
                        )}
                    </div>

                    <div className="grid gap-6">
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                <p className="text-slate-500 text-lg">No jobs available right now. Check back later!</p>
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <motion.div 
                                    key={job.id} 
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {job.title}
                                                </h3>
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">New</span>
                                            </div>
                                            <p className="text-slate-600 font-medium mb-1">{job.company} • {job.location}</p>
                                            <p className="text-slate-500 text-sm mt-3 line-clamp-2">{job.description}</p>
                                        </div>

                                        <div className="min-w-[200px] flex flex-col items-end gap-3">
                                            {/* RECRUITER ACTION */}
                                            {user && user.isRecruiter ? (
                                                <Link 
                                                    to={`/applications/${job.id}`}
                                                    className="w-full text-center bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                                                >
                                                    View Applicants
                                                </Link>
                                            ) : user ? (
                                                // APPLICANT ACTION
                                                <div className="w-full">
                                                    {!activeJobId || activeJobId !== job.id ? (
                                                        <button 
                                                            onClick={() => setActiveJobId(job.id)}
                                                            className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                                                        >
                                                            Apply Now
                                                        </button>
                                                    ) : (
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in zoom-in duration-200">
                                                            <input 
                                                                type="file" 
                                                                accept="application/pdf"
                                                                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 mb-2"
                                                                onChange={(e) => setFile(e.target.files[0])}
                                                            />
                                                            <button 
                                                                onClick={() => handleApply(job.id)} 
                                                                className="w-full bg-green-600 text-white py-1.5 rounded text-xs font-medium hover:bg-green-700"
                                                            >
                                                                Confirm Upload
                                                            </button>
                                                            <button 
                                                                onClick={() => setActiveJobId(null)}
                                                                className="w-full text-slate-400 text-xs mt-1 hover:text-slate-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <Link to="/login" className="text-blue-600 text-sm font-medium hover:underline">
                                                    Login to Apply
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="py-24 bg-slate-900 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Loved by Professionals</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Sarah J.", role: "Software Engineer", quote: "HireNest made it incredibly easy to find a remote role that fits my lifestyle. The process was seamless." },
                            { name: "David K.", role: "Product Manager", quote: "As a recruiter, the quality of candidates I find here is unmatched. The dashboard is intuitive and fast." },
                            { name: "Elena R.", role: "UX Designer", quote: "I love the minimalist design and how quick it is to apply. No more filling out 10-page forms!" },
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-800 p-8 rounded-2xl relative">
                                <div className="absolute -top-4 left-8 bg-blue-600 p-2 rounded-full">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-slate-300 italic mb-6">"{t.quote}"</p>
                                <div className="text-left">
                                    <div className="font-bold text-white">{t.name}</div>
                                    <div className="text-sm text-blue-400">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-black py-12 border-t border-slate-800 text-slate-500 text-sm">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <span className="text-2xl font-bold text-white tracking-tight">Hire<span className="text-blue-600">Nest</span></span>
                        <p className="mt-2">© 2026 HireNest Inc. All rights reserved.</p>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                        <a href="#" className="hover:text-white transition">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default JobBoard;