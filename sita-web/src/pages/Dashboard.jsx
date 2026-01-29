import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Video,
    BarChart3,
    Settings,
    LogOut,
    Activity,
    Cpu,
    Database,
    Wifi,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Eye,
    Play,
    Pause,
    RefreshCw,
    Upload,
    User,
    Download
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

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
    { icon: Video, label: 'Data Ingest', id: 'ingest' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: Settings, label: 'System', id: 'system' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [activeSection, setActiveSection] = useState('ingest'); // Default to detection
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState('idle');
    const [reportData, setReportData] = useState([]);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [videoLink, setVideoLink] = useState(null);
    const [filterText, setFilterText] = useState('');

    // Derived stats from reportData
    const vehicleCounts = reportData.reduce((acc, obj) => {
        const type = obj.vehicle_type?.toLowerCase() || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const [stats, setStats] = useState({
        dataPoints: 2847592,
        latency: 23,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                dataPoints: prev.dataPoints + Math.floor(Math.random() * 1000),
                latency: 20 + Math.random() * 10,
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval;
        if (processingStatus === 'processing' || isAnalyzing) {
            interval = setInterval(async () => {
                try {
                    const res = await apiRequest('/status');
                    if (res && res.status === 'completed') {
                        setProcessingStatus('complete');
                        setIsAnalyzing(false);
                        setVideoLink(res.video_link);
                        showToast("NEURAL EXTRACTION COMPLETE", "success");
                        fetchReport();
                    }
                } catch (e) {
                    console.error("Status Poll Error", e);
                    showToast("ANALYSIS SUBSYSTEM ERROR", "error");
                    setIsAnalyzing(false);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [processingStatus, isAnalyzing]);

    const fetchReport = async () => {
        setIsFetchingReport(true);
        try {
            const data = await apiRequest('/traffic_report');
            if (data && data.data) {
                setReportData(data.data);
            }
        } catch (e) {
            console.error("Failed to fetch report", e);
        } finally {
            setIsFetchingReport(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setProcessingStatus('uploading');
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('video', file);

        try {
            const token = localStorage.getItem('sita_user_email');
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload_video');
            xhr.setRequestHeader('X-User-Email', user?.email);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    setUploadProgress((e.loaded / e.total) * 100);
                }
            };

            xhr.onload = function () {
                if (xhr.status === 200) {
                    setProcessingStatus('processing');
                    setIsAnalyzing(true);
                    setUploadProgress(100);
                    setVideoLink(null); // Reset link for new job
                    showToast("DATA INGESTED: INITIALIZING ENGINE", "info");
                } else {
                    setProcessingStatus('idle');
                    showToast("INGESTION PROTOCOL FAILED", "error");
                }
            };
            xhr.onerror = () => {
                setProcessingStatus('idle');
                showToast("NETWORK LINK COLLAPSE", "error");
            };
            xhr.send(formData);
        } catch (e) {
            setProcessingStatus('idle');
        }
    };

    const handleExportCSV = () => {
        if (!reportData.length) return;
        const headers = ["Reference", "Vehicle Type", "Color Signature", "Plate Identifier"];
        const rows = reportData.map((r, i) => [
            `#${1000 + i}`,
            r.vehicle_type?.toUpperCase() || 'UNIDENTIFIED',
            r.color?.toUpperCase() || 'N/A',
            r.number_plate?.toUpperCase() || 'DETECTING...'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `SITA_REPORT_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("REPORT EXPORTED SUCCESSFULLY", "success");
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            <StarField />

            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 lg:px-8 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-orbitron text-lg font-bold text-primary tracking-tighter">SITA</h1>
                            <p className="font-mono text-[9px] text-muted-foreground uppercase opacity-70">Detection Platform</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 border-r border-border/50 pr-6">
                            <StatusIndicator status="online" label="STREAMS ACTIVE" />
                            <div className="font-mono text-[10px] text-muted-foreground flex gap-4">
                                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> LATENCY: {stats.latency.toFixed(1)}ms</span>
                                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> GRID_v{stats.dataPoints.toString().slice(-4)}</span>
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-muted/20 border border-border/50 hover:border-primary transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:bg-primary/40 transition-colors">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-[10px] font-mono text-muted-foreground leading-none mb-1">AUTHORIZED AGENT</p>
                                    <p className="text-xs font-bold text-white leading-none">{user?.name || 'AGENT-84'}</p>
                                </div>
                            </button>

                            {showProfile && (
                                <GlassPanel className="absolute right-0 mt-3 w-64 p-5 z-[100] border-primary/30 animate-in fade-in slide-in-from-top-2" corners>
                                    <h4 className="font-orbitron text-xs font-bold text-primary mb-4 border-b border-primary/20 pb-2">AGENT IDENTITY</h4>
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Unique Identifier</p>
                                            <p className="text-sm font-bold text-white tracking-widest">{user?.agent_id || 'SITA-NULL'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Full Name</p>
                                            <p className="text-sm font-bold text-white">{user?.name || 'NOT SPECIFIED'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Clearance Level</p>
                                            <p className="text-[10px] font-bold text-success">LEVEL-7 (ALPHA)</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono rounded hover:bg-destructive/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-3 h-3" /> DISCONNECT NODE
                                    </button>
                                </GlassPanel>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Application Area */}
            <main className="container mx-auto p-4 lg:p-8 space-y-8 relative z-10">
                {/* 1. Detection Console */}
                <section>
                    <GlassPanel className="overflow-hidden" corners>
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-3">
                                <Video className="w-5 h-5 text-primary" />
                                <span className="font-orbitron text-sm font-semibold tracking-wider">SECURE FEED ANALYZER</span>
                            </div>
                            <div className="flex gap-2">
                                <label className="cursor-pointer group">
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
                                <video
                                    src={`${API_BASE}/api/download/${videoLink}`}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    controls
                                />
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
                                                    {processingStatus === 'processing' && 'NEURAL ENGINE BUSY...'}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="FILTER RESULTS..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="bg-muted/20 border border-border/50 rounded px-3 py-1.5 font-mono text-[10px] text-white focus:border-primary outline-none w-full md:w-64"
                            />
                            <button
                                onClick={handleExportCSV}
                                className="p-1.5 px-4 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary transition-all flex items-center gap-2 font-mono text-[10px] font-bold uppercase"
                            >
                                <Download className="w-3 h-3" /> EXPORT DATA
                            </button>
                            <div className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                RECORDS: {reportData.length} | SYNCED: {new Date().toLocaleTimeString()}
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
                                            <th className="p-4">Plate Identifier</th>
                                            <th className="p-4">Detection Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {reportData
                                            .filter(r =>
                                                !filterText ||
                                                r.vehicle_type?.toLowerCase().includes(filterText.toLowerCase()) ||
                                                r.number_plate?.toLowerCase().includes(filterText.toLowerCase()) ||
                                                r.color?.toLowerCase().includes(filterText.toLowerCase())
                                            )
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
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1 bg-muted/20 rounded-full max-w-[60px]">
                                                                <div className="h-full bg-success rounded-full" style={{ width: '92%' }} />
                                                            </div>
                                                            <span className="text-[10px] text-success">92%</span>
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

export default Dashboard;
