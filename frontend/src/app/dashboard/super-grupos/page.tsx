'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Rocket, Plus, Calendar, Users, CheckCircle2,
    Clock, XCircle, Loader2, Trash2, ArrowRight, Target
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; indicator: string }> = {
        draft: { label: 'Rascunho', cls: 'bg-neutral-800 text-neutral-400 border border-neutral-700', indicator: 'bg-neutral-500' },
        active: { label: 'Ativa', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]', indicator: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' },
        closed: { label: 'Encerrada', cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', indicator: 'bg-rose-500' },
    };
    const s = map[status] || map.draft;
    return (
        <span className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.indicator}`} />
            {s.label}
        </span>
    );
}

export default function SuperGruposPage() {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/super-grupos`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            setCampaigns(Array.isArray(data) ? data : []);
        } catch { setCampaigns([]); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function deleteCampaign(id: string, e: React.MouseEvent) {
        e.preventDefault();
        if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
        setDeleting(id);
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/super-grupos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
        });
        load();
        setDeleting(null);
    }

    const totalGroups = campaigns.reduce((s, c) => s + (c.launch_groups?.length || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 relative">
            
            {/* Ambient Back Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 glass p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm bg-surface/40">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-[0_0_15px_rgba(230,57,70,0.15)] shrink-0">
                        <Rocket className="w-7 h-7 text-brand drop-shadow-[0_0_8px_rgba(230,57,70,0.5)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Super Grupos</h1>
                        <p className="text-foreground-muted text-sm font-medium mt-1">Gestão de automações em massa no WhatsApp</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/super-grupos/new"
                    className="flex items-center gap-2 px-6 py-3.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] active:scale-95 shrink-0 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    Nova Campanha
                </Link>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                {[
                    { label: 'Total de Campanhas', value: campaigns.length, icon: <Target className="w-6 h-6 text-brand" />, bg: 'bg-brand/10 border-brand/20 shadow-[0_0_15px_rgba(230,57,70,0.1)]' },
                    { label: 'Campanhas Ativas', value: activeCampaigns, icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' },
                    { label: 'Grupos Configurados', value: totalGroups, icon: <Users className="w-6 h-6 text-blue-400" />, bg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
                ].map(card => (
                    <div key={card.label} className="glass border border-border-subtle rounded-3xl p-6 sm:p-8 flex items-center gap-5 hover:border-border transition-colors hover:shadow-premium bg-surface/30">
                        <div className={`p-4 rounded-2xl border ${card.bg}`}>{card.icon}</div>
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-foreground-muted mb-1">{card.label}</p>
                            <p className="text-3xl sm:text-4xl font-extrabold text-white">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaigns list */}
            <div className="relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 glass rounded-3xl border border-border-subtle bg-surface/30">
                        <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(230,57,70,0.5)] mb-4" />
                        <p className="text-foreground-muted font-bold tracking-widest uppercase text-xs animate-pulse">Carregando Campanhas...</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="glass border border-dashed border-border-subtle rounded-3xl py-24 text-center space-y-5 shadow-sm bg-surface/30">
                        <div className="w-20 h-20 bg-surface border border-border-subtle rounded-full mx-auto flex items-center justify-center shadow-inner">
                            <Rocket className="w-10 h-10 text-brand/50" />
                        </div>
                        <div>
                            <p className="text-xl font-extrabold text-white mb-2">Nenhuma campanha criada ainda.</p>
                            <p className="text-foreground-muted font-medium text-sm">Crie sua primeira campanha de Super Grupos e automatize seu lançamento!</p>
                        </div>
                        <Link href="/dashboard/super-grupos/new" className="inline-flex items-center gap-2 mt-4 px-8 py-4 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-2xl shadow-shadow-glow hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] transition-all active:scale-95">
                            <Plus className="w-5 h-5" /> Criar Primeira Campanha
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campaigns.map((camp: any) => {
                            const groups = camp.launch_groups || [];
                            const totalMembers = groups.reduce((s: number, g: any) => s + (g.member_count || 0), 0);
                            const totalCapacity = groups.length * (camp.overflow_limit || 250);
                            const pct = totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0;
                            const offerDate = new Date(camp.offer_date);
                            const progressColor = pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-400' : 'bg-brand';
                            const progressText = pct >= 80 ? 'text-rose-400' : pct >= 50 ? 'text-amber-400' : 'text-brand';

                            return (
                                <Link key={camp.id} href={`/dashboard/super-grupos/${camp.id}`} className="block glass border border-border-subtle hover:border-brand/40 hover:bg-surface/60 rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-premium group bg-surface/40 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex items-start justify-between gap-4 relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                <StatusBadge status={camp.status} />
                                                {camp.offer_date && (
                                                    <span className="text-[10px] font-bold tracking-widest text-foreground-muted flex items-center gap-1.5 uppercase bg-black/20 px-2 py-0.5 rounded border border-border-subtle">
                                                        <Calendar className="w-3 h-3 text-brand" />
                                                        Oferta: {offerDate.toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-extrabold text-white group-hover:text-brand transition-colors truncate tracking-tight">{camp.name}</h3>
                                            
                                            <div className="grid grid-cols-3 gap-3 mt-5">
                                                <div className="bg-black/20 border border-border-subtle rounded-xl p-3 shrink-0">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-widest"><Users className="w-3.5 h-3.5 text-blue-400" />Grupos</span>
                                                    <span className="text-base font-extrabold text-white mt-1 block">{groups.length}</span>
                                                </div>
                                                <div className="bg-black/20 border border-border-subtle rounded-xl p-3 shrink-0">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-widest"><Clock className="w-3.5 h-3.5 text-purple-400" />Msgs</span>
                                                    <span className="text-base font-extrabold text-white mt-1 block">{camp.launch_messages?.[0]?.count || 0}</span>
                                                </div>
                                                <div className="bg-black/20 border border-border-subtle rounded-xl p-3 shrink-0">
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-foreground-muted uppercase tracking-widest"><Target className="w-3.5 h-3.5 text-emerald-400" />Leads</span>
                                                    <span className="text-base font-extrabold text-white mt-1 block">{camp.launch_leads?.[0]?.count || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => deleteCampaign(camp.id, e)}
                                                className="p-2.5 text-foreground-muted hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent rounded-xl transition-all z-20"
                                                title="Excluir campanha"
                                            >
                                                {deleting === camp.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                            <div className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center group-hover:bg-brand group-hover:border-brand transition-colors">
                                                <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Capacity progress bar */}
                                    {groups.length > 0 && (
                                        <div className="mt-8 relative z-10">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                                                    <Users className="w-3.5 h-3.5 text-brand" /> {totalMembers.toLocaleString()} <span className="text-[10px] mx-0.5 opacity-50">/</span> {totalCapacity.toLocaleString()} vagas
                                                </span>
                                                <span className={`text-sm font-black tracking-tight ${progressText}`}>{pct}% cheio</span>
                                            </div>
                                            <div className="h-2 bg-black/40 border border-border-subtle rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor} shadow-[0_0_10px_rgba(currentColor,0.5)]`}
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
