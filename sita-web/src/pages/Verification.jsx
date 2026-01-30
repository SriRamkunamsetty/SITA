import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import GlassPanel from '../components/ui/GlassPanel';
import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import { useSystemSound } from '../hooks/useSystemSound';
import { useToast } from '../context/ToastContext';

export default function Verification() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { playScan, playAccessGranted, playAccessDenied } = useSystemSound();
    const [status, setStatus] = useState('checking'); // checking, verifying, verified, rejected
    const [subStatus, setSubStatus] = useState('INITIALIZING SECURE HANDSHAKE...');

    useEffect(() => {
        let interval;
        if (!user) return;

        const performChecks = async () => {
            // Emulate a "Scan" process even if backend is fast
            // 1. Initial Scan
            playScan();
            setStatus('checking');
            setSubStatus('SCANNING BIOMETRIC SIGNATURE...');
            await new Promise(r => setTimeout(r, 1500));

            // 2. Database Handshake
            playScan();
            setSubStatus('ESTABLISHING NEURAL LINK...');

            try {
                const userData = await apiRequest(`/user/me?email=${user.email}`, 'GET', null, user.email);

                // PERMISSIVE CHECK: Allow verified OR pending (Auto-verify)
                if (userData.status === 'verified' || userData.status === 'pending_onboarding') {
                    // 3. Success Sequence
                    playAccessGranted();
                    showToast("SECURITY CLEARANCE GRANTED", "success");
                    setStatus('verified');
                    setSubStatus('IDENTITY CONFIRMED. DECRYPTING CLEARANCE...');
                    await new Promise(r => setTimeout(r, 1500));

                    if (userData.role === 'super_admin') navigate('/super-admin');
                    else if (userData.role === 'admin') navigate('/admin');
                    else navigate('/agent'); // Default for users/agents
                } else {
                    // Even if rejected or pending, we force access now as per user demand
                    console.warn("Status is", userData.status, "but forcing access.");
                    playAccessGranted();
                    showToast("ACCESS GRANTED (FORCE MODE)", "success");
                    setStatus('verified');
                    await new Promise(r => setTimeout(r, 1000));
                    navigate('/agent');
                }
            } catch (err) {
                console.error("Verification error", err);
                // FORCE BYPASS ON ERROR
                playAccessGranted();
                showToast("SYSTEM OVERRIDE: ACCESS GRANTED", "success");
                setStatus('verified');
                setSubStatus('BYPASSING SECURITY PROTOCOLS...');
                await new Promise(r => setTimeout(r, 1000));
                navigate('/agent');
            }
        };

        performChecks();

        return () => { };
    }, [user, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-brand-dark overflow-hidden relative">

            {/* Background Glitchy elements */}
            {status === 'checking' && (
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div className="w-full h-1 bg-brand-neon absolute top-10 animate-pulse" />
                    <div className="w-full h-1 bg-brand-neon absolute bottom-20 animate-pulse" />
                </div>
            )}

            <GlassPanel className="w-full max-w-md text-center py-16 relative z-10 border-brand-neon/20">
                <div className="flex justify-center mb-8 h-24 items-center">
                    <AnimatePresence mode="wait">
                        {status === 'checking' && (
                            <motion.div
                                key="lock-checking"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative w-24 h-24 flex items-center justify-center"
                            >
                                <div className="absolute inset-0 border-4 border-brand-neon/30 border-t-brand-neon rounded-full animate-spin" />
                                <Lock size={40} className="text-white/50 relative z-10" />
                            </motion.div>
                        )}

                        {status === 'verified' && (
                            <motion.div
                                key="lock-verified"
                                initial={{ scale: 0.8, rotate: -45, opacity: 0 }}
                                animate={{ scale: 1.1, rotate: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <div className="absolute inset-0 bg-brand-success/20 blur-xl rounded-full" />
                                <Unlock size={64} className="text-brand-success relative z-10" />
                            </motion.div>
                        )}

                        {status === 'rejected' && (
                            <motion.div
                                key="lock-rejected"
                                initial={{ x: -10 }}
                                animate={{ x: [0, -10, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5 }}
                            >
                                <AlertTriangle size={64} className="text-brand-alert" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.h2
                    key={status} // re-animate on change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-3xl font-bold text-white mb-2 tracking-widest uppercase"
                >
                    {status === 'checking' && "AUTHENTICATING"}
                    {status === 'verified' && <span className="text-brand-success text-shadow-glow">CLEARANCE GRANTED</span>}
                    {status === 'rejected' && <span className="text-brand-alert">ACCESS DENIED</span>}
                </motion.h2>

                <p className="text-brand-neon/70 font-mono text-xs uppercase tracking-[0.2em] mb-8 min-h-[1.5em] animate-pulse">
                    {subStatus}
                </p>

                {status === 'checking' && (
                    <div className="relative w-64 mx-auto h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-brand-neon box-shadow-glow"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "linear" }}
                        />
                    </div>
                )}
            </GlassPanel>
        </div>
    );
}
