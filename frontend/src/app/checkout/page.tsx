'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const priceId = searchParams.get('price_id');
    
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!priceId) {
            router.push('/#pricing');
        }
    }, [priceId, router]);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API}/api/billing/public-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ price_id: priceId, email })
            });

            const data = await res.json();
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Erro ao iniciar o checkout seguro. Tente novamente.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão ao servidor de pagamentos.');
            setLoading(false);
        }
    };

    if (!priceId) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden text-white">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8383830a_1px,transparent_1px),linear-gradient(to_bottom,#8383830a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass border border-border-subtle rounded-[2rem] p-8 sm:p-10 shadow-premium bg-surface/40 backdrop-blur-2xl">
                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-hover rounded-2xl flex items-center justify-center mb-6 shadow-shadow-glow border border-white/10">
                            <Zap className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Quase lá!</h1>
                        <p className="text-foreground-muted text-sm px-4">
                            Para onde devemos enviar o seu acesso exclusivo à plataforma?
                        </p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleCheckout} className="space-y-6">
                        <div className="space-y-2 group">
                            <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-widest group-focus-within:text-brand transition-colors">
                                E-mail de Acesso
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-neutral-500 group-focus-within:text-brand transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu.melhor@email.com"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !email}
                            className="group relative w-full h-[60px] bg-gradient-to-r from-brand to-brand-hover disabled:from-surface disabled:to-surface disabled:border-border disabled:text-neutral-500 border border-transparent text-white font-black tracking-widest text-sm rounded-xl shadow-[0_0_30px_rgba(230,57,70,0.3)] hover:shadow-[0_0_40px_rgba(230,57,70,0.5)] transition-all overflow-hidden flex items-center justify-center gap-3"
                        >
                            {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />}
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>IR PARA PAGAMENTO SEGURO</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Ambiente 100% Seguro (Stripe)
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors">
                        Voltar para a página inicial
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
