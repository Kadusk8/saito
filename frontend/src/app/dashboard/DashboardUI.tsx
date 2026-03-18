'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users, ShieldAlert, Radio, MessageSquare,
    TrendingUp, Activity, Zap, ArrowRight,
    CheckCircle2, Wifi, MessageSquareWarning
} from 'lucide-react';

interface Group {
    id: string;
    name: string;
    jid: string;
    rules?: { moderationEnabled?: boolean; aiBlacklist?: boolean };
}

interface Instance {
    id: string;
    name: string;
}

interface DashboardUIProps {
    totalGroups: number;
    monitoredGroups: number;
    totalInstances: number;
    activeStrikes: number;
    iaBansToday: number;
    recentGroups: Group[];
    instances: Instance[];
}

function StatCard({
    label, value, sub, icon, color, href
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color: string;
    href?: string;
}) {
    const card = (
        <motion.div 
            whileHover={href ? { scale: 1.02, y: -4 } : { scale: 1.01 }}
            className={`glass border border-border-subtle rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group transition-shadow duration-300 ${href ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:border-brand/30' : ''}`}
        >
            {/* Subtle glow background */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] opacity-10 rounded-full ${color}`} />
            
            <div className="flex items-start justify-between relative z-10">
                <span className="text-sm font-medium text-foreground-muted group-hover:text-foreground transition-colors">{label}</span>
                <div className={`p-2.5 rounded-xl bg-surface/80 border border-white/5 shadow-sm backdrop-blur-sm ${color}`}>{icon}</div>
            </div>
            <div className="relative z-10">
                <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
                {sub && <p className="text-xs text-foreground-muted mt-2">{sub}</p>}
            </div>
            {href && (
                <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 ${color.replace('bg-', 'text-').replace('/10', '')}`}>
                    <ArrowRight className="w-5 h-5" />
                </div>
            )}
        </motion.div>
    );
    if (href) return <Link href={href}>{card}</Link>;
    return card;
}

export default function DashboardUI({
    totalGroups,
    monitoredGroups,
    totalInstances,
    activeStrikes,
    iaBansToday,
    recentGroups,
    instances,
}: DashboardUIProps) {
    const moderationEnabled = recentGroups.filter(g => g.rules?.moderationEnabled).length;
    const aiEnabled = recentGroups.filter(g => g.rules?.aiBlacklist).length;

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">

            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-light rounded-2xl text-brand border border-brand/20 shadow-shadow-glow">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">Dashboard</h1>
                        <p className="text-foreground-muted text-sm sm:text-base">Métricas e operações em tempo real.</p>
                    </div>
                </div>
            </div>

            {/* Instances status bar */}
            {instances.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                    {instances.map(inst => (
                        <div key={inst.id} className="glass flex items-center gap-3 rounded-full px-5 py-2.5 shadow-sm border border-border-subtle">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <Wifi className="w-4 h-4 text-foreground-muted" />
                            <span className="text-sm font-medium text-white tracking-wide">{inst.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Grupos"
                    value={totalGroups}
                    sub={`${monitoredGroups} com moderação`}
                    icon={<Users className="w-5 h-5" />}
                    color="text-indigo-400 bg-indigo-500/10"
                    href="/dashboard/groups"
                />
                <StatCard
                    label="Strikes Ativos"
                    value={activeStrikes}
                    sub="Membros sob alerta"
                    icon={<MessageSquareWarning className="w-5 h-5" />}
                    color="text-amber-400 bg-amber-500/10"
                    href="/dashboard/strikes"
                />
                <StatCard
                    label="Banimentos (IA)"
                    value={iaBansToday}
                    sub="Ações automáticas hoje"
                    icon={<ShieldAlert className="w-5 h-5" />}
                    color="text-red-400 bg-red-500/10"
                />
                <StatCard
                    label="IA Ativa"
                    value={`${aiEnabled} grupos`}
                    sub="Defesa avançada ligada"
                    icon={<Zap className="w-5 h-5" />}
                    color="text-brand bg-brand-light"
                />
            </div>

            {/* Main content: groups table + quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Groups table */}
                <div className="lg:col-span-2 glass rounded-2xl overflow-hidden border border-border-subtle shadow-premium">
                    <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-surface/40">
                        <h2 className="text-lg font-semibold text-white tracking-tight">Atividade Recente dos Grupos</h2>
                        <Link href="/dashboard/groups" className="text-sm text-brand font-medium hover:text-brand-hover flex items-center gap-2 transition-colors">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border/40 bg-surface/20">
                        {recentGroups.length === 0 ? (
                            <div className="py-16 text-center text-foreground-muted text-sm flex flex-col items-center gap-3">
                                <Users className="w-8 h-8 opacity-20" />
                                <p>Nenhum grupo sincronizado ainda.</p>
                                <Link href="/dashboard/groups" className="text-brand font-medium hover:underline mt-2">Sincronizar agora</Link>
                            </div>
                        ) : (
                            recentGroups.slice(0, 7).map(group => (
                                <Link key={group.id} href={`/dashboard/groups/${group.id}`} className="flex items-center justify-between px-8 py-4 hover:bg-surface-hover/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-background rounded-xl border border-border shadow-sm group-hover:border-brand/30 transition-colors">
                                            <MessageSquare className="w-4 h-4 text-foreground-muted group-hover:text-brand transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white tracking-wide line-clamp-1">{group.name}</p>
                                            <p className="text-xs text-foreground-muted mt-0.5 font-mono">{group.jid?.split('@')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {group.rules?.moderationEnabled && (
                                            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-light text-brand font-bold border border-brand/10">Moderação</span>
                                        )}
                                        {group.rules?.aiBlacklist && (
                                            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-bold border border-amber-500/10">Shield IA</span>
                                        )}
                                        {!group.rules?.moderationEnabled && !group.rules?.aiBlacklist && (
                                            <span className="text-xs text-foreground-muted italic">Em análise</span>
                                        )}
                                        <ArrowRight className="w-4 h-4 text-foreground-muted opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Quick actions & Status */}
                <div className="space-y-6">
                    {/* Quick actions */}
                    <div className="glass rounded-2xl p-7 space-y-5 border border-border-subtle shadow-premium bg-surface/30">
                        <h2 className="text-lg font-semibold text-white tracking-tight">Ações Rápidas</h2>
                        <div className="space-y-3 pt-2">
                            {[
                                { href: '/dashboard/broadcasts', label: 'Enviar Mensagens', desc: 'Disparo para múltiplos grupos', icon: <Radio className="w-4 h-4" />, color: 'text-brand bg-brand-light border-brand/20' },
                                { href: '/dashboard/groups', label: 'Sincronizar', desc: 'Importar novos grupos', icon: <Users className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                                { href: '/dashboard/ai', label: 'Treinar Agente', desc: 'Configurar IA base', icon: <Zap className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                            ].map(action => (
                                <Link key={action.href} href={action.href} className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-border-subtle hover:bg-surface-hover/80 transition-all duration-300 group">
                                    <div className={`p-2.5 rounded-lg border ${action.color} shrink-0`}>{action.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white tracking-wide">{action.label}</p>
                                        <p className="text-xs text-foreground-muted mt-0.5">{action.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Groups status summary */}
                    <div className="glass rounded-2xl p-7 space-y-6 border border-border-subtle shadow-premium bg-surface/30">
                        <h2 className="text-lg font-semibold text-white tracking-tight">Distribuição de Status</h2>
                        <div className="space-y-5">
                            {[
                                { label: 'Moderação Ativa', value: moderationEnabled, total: totalGroups, color: 'bg-brand shadow-[0_0_10px_rgba(139,92,246,0.6)]' },
                                { label: 'Agente Shield IA', value: aiEnabled, total: totalGroups, color: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]' },
                                { label: 'Monitoramento Padrão', value: totalGroups - moderationEnabled, total: totalGroups, color: 'bg-neutral-600' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                                        <span className="text-foreground-muted">{item.label}</span>
                                        <span className="text-white">{item.value} <span className="text-foreground-muted font-normal">/ {item.total}</span></span>
                                    </div>
                                    <div className="h-2 bg-background rounded-full overflow-hidden border border-border/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full rounded-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
