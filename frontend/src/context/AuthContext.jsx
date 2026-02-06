import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const isRecruiter = localStorage.getItem('is_recruiter') === 'true';
        if (token) {
            setUser({ token, isRecruiter });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        
        // Correctly mapping snake_case from backend to camelCase for frontend
        const { access_token, is_recruiter } = response.data;

        localStorage.setItem('token', access_token);
        localStorage.setItem('is_recruiter', is_recruiter);
        
        // We assign 'is_recruiter' (value) to 'isRecruiter' (state property)
        setUser({ token: access_token, isRecruiter: is_recruiter });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_recruiter');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);