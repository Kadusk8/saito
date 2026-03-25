'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgot, setIsForgot] = useState(false);

    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isForgot) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/confirm?next=/signup/set-password`
                });
                if (error) throw error;
                setSuccess('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
                return;
            }

            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                setSuccess('Cadastro realizado! Verifique seu email para confirmar a conta.');
                setIsSignUp(false);
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-brand/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-500/15 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass border border-border-subtle rounded-3xl p-8 sm:p-10 shadow-premium bg-surface/40 backdrop-blur-xl">
                    <div className="flex flex-col items-center mb-10">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                            className="w-16 h-16 bg-gradient-to-br from-brand to-brand-hover rounded-2xl flex items-center justify-center mb-6 shadow-shadow-glow relative"
                        >
                            <div className="absolute inset-0 rounded-2xl border border-white/20" />
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                            {isForgot ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Acessar Saito'}
                        </h1>
                        <p className="text-foreground-muted text-sm text-center">
                            {isForgot ? 'Enviaremos um link para redefinir sua senha' : 'Governança avançada e IA para grupos de WhatsApp'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center font-medium"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2 group">
                            <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-widest group-focus-within:text-brand transition-colors">
                                Email Corporativo
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                                placeholder="seu@app.com"
                            />
                        </div>

                        {!isForgot && (
                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center">
                                <label className="block text-[11px] font-bold text-foreground-muted uppercase tracking-widest group-focus-within:text-brand transition-colors">
                                    Senha
                                </label>
                                {!isSignUp && (
                                    <button type="button" onClick={() => { setIsForgot(true); setError(null); setSuccess(null); }} className="text-[11px] text-brand hover:text-brand-hover transition-colors font-semibold">
                                        Esqueceu a senha?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={!isForgot}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading || !email || (!isForgot && !password)}
                            className="group relative w-full h-14 bg-gradient-to-r from-brand to-brand-hover disabled:from-surface disabled:to-surface disabled:border-border disabled:text-neutral-500 border border-transparent text-white font-bold tracking-wide rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all overflow-hidden flex items-center justify-center gap-2 mt-8"
                        >
                            {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />}
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isForgot ? 'Enviar Link de Recuperação' : isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 text-center border-t border-border-subtle/50 pt-6 flex flex-col gap-3">
                        {isForgot ? (
                            <button type="button" onClick={() => { setIsForgot(false); setError(null); setSuccess(null); }} className="text-sm text-foreground-muted hover:text-white transition-colors font-medium">
                                ← Voltar para o login
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
                                className="text-sm text-foreground-muted hover:text-white transition-colors font-medium"
                            >
                                {isSignUp ? 'Já tem uma conta? Faça login' : 'Ainda não tem conta? Cadastre-se'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-10 text-neutral-600 text-xs font-mono tracking-widest uppercase"
            >
                &copy; {new Date().getFullYear()} Saito Governance. System Active.
            </motion.div>
        </div>
    );
}
