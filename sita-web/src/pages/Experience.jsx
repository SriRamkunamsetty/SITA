import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Brain, Eye, Lock, ChevronDown, Zap, Network, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import GridOverlay from '../components/GridOverlay';
import Hero3D from '../components/Hero3D';
import GlassPanel from '../components/ui/GlassPanel';
import NeonButton from '../components/ui/NeonButton';
import FeatureCard from '../components/FeatureCard';
import StatusIndicator from '../components/StatusIndicator';
import { apiRequest, API_BASE } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const AdminLoginColumn = ({ navigate, login }) => {
    const [orgId, setOrgId] = useState('');
    const [orgName, setOrgName] = useState(''); // Was adminId
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/admin/login', 'POST', {
                org_unique_code: orgId,
                org_name: orgName,
                password: password
            });

            if (data && data.email) {
                await login(data.email, data);
                navigate('/admin'); // Admin goes to Admin Dashboard
            }
        } catch (e) {
            alert("ADMIN ACCESS DENIED: " + (e.message || "Invalid Credentials"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border border-red-500/30 bg-red-500/5 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors duration-500" />
            <Shield className="w-12 h-12 text-red-500 mb-4" />
            <h4 className="font-orbitron text-lg font-bold text-white mb-2">ORG ADMIN</h4>
            <p className="font-mono text-[10px] text-red-300 uppercase mb-4 h-8 animate-pulse">Strict Protocol Enforced</p>

            <div className="w-full space-y-3 relative z-10">
                <input
                    className="w-full bg-black/50 border border-red-500/30 rounded p-2 text-white text-xs font-mono focus:border-red-500 focus:outline-none placeholder:text-red-500/50"
                    placeholder="ORG ID (e.g. SITA-DL-12X)"
                    value={orgId}
                    onChange={e => setOrgId(e.target.value)}
                />
                <input
                    className="w-full bg-black/50 border border-red-500/30 rounded p-2 text-white text-xs font-mono focus:border-red-500 focus:outline-none placeholder:text-red-500/50"
                    placeholder="SECTOR DESIGNATION (Name)"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                />
                <input
                    type="password"
                    className="w-full bg-black/50 border border-red-500/30 rounded p-2 text-white text-xs font-mono focus:border-red-500 focus:outline-none placeholder:text-red-500/50"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <NeonButton
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full border-red-500 text-red-500 hover:bg-red-500/20"
                >
                    {loading ? 'VERIFYING...' : 'LOGIN'}
                </NeonButton>
            </div>
        </div>
    );
};

const Experience = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);

    // Super Admin State
    const [superAdminMode, setSuperAdminMode] = useState(null); // null, 'setup', 'generated', 'login'
    const [saPassword, setSaPassword] = useState('');
    const [saAgentId, setSaAgentId] = useState('');
    const [generatedId, setGeneratedId] = useState('');

    const handleSuperAdminClick = async () => {
        try {
            const data = await apiRequest('/super-admin/check');
            if (data && data.exists) {
                setSuperAdminMode('login');
            } else {
                setSuperAdminMode('setup');
            }
        } catch (e) {
            console.error("Failed to check super admin status", e);
        }
    };

    const handleSuperAdminSetup = async () => {
        try {
            const data = await apiRequest('/super-admin/setup', 'POST', { password: saPassword });
            if (data && data.agent_id) {
                setGeneratedId(data.agent_id);
                setSuperAdminMode('generated');
            }
        } catch (e) {
            console.error("Setup failed", e);
            alert("Setup Failed: " + e.message);
        }
    };

    const handleSuperAdminLogin = async () => {
        try {
            const data = await apiRequest('/super-admin/login', 'POST', {
                password: saPassword
            });

            if (data && data.email) {
                await login(data.email, data); // Log them in context
                navigate('/super-admin'); // Super Admin Dashboard
            }
        } catch (e) {
            console.error("Login failed", e);
            alert("AUTHENTICATION FAILED: " + (e.message || "Invalid Credentials"));
        }
    };

    const scrollToContent = () => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    };

    const capabilities = [
        {
            icon: <Eye className="w-8 h-8" />,
            title: 'Vehicle Identification',
            description: 'Automated classification of vehicle types including Cars, Trucks, Motorcycles, and Buses with high-precision neural detection.',
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: 'Color Analytics',
            description: 'Advanced vision algorithms extract precise hexadecimal and human-readable color data from every detected vehicle in the stream.',
        },
        {
            icon: <Network className="w-8 h-8" />,
            title: 'License Plate Recognition',
            description: 'Optical Character Recognition (OCR) captures and logs vehicle registration plates for security and tracking protocols.',
        },
        {
            icon: <Database className="w-8 h-8" />,
            title: 'Intelligence Ingestion',
            description: 'Secure logging of all attributes—Type, Color, and Number Plate—into the SITA Global Intelligence Core.',
        },
    ];

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    const staggerContainer = {
        initial: {},
        whileInView: { transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <StarField />
            <GridOverlay />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
                {/* Status Bar */}
                <div className="absolute top-6 left-6 flex items-center gap-6 z-20">
                    <StatusIndicator status="online" label="SYSTEM ACTIVE" />
                    <button
                        onClick={() => setShowSuperAdminLogin(!showSuperAdminLogin)}
                        className="font-mono text-xs text-muted-foreground tracking-wider hover:text-purple-500 transition-colors cursor-pointer"
                        title="System Core Access"
                    >
                        v2.4.7 // NEURAL CORE ONLINE
                    </button>
                </div>

                {/* Main Title */}
                <div className="relative z-10 text-center">
                    <Hero3D />

                    {/* CTA Button */}
                    <div className="mt-12 md:mt-16">
                        <NeonButton
                            onClick={() => setShowRoleSelector(true)}
                            size="lg"
                        >
                            Access SITA
                        </NeonButton>
                    </div>
                </div>

                // Role Selector Modal
                {showRoleSelector && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />

                        <GlassPanel className="w-full max-w-5xl p-4 md:p-8 relative z-10" corners>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                            <div className="text-center mb-10">
                                <h3 className="font-orbitron text-2xl font-bold text-white mb-2 tracking-wider">SECURE LOGIN GATEWAY</h3>
                                <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.2em]">Select Your Clearance Level</p>
                            </div>

                            <button
                                onClick={() => setShowRoleSelector(false)}
                                className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* 1. SUPER ADMIN COLUMN */}
                                <div className="p-6 border border-purple-500/30 bg-purple-500/5 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-500" />
                                    <Eye className="w-12 h-12 text-purple-500 mb-4 animate-pulse" />
                                    <h4 className="font-orbitron text-lg font-bold text-white mb-2">SYSTEM GOVERNOR</h4>
                                    <p className="font-mono text-[10px] text-purple-300 uppercase mb-6 h-8">Platform Control & Organization Governance</p>

                                    {!superAdminMode ? (
                                        <NeonButton
                                            onClick={() => handleSuperAdminClick()}
                                            className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/20"
                                        >
                                            ACCESS CORE
                                        </NeonButton>
                                    ) : (
                                        <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 relative z-10">
                                            {superAdminMode === 'setup' ? (
                                                <>
                                                    <p className="font-mono text-[10px] text-purple-400">GENESIS REQUIRED</p>
                                                    <input
                                                        type="password"
                                                        placeholder="Set Master Password"
                                                        className="w-full bg-black/50 border border-purple-500/50 rounded p-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                                                        value={saPassword}
                                                        onChange={e => setSaPassword(e.target.value)}
                                                    />
                                                    <NeonButton onClick={handleSuperAdminSetup} size="sm" className="w-full border-purple-500 text-purple-500">
                                                        INITIALIZE
                                                    </NeonButton>
                                                </>
                                            ) : superAdminMode === 'generated' ? (
                                                <div className="bg-green-500/10 p-2 rounded border border-green-500/30">
                                                    <p className="text-[10px] text-green-400">ID: {generatedId}</p>
                                                    <NeonButton onClick={() => setSuperAdminMode('login')} size="sm" className="w-full mt-2">LOGIN</NeonButton>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="password"
                                                        placeholder="Master Password"
                                                        className="w-full bg-black/50 border border-purple-500/50 rounded p-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                                                        value={saPassword}
                                                        onChange={e => setSaPassword(e.target.value)}
                                                    />
                                                    <NeonButton onClick={handleSuperAdminLogin} size="sm" className="w-full border-purple-500 text-purple-500">
                                                        AUTHENTICATE
                                                    </NeonButton>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 2. ADMIN COLUMN */}
                                <AdminLoginColumn navigate={navigate} login={login} />

                                {/* 3. USER COLUMN */}
                                <div className="p-6 border border-blue-500/30 bg-blue-500/5 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500" />
                                    <Brain className="w-12 h-12 text-blue-500 mb-4" />
                                    <h4 className="font-orbitron text-lg font-bold text-white mb-2">FIELD AGENT</h4>
                                    <p className="font-mono text-[10px] text-blue-300 uppercase mb-6 h-8">Traffic Monitoring & Detection Dashboard</p>

                                    <NeonButton
                                        onClick={() => navigate('/access', { state: { role: 'agent' } })}
                                        className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/20"
                                    >
                                        AGENT LOGIN
                                    </NeonButton>
                                    <p className="mt-4 font-mono text-[9px] text-muted-foreground">
                                        Supported: Email OTP, Mobile OTP, Org Credentials
                                    </p>
                                </div>
                            </div>

                        </GlassPanel>
                    </div>
                )}

                {/* Scroll Indicator */}
                <button
                    onClick={scrollToContent}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer z-20"
                >
                    <span className="font-mono text-xs uppercase tracking-widest">Explore</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                </button>

                {/* Decorative Lines */}
                <div className="absolute left-0 top-1/2 w-32 h-px bg-gradient-to-r from-transparent to-primary/30" />
                <div className="absolute right-0 top-1/2 w-32 h-px bg-gradient-to-l from-transparent to-primary/30" />
            </section>

            {/* About Section */}
            <section id="about" className="relative py-24 md:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16 md:mb-24"
                        {...fadeInUp}
                    >
                        <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase">
              // SYSTEM OVERVIEW
                        </span>
                        <h2 className="font-orbitron text-3xl md:text-5xl font-bold mt-4 mb-6">
                            What is <span className="text-primary">SITA</span>?
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div {...fadeInUp}>
                            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-8">
                                SITA is an advanced artificial intelligence system designed for comprehensive
                                traffic network analysis. It operates as a neural processing core, transforming
                                raw data streams into actionable intelligence. By leveraging computer vision
                                and deep learning, SITA identifies **vehicle types**, extracts **precise colors**,
                                and performs **optical character recognition on number plates** with exceptional accuracy.
                            </p>
                            <GlassPanel className="p-4 md:p-8" corners>
                                <div className="grid grid-cols-3 gap-8 text-center">
                                    <div>
                                        <div className="font-orbitron text-3xl md:text-4xl font-bold text-primary mb-2">2.4M</div>
                                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Data Points / Sec</div>
                                    </div>
                                    <div>
                                        <div className="font-orbitron text-3xl md:text-4xl font-bold text-primary mb-2">99.7%</div>
                                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</div>
                                    </div>
                                    <div>
                                        <div className="font-orbitron text-3xl md:text-4xl font-bold text-primary mb-2">&lt;50ms</div>
                                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Latency</div>
                                    </div>
                                </div>
                            </GlassPanel>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <GlassPanel className="p-2 overflow-hidden bg-black/50" corners>
                                <img
                                    src="/assets/detection_demo.png"
                                    alt="SITA Detection Interface"
                                    className="w-full h-auto rounded border border-primary/20 opacity-80 hover:opacity-100 transition-opacity duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div className="font-mono text-xs text-primary bg-black/80 px-2 py-1 rounded border border-primary/30">
                                        LIVE FEED // CAM-04
                                    </div>
                                </div>
                            </GlassPanel>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Capabilities Section */}
            <section className="relative py-24 md:py-32 px-4 bg-black/20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        {...fadeInUp}
                    >
                        <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase">
              // CORE CAPABILITIES
                        </span>
                        <h2 className="font-orbitron text-3xl md:text-5xl font-bold mt-4">
                            What Can It Do?
                        </h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {capabilities.map((cap, index) => (
                            <motion.div key={cap.title} variants={fadeInUp}>
                                <FeatureCard
                                    icon={cap.icon}
                                    title={cap.title}
                                    description={cap.description}
                                    index={index}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Why It Matters Section */}
            <section className="relative py-24 md:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        {...fadeInUp}
                    >
                        <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase">
                // MISSION CRITICAL
                        </span>
                        <h2 className="font-orbitron text-3xl md:text-5xl font-bold mt-4 mb-8">
                            Why It Matters
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="order-2 lg:order-1 relative"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Analytics Image */}
                            <GlassPanel className="p-2 overflow-hidden bg-black/50" corners>
                                <img
                                    src="/assets/analytics_demo.png"
                                    alt="SITA Analytics Dashboard"
                                    className="w-full h-auto rounded border border-primary/20 opacity-80 hover:opacity-100 transition-opacity duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                            </GlassPanel>
                        </motion.div>

                        <motion.div className="order-1 lg:order-2" {...fadeInUp}>
                            <GlassPanel className="p-8 md:p-12" corners>
                                <div className="flex items-center gap-4 mb-6">
                                    <Zap className="w-8 h-8 text-warning" />
                                    <span className="font-orbitron text-xl md:text-2xl font-semibold">
                                        Intelligence at Scale
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    Modern traffic networks generate petabytes of data daily. Human analysis
                                    cannot keep pace. SITA provides the cognitive infrastructure needed to
                                    maintain safety, efficiency, and situational awareness across complex
                                    transportation ecosystems. It sees what we cannot, predicts what we miss,
                                    and responds before we react.
                                </p>
                            </GlassPanel>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Access Control Section */}
            <section className="relative py-24 md:py-32 px-4">
                <motion.div
                    className="max-w-4xl mx-auto"
                    {...fadeInUp}
                >
                    <div className="text-center mb-12">
                        <span className="font-mono text-xs text-destructive tracking-[0.3em] uppercase">
              // RESTRICTED ACCESS
                        </span>
                        <h2 className="font-orbitron text-3xl md:text-5xl font-bold mt-4 mb-6">
                            Responsible Access
                        </h2>
                    </div>

                    <GlassPanel
                        className="p-6 md:p-12 hover:border-destructive/30 transition-colors duration-500"
                        style={{ borderColor: 'hsl(340 100% 60% / 0.2)' }}
                    >
                        <div className="flex items-start gap-6">
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                                <Shield className="w-8 h-8 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-orbitron text-xl font-semibold mb-4 text-destructive">
                                    CLEARANCE REQUIRED
                                </h3>
                                <p className="text-muted-foreground leading-relaxed mb-6">
                                    SITA is a high-security intelligence system. Access is granted only to
                                    verified agents who acknowledge the responsibility of handling sensitive
                                    traffic data. All sessions are monitored and logged. Misuse will result
                                    in immediate access revocation and potential legal action.
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                        <span>End-to-End Encrypted</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Eye className="w-4 h-4" />
                                        <span>Session Monitoring</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Final CTA */}
                    <div className="text-center mt-16">
                        <NeonButton
                            onClick={() => setShowRoleSelector(true)}
                            size="lg"
                        >
                            Request Access
                        </NeonButton>
                        <p className="font-mono text-xs text-muted-foreground mt-4 tracking-wider">
                            IDENTITY VERIFICATION REQUIRED
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="relative py-8 px-4 border-t border-border/30">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="font-orbitron text-sm text-muted-foreground">
                        SITA // SMART INTELLIGENT TRAFFIC ANALYZER
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                        NEURAL CORE v2.4.7 // ALL SYSTEMS OPERATIONAL
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Experience;
