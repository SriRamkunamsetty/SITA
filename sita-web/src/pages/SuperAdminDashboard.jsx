import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, RefreshCw, Eye, Building2, Globe, Activity, Users, Cpu, Server, MapPin, Lock, Shield, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { useToast } from '../context/ToastContext';
import StarField from '../components/StarField';
import GlassPanel from '../components/ui/GlassPanel';
import NeonButton from '../components/ui/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [allOrgs, setAllOrgs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrg, setSelectedOrg] = useState(null);

    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrgData, setNewOrgData] = useState({ name: '', state: '', district: '', password: '' });

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            navigate('/'); // Strict redirect
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, orgsData] = await Promise.all([
                apiRequest('/admin/users', 'GET', null, user.email), // Backend returns ALL users for super_admin
                apiRequest('/orgs', 'GET', null, user.email)
            ]);
            setUsers(usersData);
            setAllOrgs(orgsData);
        } catch (e) {
            console.error("Data Load Error", e);
            showToast("COMMAND SYNC FAILED", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const getOrgUsers = (orgId) => users.filter(u => u.organization_id === orgId);

    const handleCreateOrg = async () => {
        if (!newOrgData.name || !newOrgData.state || !newOrgData.district || !newOrgData.password) {
            showToast("MISSING PARAMETERS", "error");
            return;
        }
        try {
            await apiRequest('/org/create', 'POST', { ...newOrgData, requester_email: user.email }, user.email);
            showToast("SECTOR INITIALIZED", "success");
            setShowCreateModal(false);
            setNewOrgData({ name: '', state: '', district: '', password: '' });
            loadData(); // Refresh all
        } catch (e) {
            showToast("INITIALIZATION FAILED: " + e.message, "error");
        }
    };

    const INDIAN_STATES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
        "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
        "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
        "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
        "Lakshadweep", "Puducherry"
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <StarField density={1500} speed={0.5} />

            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 h-auto md:h-16 flex flex-col md:flex-row items-center justify-between px-4 lg:px-12 py-3 md:py-0 gap-3 md:gap-0">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded flex items-center justify-center border border-purple-500/50 bg-purple-500/10 text-purple-400">
                            <Eye className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-orbitron text-lg font-bold tracking-widest text-white">
                                SITA <span className="text-xs ml-2 px-2 py-0.5 rounded border border-purple-500/30 text-purple-400">OVERWATCH</span>
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-4">
                        <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <NeonButton onClick={logout} size="sm" className="border-white/10 hover:bg-white/5 text-xs">
                            TERMINATE SESSION
                        </NeonButton>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 md:pt-24 px-4 lg:px-12 pb-12 max-w-[1600px] mx-auto">
                {/* Stats Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="ACTIVE SECTORS" value={allOrgs.length} icon={<Globe className="text-purple-400" />} />
                    <StatCard label="TOTAL AGENTS" value={users.length} icon={<Users className="text-blue-400" />} />
                    <StatCard label="SYSTEM STATUS" value="ONLINE" sub="99.9% Uptime" icon={<Activity className="text-green-400" />} />
                    <StatCard label="SERVER EXECUTIONS" value="2.4M" icon={<Cpu className="text-orange-400" />} />
                </div>

                <AnimatePresence mode="wait">
                    {!selectedOrg ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <h2 className="font-orbitron text-xl font-bold text-white flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-purple-500" /> GLOBAL COMMAND GRID
                                </h2>
                                <NeonButton onClick={() => setShowCreateModal(true)} className="border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                    <Building2 className="w-4 h-4 mr-2" /> INITIALIZE SECTOR
                                </NeonButton>
                            </div>

                            {allOrgs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {allOrgs.map((org, i) => (
                                        <OrgCard key={org.id} org={org} onClick={() => setSelectedOrg(org)} index={i} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="NO ACTIVE SECTORS DETECTED" action={() => setShowCreateModal(true)} />
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        >
                            <button onClick={() => setSelectedOrg(null)} className="flex items-center gap-2 text-xs font-mono text-purple-400 hover:text-white mb-6 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> RETURN TO GRID
                            </button>

                            <OrgDetailView org={selectedOrg} users={getOrgUsers(selectedOrg.id)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Create Org Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                    <GlassPanel className="w-full max-w-md p-8 relative overflow-hidden" corners>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
                        <h3 className="font-orbitron text-2xl font-bold mb-1 text-white">INITIALIZE SECTOR</h3>
                        <p className="font-mono text-xs text-purple-400 mb-6 uppercase tracking-wider">Create New Command Node</p>

                        <div className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono text-muted-foreground uppercase">Sector Designation</label>
                                <input
                                    value={newOrgData.name} onChange={e => setNewOrgData({ ...newOrgData, name: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors"
                                    placeholder="e.g. ALPHA CENTAURI COMMAND"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-muted-foreground uppercase">State Region</label>
                                    <select
                                        value={newOrgData.state} onChange={e => setNewOrgData({ ...newOrgData, state: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="">SELECT REGION</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-muted-foreground uppercase">District Zone</label>
                                    <input
                                        value={newOrgData.district} onChange={e => setNewOrgData({ ...newOrgData, district: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors"
                                        placeholder="District Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono text-muted-foreground uppercase">Secure Access Key</label>
                                <input
                                    type="password"
                                    value={newOrgData.password} onChange={e => setNewOrgData({ ...newOrgData, password: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors"
                                    placeholder="••••••••••••"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-xs font-mono text-muted-foreground hover:text-white border border-transparent hover:border-white/10 rounded transition-all">ABORT</button>
                                <NeonButton onClick={handleCreateOrg} className="flex-1 bg-purple-500/10 border-purple-500 text-purple-400 hover:bg-purple-500/20">
                                    INITIALIZE
                                </NeonButton>
                            </div>
                        </div>
                    </GlassPanel>
                </div>
            )}
        </div>
    );
};

// --- SUB COMPONENTS (Reused for consistency) ---

const StatCard = ({ label, value, sub, icon }) => (
    <GlassPanel className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors" corners>
        <div className="p-3 rounded bg-white/5 border border-white/10">
            {icon}
        </div>
        <div>
            <div className="text-2xl font-orbitron font-bold text-white leading-none">{value}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1 tracking-wider uppercase">{label}</div>
            {sub && <div className="text-[9px] font-mono text-green-400 mt-0.5">{sub}</div>}
        </div>
    </GlassPanel>
);

const OrgCard = ({ org, onClick, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
        onClick={onClick}
        className="group cursor-pointer relative overflow-hidden"
    >
        <GlassPanel className="p-6 h-full hover:bg-purple-900/5 transition-colors border-purple-500/10 hover:border-purple-500/40" corners>
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-all">
                    <Building2 className="w-5 h-5" />
                </div>
                <div className="px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-mono text-muted-foreground">
                    #{org.id}
                </div>
            </div>
            <h3 className="font-orbitron text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{org.name}</h3>
            <p className="font-mono text-xs text-muted-foreground flex items-center gap-1 mb-4">
                <MapPin className="w-3 h-3" /> {org.district}, {org.state}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="text-[10px] font-mono text-white/50">
                    CODE: <span className="text-purple-400">{org.unique_code}</span>
                </div>
                <ArrowLeft className="w-4 h-4 text-purple-500 rotate-180 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </div>
        </GlassPanel>
    </motion.div>
);

const OrgDetailView = ({ org, users }) => (
    <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-r from-purple-900/10 to-transparent border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Building2 className="w-64 h-64" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold font-mono border border-purple-500/20">ACTIVE SECTOR</span>
                    <span className="text-white/30 text-xs font-mono">ID: {org.id}</span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold text-white mb-2">{org.name}</h1>
                <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 text-sm font-mono text-muted-foreground mt-4">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {org.district}, {org.state}</span>
                    <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Pass: <span className="text-white">{org.password}</span></span>
                    <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Code: <span className="text-purple-400">{org.unique_code}</span></span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Created: {new Date(org.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <div className="flex items-center justify-between mb-4 bg-red-900/10 p-3 rounded border border-red-500/20">
                    <h3 className="font-orbitron font-bold text-red-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> COMMAND STAFF
                    </h3>
                </div>
                <div className="space-y-3">
                    {users.filter(u => u.role === 'admin').length > 0 ? (
                        users.filter(u => u.role === 'admin').map(u => <UserCard key={u.email} user={u} type="admin" />)
                    ) : (
                        <div className="text-center py-8 text-xs font-mono text-white/30 border border-white/5 rounded border-dashed">NO COMMANDERS ASSIGNED</div>
                    )}
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-4 bg-blue-900/10 p-3 rounded border border-blue-500/20">
                    <h3 className="font-orbitron font-bold text-blue-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> FIELD AGENTS
                    </h3>
                </div>
                <div className="space-y-3">
                    {users.filter(u => u.role === 'user').length > 0 ? (
                        users.filter(u => u.role === 'user').map(u => <UserCard key={u.email} user={u} type="user" />)
                    ) : (
                        <div className="text-center py-8 text-xs font-mono text-white/30 border border-white/5 rounded border-dashed">NO AGENTS DEPLOYED</div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const UserCard = ({ user, type }) => (
    <div className={`flex items-center gap-4 p-3 rounded border transition-colors ${type === 'admin' ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30' : 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30'}`}>
        <img src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-10 h-10 rounded" alt="" />
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>
            <p className="text-[10px] font-mono text-white/50 truncate">{user.email}</p>
        </div>
        <div className="text-right">
            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${type === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                {type}
            </div>
            <div className="text-[9px] font-mono text-white/30 mt-1">{user.status}</div>
        </div>
    </div>
);

const EmptyState = ({ message, action }) => (
    <div className="p-12 text-center border border-white/10 rounded-2xl border-dashed bg-white/5">
        <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="font-mono text-sm text-white/50 mb-6">{message}</p>
        {action && (
            <NeonButton onClick={action} size="sm" className="border-white/20 hover:bg-white/10">
                INITIATE
            </NeonButton>
        )}
    </div>
);

export default SuperAdminDashboard;
