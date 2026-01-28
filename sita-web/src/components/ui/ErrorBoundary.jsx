import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import GlassPanel from './GlassPanel';
import NeonButton from './NeonButton';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("CRITICAL SYSTEM FAILURE:", error, errorInfo);
    }

    handleRestart = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                        <div className="w-full h-1 bg-red-500 absolute top-1/4 animate-pulse" />
                        <div className="w-full h-1 bg-red-500 absolute bottom-1/4 animate-pulse" />
                    </div>

                    <GlassPanel className="max-w-md w-full p-12 text-center border-red-500/30 relative z-10" corners>
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center animate-bounce">
                                <AlertTriangle size={40} className="text-red-500" />
                            </div>
                        </div>

                        <h1 className="font-orbitron text-2xl font-bold text-white mb-4 tracking-widest uppercase">
                            Kernel Panic Detected
                        </h1>
                        <p className="font-mono text-xs text-red-400/70 uppercase tracking-widest mb-8 leading-relaxed">
                            AN UNEXPECTED EXCEPTION HAS HALTED THE NEURAL CORE. ALL PROCESSES SUSPENDED TO PROTECT SYSTEM INTEGRITY.
                        </p>

                        <NeonButton
                            onClick={this.handleRestart}
                            className="w-full bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/40"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" /> REBOOT SYSTEM
                        </NeonButton>
                    </GlassPanel>

                    {/* Grid Overlay */}
                    <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none z-0" />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
