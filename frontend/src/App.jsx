import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import JobBoard from './pages/JobBoard';
import CreateJob from './pages/CreateJob';
import JobApplications from './pages/JobApplications';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import ProfilePage from './pages/ProfilePage'; 

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-extrabold text-white tracking-tight">
                            Hire<span className="text-blue-500">Nest</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-slate-400 text-sm font-medium hidden sm:block">
                                    {user.isRecruiter ? "Recruiter" : "Applicant"}
                                </span>
                                
                                {user.isRecruiter ? (
                                    /* Recruiter Links */
                                    <>
                                        <Link to="/recruiter-dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                                            Dashboard
                                        </Link>
                                        <Link to="/post-job" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">
                                            + Post Job
                                        </Link>
                                    </>
                                ) : (
                                    /* Applicant Links */
                                    <>
                                        <Link to="/applicant-dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                                            My Dashboard
                                        </Link>
                                        <Link to="/profile" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                                            My Profile
                                        </Link>
                                    </>
                                )}
                                
                                <button onClick={logout} className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                                    Log out
                                </button>
                            </>
                        ) : (
                            /* Public Links */
                            <>
                                <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">Log in</Link>
                                <Link to="/register" className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition">Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

// Security Wrapper
const PrivateRoute = ({ children, recruiterOnly = false }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-10 text-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (recruiterOnly && !user.isRecruiter) return <Navigate to="/" />;
    return children;
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Navbar />
                <Routes>
                    {/* Public Home Page */}
                    <Route path="/" element={<JobBoard />} /> 
                    
                    {/* Auth Pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Recruiter Routes */}
                    <Route path="/recruiter-dashboard" element={
                        <PrivateRoute recruiterOnly={true}><RecruiterDashboard /></PrivateRoute>
                    } />
                    <Route path="/post-job" element={
                        <PrivateRoute recruiterOnly={true}><CreateJob /></PrivateRoute>
                    } />
                    <Route path="/applications/:jobId" element={
                        <PrivateRoute recruiterOnly={true}><JobApplications /></PrivateRoute>
                    } />

                    {/* Applicant Routes */}
                    <Route path="/applicant-dashboard" element={
                        <PrivateRoute><ApplicantDashboard /></PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute><ProfilePage /></PrivateRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}