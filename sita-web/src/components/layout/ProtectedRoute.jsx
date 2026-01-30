import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-brand-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-brand-neon/30 border-t-brand-neon rounded-full animate-spin" />
                    <span className="text-brand-neon font-mono animate-pulse">AUTHENTICATING...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Admins and Super Admins bypass verification check (they are verified by credentials)
    if (user.role !== 'admin' && user.role !== 'super_admin' && user.status !== 'verified') {
        return <Navigate to="/verification" replace />;
    }

    return children;
}
