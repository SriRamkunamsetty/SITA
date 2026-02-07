import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Video, BarChart3, Settings, LogOut, Activity, Cpu, Database, Wifi, AlertTriangle, CheckCircle, Clock, TrendingUp, Eye, Play, Pause, RefreshCw, Upload, User, Download, Shield
} from 'lucide-react';
import StarField from '../components/StarField';
import GlassPanel from '../components/ui/GlassPanel';
import StatusIndicator from '../components/StatusIndicator';
import AnimatedCounter from '../components/AnimatedCounter';
import NeonButton from '../components/ui/NeonButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { apiRequest, API_BASE } from '../lib/api';
import { useToast } from '../context/ToastContext';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showToast } = useToast();

    // UI Logic
    // Persistence Keys
    const STORAGE_KEY = 'sita_analysis_state';

    // UI Logic - with Initializers from Storage
    const [isAnalyzing, setIsAnalyzing] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).isAnalyzing : false;
    });
    const [videoLink, setVideoLink] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).videoLink : null;
    });
    const [processingStatus, setProcessingStatus] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).processingStatus : 'idle';
    });
    const [uploadProgress, setUploadProgress] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).uploadProgress : 0;
    });
    const [reportData, setReportData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).reportData : [];
    });
    const [filterText, setFilterText] = useState('');

    // Persist State Changes
    useEffect(() => {
        const stateToSave = {
            isAnalyzing,
            videoLink,
            processingStatus,
            uploadProgress,
            reportData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [isAnalyzing, videoLink, processingStatus, uploadProgress, reportData]);

    // Poll for status if processing
    useEffect(() => {
        let interval;
        if (processingStatus === 'uploading' || processingStatus === 'processing') {
            interval = setInterval(async () => {
                try {
                    const data = await apiRequest('/status', 'GET', null, user.email);
                    if (data && data.status) {
                        if (data.status === 'processing') {
                            setProcessingStatus('processing');
                            setUploadProgress((prev) => (prev < 90 ? prev + 1 : prev)); // Fake progress to 90
                        } else if (data.status === 'complete') {
                            setProcessingStatus('complete');
                            setUploadProgress(100);
                            setVideoLink(data.video_link);
                            clearInterval(interval);
                            // Fetch Report
                            const report = await apiRequest('/traffic_report', 'GET', null, user.email);
                            if (report && report.data) setReportData(report.data);
                            setIsAnalyzing(false);
                            showToast("ANALYSIS COMPLETE", "success");
                        } else if (data.status === 'error') {
                            setProcessingStatus('idle');
                            setIsAnalyzing(false);
                            clearInterval(interval);
                            showToast(data.error || "ANALYSIS FAILED", "error");
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [processingStatus]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setProcessingStatus('uploading');
        setUploadProgress(0);
        setIsAnalyzing(true);
        // Reset old data
        setReportData([]);
        setVideoLink(null);

        const formData = new FormData();
        formData.append('video', file);
        formData.append('email', user.email);

        try {
            // Manual Fetch for file upload
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/api/upload_video`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        setProcessingStatus('processing');
                        setUploadProgress(0); // Reset for processing phase
                        showToast("UPLOAD COMPLETE. ANALYZING...", "info");
                    } else {
                        throw new Error(response.error || "Upload failed");
                    }
                } else {
                    throw new Error("Upload failed with status " + xhr.status);
                }
            };

            xhr.onerror = () => { throw new Error("Network Error"); };
            xhr.send(formData);

        } catch (error) {
            console.error(error);
            setProcessingStatus('idle');
            setIsAnalyzing(false);
            showToast("INGESTION FAILED: " + error.message, "error");
        }
    };

    const handleExportCSV = () => {
        if (reportData.length === 0) return;
        // Generate CSV content
        const headers = Object.keys(reportData[0]).join(',');
        const rows = reportData.map(row => Object.values(row).join(','));
        const csvContent = [headers, ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SITA_REPORT_${new Date().getTime()}.csv`;
        a.click();
    };

    // Live Counters Logic (Derived for demo)
    const vehicleCounts = reportData.reduce((acc, row) => {
        const type = row.vehicle_type?.toLowerCase();
        if (type) acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});


    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            <StarField />

            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-3xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-4 lg:px-8 py-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center flex-shrink-0">
                                <Cpu className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-orbitron text-lg font-bold text-primary tracking-tighter uppercase truncate max-w-[150px] md:max-w-none">{user?.name}</h1>
                                <div className="flex items-center gap-3 font-mono text-[9px] text-muted-foreground uppercase opacity-90 mt-0.5">
                                    <span>ID: <span className="text-brand-neon">{user?.agent_id || 'PENDING'}</span></span>
                                    <span className="text-white/20">|</span>
                                    <span className="truncate max-w-[100px] md:max-w-none">ORG: <span className="text-white">{user?.org_name || 'UNASSIGNED'}</span></span>
                                </div>
                            </div>
                        </div>
                        {/* Mobile End Shift Button (Visible only on small screens) */}
                        <div className="md:hidden">
                            <NeonButton onClick={logout} size="sm" className="border-white/10 hover:bg-white/5 text-[10px] px-2 py-1 h-8">
                                <LogOut className="w-3 h-3" />
                            </NeonButton>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="hidden md:flex items-center gap-4 border-r border-border/50 pr-6">
                            <StatusIndicator status="online" label="STREAMS ACTIVE" />
                        </div>
                        <div className="hidden md:block">
                            <NeonButton onClick={logout} size="sm" className="border-white/10 hover:bg-white/5 text-xs">
                                End Shift
                            </NeonButton>
                        </div>
                        {/* Mobile Status Indicator */}
                        <div className="md:hidden flex items-center gap-2">
                            <StatusIndicator status="online" label="ONLINE" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Application Area */}
            <main className="container mx-auto p-4 lg:p-8 space-y-6 md:space-y-8 relative z-10 pt-36 md:pt-48 mt-4 md:mt-8">
                {/* 1. Detection Console */}
                <section>
                    <GlassPanel className="overflow-hidden" corners>
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-primary" />
                                <span className="font-orbitron text-sm font-semibold tracking-wider">SECURE FEED ANALYZER</span>
                            </div>
                            <div className="flex gap-2">
                                <label className="cursor-pointer group relative z-20">
                                    <input type="file" className="hidden" accept="video/mp4,video/avi" onChange={handleFileUpload} />
                                    <div className="p-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        <span className="text-xs font-mono font-bold uppercase">INGEST SOURCE</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="aspect-video lg:aspect-[21/9] bg-black/60 relative group">
                            {videoLink && processingStatus === 'complete' ? (
                                <div className="relative w-full h-full">
                                    <video
                                        key={videoLink}
                                        src={`${API_BASE}/api/download/${videoLink}`}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        controls
                                        playsInline
                                        crossOrigin="anonymous"
                                        onError={() => showToast("Error playing video", "error")}
                                    />
                                    <div className="absolute top-4 right-4 z-30">
                                        <a href={`${API_BASE}/api/download/${videoLink}`} download className="p-2 bg-black/50 hover:bg-primary/50 text-white rounded-full transition-colors flex items-center gap-2 text-xs border border-white/10">
                                            <Download className="w-4 h-4" /> SAVE VIDEO
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-24 h-24 rounded-full border-2 border-primary/20 flex items-center justify-center mb-6 mx-auto relative">
                                            {isAnalyzing ? (
                                                <div className="absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin" />
                                            ) : (
                                                <div className="absolute inset-0 border-2 border-primary/10 rounded-full animate-pulse" />
                                            )}
                                            <Video className={cn("w-10 h-10 text-primary/40", isAnalyzing && "text-primary animate-pulse")} />
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-orbitron text-lg font-bold text-white tracking-widest uppercase">
                                                    {processingStatus === 'uploading' && `STREAMING: ${Math.round(uploadProgress)}%`}
                                                    {processingStatus === 'processing' && `NEURAL ANALYSIS: ${Math.round(uploadProgress)}%`}
                                                    {processingStatus === 'idle' && 'WAITING FOR DATA SOURCE'}
                                                    {processingStatus === 'complete' && 'EXTRACTION SUCCESSFUL'}
                                                </p>
                                                <p className="font-mono text-[10px] text-muted-foreground uppercase animate-pulse mt-1">
                                                    {isAnalyzing ? 'Analyzing traffic patterns via YOLOfier-v11 Kernal' : 'Secure encrypted connection established'}
                                                </p>
                                            </div>

                                            {processingStatus === 'complete' && (
                                                <NeonButton
                                                    onClick={() => document.getElementById('detection-hub').scrollIntoView({ behavior: 'smooth' })}
                                                    size="sm"
                                                    className="mt-6"
                                                >
                                                    VIEW ANALYTICS HUB
                                                </NeonButton>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scanning overlays */}
                            {isAnalyzing && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-x-0 h-1 bg-primary/50 top-1/4 animate-scan-y shadow-[0_0_20px_theme(colors.primary.DEFAULT)]" />
                                    <div className="absolute inset-y-0 w-px bg-primary/20 left-1/2" />
                                    <div className="absolute top-8 right-8 text-right font-mono text-[10px] space-y-1 text-primary">
                                        <p>COORD_X: {Math.random().toFixed(4)}</p>
                                        <p>COORD_Y: {Math.random().toFixed(4)}</p>
                                        <p>SENSITIVITY: 99.1%</p>
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />
                            <div className="absolute bottom-4 left-4">
                                <StatusIndicator status={isAnalyzing ? 'processing' : 'offline'} label={isAnalyzing ? 'ANALYSIS_LIVE' : 'STANDBY'} />
                            </div>
                        </div>
                    </GlassPanel>
                </section>

                {/* 2. Live Counters */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                        {[
                            { label: 'Cars', key: 'car' },
                            { label: 'Buses', key: 'bus' },
                            { label: 'Trucks', key: 'truck' },
                            { label: 'Motorcycles', key: 'motorcycle' },
                            { label: 'Plates Found', key: 'plate' },
                            { label: 'Total Objects', key: 'total' }
                        ].map(item => {
                            const val = item.key === 'total' ? reportData.length : (item.key === 'plate' ? reportData.filter(r => r.number_plate).length : (vehicleCounts[item.key] || 0));
                            return (
                                <GlassPanel key={item.key} className="p-4 border-primary/20 bg-primary/5" corners>
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2 tracking-tighter">{item.label}</p>
                                    <div className="font-orbitron text-2xl font-bold text-white">
                                        <AnimatedCounter value={val} />
                                    </div>
                                </GlassPanel>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Detection Results Table */}
                <section id="detection-hub">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 px-2 gap-4">
                        <h3 className="font-orbitron text-sm font-bold text-primary flex items-center gap-3">
                            <Activity className="w-5 h-5" /> MASTER DETECTION LOG
                        </h3>
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="FILTER RESULTS..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="bg-muted/20 border border-border/50 rounded px-3 py-1.5 font-mono text-[10px] text-white focus:border-primary outline-none w-full md:w-64"
                            />
                            <div className="flex w-full md:w-auto justify-between items-center gap-4">
                                <button
                                    onClick={handleExportCSV}
                                    className="p-1.5 px-4 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all flex items-center gap-2 font-mono text-[10px] font-bold uppercase flex-1 md:flex-none justify-center"
                                >
                                    <Download className="w-3 h-3" /> EXPORT
                                </button>
                                <div className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                    {reportData.length} RECS
                                </div>
                            </div>
                        </div>
                    </div>

                    <GlassPanel className="overflow-hidden" corners>
                        <div className="overflow-x-auto">
                            {reportData.length > 0 ? (
                                <table className="w-full text-left font-mono text-sm">
                                    <thead>
                                        <tr className="bg-primary/5 border-b border-border/50 text-[10px] text-primary uppercase font-bold">
                                            <th className="p-4">Reference</th>
                                            <th className="p-4">Vehicle Type</th>
                                            <th className="p-4">Color Signature</th>
                                            <th className="p-4">Best Plate (Refined)</th>
                                            <th className="p-4 text-muted-foreground">Initial Scan (Raw)</th>
                                            <th className="p-4">Detection Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {reportData
                                            .filter(r => {
                                                if (!filterText) return true;
                                                const searchTerms = filterText.toLowerCase().split(' ').filter(Boolean);
                                                const rowText = `${r.vehicle_type} ${r.number_plate} ${r.color}`.toLowerCase();
                                                return searchTerms.every(term => rowText.includes(term));
                                            })
                                            .map((row, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors border-l-2 border-transparent hover:border-primary">
                                                    <td className="p-4 text-muted-foreground text-[10px]">#{1000 + i}</td>
                                                    <td className="p-4 text-white font-bold">{row.vehicle_type?.toUpperCase() || 'UNIDENTIFIED'}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color?.toLowerCase() }} />
                                                            <span className="text-xs uppercase opacity-80">{row.color || 'UNKNOWN'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-primary px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs tracking-[0.2em]">
                                                            {row.number_plate || 'NOT_FOUND'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-mono text-[10px] text-muted-foreground opacity-70 tracking-[0.1em] border-b border-dashed border-white/10 pb-0.5">
                                                            {row.initial_plate || '---'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1 bg-muted/20 rounded-full max-w-[60px]">
                                                                <div className="h-full bg-success rounded-full" style={{ width: '92%' }} />
                                                            </div>
                                                            <span className="text-[10px] text-success">
                                                                {row.confidence ? Math.round(row.confidence * 100) + '%' : '92%'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center text-muted-foreground">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-mono text-xs uppercase tracking-widest">Awaiting Neural Link Data Ingest...</p>
                                </div>
                            )}
                        </div>
                    </GlassPanel>
                </section>
            </main>

            {/* Global Grid Overlay */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none z-0" />
        </div>
    );
};

export default UserDashboard;
