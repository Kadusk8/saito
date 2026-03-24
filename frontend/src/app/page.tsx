'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Zap, Sparkles, CheckCircle2, ChevronRight, Bot, Target, CalendarDays, BarChart3, Users, MessageSquareShare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const [isAnnual, setIsAnnual] = useState(false);

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };
    
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col selection:bg-brand/30 selection:text-white overflow-hidden relative font-sans">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-brand/10 rounded-full blur-[150px] pointer-events-none opacity-60 -z-10" />
            <div className="absolute top-[40%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[180px] pointer-events-none opacity-40 -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-orange-500/5 rounded-full blur-[180px] pointer-events-none opacity-30 -z-10" />

            {/* Header */}
            <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-brand to-brand-hover rounded-xl shadow-shadow-glow">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter">Saito</span>
                </div>
                <nav className="hidden md:flex items-center gap-8 glass px-8 py-3 rounded-full border border-white/5 bg-surface/30 backdrop-blur-md">
                    <a href="#solucoes" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Moderação IA</a>
                    <a href="#solucoes" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Super Grupos</a>
                    <a href="#recursos" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Recursos</a>
                    <a href="#pricing" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Planos</a>
                </nav>
                <div className="flex items-center gap-6 relative z-50 pointer-events-auto">
                    <Link href="/login" className="text-sm font-semibold text-foreground-muted hover:text-white transition-colors">
                        Entrar
                    </Link>
                    <a href="#pricing" className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Começar Agora <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </header>

            <main className="flex-1 w-full relative z-0 flex flex-col items-center">
                
                {/* Hero Section */}
                <section className="w-full pt-28 pb-32 px-6 flex flex-col items-center relative">
                    <motion.div 
                        initial="hidden" 
                        animate="visible" 
                        variants={staggerContainer}
                        className="w-full max-w-5xl mx-auto text-center space-y-8 relative z-10"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                            <Bot className="w-4 h-4" /> A Única Plataforma de Moderação com IA do Mercado
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-black text-white tracking-tighter leading-[1.05]">
                            Moderação e <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-indigo-400 to-orange-400 animate-gradient">Lançamentos Blindados.</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-foreground-muted max-w-3xl mx-auto leading-relaxed font-medium tracking-wide">
                            Gestão de infraestrutura para Lançamentos de Alto Risco. Modere grupos de WhatsApp com inteligência artificial, evite spams do "Tigrinho" e escale com super grupos infinitos.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 relative z-20 pointer-events-auto">
                            <a href="#pricing" className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-brand-hover text-white text-lg font-bold rounded-2xl transition-all shadow-premium hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 group relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                Proteger meus Lançamentos <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#solucoes" className="w-full sm:w-auto px-10 py-5 glass hover:bg-surface-hover border border-border-subtle text-white text-lg font-bold rounded-2xl transition-all flex items-center justify-center group">
                                Entender a IA
                            </a>
                        </motion.div>
                        
                        <motion.div variants={fadeInUp} className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-neutral-500">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Zero Tolerância a Spam</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Bloqueios Semânticos IA</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Agendamento e Transbordo 100% cloud</div>
                        </motion.div>
                    </motion.div>

                    {/* Dashboard Mockup Representation */}
                    <motion.div 
                        initial={{ opacity: 0, y: 100, rotateX: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, rotateX: 15, scale: 0.95 }}
                        transition={{ duration: 1.2, delay: 0.6 }}
                        className="mt-32 max-w-6xl mx-auto relative perspective-[2000px] pointer-events-none w-full"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
                        
                        <div className="relative z-0 rounded-t-3xl border border-border-subtle/50 glass p-2 shadow-[0_-20px_80px_rgba(139,92,246,0.15)] overflow-hidden">
                            <div className="rounded-2xl border border-white/10 bg-surface/90 overflow-hidden aspect-[16/9] flex items-center justify-center relative backdrop-blur-3xl">
                                
                                {/* Mock UI Header */}
                                <div className="absolute top-0 inset-x-0 h-16 border-b border-white/5 flex items-center px-6 gap-4 bg-background/50">
                                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                     <div className="ml-8 w-48 h-8 rounded-lg bg-white/5" />
                                </div>

                                {/* Interactive Motion Content */}
                                <div className="absolute top-24 left-6 right-6 bottom-6 flex gap-6">
                                    
                                    {/* Sidebar */}
                                    <div className="w-48 bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
                                        <div className="w-full h-8 bg-white/10 rounded-lg" />
                                        <div className="w-3/4 h-8 bg-brand/20 border border-brand/30 rounded-lg relative overflow-hidden">
                                            <motion.div 
                                                animate={{ opacity: [0.5, 1, 0.5] }} 
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute left-2 top-2 h-4 w-1 bg-brand rounded-full" 
                                            />
                                        </div>
                                        <div className="w-full h-8 bg-white/5 rounded-lg" />
                                        <div className="w-2/3 h-8 bg-white/5 rounded-lg" />
                                    </div>

                                    {/* Main Campaign Area */}
                                    <div className="flex-1 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <div className="w-40 h-6 bg-white/20 rounded-md mb-2" />
                                                <div className="w-64 h-4 bg-white/10 rounded-md" />
                                            </div>
                                            <motion.div 
                                                animate={{ scale: [1, 0.95, 1], backgroundColor: ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.8)', 'rgba(139,92,246,0.2)'] }}
                                                transition={{ duration: 6, times: [0, 0.4, 1], repeat: Infinity }}
                                                className="w-32 h-10 rounded-xl border border-brand/50 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                            >
                                                <div className="w-16 h-2 bg-white rounded-full" />
                                            </motion.div>
                                        </div>

                                        {/* Campaign Creation Steps Animation */}
                                        <div className="space-y-4">
                                            <div className="w-full h-16 bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-brand/20 flex flex-center items-center justify-center">1</div>
                                                    <div className="w-32 h-4 bg-white/20 rounded-md" />
                                                </div>
                                                <div className="w-16 h-8 bg-brand/30 rounded-lg border border-brand/50" />
                                            </div>

                                            {/* Typing Simulation Area */}
                                            <div className="w-full h-32 bg-background/50 rounded-xl border border-white/10 p-4 relative">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-4 h-4 rounded-full bg-green-500/50" />
                                                    <div className="w-24 h-3 bg-white/20 rounded-md" />
                                                </div>
                                                
                                                <div className="flex flex-col gap-3 ml-6 pt-2">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "80%" }}
                                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                                                        className="h-3 bg-white/30 rounded-md"
                                                    />
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "60%" }}
                                                        transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 4.5 }}
                                                        className="h-3 bg-white/20 rounded-md"
                                                    />
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "40%" }}
                                                        transition={{ duration: 1, delay: 1, repeat: Infinity, repeatDelay: 5 }}
                                                        className="h-3 bg-white/10 rounded-md"
                                                    />
                                                </div>

                                                {/* Simulated Cursor */}
                                                <motion.div 
                                                    animate={{ x: [0, 150, 350, 450, 0], y: [0, -20, 50, -50, 0], opacity: [0, 1, 1, 1, 0] }}
                                                    transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                                                    className="absolute w-4 h-4 top-1/2 left-1/4 z-10"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md transform -rotate-12"><polygon points="3 3 10 21 14 14 21 10 3 3"></polygon></svg>
                                                </motion.div>
                                            </div>

                                            <div className="w-full h-16 bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between opacity-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-white/10" />
                                                    <div className="w-48 h-4 bg-white/10 rounded-md" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar overlay mimicking "Sending Mass Messages" */}
                                        <motion.div 
                                            animate={{ opacity: [0, 0, 1, 0] }}
                                            transition={{ duration: 6, times: [0, 0.6, 0.7, 1], repeat: Infinity }}
                                            className="absolute inset-0 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 border border-brand/30 rounded-2xl"
                                        >
                                            <div className="text-lg font-bold text-white mb-2">Disparando para 45.290 Leads...</div>
                                            <div className="w-64 h-3 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                    animate={{ width: ['0%', '100%'] }}
                                                    transition={{ duration: 1.5, delay: 4.2, repeat: Infinity, repeatDelay: 4.5 }}
                                                    className="h-full bg-gradient-to-r from-brand to-indigo-400"
                                                />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* The "Why Saito" / Suites Section */}
                <section id="solucoes" className="w-full py-32 px-6 flex flex-col items-center border-t border-border-subtle/50 bg-background relative overflow-hidden">
                     <div className="w-full max-w-7xl mx-auto space-y-32">
                        
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                            className="text-center"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">O Fim da <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Pirataria</span> nos Seus Grupos</h2>
                            <p className="text-foreground-muted text-xl max-w-3xl mx-auto font-medium">Você investe pesado em tráfego para atrair o público. Nós investimos nossa infraestrutura de IA para que concorrentes ou robôs de cassino não levem seus leads embora.</p>
                        </motion.div>

                        {/* Feature 1: Agente & IA (Moderação Semântica) */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
                            className="flex flex-col lg:flex-row gap-16 items-center"
                        >
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-orange-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] text-orange-400">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Gatekeeper AI & Moderação Semântica</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    Moderação por palavra-chave é passado. O Gatekeeper AI interpreta o "sentido real" das frases. Mesmo se escreverem "j0guinho que p🅰ga" ou tentarem disfarçar links com espaços, a IA reconhece o intuito malicioso e bane instantaneamente.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Controle de Assunto Inflexível: Força o grupo a falar só sobre o que importa.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Blacklist Dinâmica Baseada em IA: Detecta variações complexas de spams de bet.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Sistema de Strikes: Avisa, silencia ou bane usuários recorrentes.</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl bg-surface/40">
                                    <div className="flex flex-col gap-4">
                                        <div className="self-start bg-neutral-800 rounded-2xl p-4 max-w-[80%]"><p className="text-sm text-white">Ei galera nova forma de fazer renda e$xtra jogando na plat4forma n0va!!! lucros reais</p></div>
                                        <div className="self-end bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4 max-w-[80%] flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-orange-400" />
                                            <div><p className="text-sm text-white font-bold">Bloqueio Semântico IA Assinado</p><p className="text-xs text-orange-200 mt-1">"Intenção detectada: Aliciamento para aposta. Moderação aplicada e usuário 55... banido."</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Feature 2: Super Grupos / Transbordo */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
                            className="flex flex-col lg:flex-row-reverse gap-16 items-center"
                        >
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-brand/30 rounded-2xl flex items-center justify-center shadow-shadow-glow text-brand">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Super Grupos com Derramamento Automático</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    Gere apenas UM único link de captação. O Saito lê 24h por dia quem entra nos seus grupos de WhatsApp em tempo-real via webhooks e troca o destino da porta de entrada automaticamente assim que o limite de membros é atingido.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Otimização máxima para infoprodutos e coprodutores escalando.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Link Mágico nunca "quebra" as campanhas ativas.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-brand shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Auto-Create de 20+ grupos na Evolution API com 1 clique.</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl bg-surface/40">
                                    <div className="w-full h-64 md:h-[400px] flex items-center justify-center relative overflow-hidden bg-background/50 rounded-2xl border border-white/5 group">
                                         {/* Animated Background Orbs */}
                                         <div className="absolute inset-0 flex items-center justify-center filter blur-3xl opacity-40 mix-blend-screen">
                                             <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-40 h-40 bg-brand/60 rounded-full absolute -top-10 -left-10" />
                                             <motion.div animate={{ rotate: -360, scale: [1, 1.3, 1] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="w-40 h-40 bg-indigo-500/60 rounded-full absolute -bottom-10 -right-10" />
                                         </div>

                                         {/* Main Visual */}
                                         <div className="relative z-10 flex flex-col items-center">
                                             <motion.div 
                                                animate={{ y: [0, -10, 0] }} 
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-brand to-indigo-600 shadow-[0_0_40px_rgba(139,92,246,0.5)] flex items-center justify-center"
                                             >
                                                 <Users className="w-10 h-10 text-white" />
                                             </motion.div>
                                             
                                             {/* Routing Nodes */}
                                             <div className="flex gap-4 items-center">
                                                 {[1, 2, 3].map((node) => (
                                                     <div key={node} className="flex flex-col items-center gap-2">
                                                         <motion.div 
                                                            initial={{ opacity: 0.3 }}
                                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                                            transition={{ duration: 2, repeat: Infinity, delay: node * 0.4 }}
                                                            className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center ${node === 2 ? 'bg-brand/20 border-brand/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-surface'}`}
                                                         >
                                                             <span className="text-xs font-bold text-white">G{node}</span>
                                                         </motion.div>
                                                     </div>
                                                 ))}
                                             </div>
                                             
                                             {/* Connecting dashed line */}
                                             <div className="absolute top-[6.5rem] mt-1 w-full flex justify-center -z-10">
                                                 <div className="w-32 h-[1px] border-b-2 border-dashed border-white/20" />
                                             </div>
                                         </div>
                                         
                                         {/* Status Badge */}
                                         <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Roteamento Ativo</span>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Feature 3: Gestão de Grupos e Planner */}
                        <motion.div 
                            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
                            className="flex flex-col lg:flex-row gap-16 items-center"
                        >
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400">
                                    <CalendarDays className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Gestão Ativa e Planner de Lançamentos</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    Acesse o painel unificado para dezenas de grupos. Escreva uma mensagem agora, adicione uma mídia e agende para ser enviada amanhã às 08h da manhã. O sistema faz o resto, grupo por grupo, com espaçamento humano real.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Integração nativa de multi-instâncias Whatsapp Web multi-devices.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Calendário interativo estilo Planner visual.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Humanize: Pausa e status de "Escrevendo..." automáticos para evitar bans de API.</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-6 relative z-10 shadow-2xl bg-surface/40 overflow-hidden group">
                                    {/* Mockup Dashboard Interface */}
                                    <div className="rounded-2xl border border-white/5 bg-background flex flex-col h-80 overflow-hidden relative">
                                        
                                        {/* Mockup Header */}
                                        <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center justify-between px-4">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /><span className="text-white font-bold text-sm">Painel de Disparo Lento</span></div>
                                            <div className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">Modo Anti-Ban</div>
                                        </div>

                                        <div className="flex flex-1 overflow-hidden">
                                            {/* Mockup Sidebar - Groups */}
                                            <div className="w-1/3 border-r border-white/5 p-3 space-y-2">
                                                <div className="text-[10px] text-foreground-muted font-bold uppercase mb-2">Segmentação (3/50)</div>
                                                <div className="bg-brand/20 border border-brand/30 rounded-lg p-2 flex items-center justify-between"><div className="w-12 h-2 bg-white/20 rounded-full" /><div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div></div>
                                                <div className="bg-brand/20 border border-brand/30 rounded-lg p-2 flex items-center justify-between"><div className="w-16 h-2 bg-white/20 rounded-full" /><div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div></div>
                                            </div>

                                            {/* Mockup Main - Editor */}
                                            <div className="flex-1 p-4 flex flex-col gap-4 relative">
                                                <div className="flex-1 bg-surface rounded-xl border border-white/5 p-3 flex flex-col relative overflow-hidden">
                                                    
                                                    {/* Typing animation simulation */}
                                                    <div className="flex gap-2 mb-2 items-center">
                                                        <div className="w-6 h-6 rounded-full bg-brand/20 flex-shrink-0" />
                                                        <div className="flex flex-col gap-2 w-full mt-2">
                                                            <div className="h-2 bg-white/20 rounded-full w-3/4 relative overflow-hidden">
                                                                <div className="absolute top-0 bottom-0 left-0 bg-white/60" style={{ transformOrigin: 'left', animationName: 'progress', animationDuration: '4s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                                
                                                {/* Action Bar */}
                                                <div className="flex justify-between items-center mt-auto">
                                                    <div className="flex gap-2">
                                                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white flex items-center gap-1"><CalendarDays className="w-3 h-3 text-blue-400" /> Agendado.</div>
                                                    </div>
                                                    <div className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-95 group-hover:bg-blue-600 delay-1000 flex items-center gap-2 cursor-pointer">
                                                        Finalizar <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <style dangerouslySetInnerHTML={{__html: `
                                        @keyframes progress {
                                            0% { width: 0%; }
                                            50% { width: 100%; }
                                            100% { width: 100%; }
                                        }
                                    `}} />
                                    
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </section>

                {/* Features Grid Section */}
                <section id="recursos" className="w-full py-32 px-6 relative flex flex-col items-center bg-surface/20">
                    <motion.div 
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
                        className="w-full max-w-7xl mx-auto"
                    >
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Escale seu negócio com <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-indigo-400">Disparos em Grupos.</span></h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Infra Própria de Disparos", desc: "Aproveita a arquitetura Node + BullMQ + Redis para sustentar disparos massivos em alta cadência e sem crash do sistema.", icon: Zap },
                                { title: "Blacklist Dinâmica", desc: "Forneça suas palavras proibidas e a inteligência artificial vai capturar e agir contra todo o conteúdo proibido que se assemelhe.", icon: ShieldAlert },
                                { title: "Extração de Dados CSV", desc: "Exporte contatos dos seus funis segmentados para relatórios profundos e análise externa por CRMs e ferramentas de tráfego.", icon: BarChart3 },
                            ].map((feature, i) => (
                                <motion.div variants={fadeInUp} key={i} className="glass border border-border-subtle rounded-3xl p-8 hover:border-brand/40 hover:bg-brand/5 focus-ring group transition-all">
                                    <div className="w-12 h-12 glass border border-white/10 rounded-xl flex items-center justify-center mb-6 text-foreground-muted group-hover:text-brand group-hover:border-brand/30 transition-colors">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-foreground-muted text-sm leading-relaxed">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Pricing / Planos */}
                <section id="pricing" className="w-full pt-20 pb-40 px-6 flex flex-col items-center border-t border-border-subtle/50 relative">
                     {/* Glossy background effect */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[400px] bg-brand/5 blur-[150px] rounded-[100%] pointer-events-none -z-10" />

                    <div className="w-full max-w-7xl mx-auto">
                        <motion.div 
                             initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Qual é o seu Nível?</h2>
                            <p className="text-foreground-muted text-xl max-w-2xl mx-auto font-medium mb-10">Escolha o plano que acompanha o ritmo do seu Expert e seus lançamentos.</p>
                            
                            {/* Billing Cycle Toggle */}
                            <div className="inline-flex items-center p-1.5 bg-background border border-border-subtle rounded-full relative shadow-inner">
                                <button 
                                    onClick={() => setIsAnnual(false)}
                                    className={`relative z-10 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-300 ${!isAnnual ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    Faturamento Mensal
                                </button>
                                <button 
                                    onClick={() => setIsAnnual(true)}
                                    className={`relative z-10 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-300 flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                                >
                                    Faturamento Anual
                                </button>
                                
                                {/* Animated active pill */}
                                <motion.div 
                                    className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-surface-hover rounded-full border border-white/5 shadow-sm"
                                    animate={{ 
                                        x: isAnnual ? '100%' : '0%',
                                        width: isAnnual ? 'calc(50% + 20px)' : 'calc(50% - 6px)'
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />

                                {/* Saving Badge */}
                                {isAnnual && (
                                    <div className="absolute -top-3 -right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg border border-emerald-400 transform rotate-12 animate-pulse">
                                        Economize 20%
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto relative z-20">
                            {/* Starter */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }}
                                className="glass rounded-3xl p-10 border border-border-subtle flex flex-col transition-transform hover:-translate-y-2 bg-gradient-to-b from-surface/20"
                            >
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Saito Starter</h3>
                                    <p className="text-sm text-foreground-muted font-medium h-10">Para começar a validar ofertas e gerir tráfego leve.</p>
                                    <div className="mt-8 mb-10 flex flex-col">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-black text-white">R${isAnnual ? '1576' : '197'}</span>
                                            <span className="text-neutral-500 font-medium pb-2 text-sm">{isAnnual ? '/ano' : '/mês'}</span>
                                        </div>
                                        {isAnnual && <span className="text-xs text-brand font-medium mt-1">Equivalente a R$131/mês</span>}
                                    </div>
                                    <ul className="space-y-4 mb-10 border-t border-white/5 pt-8">
                                        {['Até 5.000 Leads', '2 Números de WhatsApp', '1 Membro de Equipe', 'Lançamentos Mutantes', 'Agendamento de Mensagens'].map((f, i) => (
                                            <li key={i} className={`flex items-start gap-3 text-sm font-semibold ${i === 2 ? 'text-white' : 'text-neutral-300'}`}>
                                                <CheckCircle2 className={`w-5 h-5 shrink-0 ${i === 2 ? 'text-brand' : 'text-neutral-500'}`} />{f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                    <a href={`/checkout?price_id=${isAnnual ? process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || 'starter_yearly' : process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'starter_monthly'}`} className="w-full block text-center py-4 rounded-xl bg-surface hover:bg-surface-hover border border-border text-white font-bold transition-colors">Assinar Starter</a>
                                </div>
                            </motion.div>

                            {/* Pro */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}
                                className="glass rounded-3xl p-10 border-2 border-brand shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-gradient-to-b from-brand/10 to-surface/40 relative flex flex-col transform md:-translate-y-6"
                            >
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-brand-hover px-6 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-shadow-glow border border-white/20">
                                    A Máquina Pronta
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">Saito Pro</h3>
                                    <p className="text-sm text-brand-light font-medium h-10 opacity-80">A máquina completa para co-produtores e o famoso 6 em 7.</p>
                                    <div className="mt-8 mb-10 flex flex-col">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-black text-white">R${isAnnual ? '3976' : '497'}</span>
                                            <span className="text-brand-light font-medium pb-2 text-sm">{isAnnual ? '/ano' : '/mês'}</span>
                                        </div>
                                        {isAnnual && <span className="text-xs text-white font-bold mt-1">Equivalente a R$331/mês</span>}
                                    </div>
                                    <ul className="space-y-4 mb-10 border-t border-brand/20 pt-8">
                                        {[
                                            'Leads Ilimitados', 
                                            '5 Números de WhatsApp', 
                                            '2 Membros de Equipe',
                                            <span key="1">Moderação <strong>Gatekeeper IA</strong> (Anti-Spam)</span>, 
                                            'Automação de Transbordo', 
                                            'Planejador Avançado'
                                        ].map((f, i) => (
                                            <li key={i} className={`flex items-start gap-3 text-sm font-medium ${i === 2 || i === 3 ? 'text-white' : 'text-neutral-300'}`}>
                                                <CheckCircle2 className={`w-5 h-5 shrink-0 ${i === 2 || i === 3 ? 'text-brand' : 'text-brand/50'}`} />{f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                     <a href={`/checkout?price_id=${isAnnual ? process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || 'pro_yearly' : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'pro_monthly'}`} className="w-full block text-center py-4 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-white font-bold transition-all shadow-shadow-glow hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] scale-100 hover:scale-[1.02] active:scale-[0.98]">
                                        Assinar Pro
                                    </a>
                                </div>
                            </motion.div>

                            {/* Enterprise */}
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}
                                className="glass rounded-3xl p-10 border border-border-subtle flex flex-col transition-transform hover:-translate-y-2 bg-gradient-to-b from-surface/20"
                            >
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Saito Master</h3>
                                    <p className="text-sm text-foreground-muted font-medium h-10">Agências de lançamentos que gerem múltiplos experts.</p>
                                    <div className="mt-8 mb-10 flex flex-col">
                                        <div className="flex items-end gap-1">
                                            <span className="text-5xl font-black text-white">R${isAnnual ? '6979' : '997'}</span>
                                            <span className="text-neutral-500 font-medium pb-2 text-sm">{isAnnual ? '/ano' : '/mês'}</span>
                                        </div>
                                        {isAnnual && <span className="text-xs text-brand font-medium mt-1">Equivalente a R$581/mês</span>}
                                    </div>
                                    <ul className="space-y-4 mb-10 border-t border-white/5 pt-8">
                                        {[
                                            'Tudo do pacote Pro', 
                                            '15 Instâncias WhatsApp', 
                                            '10 Membros de Equipe', 
                                            <span key="1">Integração via <strong>Webhooks (API)</strong></span>, 
                                            'Atendimento Prioritário'
                                        ].map((f, i) => (
                                            <li key={i} className={`flex items-start gap-3 text-sm font-semibold ${i === 2 || i === 3 ? 'text-white' : 'text-neutral-300'}`}>
                                                <CheckCircle2 className={`w-5 h-5 shrink-0 ${i === 2 || i === 3 ? 'text-brand' : 'text-neutral-500'}`} />{f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                    <a href={`/checkout?price_id=${isAnnual ? process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'master_yearly' : process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'master_monthly'}`} className="w-full block text-center py-4 rounded-xl bg-surface hover:bg-surface-hover border border-border text-white font-bold transition-colors">Assinar Master</a>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-border-subtle/50 bg-background/50 backdrop-blur-3xl relative z-10 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-brand to-brand-hover rounded-xl shadow-shadow-glow">
                                    <ShieldAlert className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tighter">Saito</span>
                            </div>
                            <p className="text-sm text-foreground-muted max-w-xs leading-relaxed">A infraestrutura secreta por trás dos maiores lançamentos do mercado digital brasileiro.</p>
                        </div>
                        
                        <div className="flex gap-16">
                            <div className="flex flex-col gap-4">
                                <span className="text-white font-bold">Produto</span>
                                <a href="#solucoes" className="text-sm text-foreground-muted hover:text-white transition-colors">Moderação IA</a>
                                <a href="#pricing" className="text-sm text-foreground-muted hover:text-white transition-colors">Preços & Planos</a>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-white font-bold">Legal</span>
                                <Link href="/termos" className="text-sm text-foreground-muted hover:text-white transition-colors">Termos de Uso</Link>
                                <Link href="/privacidade" className="text-sm text-foreground-muted hover:text-white transition-colors">Privacidade</Link>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-foreground-muted text-xs font-medium">
                        <span>© {new Date().getFullYear()} Saito Governance. System Active.</span>
                        <div className="flex items-center gap-2">Feito para <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 font-bold border border-green-500/20">Agências Pro</span> de Alta Performance</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
