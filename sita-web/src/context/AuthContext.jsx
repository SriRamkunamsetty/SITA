import { createContext, useState, useEffect, useContext } from 'react';
import { googleLogout } from '@react-oauth/google';
import { apiRequest } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial session check
    useEffect(() => {
        const storedEmail = localStorage.getItem('sita_user_email');
        if (storedEmail) {
            checkSession(storedEmail);
        } else {
            setLoading(false);
        }
    }, []);

    const checkSession = async (email) => {
        try {
            const data = await apiRequest(`/user/me?email=${email}`, 'GET', null, email);
            setUser(data);
        } catch (err) {
            console.error("Session restoration failed:", err);
            localStorage.removeItem('sita_user_email');
        } finally {
            setLoading(false);
        }
    };

    // Generic Login (Google or OTP)
    // Expects: email (string), userData (object from backend or google)
    const login = async (email, userData) => {
        setLoading(true);
        try {
            // Persist session
            localStorage.setItem('sita_user_email', email);

            // If userData is incomplete (e.g. just google profile), verify with backend
            // But AccessGate already calls upsert/verify, so userData should be fresh from backend.
            // We'll trust the passed object or fetch fresh.
            if (!userData.role) {
                const freshData = await apiRequest(`/user/me?email=${email}`, 'GET', null, email);
                setUser(freshData);
                return freshData;
            } else {
                setUser(userData);
                return userData;
            }
        } catch (err) {
            console.error("Login context failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        googleLogout();
        localStorage.removeItem('sita_user_email');
        setUser(null);
    };

    const refreshUser = async () => {
        if (user?.email) {
            await checkSession(user.email);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
