'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// These would ideally come from your environment or a database configuration
const STRIPE_PRICES: Record<string, { monthly: string; yearly: string }> = {
    starter: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || ''
    },
    pro: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || ''
    },
    enterprise: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
        yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ''
    }
};

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function BillingPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [session, setSession] = useState<any>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        loadData();

        // Handle Stripe success/cancel redirects
        const query = new URLSearchParams(window.location.search);
        if (query.get('success')) {
            alert('Assinatura ativada com sucesso! O sistema pode levar alguns segundos para processar.');
            window.history.replaceState({}, '', '/billing');
        }
    }, []);

    async function loadData() {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
            // Because RLS is restricted to the user's organization, this will only return their sub
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .single();

            setSubscription(data);
        }
        setLoading(false);
    }

    async function handleCheckout(priceId: string, planName: string) {
        if (!session) return;
        setActionLoading(planName);
        try {
            const res = await fetch(`${API}/api/billing/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ price_id: priceId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe Checkout
            } else {
                alert(data.error || 'Erro ao iniciar checkout');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar ao servidor de pagamentos.');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleCustomerPortal() {
        if (!session) return;
        setActionLoading('portal');
        try {
            const res = await fetch(`${API}/api/billing/portal`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe Portal
            } else {
                alert(data.error || 'Erro ao abrir portal de cliente');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar ao servidor de pagamentos.');
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]" />
                <p className="text-foreground-muted font-bold tracking-widest uppercase text-xs mt-4 animate-pulse">Carregando plano...</p>
            </div>
        );
    }

    const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trialing');

    return (
        <div className="p-8 pb-32 sm:p-12 max-w-6xl mx-auto animate-in fade-in duration-500 relative">
            
            {/* Ambient Back Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="mb-10 text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 shadow-[0_0_15px_rgba(230,57,70,0.2)] mb-4">
                    <Crown className="w-8 h-8 text-brand drop-shadow-[0_0_5px_rgba(230,57,70,0.5)]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">Assinatura e Cobrança</h1>
                <p className="text-sm font-medium text-foreground-muted max-w-xl mx-auto">Gerencie seu plano, faturas e métodos de pagamento do Agente Saito. Escale seus lançamentos com tecnologia militar.</p>
            </div>

            {/* Current Plan Status */}
            <div className="glass bg-surface/40 border border-border-subtle rounded-3xl p-8 sm:p-10 relative overflow-hidden group shadow-sm mb-12">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[80px] rounded-full pointer-events-none -z-10 transition-opacity duration-500 opacity-50 group-hover:opacity-100" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                            <h2 className="text-2xl font-extrabold text-white">Status do Plano</h2>
                            {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                                </span>
                            ) : subscription ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {subscription.status}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-500/10 text-neutral-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-neutral-500/20">
                                    Gratuito / Sem Plano
                                </span>
                            )}
                        </div>

                        {subscription ? (
                            <p className="text-sm font-medium text-neutral-400 max-w-2xl leading-relaxed">
                                Sua assinatura está atualmente <strong className="text-white uppercase text-xs">{subscription.status}</strong>.<br className="hidden sm:block"/>
                                O próximo ciclo termina em <strong className="text-white">{new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</strong>.
                                {subscription.cancel_at_period_end && <span className="text-amber-400 ml-1">Sua assinatura será cancelada no final deste período.</span>}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-neutral-400 max-w-2xl leading-relaxed">
                                Você está no plano gratuito com recursos limitados. Faça o upgrade para desbloquear campanhas ilimitadas, funis inteligentes e automação via IA.
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border-subtle/50 md:pl-8">
                        {subscription ? (
                            <button
                                onClick={handleCustomerPortal}
                                disabled={actionLoading === 'portal'}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-extrabold rounded-2xl transition-all border border-border-subtle shadow-sm active:scale-95"
                            >
                                {actionLoading === 'portal' ? <Loader2 className="w-5 h-5 animate-spin text-brand" /> : <CreditCard className="w-5 h-5 text-brand" />}
                                Portal do Cliente (Stripe)
                            </button>
                        ) : (
                            <a href="#pricing" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-brand hover:bg-brand-hover text-white text-sm font-extrabold rounded-2xl transition-all shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] active:scale-95">
                                Fazer Upgrade Agora
                                <ArrowRight className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Tiers */}
            {!isActive && (
                <div id="pricing" className="pt-8 space-y-10 relative z-10">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black text-white mb-4">Escolha o Plano Ideal</h2>
                        <p className="text-sm font-medium text-neutral-400 mb-10">Destrua seus limites. Envie mensagens em massa, qualifique leads com IA e crie urgência real.</p>

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center justify-center gap-4 bg-black/40 border border-border-subtle rounded-full p-2 w-fit mx-auto shadow-inner">
                            <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full cursor-pointer transition-all ${billingCycle === 'monthly' ? 'bg-surface text-white shadow-sm border border-border' : 'text-neutral-500 hover:text-white'}`}
                                  onClick={() => setBillingCycle('monthly')}
                            >
                                Mensal
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full cursor-pointer transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-brand/20 text-brand shadow-sm border border-brand/30 ring-1 ring-brand/30' : 'text-neutral-500 hover:text-white'}`}
                                  onClick={() => setBillingCycle('yearly')}
                            >
                                Anual <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-black">-20%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-center">

                        {/* Plan 1: Starter */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors shadow-sm h-full">
                            <div className="mb-8">
                                <h3 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-neutral-500" /> Saito Starter
                                </h3>
                                <p className="text-xs font-medium text-neutral-400 h-10">Para produtores validando seus primeiros lançamentos.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white tracking-tight">
                                        {billingCycle === 'monthly' ? 'R$147' : 'R$1.176'}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    'Até 2 Conexões WhatsApp',
                                    'Envios Ilimitados (Texto/Imagem)',
                                    'Transbordo Dinâmico de Grupos',
                                    'Agendador de Campanhas Básico'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-neutral-300 leading-snug">
                                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(STRIPE_PRICES.starter[billingCycle], 'starter')}
                                disabled={!!actionLoading}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-border-subtle text-white font-extrabold text-sm transition-all flex justify-center items-center gap-2 active:scale-95"
                            >
                                {actionLoading === 'starter' ? <Loader2 className="w-5 h-5 animate-spin text-brand" /> : `Assinar Starter`}
                            </button>
                        </div>

                        {/* Plan 2: Pro */}
                        <div className="glass bg-surface/60 border border-brand/50 rounded-3xl p-10 flex flex-col relative overflow-hidden group shadow-[0_0_50px_rgba(230,57,70,0.15)] transform md:-translate-y-4 z-10 h-full">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent"></div>
                            <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-md">
                                Mais Popular
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none"></div>

                            <div className="mb-8 relative">
                                <h3 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-brand drop-shadow-[0_0_8px_rgba(230,57,70,0.5)]" /> Saito Pro
                                </h3>
                                <p className="text-xs font-medium text-neutral-400 h-10">Para múltiplos experts e lançamentos escaláveis.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white tracking-tight">
                                        {billingCycle === 'monthly' ? 'R$347' : 'R$2.776'}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1 relative">
                                {[
                                    'Até 5 Conexões WhatsApp',
                                    'Envio de Áudios PTT nativos',
                                    'Simulação "Digitando/Gravando"',
                                    'Motor de Escassez Automática',
                                    'Log de Strikes & Cão de Guarda'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-neutral-200 leading-snug">
                                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(STRIPE_PRICES.pro[billingCycle], 'pro')}
                                disabled={!!actionLoading}
                                className="relative w-full py-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-extrabold transition-all shadow-[0_0_20px_rgba(230,57,70,0.4)] hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] flex justify-center items-center gap-2 active:scale-95"
                            >
                                {actionLoading === 'pro' ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : `Começar no Pro`}
                            </button>
                        </div>

                        {/* Plan 3: Enterprise */}
                        <div className="glass bg-surface/30 border border-border-subtle rounded-3xl p-8 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors shadow-sm h-full">
                            <div className="mb-8">
                                <h3 className="text-lg font-extrabold text-white mb-1 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-neutral-500" /> Saito Max
                                </h3>
                                <p className="text-xs font-medium text-neutral-400 h-10">Para Mega Lançamentos e Grandes Agências.</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white tracking-tight">
                                        {billingCycle === 'monthly' ? 'R$997' : 'R$7.976'}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {[
                                    'Instâncias WhatsApp Ilimitadas',
                                    'Agente IA para Qualificação Qualitativa',
                                    'Gatekeeper (Bloqueio Total de Spam)',
                                    'Múltiplos Usuários do Dashboard',
                                    'Gerente de Contas Dedicado'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-neutral-300 leading-snug">
                                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(STRIPE_PRICES.enterprise[billingCycle], 'enterprise')}
                                disabled={!!actionLoading}
                                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-border-subtle text-white text-sm font-extrabold transition-all flex justify-center items-center gap-2 active:scale-95"
                            >
                                {actionLoading === 'enterprise' ? <Loader2 className="w-5 h-5 animate-spin text-brand" /> : `Assinar Max`}
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black/40 border border-border-subtle rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest shadow-inner">
                            <Shield className="w-3.5 h-3.5" /> Transações processadas em ambiente seguro. Cancele quando quiser.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
