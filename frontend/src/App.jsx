import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WSProvider } from './context/WSContext';
import NotificationBell from './components/NotificationBell';
import Login from './pages/Login';
import Register from './pages/Register';
import JobBoard from './pages/JobBoard';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import JobApplications from './pages/JobApplications';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

const NavLink = ({ to, children }) => {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link
            to={to}
            className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 rounded-md group ${
                active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            {children}
            <span className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
        </Link>
    );
};

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                            <span className="text-white font-black text-xs">H</span>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-white">
                            Hire<span className="gradient-text">Nest</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-1">
                        {user ? (
                            <>
                                <span className="hidden sm:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-full text-xs font-semibold border" style={{
                                    background: user.isAdmin ? 'rgba(124,58,237,0.12)' : user.isRecruiter ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)',
                                    borderColor: user.isAdmin ? 'rgba(124,58,237,0.3)' : user.isRecruiter ? 'rgba(6,182,212,0.28)' : 'rgba(16,185,129,0.28)',
                                    color: user.isAdmin ? '#a78bfa' : user.isRecruiter ? '#22d3ee' : '#34d399',
                                }}>
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
                                        background: user.isAdmin ? '#a78bfa' : user.isRecruiter ? '#22d3ee' : '#34d399'
                                    }} />
                                    {user.isAdmin ? 'Admin' : user.isRecruiter ? 'Recruiter' : 'Applicant'}
                                </span>

                                {user.isAdmin && <NavLink to="/admin">Admin</NavLink>}

                                {user.isRecruiter ? (
                                    <>
                                        <NavLink to="/recruiter-dashboard">Dashboard</NavLink>
                                        <Link to="/post-job" className="ml-1 btn-primary btn-shimmer text-sm px-4 py-2 flex items-center gap-1.5">
                                            <span className="text-base leading-none">+</span> Post Job
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <NavLink to="/applicant-dashboard">Dashboard</NavLink>
                                        <NavLink to="/profile">Profile</NavLink>
                                    </>
                                )}

                                <NotificationBell />

                                <button
                                    onClick={logout}
                                    className="ml-1 px-3 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors duration-300 rounded-md"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login">Log in</NavLink>
                                <Link to="/register" className="ml-1 btn-primary btn-shimmer text-sm px-4 py-2">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

const PrivateRoute = ({ children, recruiterOnly = false, adminOnly = false }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen grid-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Authenticating...</p>
            </div>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (recruiterOnly && !user.isRecruiter) return <Navigate to="/" />;
    if (adminOnly && !user.isAdmin) return <Navigate to="/" />;
    return children;
};

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            >
                <Routes>
                    <Route path="/" element={<JobBoard />} />
                    <Route path="/jobs/:id" element={<JobDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/recruiter-dashboard" element={
                        <PrivateRoute recruiterOnly><RecruiterDashboard /></PrivateRoute>
                    } />
                    <Route path="/post-job" element={
                        <PrivateRoute recruiterOnly><CreateJob /></PrivateRoute>
                    } />
                    <Route path="/applications/:jobId" element={
                        <PrivateRoute recruiterOnly><JobApplications /></PrivateRoute>
                    } />

                    <Route path="/applicant-dashboard" element={
                        <PrivateRoute><ApplicantDashboard /></PrivateRoute>
                    } />
                    <Route path="/profile" element={
                        <PrivateRoute><ProfilePage /></PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>
                    } />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <WSProvider>
                <Router>
                    <Navbar />
                    <AnimatedRoutes />
                </Router>
            </WSProvider>
        </AuthProvider>
    );
}
