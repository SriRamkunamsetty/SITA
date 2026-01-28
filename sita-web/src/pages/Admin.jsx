import { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import { Check, X, Shield } from "lucide-react";
import NeonButton from "../components/ui/NeonButton";

export default function Admin() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await apiRequest('/admin/users', 'GET', null, user.email);
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    const handleAction = async (targetEmail, action) => {
        if (!confirm(`Are you sure you want to ${action} ${targetEmail}?`)) return;
        try {
            await apiRequest('/admin/approve', 'POST', { email: targetEmail, action }, user.email);
            loadUsers();
        } catch (e) {
            console.error("Action failed", e);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark p-6 pt-24">
            <Navbar />

            <div className="container mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Shield className="w-8 h-8 text-brand-neon" />
                    <h1 className="text-3xl font-display font-bold text-white">GOVERNANCE CONSOLE</h1>
                </div>

                <div className="glass-panel overflow-hidden rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900 text-xs font-mono text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4 border-b border-white/10">User</th>
                                <th className="p-4 border-b border-white/10">Reason</th>
                                <th className="p-4 border-b border-white/10">Status</th>
                                <th className="p-4 border-b border-white/10 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-300 divide-y divide-white/5">
                            {users.map(u => (
                                <tr key={u.email} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                        <div className="text-xs text-brand-neon">{u.phone || 'No Phone'}</div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={u.reason}>
                                        {u.reason || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                u.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.role !== 'admin' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction(u.email, 'approve')}
                                                    className="p-2 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 transition-colors"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(u.email, 'reject')}
                                                    className="p-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
