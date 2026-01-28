import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Hide navbar on Experience page for full immersion, or keep it minimal?
    // Let's keep it minimal.

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 pointer-events-none"
        >
            <Link to="/" className="pointer-events-auto group">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-neon/20 border border-brand-neon rounded-sm flex items-center justify-center group-hover:bg-brand-neon/40 transition-all">
                        <div className="w-2 h-2 bg-brand-neon rounded-full animate-pulse" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-widest text-white group-hover:text-brand-neon transition-colors">
                        SITA
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-8 pointer-events-auto">
                {!user ? (
                    location.pathname !== '/access' && (
                        <Link to="/access" className="nav-link font-mono text-sm uppercase tracking-widest">
                            [ Initiate Access ]
                        </Link>
                    )
                ) : (
                    <div className="flex items-center gap-6">
                        <span className="font-mono text-xs text-brand-neon/70">
                            ID: {user.email.split('@')[0]}
                        </span>
                        <button
                            onClick={logout}
                            className="nav-link font-mono text-xs text-brand-alert hover:text-red-400 uppercase tracking-widest"
                        >
                            [ Terminate ]
                        </button>
                    </div>
                )}
            </div>
        </motion.nav>
    );
}
