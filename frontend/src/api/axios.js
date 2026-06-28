import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auto-logout only when an *authenticated* request gets 401 (expired token).
// Never redirect for the login endpoint itself.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('is_recruiter');
            localStorage.removeItem('is_admin');
            localStorage.removeItem('user_id');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
