import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, Shield, Users, Activity, Eye, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { useToast } from '../context/ToastContext';
import StarField from '../components/StarField';
import GlassPanel from '../components/ui/GlassPanel';
import NeonButton from '../components/ui/NeonButton';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myOrg, setMyOrg] = useState(null);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetch for efficiency
                const [usersData, orgData] = await Promise.all([
                    apiRequest('/admin/users', 'GET', null, user.email),
                    apiRequest('/org/my', 'GET', null, user.email)
                ]);
                setUsers(usersData);
                setMyOrg(orgData);
            } catch (e) {
                console.error("Data Load Error", e);
                showToast("COMMAND SYNC FAILED", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <StarField density={1500} speed={0.5} />

            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded flex items-center justify-center border border-red-500/50 bg-red-500/10 text-red-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-orbitron text-lg font-bold tracking-widest text-white">
                            SITA <span className="text-xs ml-2 px-2 py-0.5 rounded border border-red-500/30 text-red-400">SECTOR COMMAND</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => window.location.reload()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <NeonButton onClick={logout} size="sm" className="border-white/10 hover:bg-white/5 text-xs">
                        LOGOUT
                    </NeonButton>
                </div>
            </header>

            <main className="relative z-10 pt-24 px-4 lg:px-12 pb-12 max-w-[1600px] mx-auto">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Org Info Card */}
                        <GlassPanel className="p-6 relative overflow-hidden" corners>
                            <div className="absolute top-0 right-0 p-3 opacity-20"><Shield className="w-24 h-24 text-red-500" /></div>
                            {myOrg ? (
                                <>
                                    <div className="text-xs font-mono text-red-400 mb-2 uppercase tracking-wider">Assigned Sector</div>
                                    <h2 className="text-3xl font-orbitron font-bold text-white mb-1">{myOrg.name}</h2>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono mb-6">
                                        <MapPin className="w-4 h-4" /> {myOrg.district}, {myOrg.state}
                                    </div>

                                    <div className="space-y-3 pt-6 border-t border-white/10">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-mono">ACCESS CODE</span>
                                            <span className="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">{myOrg.unique_code}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-mono">ENCRYPTION KEY</span>
                                            <span className="font-mono font-bold text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-500/30">{myOrg.password}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="w-8 h-8 text-red-500 mx-auto mb-2 animate-pulse" />
                                    <p className="font-mono text-sm text-red-400">SECTOR DATA UNAVAILABLE</p>
                                </div>
                            )}
                        </GlassPanel>

                        {/* Actions / Detection Link */}
                        <div className="col-span-2 space-y-4">
                            <div className="h-full flex flex-col gap-4">
                                <div
                                    onClick={() => navigate('/agent')}
                                    className="flex-1 cursor-pointer group relative overflow-hidden rounded-xl border border-red-500/30 bg-red-900/10 hover:bg-red-900/20 transition-all p-6 flex flex-col justify-center items-center text-center"
                                >
                                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                    <Eye className="w-12 h-12 text-red-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
                                    <h3 className="font-orbitron text-2xl font-bold text-white mb-2">LAUNCH SURVEILLANCE SUITE</h3>
                                    <p className="font-mono text-xs text-red-300 uppercase tracking-widest">Access Real-time Traffic Detection & Analytics</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personnel List */}
                    <div className="mt-8">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center rounded-t-xl">
                            <h3 className="font-orbitron text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-red-400" /> SECTOR PERSONNEL
                            </h3>
                            <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-muted-foreground">
                                {users.length} ASSIGNED
                            </span>
                        </div>
                        <GlassPanel className="p-0 rounded-t-none" corners={false}>
                            <UserTable users={users} />
                        </GlassPanel>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

const UserTable = ({ users }) => (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-4 text-left font-mono text-[10px] text-muted-foreground uppercase">Identity</th>
                    <th className="p-4 text-left font-mono text-[10px] text-muted-foreground uppercase">Contact</th>
                    <th className="p-4 text-left font-mono text-[10px] text-muted-foreground uppercase">Role</th>
                    <th className="p-4 text-left font-mono text-[10px] text-muted-foreground uppercase">Status</th>
                    <th className="p-4 text-left font-mono text-[10px] text-muted-foreground uppercase">Last Active</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                    <tr key={u.email} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <img src={u.picture || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded bg-white/5" />
                                <div>
                                    <p className="font-bold text-xs text-white">{u.name}</p>
                                    <p className="text-[10px] text-white/50 font-mono">{u.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-white/70">
                            {u.phone ? `${u.country_code} ${u.phone}` : '-'}
                        </td>
                        <td className="p-4">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${u.role === 'admin'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                {u.role}
                            </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] uppercase text-white/60">{u.status}</td>
                        <td className="p-4 font-mono text-[10px] text-white/40">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : 'OFFLINE'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AdminDashboard;
