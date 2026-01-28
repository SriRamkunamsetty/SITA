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

const Experience = () => {
    const navigate = useNavigate();

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
                    <span className="font-mono text-xs text-muted-foreground tracking-wider">
                        v2.4.7 // NEURAL CORE ONLINE
                    </span>
                </div>

                {/* Main Title */}
                <div className="relative z-10 text-center">
                    <Hero3D />

                    {/* CTA Button */}
                    <div className="mt-12 md:mt-16">
                        <NeonButton
                            onClick={() => navigate('/access')}
                            size="lg"
                        >
                            Access SITA
                        </NeonButton>
                    </div>
                </div>

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
                            <GlassPanel className="p-8" corners>
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
                        className="p-8 md:p-12 hover:border-destructive/30 transition-colors duration-500"
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
                            onClick={() => navigate('/access')}
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
