'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Plus, Clock, CheckCircle, Loader2, ChevronRight, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { createBrowserClient } from '@supabase/ssr';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' },
    approved: { label: 'Aprovado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    executing: { label: 'Em Execução', color: 'text-brand bg-brand-light border-brand/20' },
    done: { label: 'Concluído', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

const PRODUCT_ICONS: Record<string, string> = {
    infoproduto: '🧠',
    produto_fisico: '📦',
    servico: '🎯',
};

export default function PlanejadorPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function fetchPlans() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const res = await fetch(`${API}/api/planner`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const d = await res.json();
                setPlans(Array.isArray(d) ? d : []);
            } catch {
                setPlans([]);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    async function deletePlan(id: string) {
        if (!confirm('Tem certeza que deseja deletar este plano? Esta ação é irreversível.')) return;
        setDeleting(id);
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${API}/api/planner/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        setPlans(p => p.filter(x => x.id !== id));
        setDeleting(null);
    }

    return (
        <div className="p-8 sm:p-12 w-full max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 glass p-8 rounded-3xl border border-border-subtle shadow-premium bg-surface/40">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-light border border-brand/20 rounded-2xl text-brand shadow-shadow-glow">
                        <Rocket className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-1">Planejador de Campanhas</h1>
                        <p className="text-foreground-muted font-medium text-lg">O Saito Strategist monta o seu lançamento completo com IA.</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/dashboard/planejador/new')}
                    className="flex items-center gap-2 px-6 py-3.5 bg-brand text-white rounded-2xl font-bold text-sm transition-shadow shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    Novo Plano
                </motion.button>
            </div>

            {/* Empty CTA */}
            {!loading && plans.length === 0 && (
                <div className="glass border border-dashed border-border-subtle rounded-3xl p-20 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="w-20 h-20 rounded-3xl bg-surface border border-brand/30 flex items-center justify-center mx-auto mb-6 shadow-shadow-glow relative z-10">
                        <Rocket className="w-10 h-10 text-brand transform group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight relative z-10">Nenhum plano ainda</h2>
                    <p className="text-foreground-muted font-medium text-base mb-8 max-w-md mx-auto leading-relaxed relative z-10">Crie seu primeiro plano e deixe o Saito Strategist montar a sua estrutura de mensagens completa em minutos.</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/dashboard/planejador/new')}
                        className="inline-flex items-center gap-2.5 px-8 py-4 bg-surface hover:bg-white text-white hover:text-black border border-border rounded-xl font-bold transition-all shadow-sm relative z-10 duration-300"
                    >
                        <Zap className="w-5 h-5 text-brand group-hover:text-amber-500 transition-colors" />
                        Iniciar Briefing com IA
                    </motion.button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
                    <span className="text-foreground-muted font-medium animate-pulse">Sincronizando planos...</span>
                </div>
            )}

            {/* Plans list */}
            {!loading && plans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {plans.map(plan => {
                        const status = STATUS_LABELS[plan.status] || STATUS_LABELS.draft;
                        const msgCount = plan.launch_plan_messages?.[0]?.count ?? 0;
                        return (
                            <motion.div
                                whileHover={{ y: -4 }}
                                key={plan.id}
                                className="group glass border border-border-subtle rounded-3xl p-6 flex flex-col gap-5 hover:border-brand/40 hover:bg-surface/60 transition-colors cursor-pointer shadow-sm overflow-hidden relative"
                                onClick={() => router.push(`/dashboard/planejador/${plan.id}`)}
                            >
                                {/* Card Glow on hover */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex items-start justify-between relative z-10">
                                    {/* Icon */}
                                    <div className="w-14 h-14 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                                        {PRODUCT_ICONS[plan.product_type] || '🚀'}
                                    </div>
                                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full border ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="relative z-10 mt-2">
                                    <h2 className="text-xl font-extrabold text-white truncate mb-1" title={plan.product_name}>{plan.product_name}</h2>
                                    {plan.instance?.name ? (
                                        <p className="text-sm font-medium text-foreground-muted flex items-center gap-1.5 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" /> {plan.instance.name}
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-neutral-600 italic mt-1">Sem instância vinculada</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto pt-4 border-t border-border-subtle/50">
                                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                            <Clock className="w-3.5 h-3.5" /> Oferta
                                        </div>
                                        <span className="text-sm font-bold text-neutral-300">
                                            {plan.offer_date ? new Date(plan.offer_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Indefinida'}
                                        </span>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                            <CheckCircle className="w-3.5 h-3.5" /> Mensagens
                                        </div>
                                        <span className="text-sm font-bold text-neutral-300">
                                            {msgCount} <span className="text-xs text-neutral-500 font-normal">criadas</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={e => { e.stopPropagation(); deletePlan(plan.id); }}
                                        className="p-2.5 bg-surface border border-border-subtle rounded-xl text-neutral-500 hover:text-red-400 hover:border-red-500/30 transition-all hover:bg-red-500/10"
                                        disabled={deleting === plan.id}
                                        title="Deletar Plano"
                                    >
                                        {deleting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-10 group-hover:border-brand/30">
                                    <ChevronRight className="w-4 h-4 text-brand" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
