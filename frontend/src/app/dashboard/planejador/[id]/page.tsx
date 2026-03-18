'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Rocket, ArrowLeft, Calendar, Package, Zap, Loader2,
    Sparkles, AlertTriangle, Check, Copy, Plus, Trash2,
    Send, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PHASES: Record<string, { label: string; color: string; bgColor: string; borderColor: string; day: string }> = {
    captacao: { label: 'Captação', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', day: 'D-7 a D-4' },
    aquecimento: { label: 'Aquecimento', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', day: 'D-3 e D-2' },
    revelacao: { label: 'Revelação', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', day: 'D-1' },
    dia_d: { label: '🔥 Dia D', color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30', day: 'Dia D' },
};

const TABS = [
    { key: 'timeline', label: '📅 Timeline', icon: Calendar },
    { key: 'assets', label: '📦 Assets Hub', icon: Package },
    { key: 'executar', label: '⚡ Executar', icon: Zap },
];

export default function PlanejadorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('timeline');

    // Timeline
    const [refining, setRefining] = useState<string | null>(null);
    const [refineInput, setRefineInput] = useState<Record<string, string>>({});
    const [refineOpen, setRefineOpen] = useState<string | null>(null);
    const [refineResult, setRefineResult] = useState<Record<string, any>>({});
    const [copied, setCopied] = useState<string | null>(null);

    // Assets
    const [assets, setAssets] = useState<Record<string, string>>({});
    const [savingAsset, setSavingAsset] = useState<string | null>(null);

    // Executar
    const [executing, setExecuting] = useState(false);
    const [execConfig, setExecConfig] = useState({
        auto_create_groups: true,
        group_count: 3,
        group_name_pattern: '',
        admin_number: '',
        overflow_limit: 250,
    });
    const [execLog, setExecLog] = useState<string[]>([]);
    const [execDone, setExecDone] = useState<any>(null);

    useEffect(() => {
        fetchPlan();
    }, [id]);

    async function fetchPlan() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/planner/${id}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
            });
            const data = await res.json();
            setPlan(data);

            // Pre-fill assets
            const assetMap: Record<string, string> = {};
            (data.launch_plan_assets || []).forEach((a: any) => {
                assetMap[a.asset_type] = a.url || '';
            });
            setAssets(assetMap);
        } catch { /* ignore */ }
        setLoading(false);
    }

    async function refineMessage(msgId: string) {
        setRefining(msgId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/planner/${id}/messages/${msgId}/refine`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ instruction: refineInput[msgId] || '' }),
            });
            const data = await res.json();
            setRefineResult(prev => ({ ...prev, [msgId]: data }));
            // Update in local state
            setPlan((prev: any) => ({
                ...prev,
                launch_plan_messages: prev.launch_plan_messages.map((m: any) =>
                    m.id === msgId ? { ...m, content: data.content, refined_by_ai: true } : m
                ),
            }));
        } catch { /* ignore */ }
        setRefining(null);
    }

    async function saveAsset(type: string) {
        setSavingAsset(type);
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/planner/${id}/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ asset_type: type, url: assets[type], label: type }),
        });

        // Update checkout URL in plan
        if (type === 'checkout') {
            await fetch(`${API}/api/planner/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ checkout_url: assets[type] }),
            });
        }
        setSavingAsset(null);
    }

    async function copyText(text: string, id: string) {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 1500);
    }

    async function execute() {
        setExecuting(true);
        setExecLog(['🔄 Iniciando execução...']);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/planner/${id}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(execConfig),
            });
            const data = await res.json();
            setExecLog(data.log || []);
            setExecDone(data);
        } catch (e: any) {
            setExecLog(prev => [...prev, `❌ Erro: ${e.message}`]);
        }
        setExecuting(false);
    }

    // Group messages by phase
    const messagesByPhase = (plan?.launch_plan_messages || []).reduce((acc: any, m: any) => {
        if (!acc[m.phase]) acc[m.phase] = [];
        acc[m.phase].push(m);
        return acc;
    }, {} as Record<string, any[]>);

    // Sort each phase by offset
    Object.keys(messagesByPhase).forEach(phase => {
        messagesByPhase[phase].sort((a: any, b: any) => a.scheduled_offset_hours - b.scheduled_offset_hours);
    });

    function formatOffset(hours: number, offerDate?: string) {
        const absH = Math.abs(hours);
        const days = Math.floor(absH / 24);
        const remH = absH % 24;
        const daysStr = days > 0 ? `${days}d ` : '';
        const hoursStr = remH > 0 ? `${remH}h` : '';
        if (hours < 0) return `D-${days || ''} ${remH > 0 ? remH + 'h antes' : ''}`.trim();
        if (hours === 0) return 'Dia D • Abertura';
        return `Dia D + ${daysStr}${hoursStr}`;
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[500px]">
            <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
            <p className="text-foreground-muted font-medium mt-4 animate-pulse">Carregando plano...</p>
        </div>
    );

    if (!plan) return (
        <div className="p-10 text-center text-foreground-muted">Plano não encontrado.</div>
    );

    const msgCount = plan.launch_plan_messages?.length || 0;
    const hasMessages = msgCount > 0;

    return (
        <div className="p-8 sm:p-12 w-full max-w-6xl mx-auto animate-in fade-in duration-500 relative pb-20">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8 glass p-6 rounded-3xl border border-border-subtle shadow-premium bg-surface/40 relative z-10">
                <button
                    onClick={() => router.push('/dashboard/planejador')}
                    className="p-3 text-neutral-500 hover:text-white transition-colors mt-1 rounded-xl hover:bg-white/10 shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 mt-1.5">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">{plan.product_name}</h1>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-black tracking-widest uppercase border shadow-sm ${plan.status === 'executing' ? 'text-brand bg-brand-light border-brand/20' :
                            plan.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
                            }`}>
                            {plan.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground-muted">
                        <span className="flex items-center gap-1">📱 {plan.instance?.name || 'Instância não definida'}</span>
                        {plan.offer_date && <span className="flex items-center gap-1">📅 {new Date(plan.offer_date).toLocaleDateString('pt-BR')}</span>}
                        <span className="flex items-center gap-1">📊 {msgCount} mensagens agendadas</span>
                    </div>
                </div>

                {/* Continue briefing if no messages yet */}
                {!hasMessages && (
                    <button
                        onClick={() => router.push('/dashboard/planejador/new')}
                        className="flex items-center gap-2 px-6 py-3.5 bg-surface hover:bg-white text-white hover:text-black border border-border rounded-xl font-bold transition-all shadow-sm hover:scale-105 active:scale-95 group shrink-0"
                    >
                        <Sparkles className="w-4 h-4 text-brand group-hover:text-amber-500 transition-colors" />
                        Continuar Briefing
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 glass border border-border-subtle rounded-2xl p-1.5 mb-10 bg-black/20 relative z-10 shadow-sm max-w-lg">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold rounded-xl transition-all ${tab === t.key ? 'bg-brand text-white shadow-shadow-glow' : 'text-neutral-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab === t.key && <t.icon className="w-4 h-4" />}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TIMELINE TAB ──────────────────────────────────────────────── */}
            {tab === 'timeline' && (
                <div className="relative z-10">
                    {!hasMessages ? (
                        <div className="glass border border-dashed border-border-subtle rounded-3xl p-16 text-center shadow-sm">
                            <Sparkles className="w-12 h-12 text-brand mx-auto mb-6 opacity-80 drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
                            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Nenhuma mensagem ainda</h3>
                            <p className="text-foreground-muted font-medium mb-8 max-w-md mx-auto">Complete o briefing para o Saito Strategist gerar a timeline completa com todas as copies.</p>
                            <button
                                onClick={() => router.push('/dashboard/planejador/new')}
                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] transition-all active:scale-95"
                            >
                                <Rocket className="w-4 h-4" />
                                Iniciar Briefing
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {['captacao', 'aquecimento', 'revelacao', 'dia_d'].map(phase => {
                                const msgs = messagesByPhase[phase] || [];
                                const ph = PHASES[phase];
                                if (!msgs.length) return null;
                                return (
                                    <div key={phase} className="relative">
                                        {/* Phase header */}
                                        <div className="flex items-center gap-4 mb-6 sticky top-20 z-20 bg-background/80 backdrop-blur-md py-4 rounded-xl px-2">
                                            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${ph.color} ${ph.bgColor} border ${ph.borderColor} shadow-sm`}>
                                                {ph.label}
                                            </div>
                                            <span className="text-sm font-bold text-foreground-muted">{ph.day}</span>
                                            <div className="flex-1 h-px bg-border-subtle/50" />
                                        </div>

                                        {/* Messages */}
                                        <div className="space-y-4 pl-0 sm:pl-4 border-l-2 border-border/30 ml-6 relative">
                                            {/* decorative line glow */}
                                            <div className="absolute top-0 bottom-0 left-[-2px] w-[2px] bg-gradient-to-b from-brand/50 via-purple-500/10 to-transparent" />
                                            
                                            {msgs.map((msg: any) => {
                                                const result = refineResult[msg.id];
                                                const isRefineOpen = refineOpen === msg.id;
                                                const isTooLong = msg.content.length > 800;

                                                return (
                                                    <div key={msg.id} className={`glass border rounded-3xl overflow-hidden transition-all ${ph.borderColor} border-opacity-40 hover:border-opacity-100 hover:shadow-premium bg-surface/40 hover:bg-surface/60 group ml-6 relative`}>
                                                        
                                                        <div className="absolute top-10 -left-[1.85rem] w-3 h-3 rounded-full bg-surface border-2 border-brand z-10 shadow-[0_0_10px_rgba(230,57,70,0.8)]" />

                                                        {/* Message header */}
                                                        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-black/20 shadow-sm">
                                                            <span className={`text-xs font-black tracking-widest uppercase ${ph.color}`}>
                                                                {formatOffset(msg.scheduled_offset_hours, plan.offer_date)}
                                                            </span>
                                                            {msg.refined_by_ai && (
                                                                <span className="text-[10px] font-bold tracking-widest uppercase text-brand flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-light border border-brand/20">
                                                                    <Sparkles className="w-3 h-3" /> Refinado
                                                                </span>
                                                            )}
                                                            {isTooLong && (
                                                                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 flex items-center gap-1.5 ml-auto px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                                    <AlertTriangle className="w-3 h-3" /> Longo para mobile
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="px-6 py-5">
                                                            <p className="text-[15px] xl:text-base text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                                                {msg.content}
                                                            </p>
                                                            {msg.variables_used?.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-subtle/50">
                                                                    {msg.variables_used.map((v: string) => (
                                                                        <span key={v} className="text-[10px] font-bold uppercase tracking-widest font-mono bg-brand/10 text-brand px-2.5 py-1 rounded border border-brand/20">{v}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-3 px-6 py-4 border-t border-border/50 bg-surface">
                                                            <button
                                                                onClick={() => copyText(msg.content, msg.id)}
                                                                className="flex items-center gap-2 text-xs font-bold text-foreground-muted hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                                                            >
                                                                {copied === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                                {copied === msg.id ? 'Copiado!' : 'Copiar Copy'}
                                                            </button>
                                                            <button
                                                                onClick={() => setRefineOpen(isRefineOpen ? null : msg.id)}
                                                                className="flex items-center gap-2 text-xs font-bold text-brand hover:text-brand-hover transition-colors px-3 py-2 rounded-lg hover:bg-brand/10 bg-brand/5 border border-transparent hover:border-brand/20 ml-auto"
                                                            >
                                                                <Sparkles className="w-4 h-4" />
                                                                Saito Strategist: Refinar
                                                                {isRefineOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </div>

                                                        {/* Refine panel */}
                                                        {isRefineOpen && (
                                                            <div className="px-6 py-5 border-t border-brand/20 bg-brand/5 animate-in slide-in-from-top-2 duration-300">
                                                                <p className="text-xs font-bold text-brand uppercase tracking-widest mb-3">Instrução para refinamento (opcional):</p>
                                                                <div className="flex flex-col sm:flex-row gap-3">
                                                                    <input
                                                                        value={refineInput[msg.id] || ''}
                                                                        onChange={e => setRefineInput(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                                                        placeholder="Ex: Torna mais curto, mais urgente, adicione emoji..."
                                                                        className="flex-1 bg-surface border border-brand/30 rounded-xl px-4 py-3 text-sm text-white placeholder-brand/40 focus:outline-none focus-ring transition-all"
                                                                    />
                                                                    <button
                                                                        onClick={() => refineMessage(msg.id)}
                                                                        disabled={refining === msg.id}
                                                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-brand-hover shadow-shadow-glow transition-all"
                                                                    >
                                                                        {refining === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                                        Refinar
                                                                    </button>
                                                                </div>
                                                                {refineResult[msg.id]?.too_long_warning && (
                                                                    <p className="text-xs text-amber-400 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 font-medium">
                                                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                                        <span>Esta copy está longa para mobile. Quer que eu resuma mantendo o gatilho de urgência?</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── ASSETS HUB TAB ────────────────────────────────────────────── */}
            {tab === 'assets' && (
                <div className="space-y-8 max-w-4xl mx-auto relative z-10 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="glass border border-border-subtle rounded-3xl p-8 shadow-sm hover:shadow-premium transition-all hover:border-border/80 bg-surface/40">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                <span className="text-xl">💰</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-white tracking-tight">Checkouts</h2>
                        </div>
                        <p className="text-sm font-medium text-foreground-muted mb-6 pl-[3.25rem]">O Saito substitui <code className="bg-surface border border-border px-1.5 py-0.5 rounded mx-1 text-brand">{'{{link_checkout}}'}</code> automaticamente durante o envio.</p>

                        <div className="space-y-6">
                            {[
                                { type: 'checkout', label: 'Checkout Principal', placeholder: 'https://pay.hotmart.com/...', badge: 'Principal', badgeColor: 'bg-brand/20 text-brand border-brand/30' },
                                { type: 'checkout_recovery', label: 'Checkout de Recuperação', placeholder: 'https://pay.eduzz.com/...', badge: 'Backup', badgeColor: 'bg-neutral-800 text-neutral-400 border-border' },
                            ].map(({ type, label, placeholder, badge, badgeColor }) => (
                                <div key={type} className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest">{label}</label>
                                        <span className={`text-[10px] px-2 py-0.5 font-bold tracking-widest uppercase rounded border ${badgeColor}`}>{badge}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                value={assets[type] || ''}
                                                onChange={e => setAssets(prev => ({ ...prev, [type]: e.target.value }))}
                                                placeholder={placeholder}
                                                className="w-full bg-black/40 border border-border-subtle rounded-2xl px-5 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/60 focus:bg-surface transition-all font-mono shadow-inner pr-12"
                                            />
                                            {assets[type] && (
                                                <a
                                                    href={assets[type]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute right-3 top-3 p-1.5 text-brand hover:text-brand-hover transition-colors bg-brand/10 rounded-lg"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => saveAsset(type)}
                                            disabled={savingAsset === type}
                                            className="px-6 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-sm font-bold disabled:opacity-50 shadow-shadow-glow transition-all active:scale-95 shrink-0"
                                        >
                                            {savingAsset === type ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Asset'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-500 flex items-start gap-3 font-medium">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <span>Ao clicar em <strong>Salvar Asset</strong>, o Saito atualiza todas as mensagens agendadas em tempo real sem precisar reagendar.</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass border border-border-subtle rounded-3xl p-8 shadow-sm hover:shadow-premium transition-all hover:border-border/80 bg-surface/40">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                <span className="text-xl">🎬</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-white tracking-tight">Mídia da Campanha</h2>
                        </div>
                        <p className="text-sm font-medium text-foreground-muted mb-6 pl-[3.25rem]">URLs de vídeos VSL/CSL e criativos para os grupos.</p>

                        <div className="space-y-6">
                            {[
                                { type: 'video_csl', label: 'Vídeo de VSL / CSL', placeholder: 'https://cdn.../video.mp4' },
                                { type: 'creative', label: 'Criativo de Carrinho Aberto', placeholder: 'https://cdn.../banner.jpg' },
                            ].map(({ type, label, placeholder }) => (
                                <div key={type} className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest">{label}</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            value={assets[type] || ''}
                                            onChange={e => setAssets(prev => ({ ...prev, [type]: e.target.value }))}
                                            placeholder={placeholder}
                                            className="flex-1 bg-black/40 border border-border-subtle rounded-2xl px-5 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/60 focus:bg-surface transition-all font-mono shadow-inner"
                                        />
                                        <button
                                            onClick={() => saveAsset(type)}
                                            disabled={savingAsset === type}
                                            className="px-6 py-3.5 bg-surface border border-border-subtle hover:border-purple-500/50 hover:bg-purple-500/10 text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95 shrink-0"
                                        >
                                            {savingAsset === type ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : 'Salvar Asset'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── EXECUTAR TAB ──────────────────────────────────────────────── */}
            {tab === 'executar' && (
                <div className="space-y-8 max-w-4xl mx-auto relative z-10 animate-in slide-in-from-bottom-4 duration-500">

                    {/* Summary */}
                    <div className="glass border border-border-subtle rounded-3xl p-8 bg-surface/40 shadow-sm">
                        <h2 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                            <span className="text-xl">📋</span> Resumo do Lançamento
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Produto', value: plan.product_name },
                                { label: 'Instância', value: plan.instance?.name || 'Não definida' },
                                { label: 'Dia D', value: plan.offer_date ? new Date(plan.offer_date).toLocaleDateString('pt-BR') : 'Sem data' },
                                { label: 'Mensagens', value: `${msgCount} prontas` },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-inner">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-foreground-muted mb-1.5">{label}</p>
                                    <p className="text-sm font-extrabold text-white truncate" title={value}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Offer date */}
                    {!plan.offer_date && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-sm text-amber-400 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-extrabold text-lg mb-0.5">Data da Oferta pendente</p>
                                <p className="text-xs font-medium text-amber-500/80 mb-3 sm:mb-0">A data de abertura do carrinho é obrigatória para sincronizar as datas.</p>
                            </div>
                            <div className="w-full sm:w-auto">
                                <input
                                    type="datetime-local"
                                    className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-amber-400 focus:bg-amber-500/20 transition-all font-mono"
                                    onChange={async e => {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        await fetch(`${API}/api/planner/${id}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${session?.access_token}`
                                            },
                                            body: JSON.stringify({ offer_date: new Date(e.target.value).toISOString() }),
                                        });
                                        fetchPlan();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Group config */}
                    <div className="glass border border-border-subtle rounded-3xl p-8 space-y-6 bg-surface/40 shadow-sm">
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <span className="text-xl">🤖</span> Configuração dos Grupos
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setExecConfig(p => ({ ...p, auto_create_groups: false }))}
                                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-extrabold border transition-all shadow-sm ${!execConfig.auto_create_groups ? 'bg-surface border-brand text-white shadow-[0_0_15px_rgba(230,57,70,0.2)]' : 'border-border-subtle bg-black/20 text-neutral-500 hover:text-white hover:border-border'}`}
                            >
                                📂 Usar Grupos Existentes
                            </button>
                            <button
                                onClick={() => setExecConfig(p => ({ ...p, auto_create_groups: true }))}
                                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-extrabold border transition-all shadow-sm ${execConfig.auto_create_groups ? 'bg-surface border-brand text-white shadow-[0_0_15px_rgba(230,57,70,0.2)]' : 'border-border-subtle bg-black/20 text-neutral-500 hover:text-white hover:border-border'}`}
                            >
                                ✨ Auto-criar Pela IA
                            </button>
                        </div>

                        {execConfig.auto_create_groups && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest pl-1">Quantidade</label>
                                    <input
                                        type="number"
                                        value={execConfig.group_count}
                                        onChange={e => setExecConfig(p => ({ ...p, group_count: +e.target.value }))}
                                        min={1} max={50}
                                        className="w-full bg-surface border border-border-subtle rounded-xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand/60 transition-all shadow-inner hover:border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest pl-1">Padrão do Nome</label>
                                    <input
                                        value={execConfig.group_name_pattern}
                                        onChange={e => setExecConfig(p => ({ ...p, group_name_pattern: e.target.value }))}
                                        placeholder={`${plan.product_name} {n}`}
                                        className="w-full bg-surface border border-border-subtle rounded-xl px-5 py-3.5 text-sm font-medium text-white placeholder-neutral-600 focus:outline-none focus:border-brand/60 transition-all shadow-inner hover:border-border"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest pl-1">Celular Admin (Semente)</label>
                                    <input
                                        value={execConfig.admin_number}
                                        onChange={e => setExecConfig(p => ({ ...p, admin_number: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="5511999999999"
                                        className="w-full bg-surface border border-border-subtle rounded-xl px-5 py-3.5 text-sm font-medium text-white placeholder-neutral-600 focus:outline-none focus:border-brand/60 transition-all shadow-inner hover:border-border font-mono tracking-widest"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest pl-1">Limite do Grupo (Overflow)</label>
                                    <input
                                        type="number"
                                        value={execConfig.overflow_limit}
                                        onChange={e => setExecConfig(p => ({ ...p, overflow_limit: +e.target.value }))}
                                        className="w-full bg-surface border border-border-subtle rounded-xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:border-brand/60 transition-all shadow-inner hover:border-border"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Execute button */}
                    {!execDone && (
                        <div className="pt-4">
                            <button
                                onClick={execute}
                                disabled={executing || !plan.offer_date || !hasMessages || !plan.instance}
                                className="w-full py-5 bg-gradient-to-r from-brand to-purple-600 hover:from-brand-hover hover:to-purple-500 text-white rounded-2xl font-extrabold text-base transition-all shadow-[0_0_30px_rgba(230,57,70,0.4)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {executing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Consolidando timeline nas instâncias...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        <span>CONSOLIDAR E EXECUTAR PLANO</span>
                                    </>
                                )}
                            </button>
                            {(!plan.offer_date || !hasMessages || !plan.instance) && !execDone && (
                                <p className="text-xs font-bold text-amber-500 text-center mt-4">
                                    {!plan.offer_date ? '⚠️ Defina a data da oferta. ' : ''}
                                    {!hasMessages ? '⚠️ Complete o briefing para gerar as cópias. ' : ''}
                                    {!plan.instance ? '⚠️ Defina a instância do WhatsApp conectada à campanha.' : ''}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Execution log */}
                    {execLog.length > 0 && (
                        <div className="bg-black/80 border border-border-subtle rounded-3xl p-6 shadow-inner overflow-hidden">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Terminal de Execução</p>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                                {execLog.map((line, i) => (
                                    <p key={i} className="text-sm font-mono text-neutral-300 ml-4 border-l-2 border-border/30 pl-3">
                                        <span className="text-brand/50 mr-2">{'>'}</span> {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Success state */}
                    {execDone?.success && (
                        <div className="glass bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-10 text-center animate-in zoom-in-95 duration-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] mt-8">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                <div className="relative w-20 h-20 rounded-full bg-surface border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                    <Check className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Lançamento em execução! 🚀</h3>
                            <p className="text-emerald-400 font-medium text-sm mb-8">
                                {execDone.groups_created} grupos criados • {execDone.messages_scheduled} mensagens programadas com sucesso.
                            </p>
                            <button
                                onClick={() => router.push(`/dashboard/instances/${plan.instance_id}/groups`)}
                                className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-sm font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95"
                            >
                                <ExternalLink className="w-5 h-5" />
                                Acompanhar Grupos Ativos
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
