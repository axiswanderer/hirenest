import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isRecruiter = localStorage.getItem('is_recruiter') === 'true';
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        const userId = Number(localStorage.getItem('user_id')) || null;
        if (token) {
            setUser({ token, isRecruiter, isAdmin, userId });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        const { access_token, is_recruiter, is_admin, user_id } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('is_recruiter', is_recruiter);
        localStorage.setItem('is_admin', is_admin);
        localStorage.setItem('user_id', user_id);

        const userData = { token: access_token, isRecruiter: is_recruiter, isAdmin: is_admin, userId: user_id };
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_recruiter');
        localStorage.removeItem('is_admin');
        localStorage.removeItem('user_id');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
