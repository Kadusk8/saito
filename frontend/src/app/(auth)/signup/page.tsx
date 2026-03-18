'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function SignupContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const success = searchParams.get('success');

    return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden text-white">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8383830a_1px,transparent_1px),linear-gradient(to_bottom,#8383830a_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative z-10 glass border border-border-subtle rounded-[2rem] p-10 text-center shadow-premium bg-surface/30 backdrop-blur-2xl"
            >
                {success ? (
                    <>
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-8"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </motion.div>
                        
                        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Assinatura Confirmada!</h1>
                        <p className="text-foreground-muted mb-8 text-lg leading-relaxed">
                            Seja bem-vindo ao Saito! Detectamos que você é novo por aqui. 
                            Enviamos um e-mail para <span className="text-white font-semibold">{email}</span> com as instruções para definir sua senha de acesso.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl text-left">
                                <div className="p-3 bg-brand/20 rounded-xl">
                                    <Mail className="w-6 h-6 text-brand" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">Passo 1: Verifique seu Inbox</h3>
                                    <p className="text-xs text-foreground-muted">O e-mail pode levar até 2 minutos para chegar.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl text-left opacity-60">
                                <div className="p-3 bg-surface rounded-xl">
                                    <ShieldCheck className="w-6 h-6 text-foreground-muted" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm">Passo 2: Defina sua Senha</h3>
                                    <p className="text-xs text-foreground-muted text-pretty">Clique no link seguro enviado e escolha sua senha.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <Link 
                                href="/login" 
                                className="flex-1 h-14 bg-white text-black font-bold rounded-xl flex items-center justify-center hover:bg-neutral-200 transition-all gap-2"
                            >
                                Ir para Login
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-extrabold mb-4">Aguardando Pagamento</h1>
                        <p className="text-foreground-muted mb-8 text-lg">
                            Se você acabou de realizar o pagamento, aguarde alguns instantes enquanto processamos sua assinatura.
                        </p>
                        <Link href="/" className="text-brand hover:underline font-bold">
                            Voltar para o Início
                        </Link>
                    </>
                )}
            </motion.div>

            <p className="mt-10 text-xs text-foreground-muted uppercase tracking-widest font-mono">
                Saito Access Provisioning &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand font-bold" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
