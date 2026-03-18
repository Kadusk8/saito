'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Users, AlertOctagon, Ban, Clock, Search, Filter, Loader2, UserMinus, Shield, Bot, Zap, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface StrikeLog {
    id: string;
    action: string;
    reason: string;
    member_jid: string;
    created_at: string;
    group_name: string;
}

export default function StrikesPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [logs, setLogs] = useState<StrikeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`${BACKEND_URL}/api/strikes`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching strike logs:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(log =>
        log.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.member_jid.includes(searchTerm) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: logs.length,
        strikes: logs.filter(l => l.action === 'strike_added').length,
        bans: logs.filter(l => l.action === 'banned').length,
    };

    return (
        <div className="p-8 pb-32 sm:p-12 w-full max-w-7xl mx-auto animate-in fade-in duration-500 relative">
            
            {/* Ambient Back Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 relative z-10 glass p-8 rounded-[2rem] border border-border-subtle shadow-sm bg-surface/40">
                <div className="flex items-start gap-5 w-full">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.2)] shrink-0">
                        <ShieldAlert className="w-7 h-7 text-rose-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 shadow-[0_0_10px_rgba(225,29,72,0.1)]">
                                <Shield className="w-3.5 h-3.5" /> Moderação Ativa
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Log de Strikes</h1>
                        <p className="text-sm font-medium text-foreground-muted mt-2 max-w-2xl">Acompanhe as defesas feitas pelo Cão de Guarda da IA. Aqui constam as advertências, expulsões e exclusões feitas pelas automações em proteção da sua comunidade.</p>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
                {[
                    { label: 'Defesas Realizadas', value: stats.total, icon: <Shield className="w-6 h-6 text-brand" />, light: 'from-brand/20 to-transparent', border: 'border-brand/30', text: 'text-brand' },
                    { label: 'Advertências (Strikes)', value: stats.strikes, icon: <AlertOctagon className="w-6 h-6 text-amber-500" />, light: 'from-amber-500/20 to-transparent', border: 'border-amber-500/30', text: 'text-amber-500' },
                    { label: 'Banimentos / Expulsões', value: stats.bans, icon: <Ban className="w-6 h-6 text-rose-500" />, light: 'from-rose-500/20 to-transparent', border: 'border-rose-500/30', text: 'text-rose-500' },
                ].map((s, idx) => (
                    <div key={idx} className={`glass bg-surface/40 border border-border-subtle rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-white/10 transition-colors`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.light} blur-[50px] rounded-full pointer-events-none -z-10 transition-opacity opacity-50 group-hover:opacity-100`} />
                        <div className="flex items-start justify-between gap-4 relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black tracking-widest uppercase text-foreground-muted mb-2">{s.label}</h4>
                                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border ${s.border} shadow-inner`}>
                                {s.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="relative z-10 space-y-6">
                <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-border-subtle bg-black/20 flex flex-col md:flex-row justify-between gap-4 items-center">
                        <div className="relative w-full md:w-96 flex items-center">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Buscar por grupo, membro ou motivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-border-subtle rounded-xl text-sm font-medium text-white placeholder-neutral-500 focus:outline-none focus:border-brand/50 transition-all shadow-inner"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-extrabold rounded-xl border border-border-subtle transition-all shadow-sm shrink-0 active:scale-95"
                        >
                            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin text-brand drop-shadow-[0_0_5px_rgba(230,57,70,0.5)]' : 'text-neutral-400'}`} />
                            Atualizar Escudo
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto my-scroll-area">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/40 border-b border-border-subtle/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Data / Hora</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Grupo Alvo</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Membro Infrator</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Penalidade</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Motivo Detectado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle/30 bg-black/10">
                                {loading && filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <Shield className="w-10 h-10 text-brand/20 mx-auto mb-4" />
                                            <p className="text-neutral-400 font-medium text-sm">Carregando defesas registradas...</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <Shield className="w-10 h-10 text-brand/20 mx-auto mb-4" />
                                            <p className="text-white font-extrabold text-lg mb-1">Paz no Reino</p>
                                            <p className="text-neutral-500 font-medium text-sm">Nenhum strike registrado ainda nas suas comunidades.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-surface/50 transition-colors group">
                                            {/* Date */}
                                            <td className="px-6 py-4 text-xs font-bold text-neutral-400 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 opacity-50" />
                                                    {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                                                </div>
                                            </td>
                                            
                                            {/* Group */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-extrabold text-white truncate max-w-[150px] block">{log.group_name}</span>
                                            </td>

                                            {/* Member */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-xl bg-black/40 border border-border-subtle flex items-center justify-center text-[10px] font-black text-neutral-400 shadow-inner group-hover:text-brand transition-colors">
                                                        {log.member_jid.substring(0, 2)}
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-300 font-mono tracking-tight">{log.member_jid.split('@')[0]}</span>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {log.action === 'strike_added' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/5 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                                                        <AlertOctagon className="w-3.5 h-3.5" /> Advertência
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/5 text-rose-500 text-[10px] font-black rounded-lg border border-rose-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(225,29,72,0.1)]">
                                                        <UserMinus className="w-3.5 h-3.5" /> Banimento Total
                                                    </span>
                                                )}
                                            </td>

                                            {/* Reason */}
                                            <td className="px-6 py-4">
                                                <div className="bg-black/40 border border-border-subtle rounded-xl p-3 shadow-inner">
                                                    <span className="text-sm font-medium text-neutral-300 leading-snug line-clamp-2" title={log.reason}>{log.reason}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer AI Note */}
                <div className="flex items-center justify-center gap-3 p-5 glass border border-border-subtle rounded-2xl bg-brand/5 shadow-sm max-w-3xl mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20 shrink-0">
                        <Bot className="w-5 h-5 text-brand" />
                    </div>
                    <p className="text-sm font-medium text-neutral-400 leading-relaxed">
                        <strong className="text-white font-extrabold mr-1">Operação Autônoma.</strong>
                        Os strikes são processados automaticamente pelo motor de segurança e validados pela <span className="text-brand">IA do Agente Saito</span> em tempo real.
                    </p>
                </div>
            </div>
        </div>
    );
}
