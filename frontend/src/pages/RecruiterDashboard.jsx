import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Users, MapPin } from 'lucide-react';

const RecruiterDashboard = () => {
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                const res = await api.get('/jobs/my-jobs'); 
                setJobs(res.data);
            } catch (err) {
                console.error("Failed to fetch jobs");
            }
        };
        fetchMyJobs();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Recruiter Portal</h1>
                        <p className="text-slate-500">Manage your postings and candidates.</p>
                    </div>
                    <Link to="/post-job" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                        <Plus className="w-5 h-5" /> Post New Job
                    </Link>
                </div>

                <div className="grid gap-6">
                    {jobs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow border border-slate-200">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900">No Active Jobs</h3>
                            <p className="text-slate-500 mb-4">You haven't posted any positions yet.</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.company}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                    </div>
                                </div>
                                <Link 
                                    to={`/applications/${job.id}`}
                                    className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition font-medium"
                                >
                                    <Users className="w-4 h-4" /> View Applicants
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecruiterDashboard;