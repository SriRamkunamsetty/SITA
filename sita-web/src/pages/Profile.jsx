import { useNavigate } from 'react-router-dom';
import { User, Shield, Key, Bell, LogOut, ArrowLeft, Smartphone, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StarField from '../components/StarField';
import GridOverlay from '../components/GridOverlay';
import GlassPanel from '../components/ui/GlassPanel';
import NeonButton from '../components/ui/NeonButton';
import StatusIndicator from '../components/StatusIndicator';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
            <StarField />
            <GridOverlay />

            <div className="relative z-10 max-w-4xl mx-auto w-full p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-mono text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        BACK TO CONTROL ROOM
                    </button>
                    <StatusIndicator status="online" label="SECURE CONNECTION" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Identity Card */}
                    <GlassPanel className="md:col-span-1 flex flex-col items-center text-center p-6 h-full" corners>
                        <div className="w-24 h-24 rounded-full border-2 border-primary/50 relative mb-4 overflow-hidden">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
                        </div>

                        <h2 className="font-orbitron text-xl font-bold text-white mb-1">{user?.name || 'Unknown Agent'}</h2>
                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 mb-4">
                            {user?.role?.toUpperCase() || 'OPERATIVE'}
                        </span>

                        <div className="w-full space-y-3 mt-auto pt-6 border-t border-border/50">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-muted-foreground">STATUS</span>
                                <span className="text-success flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> VERIFIED
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-muted-foreground">CLEARANCE</span>
                                <span className="text-white">LEVEL 3</span>
                            </div>
                        </div>
                    </GlassPanel>

                    {/* Agent Details & Settings */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Agent ID Section */}
                        <GlassPanel className="p-6 relative overflow-hidden" corners>
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Shield className="w-24 h-24 text-primary" />
                            </div>

                            <h3 className="font-orbitron text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5" /> AGENT IDENTITY
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-black/20 rounded border border-border/50">
                                    <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Agent ID (Unique)</label>
                                    <div className="font-mono text-xl text-white tracking-widest font-bold">
                                        {user?.agent_id || 'Generating...'}
                                    </div>
                                </div>
                                <div className="p-3 bg-black/20 rounded border border-border/50">
                                    <label className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Secure Email</label>
                                    <div className="font-mono text-sm text-white truncate">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-black/20 rounded border border-border/50 flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-[10px] font-mono text-muted-foreground uppercase block">Contact</label>
                                        <div className="font-mono text-sm text-white">{user?.phone || 'Not Linked'}</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-black/20 rounded border border-border/50 flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <label className="text-[10px] font-mono text-muted-foreground uppercase block">Region</label>
                                        <div className="font-mono text-sm text-white">{user?.country_code || 'Global'}</div>
                                    </div>
                                </div>
                            </div>
                        </GlassPanel>

                        {/* Settings */}
                        <GlassPanel className="p-6" corners>
                            <h3 className="font-orbitron text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <Bell className="w-5 h-5" /> PREFERENCES
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-mono text-sm text-white">Mission Alerts</div>
                                        <div className="font-mono text-xs text-muted-foreground">Receive critical system notifications</div>
                                    </div>
                                    <div className="w-10 h-5 bg-primary rounded-full relative">
                                        <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full shadow" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-mono text-sm text-white">Two-Factor Auth</div>
                                        <div className="font-mono text-xs text-muted-foreground">Enhanced account security</div>
                                    </div>
                                    <div className="w-10 h-5 bg-muted/50 rounded-full relative">
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-muted-foreground rounded-full shadow" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/50">
                                <NeonButton
                                    onClick={handleLogout}
                                    variant="outline"
                                    className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> DISCONNECT AGENT
                                </NeonButton>
                            </div>
                        </GlassPanel>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
