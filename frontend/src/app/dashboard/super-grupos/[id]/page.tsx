'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Rocket, ArrowLeft, Users, Calendar, Link2, Send, Shield, Target,
    CheckCircle2, XCircle, Loader2, Plus, Clock, Trash2, Flame, Eye,
    AlertTriangle, Copy, Check, ToggleLeft, ToggleRight, Megaphone,
    MessageSquare, ImageIcon, Video, Mic, FileText, ChevronRight, Sparkles
} from 'lucide-react';
import { ScheduleMessagePanel } from '@/components/ScheduleMessagePanel';
import { BlueprintStrategist } from '@/components/BlueprintStrategist';
import { createClient } from '@/lib/supabase/client';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

type Tab = 'overview' | 'overflow' | 'content' | 'gatekeeper' | 'leads' | 'strategist' | 'engajamento';

function TabBtn({ id, label, icon, active, onClick }: any) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-2xl border transition-all ${
                active 
                ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(230,57,70,0.3)]' 
                : 'border-border-subtle text-neutral-400 hover:text-white hover:border-border hover:bg-surface/50'
            }`}
        >
            {icon} {label}
        </button>
    );
}

function StatusPill({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string; ping: string }> = {
        draft: { label: 'Rascunho', cls: 'bg-neutral-800 text-neutral-400 border border-neutral-700', ping: 'bg-neutral-500' },
        active: { label: 'Ativa', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]', ping: 'bg-emerald-400 animate-pulse' },
        closed: { label: 'Encerrada', cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', ping: 'bg-rose-500' },
    };
    const s = map[status] || map.draft;
    return (
        <span className={`flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.ping}`} />
            {s.label}
        </span>
    );
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 bg-black/40 border border-border-subtle rounded-xl text-neutral-400 hover:text-brand hover:border-brand/30 transition-all hover:bg-brand/5 shadow-inner">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
    );
}

export default function CampaignDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('overview');
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Scarcity
    const [scarcityEnabled, setScarcityEnabled] = useState(false);
    const [scarcityInterval, setScarcityInterval] = useState(60);

    // Invite link
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [loadingLink, setLoadingLink] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/super-grupos/${id}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setCampaign(data);
            setScarcityEnabled(data.scarcity_enabled);
            setScarcityInterval(data.scarcity_interval_minutes || 60);

            // Load saved invite link from active group
            const activeGroup = (data.launch_groups || []).find((g: any) => g.is_active);
            if (activeGroup?.invite_link) setInviteLink(activeGroup.invite_link);

            if (data.launch_groups?.length > 0) {
                fetchMembers(data.launch_groups.map((g: any) => g.id));
            }
        } catch { } finally { setLoading(false); }
    }

    async function fetchMembers(groupIds: string[]) {
        setLoadingMembers(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .in('group_id', groupIds)
                .order('message_count', { ascending: false });
            
            if (data) setMembers(data);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoadingMembers(false);
        }
    }

    useEffect(() => { load(); }, [id]);

    async function doAction(action: string, opts: RequestInit = {}) {
        setActionLoading(action);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/super-grupos/${id}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            ...opts
        });
        await load();
        setActionLoading(null);
    }

    async function fetchInviteLink() {
        setLoadingLink(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/super-grupos/${id}/invite-link`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setInviteLink(data.invite_link);
        } catch { } finally { setLoadingLink(false); }
    }

    async function deleteMessage(msgId: string) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/super-grupos/${id}/messages/${msgId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        load();
    }

    async function toggleScarcity() {
        const newVal = !scarcityEnabled;
        setScarcityEnabled(newVal);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/super-grupos/${id}/scarcity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ enabled: newVal, interval_minutes: scarcityInterval }),
        });
        load();
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
                <p className="text-foreground-muted font-bold tracking-widest uppercase text-xs mt-4 animate-pulse">Carregando Campanha...</p>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="p-12 text-center text-foreground-muted font-medium">Campanha não encontrada.</div>
        );
    }

    const groups: any[] = campaign.launch_groups || [];
    const messages: any[] = campaign.launch_messages || [];
    const leads: any[] = campaign.launch_leads || [];
    const totalCapacity = groups.length * (campaign.overflow_limit || 250);
    const totalMembers = groups.reduce((s: number, g: any) => s + (g.member_count || 0), 0);
    const pct = totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0;
    const hotLeads = leads.filter(l => l.classification === 'hot').length;
    const warmLeads = leads.filter(l => l.classification === 'warm').length;

    return (
        <div className="p-8 pb-32 sm:p-12 w-full max-w-7xl mx-auto animate-in fade-in duration-500 relative">
            
            {/* Ambient Back Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10 glass p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm bg-surface/40">
                <div className="flex items-start gap-4">
                    <button onClick={() => router.push('/dashboard/super-grupos')} className="p-3 text-neutral-500 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-xl border border-transparent hover:border-border mt-1 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <StatusPill status={campaign.status} />
                            {campaign.offer_date && (
                                <span className="text-[10px] font-bold tracking-widest text-foreground-muted flex items-center gap-1.5 uppercase bg-black/20 px-3 py-1.5 rounded border border-border-subtle">
                                    <Calendar className="w-3.5 h-3.5 text-brand" />
                                    Oferta: {new Date(campaign.offer_date).toLocaleDateString('pt-BR')}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{campaign.name}</h1>
                        <p className="text-sm font-medium text-foreground-muted mt-2">Gerencie capacidade, mensagens e restrições dos grupos.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 sm:mt-0 items-start shrink-0">
                    {campaign.status !== 'active' && (
                        <button
                            onClick={() => doAction('open')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95"
                        >
                            {actionLoading === 'open' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                            Abrir Grupos (Lançar)
                        </button>
                    )}
                    {campaign.status === 'active' && (
                        <button
                            onClick={() => doAction('close')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(225,29,72,0.2)] hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] active:scale-95"
                        >
                            {actionLoading === 'close' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                            Encerrar Campanha
                        </button>
                    )}
                </div>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
                {[
                    { label: 'Grupos', value: groups.length, icon: <Users className="w-5 h-5 text-blue-400" />, border: 'border-blue-500/20' },
                    { label: 'Ocupação', value: `${totalMembers}/${totalCapacity}`, icon: <Target className="w-5 h-5 text-amber-400" />, border: 'border-amber-500/20' },
                    { label: 'Leads Quentes', value: hotLeads, icon: <Flame className="w-5 h-5 text-rose-400" />, border: 'border-rose-500/20' },
                    { label: 'Agendamentos', value: messages.filter(m => m.status === 'pending').length, icon: <Clock className="w-5 h-5 text-brand" />, border: 'border-brand/20' },
                ].map(c => (
                    <div key={c.label} className={`glass bg-surface/30 border border-border-subtle rounded-3xl p-6 flex items-center gap-4 hover:border-white/10 transition-colors shadow-sm`}>
                        <div className={`p-3 rounded-2xl bg-black/40 border ${c.border} shadow-inner`}>
                            {c.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase mb-1">{c.label}</p>
                            <p className="text-2xl font-extrabold text-white truncate" title={String(c.value)}>{c.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-8 flex-wrap relative z-10">
                <TabBtn id="overview" label="Visão Geral" icon={<Eye className="w-4 h-4" />} active={tab === 'overview'} onClick={setTab} />
                <TabBtn id="strategist" label="Estrategista (IA)" icon={<Sparkles className="w-4 h-4 text-amber-400" />} active={tab === 'strategist'} onClick={setTab} />
                <TabBtn id="engajamento" label="Engajamento" icon={<Flame className="w-4 h-4 text-orange-400" />} active={tab === 'engajamento'} onClick={setTab} />
                <TabBtn id="overflow" label="Transbordo Dinâmico" icon={<Link2 className="w-4 h-4" />} active={tab === 'overflow'} onClick={setTab} />
                <TabBtn id="content" label="Agendamento" icon={<MessageSquare className="w-4 h-4" />} active={tab === 'content'} onClick={setTab} />
                <TabBtn id="gatekeeper" label="Segurança & Escassez" icon={<Shield className="w-4 h-4" />} active={tab === 'gatekeeper'} onClick={setTab} />
                <TabBtn id="leads" label={`Leads Hot (${leads.length})`} icon={<Target className="w-4 h-4" />} active={tab === 'leads'} onClick={setTab} />
            </div>

            {/* Content Area */}
            <div className="relative z-10">
                {/* ── TAB: Overview ─────────────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Progress bar */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 shadow-sm">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                                    <Target className="w-5 h-5 text-brand" /> Ocupação Global
                                </span>
                                <span className={`text-2xl font-black tracking-tight ${pct >= 80 ? 'text-rose-400' : pct >= 50 ? 'text-amber-400' : 'text-brand'}`}>
                                    {pct}% lotado
                                </span>
                            </div>
                            <div className="h-4 bg-black/40 border border-border-subtle rounded-full overflow-hidden mb-3 shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-1000 ${pct >= 80 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : pct >= 50 ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-brand shadow-[0_0_15px_rgba(230,57,70,0.5)]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-foreground-muted">
                                <span>{totalMembers.toLocaleString()} LEADS NOS GRUPOS</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-border-subtle" />
                                <span>{(totalCapacity - totalMembers).toLocaleString()} VAGAS RESTANTES</span>
                            </div>
                        </div>

                        {/* Groups table */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-border-subtle bg-black/20 flex items-center justify-between">
                                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand" /> Grupos Orquestrados
                                </h3>
                                <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-border-subtle">
                                    {groups.length} Grupos
                                </span>
                            </div>
                            {groups.length === 0 ? (
                                <div className="p-12 text-center text-foreground-muted font-medium">Nenhum grupo vinculado.</div>
                            ) : (
                                <div className="divide-y divide-border-subtle/50 bg-black/10">
                                    {groups.sort((a, b) => a.order_index - b.order_index).map((g, i) => {
                                        const gpct = Math.round((g.member_count / (campaign.overflow_limit || 250)) * 100);
                                        return (
                                            <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-8 py-5 hover:bg-surface/50 transition-colors">
                                                <div className="flex items-center gap-4 sm:w-1/2">
                                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${g.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-surface text-neutral-500 border-border-subtle'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-extrabold text-white truncate">{g.group_name}</p>
                                                        <p className="text-xs text-neutral-500 truncate mt-0.5 font-mono">{g.group_jid}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 sm:w-1/2 justify-between sm:justify-end shrink-0 pl-12 sm:pl-0">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold tracking-widest uppercase text-foreground-muted mb-1">Capacidade</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 sm:w-32 h-2 bg-black/40 border border-border-subtle rounded-full overflow-hidden shadow-inner hidden sm:block">
                                                                <div className={`h-full rounded-full ${gpct >= 80 ? 'bg-rose-500' : gpct >= 50 ? 'bg-amber-400' : 'bg-brand'}`} style={{ width: `${Math.min(gpct, 100)}%` }} />
                                                            </div>
                                                            <span className="text-sm font-black text-white">{g.member_count}<span className="text-neutral-600 font-medium">/{campaign.overflow_limit}</span></span>
                                                        </div>
                                                    </div>
                                                    {g.is_active ? 
                                                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Captando
                                                        </span> 
                                                        : 
                                                        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 px-2.5 py-1">Inativo</span>
                                                    }
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB: Overflow / Transbordo ────────────────────────────────────── */}
                {tab === 'overflow' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[80px] rounded-full pointer-events-none -z-10" />
                            
                            <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 mb-4">
                                <Link2 className="w-7 h-7 text-brand drop-shadow-[0_0_10px_rgba(230,57,70,0.5)]" /> Link de Entrada Mágico
                            </h3>
                            <p className="text-sm text-foreground-muted font-medium mb-8 max-w-2xl leading-relaxed">Este link atua como um roteador inteligente. Ele sempre apontará para o grupo <strong>ativo</strong>, garantindo que nenhum lead fique de fora. Sempre que um grupo atinge o limite seguro de {campaign.overflow_limit} membros, o Saito substitui o convite instantaneamente para o próximo da fila.</p>
                            
                            {/* Permanent redirect URL */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex-1 flex items-center gap-3 bg-black/40 border border-brand/30 rounded-2xl px-5 py-2 shadow-inner group transition-colors hover:border-brand/50">
                                    <span className="flex-1 text-sm font-semibold text-brand font-mono truncate py-2">
                                        {`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://webhook.saito.app.br'}/join/${id}`}
                                    </span>
                                    <CopyBtn text={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://webhook.saito.app.br'}/join/${id}`} />
                                </div>
                            </div>

                            {/* Sync button + WhatsApp link status */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <button
                                    onClick={fetchInviteLink}
                                    disabled={loadingLink}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-brand/40 text-neutral-300 hover:text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {loadingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                    Sincronizar Link do Grupo Ativo
                                </button>
                                {inviteLink ? (
                                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4" /> Link em cache — redirect instantâneo
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                        <AlertTriangle className="w-4 h-4" /> Sem cache — o redirect buscará o link na hora do clique
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="glass bg-surface/40 border border-border-subtle rounded-3xl p-8 shadow-sm">
                            <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-400" /> Histórico de Preenchimento
                            </h3>
                            <div className="space-y-4">
                                {groups.sort((a, b) => a.order_index - b.order_index).map((g, i) => {
                                    const gpct = Math.round((g.member_count / (campaign.overflow_limit || 250)) * 100);
                                    return (
                                        <div key={g.id} className={`p-5 bg-black/20 rounded-2xl border ${g.is_active ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-border-subtle/50'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border ${g.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-surface text-neutral-500 border-border'}`}>{i + 1}</span>
                                                    <span className={`text-sm font-extrabold ${g.is_active ? 'text-white' : 'text-neutral-400'}`}>{g.group_name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-white">{g.member_count}<span className="text-neutral-600 font-medium">/{campaign.overflow_limit}</span></span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-black/60 border border-border-subtle rounded-full overflow-hidden shadow-inner">
                                                <div className={`h-full rounded-full transition-all duration-700 ${gpct >= 80 ? 'bg-rose-500' : gpct >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(gpct, 100)}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Content ──────────────────────────────────────────────────── */}
                {tab === 'content' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                        <ScheduleMessagePanel campaignId={campaign.id} onScheduled={load} />

                        {/* Messages list */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-border-subtle bg-black/20 flex items-center justify-between">
                                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-brand" /> Timeline de Lançamento
                                </h3>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted bg-surface border border-border-subtle px-3 py-1.5 rounded-lg flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand" /> {messages.length} envios 
                                </div>
                            </div>
                            {messages.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <MessageSquare className="w-12 h-12 text-brand/30 mb-4" />
                                    <p className="text-white font-extrabold text-lg mb-2">Timeline vazia</p>
                                    <p className="text-neutral-500 font-medium text-sm">Sem mensagens agendadas para replicar nos grupos.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-subtle/50 px-2 pb-2">
                                    {messages.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).map((msg, idx) => (
                                        <div key={msg.id} className="relative pl-8 pr-6 py-6 group hover:bg-surface/40 transition-colors m-2 rounded-2xl">
                                            {/* Timeline track line */}
                                            {idx !== messages.length - 1 && (
                                                <div className="absolute top-12 bottom-[-1.5rem] left-5 w-px bg-border-subtle/50 group-hover:bg-brand/20 transition-colors" />
                                            )}
                                            
                                            <div className="absolute top-6 left-3.5 w-3.5 h-3.5 rounded-full border-2 border-surface bg-brand z-10 shadow-[0_0_10px_rgba(230,57,70,0.5)] flex items-center justify-center">
                                                {msg.status === 'sent' ? <Check className="w-2.5 h-2.5 text-white" /> : null}
                                            </div>

                                            <div className="flex items-start gap-4 ml-2">
                                                <div className="flex-1 min-w-0 bg-black/20 border border-border-subtle rounded-2xl p-5 shadow-sm group-hover:border-border transition-colors">
                                                    
                                                    {/* Msg Header */}
                                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-border/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-surface border border-border px-2 py-0.5 rounded">
                                                                {msg.content_type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-400" />}
                                                                {msg.content_type === 'video' && <Video className="w-3.5 h-3.5 text-blue-400" />}
                                                                {msg.content_type === 'audio' && <Mic className="w-3.5 h-3.5 text-amber-400" />}
                                                                {msg.content_type === 'document' && <FileText className="w-3.5 h-3.5 text-rose-400" />}
                                                                {msg.content_type === 'text' && <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                                                                {msg.content_type}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-foreground-muted">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {new Date(msg.scheduled_at).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            {msg.humanize && <span className="text-[10px] font-bold uppercase tracking-widest text-brand px-2 py-0.5 rounded bg-brand/10 border border-brand/20">Modo Humano</span>}
                                                            {msg.status === 'pending' && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]">Pendente</span>}
                                                            {msg.status === 'sent' && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Enviado</span>}
                                                            {msg.status === 'error' && <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 shadow-[0_0_8px_rgba(225,29,72,0.3)]">Erro</span>}
                                                        </div>
                                                    </div>

                                                    {/* Msg Content */}
                                                    <div className="text-[14px] text-neutral-300 leading-relaxed font-medium whitespace-pre-wrap px-1">
                                                        {(msg.content_type !== 'text' && msg.caption) ? msg.caption : msg.content}
                                                    </div>
                                                    
                                                    {msg.media_url && (
                                                        <a href={msg.media_url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-brand hover:bg-brand/10 hover:border-brand/30 transition-all">
                                                            <Link2 className="w-4 h-4" /> Acessar Mídia Anexada <ChevronRight className="w-3 h-3 opacity-50" />
                                                        </a>
                                                    )}
                                                </div>
                                                
                                                {/* Actions */}
                                                {msg.status === 'pending' && (
                                                    <button onClick={() => deleteMessage(msg.id)} className="shrink-0 p-3 mt-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TAB: Gatekeeper ───────────────────────────────────────────────── */}
                {tab === 'gatekeeper' && (
                    <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        {/* Open/Close */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 space-y-4 hover:shadow-premium hover:border-border transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] mb-2 group-hover:scale-110 transition-transform">
                                    <Rocket className="w-7 h-7 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Câmera... Ação! (Abrir)</h3>
                                    <p className="text-sm font-medium text-neutral-400 leading-relaxed">Libera todos os grupos para que os membros possam enviar mensagens, tirar dúvidas e interagir. (Modo: aberto)</p>
                                </div>
                                <button
                                    onClick={() => doAction('open')}
                                    disabled={!!actionLoading}
                                    className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-extrabold rounded-2xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95"
                                >
                                    {actionLoading === 'open' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Abrir Todos os Grupos Agora
                                </button>
                            </div>

                            <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 space-y-4 hover:shadow-premium hover:border-border transition-all group">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(225,29,72,0.15)] mb-2 group-hover:scale-110 transition-transform">
                                    <Shield className="w-7 h-7 text-rose-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Blindar (Fechar)</h3>
                                    <p className="text-sm font-medium text-neutral-400 leading-relaxed">Fecha os grupos, bloqueando envios da comunidade. Apenas os admins podem disparar mensagens. (Modo: anúncio)</p>
                                </div>
                                <button
                                    onClick={() => doAction('close')}
                                    disabled={!!actionLoading}
                                    className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-surface border border-border hover:border-rose-500 hover:bg-rose-500/10 text-white hover:text-rose-400 text-sm font-extrabold rounded-2xl transition-all disabled:opacity-50 active:scale-95 shadow-inner"
                                >
                                    {actionLoading === 'close' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                    Restringir Grupos para Admins
                                </button>
                            </div>
                        </div>

                        {/* Scarcity */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                                        <Flame className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-white tracking-tight">Motor de Escassez Automática</h3>
                                        <p className="text-sm font-medium text-neutral-400 mt-1 max-w-lg">Cria urgência real enviando alertas da capacidade atual dos grupos.</p>
                                    </div>
                                </div>
                                <button onClick={toggleScarcity} className="text-neutral-400 hover:text-white transition-colors">
                                    {scarcityEnabled ? <ToggleRight className="w-12 h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /> : <ToggleLeft className="w-12 h-12 opacity-50" />}
                                </button>
                            </div>

                            <div className="bg-black/20 border border-border-subtle rounded-2xl p-6 relative z-10">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-foreground-muted w-24">Frequência</label>
                                            <select
                                                value={scarcityInterval}
                                                onChange={e => setScarcityInterval(+e.target.value)}
                                                className="bg-black/60 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500/50 shadow-inner"
                                            >
                                                <option value={15}>A cada 15 min</option>
                                                <option value={30}>A cada 30 min</option>
                                                <option value={60}>A cada 1 hora</option>
                                                <option value={120}>A cada 2 horas</option>
                                            </select>
                                        </div>
                                        {scarcityEnabled ? (
                                            <div className="flex items-start gap-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 shadow-[0_0_10px_rgba(16,185,129,0.05)] font-medium">
                                                <Radio className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
                                                <p>Escassez ligada. Robô rodando e enviando atualizações conforme intervalo definido.</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-3 text-sm text-neutral-500 bg-surface border border-border rounded-xl px-4 py-3 font-medium">
                                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 opacity-50" />
                                                <p>Motor de escassez desligado no momento.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 bg-black/40 border border-border-subtle rounded-xl p-5 shadow-inner">
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5" /> Preview da Copy Gerada
                                        </p>
                                        <div className="text-sm font-medium text-neutral-300 leading-relaxed">
                                            <span className="text-rose-400">🔴 VAGAS PREENCHENDO RÁPIDO!</span><br /><br />
                                            📊 {pct}% das vagas já foram preenchidas.<br />
                                            Restam apenas <strong>{totalCapacity - totalMembers} vagas</strong> com o desconto especial!<br /><br />
                                            ⚡ Garanta a sua agora antes que acabe!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Leads ────────────────────────────────────────────────────── */}
                {tab === 'leads' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { label: '🔥 Alta Intenção (Hot)', value: hotLeads, light: 'from-rose-500/20 to-transparent', border: 'border-rose-500/30', text: 'text-rose-400' },
                                { label: '🌡️ Indecisos (Warm)', value: warmLeads, light: 'from-amber-500/20 to-transparent', border: 'border-amber-500/30', text: 'text-amber-400' },
                                { label: '🧊 Curiosos (Cold)', value: leads.length - hotLeads - warmLeads, light: 'from-blue-500/20 to-transparent', border: 'border-blue-500/30', text: 'text-blue-400' },
                            ].map(c => (
                                <div key={c.label} className={`glass bg-surface/40 border ${c.border} rounded-3xl p-6 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]`}>
                                    <div className={`absolute inset-0 bg-gradient-to-b ${c.light} opacity-50`} />
                                    <h4 className="text-[10px] font-black tracking-widest uppercase text-foreground-muted mb-2 relative z-10">{c.label}</h4>
                                    <p className={`text-4xl font-extrabold relative z-10 drop-shadow-md ${c.text}`}>{c.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Leads table */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-border-subtle bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                        <Target className="w-5 h-5 text-brand" /> Hub de Inteligência de Leads
                                    </h3>
                                    <p className="text-xs font-medium text-foreground-muted mt-1">O LLM analisa e classifica mensagens das pessoas automaticamente para buscar intenção de compra.</p>
                                </div>
                                <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-border-subtle shrink-0">
                                    {leads.length} Cadastros
                                </span>
                            </div>

                            {leads.length === 0 ? (
                                <div className="py-24 text-center">
                                    <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <Eye className="w-8 h-8 text-neutral-600" />
                                    </div>
                                    <p className="text-white font-extrabold text-lg mb-1">Cão de Guarda Mudo</p>
                                    <p className="text-sm font-medium text-neutral-500 max-w-sm mx-auto">Nenhum cruzamento de intenção detectado. Abra os grupos e permita que os leads conversem para a IA entrar em ação.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-subtle/50 bg-black/10">
                                    {leads.map(lead => {
                                        const isHot = lead.classification === 'hot';
                                        const isWarm = lead.classification === 'warm';
                                        const badgeStyle = isHot
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                            : isWarm
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                                        
                                        return (
                                            <div key={lead.id} className="p-8 flex flex-col sm:flex-row gap-6 hover:bg-surface/40 transition-colors">
                                                <div className="sm:w-1/4 shrink-0 border-r border-border/30 pr-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm mb-3 ${badgeStyle}`}>
                                                        {isHot ? '🔥 Hot' : isWarm ? '🌡️ Warm' : '🧊 Cold'}
                                                    </span>
                                                    <p className="text-sm font-extrabold text-white break-all">{lead.member_name || lead.member_jid}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mt-1">
                                                        <Clock className="w-3.5 h-3.5" /> {new Date(lead.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="bg-black/40 border border-border-subtle rounded-2xl p-5 shadow-inner mb-4 relative">
                                                        <MessageSquare className="absolute top-4 right-4 w-4 h-4 text-neutral-600 opacity-50" />
                                                        <p className="text-sm text-neutral-300 font-medium leading-relaxed pr-6 italic">"{lead.message_text}"</p>
                                                    </div>
                                                    
                                                    {lead.gemini_reasoning && (
                                                        <div className="flex items-start gap-3 mt-3">
                                                            <div className="w-6 h-6 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Rocket className="w-3.5 h-3.5 text-brand" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Análise do Agente Saito</p>
                                                                <p className="text-xs text-neutral-400 font-medium leading-relaxed">{lead.gemini_reasoning}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {lead.keywords_matched?.length > 0 && (
                                                        <div className="flex gap-2 flex-wrap mt-4">
                                                            {lead.keywords_matched.map((kw: string) => (
                                                                <span key={kw} className="text-[10px] bg-surface border border-border-subtle text-neutral-300 px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">#{kw}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STRATEGIST TAB ────────────────────────────────────────────── */}
                {tab === 'strategist' && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="glass border border-border-subtle rounded-3xl p-8 bg-surface/40 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-white tracking-tight">IA Strategist: Meteórico Starter</h2>
                                    <p className="text-sm font-medium text-foreground-muted">Configure sua estratégia de lançamento com a ajuda da nossa IA especialista.</p>
                                </div>
                            </div>
                            <BlueprintStrategist 
                                campaignId={id} 
                                onPlanApplied={() => {
                                    load(); 
                                }} 
                            />
                        </div>
                    </div>
                )}

                {/* ── TAB: Engajamento ────────────────────────────────────────────── */}
                {tab === 'engajamento' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-6 flex items-center gap-4 hover:shadow-premium transition-all">
                                <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                    <MessageSquare className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">Total Mensagens</p>
                                    <p className="text-2xl font-black text-white">{members.reduce((acc, m) => acc + (m.message_count || 0), 0)}</p>
                                </div>
                            </div>
                            <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-6 flex items-center gap-4 hover:shadow-premium transition-all">
                                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">Membros Ativos</p>
                                    <p className="text-2xl font-black text-white">{members.filter(m => (m.message_count || 0) > 0).length}</p>
                                </div>
                            </div>
                            <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-6 flex items-center gap-4 hover:shadow-premium transition-all">
                                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-foreground-muted uppercase">Total Infrações</p>
                                    <p className="text-2xl font-black text-white">{members.reduce((acc, m) => acc + (m.strikes || 0), 0)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Ranking Table */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-border-subtle bg-black/20 flex items-center justify-between">
                                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500" /> Ranking de Engajamento
                                </h3>
                                <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-border-subtle">
                                    Top Atividade
                                </span>
                            </div>

                            {loadingMembers ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
                                    <p className="text-foreground-muted font-bold uppercase text-xs tracking-widest">Processando Atividade...</p>
                                </div>
                            ) : members.length === 0 ? (
                                <div className="p-20 text-center">
                                    <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4 opacity-20" />
                                    <p className="text-neutral-500 font-medium">Nenhum dado de atividade registrado ainda.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/10">
                                                <th className="px-8 py-4 text-[10px] font-black tracking-widest text-neutral-500 uppercase">Pos</th>
                                                <th className="px-8 py-4 text-[10px] font-black tracking-widest text-neutral-500 uppercase">Membro</th>
                                                <th className="px-8 py-4 text-[10px] font-black tracking-widest text-neutral-500 uppercase text-center">Mensagens</th>
                                                <th className="px-8 py-4 text-[10px] font-black tracking-widest text-neutral-500 uppercase text-center">Score</th>
                                                <th className="px-8 py-4 text-[10px] font-black tracking-widest text-neutral-500 uppercase text-center">Infrações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle/50 bg-black/5">
                                            {members.map((m, i) => (
                                                <tr key={m.id} className="hover:bg-brand/5 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${i === 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : i === 1 ? 'bg-neutral-300/10 text-neutral-400 border-neutral-300/20' : i === 2 ? 'bg-orange-800/20 text-orange-600 border-orange-800/30' : 'bg-surface text-neutral-500 border-border-subtle'}`}>
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div>
                                                            <p className="text-sm font-extrabold text-white group-hover:text-brand transition-colors">@{m.jid.split('@')[0]}</p>
                                                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5 tracking-tight opacity-50">{m.jid}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-black text-white">{m.message_count || 0}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="text-sm font-black text-emerald-400">{m.lead_score || 0}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        {m.strikes > 0 ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                                                                <Shield className="w-3 h-3" /> {m.strikes}/3
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-600 border border-neutral-800 px-2 py-0.5 rounded">Limpo</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline fallback for missing lucide icon
function Radio(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path>
            <path d="M7.76 16.24a6 6 0 0 1 0-8.48"></path>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.48"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
    );
}
