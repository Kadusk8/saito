import Link from 'next/link';
import { ShieldAlert, ArrowRight, Zap, Sparkles, CheckCircle2, ChevronRight, Bot, Target, CalendarDays, BarChart3, Users, MessageSquareShare, PhoneCall } from 'lucide-react';

export default function LandingPage() {
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
                    <a href="#solucoes" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Soluções</a>
                    <a href="#como-funciona" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Como Funciona</a>
                    <a href="#recursos" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Recursos</a>
                    <a href="#pricing" className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors">Planos</a>
                </nav>
                <div className="flex items-center gap-6 relative z-50 pointer-events-auto">
                    <Link href="/login" className="text-sm font-semibold text-foreground-muted hover:text-white transition-colors">
                        Entrar
                    </Link>
                    <Link href="/login" className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Começar Agora <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <main className="flex-1 w-full relative z-0 flex flex-col items-center">
                
                {/* Hero Section */}
                <section className="w-full pt-28 pb-32 px-6 flex flex-col items-center relative">
                    <div className="w-full max-w-5xl mx-auto text-center space-y-8 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand/30 bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-shadow-glow">
                            <Sparkles className="w-4 h-4" /> A Plataforma Definitiva para Infoprodutos, Serviços e Físicos
                        </div>

                        <h1 className="text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-black text-white tracking-tighter leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Domine seus <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-indigo-400 to-orange-400 animate-gradient">Lançamentos em Grupos.</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-foreground-muted max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 font-medium tracking-wide">
                            Saito é o sistema completo para gestão de lançamentos: Multi-Grupos de WhatsApp, Moderação com IA e Automação extrema num só lugar.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 relative z-20 pointer-events-auto">
                            <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-brand-hover text-white text-lg font-bold rounded-2xl transition-all shadow-premium hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] flex items-center justify-center gap-2 group relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                Criar Conta Grátis <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#solucoes" className="w-full sm:w-auto px-10 py-5 glass hover:bg-surface-hover border border-border-subtle text-white text-lg font-bold rounded-2xl transition-all flex items-center justify-center group">
                                Como Funciona
                            </a>
                        </div>
                        
                        <div className="mt-12 flex items-center justify-center gap-8 text-sm font-semibold text-neutral-500 animate-in fade-in duration-1000 delay-500">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Sem bloqueios no WhatsApp</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> +45% de conversão (Média)</div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand" /> Setup em 3 minutos</div>
                        </div>
                    </div>

                    {/* Dashboard Mockup Representation */}
                    <div className="mt-32 max-w-6xl mx-auto relative perspective-[2000px] pointer-events-none w-full">
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
                        
                        <div className="relative z-0 rounded-t-3xl border border-border-subtle/50 glass p-2 shadow-[0_-20px_80px_rgba(139,92,246,0.15)] overflow-hidden transform rotate-x-[15deg] scale-95 opacity-90 animate-in fade-in slide-in-from-bottom-32 duration-1200 delay-500">
                            <div className="rounded-2xl border border-white/10 bg-surface/90 overflow-hidden aspect-[16/9] flex items-center justify-center relative backdrop-blur-3xl">
                                
                                {/* Mock UI Header */}
                                <div className="absolute top-0 inset-x-0 h-16 border-b border-white/5 flex items-center px-6 gap-4 bg-background/50">
                                     <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                     <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                     <div className="ml-8 w-48 h-8 rounded-lg bg-white/5" />
                                </div>

                                {/* Mock Stats */}
                                <div className="absolute top-24 left-6 right-6 flex gap-6 opacity-80">
                                    <div className="flex-1 h-32 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 flex flex-col justify-between">
                                        <div className="flex items-center justify-between"><div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center"><Users className="w-4 h-4 text-brand" /></div><div className="text-xs text-green-400 font-bold">+12%</div></div>
                                        <div><div className="text-2xl font-black text-white">45.290</div><div className="text-xs text-foreground-muted font-semibold mt-1">Leads Ativos</div></div>
                                    </div>
                                    <div className="flex-1 h-32 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 flex flex-col justify-between">
                                        <div className="flex items-center justify-between"><div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center"><MessageSquareShare className="w-4 h-4 text-indigo-400" /></div><div className="text-xs text-green-400 font-bold">+8%</div></div>
                                        <div><div className="text-2xl font-black text-white">128.4M</div><div className="text-xs text-foreground-muted font-semibold mt-1">Mensagens Enviadas</div></div>
                                    </div>
                                    <div className="flex-1 h-32 rounded-2xl glass border border-brand/30 shadow-shadow-glow p-6 flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-brand/10 blur-3xl" />
                                        <div className="flex items-center justify-between relative z-10"><div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><Target className="w-4 h-4 text-green-400" /></div><div className="text-xs text-brand font-bold">ALERTA</div></div>
                                        <div className="relative z-10"><div className="text-2xl font-black text-white">2.490</div><div className="text-xs text-foreground-muted font-semibold mt-1">Spammers Banidos IA</div></div>
                                    </div>
                                </div>
                                
                                {/* Mock Chart Area */}
                                <div className="absolute top-64 left-6 right-6 h-64 rounded-2xl glass border border-white/5 opacity-80 flex flex-col gap-4 p-6 relative overflow-hidden">
                                     <div className="w-48 h-6 bg-white/10 rounded-md mb-4" />
                                     <div className="flex-1 w-full flex items-end justify-between gap-2 px-4">
                                         {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85, 60, 95].map((h, i) => (
                                             <div key={i} className={`w-full rounded-t-md opacity-70 ${i === 7 ? 'bg-brand shadow-shadow-glow' : 'bg-white/10'}`} style={{ height: `${h}%` }} />
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The "Why Saito" / Suites Section */}
                <section id="solucoes" className="w-full py-32 px-6 flex flex-col items-center border-t border-border-subtle/50 bg-background relative">
                     <div className="w-full max-w-7xl mx-auto space-y-32">
                        
                        <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Um Ecossistema <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-indigo-400">Completo</span></h2>
                            <p className="text-foreground-muted text-xl max-w-3xl mx-auto font-medium">Substitua várias ferramentas caras e ineficientes por um único painel de controle focado em maximizar o LTV e a conversão do seu funil.</p>
                        </div>

                        {/* Feature 1: Super Grupos */}
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-brand/30 rounded-2xl flex items-center justify-center shadow-shadow-glow text-brand">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Lançamentos em Grupos Mutantes</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    O fim do pesadelo dos "Grupos Lotados". Gere apenas 1 link mágico. Quando o Grupo 01 atinge a capacidade máxima configurada por você, o link direciona automaticamente os próximos leads para o Grupo 02, depois 03, infinitamente. Ideal para infoprodutos, serviços e produtos físicos.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Link de Convite único para todas as campanhas.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Métricas de lotação em tempo real.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Controle de Administradores em massa.</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl bg-surface/40">
                                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop" alt="Dashboard Super Grupos" className="rounded-2xl border border-white/5 opacity-80" />
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Agente & IA */}
                        <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-orange-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] text-orange-400">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Gatekeeper AI & Moderação Automática</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    Proteja seus lançamentos contra pirataria, concorrentes e spammers. Nossa IA analisa o contexto de cada mensagem. Mencionou "Bet", "Tigrinho" ou mandou link de outro grupo? Banimento instantâneo.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Sistema de Strikes: Após X violações, o usuário é removido.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Suporte Atendimento IA: Responda dúvidas comuns automaticamente.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Qualificação de Leads (Quente, Morno, Frio).</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl bg-surface/40">
                                    <div className="flex flex-col gap-4">
                                        <div className="self-start bg-neutral-800 rounded-2xl p-4 max-w-[80%]"><p className="text-sm text-white">Ei galera, acessem esse link pro jogo do tigrinho q ta pagando muito!!</p></div>
                                        <div className="self-end bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4 max-w-[80%] flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-orange-400" />
                                            <div><p className="text-sm text-white font-bold">Ação Automática (Saito AI)</p><p className="text-xs text-orange-200 mt-1">Mensagem apagada. Usuário banido por Regra Anti-Spam (Jogos de Azar).</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3: Gestão de Grupos e Planner */}
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="flex-1 space-y-8">
                                <div className="w-16 h-16 glass border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400">
                                    <CalendarDays className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Gestão Ativa e Agendamento</h3>
                                <p className="text-lg text-foreground-muted font-medium leading-relaxed">
                                    Acesse o painel unificado para dezenas de grupos. Escreva uma mensagem agora, adicione uma mídia e agende para ser enviada amanhã às 08h da manhã. O sistema faz o resto, grupo por grupo, sem travar seu celular.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Envio de imagens, áudios e vídeos simultâneos.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Calendário interativo estilo Planner.</span></li>
                                    <li className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /><span className="text-neutral-300 font-medium">Pausa automática entre grupos (Anti-Ban).</span></li>
                                </ul>
                            </div>
                            <div className="flex-1 w-full relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                                <div className="glass border border-white/10 rounded-3xl p-6 relative z-10 shadow-2xl bg-surface/40 overflow-hidden group">
                                    {/* Mockup Dashboard Interface */}
                                    <div className="rounded-2xl border border-white/5 bg-background flex flex-col h-80 overflow-hidden relative">
                                        
                                        {/* Mockup Header */}
                                        <div className="h-12 border-b border-white/5 bg-surface/50 flex items-center justify-between px-4">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /><span className="text-white font-bold text-sm">Dashboard Saito</span></div>
                                            <div className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">Instância Conectada</div>
                                        </div>

                                        <div className="flex flex-1 overflow-hidden">
                                            {/* Mockup Sidebar - Groups */}
                                            <div className="w-1/3 border-r border-white/5 p-3 space-y-2">
                                                <div className="text-[10px] text-foreground-muted font-bold uppercase mb-2">Seus Grupos (3/50)</div>
                                                <div className="bg-brand/20 border border-brand/30 rounded-lg p-2 flex items-center justify-between"><div className="w-12 h-2 bg-white/20 rounded-full" /><div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div></div>
                                                <div className="bg-brand/20 border border-brand/30 rounded-lg p-2 flex items-center justify-between"><div className="w-16 h-2 bg-white/20 rounded-full" /><div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div></div>
                                                <div className="bg-brand/20 border border-brand/30 rounded-lg p-2 flex items-center justify-between"><div className="w-10 h-2 bg-white/20 rounded-full" /><div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div></div>
                                                <div className="bg-white/5 rounded-lg p-2"><div className="w-20 h-2 bg-white/10 rounded-full" /></div>
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
                                                            <div className="h-2 bg-white/20 rounded-full w-1/2 relative overflow-hidden">
                                                                <div className="absolute top-0 bottom-0 left-0 bg-white/60" style={{ transformOrigin: 'left', animationName: 'progress', animationDuration: '4s', animationDelay: '1s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Image attachment simulation */}
                                                    <div className="mt-4 w-full h-16 rounded-lg bg-gradient-to-br from-brand/20 to-indigo-500/20 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-700">
                                                        <Sparkles className="w-5 h-5 text-brand animate-pulse" />
                                                    </div>

                                                </div>
                                                
                                                {/* Action Bar */}
                                                <div className="flex justify-between items-center mt-auto">
                                                    <div className="flex gap-2">
                                                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white flex items-center gap-1"><CalendarDays className="w-3 h-3 text-blue-400" /> 18/10 às 08:00</div>
                                                    </div>
                                                    <div className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)] transform transition-transform group-hover:scale-95 group-hover:bg-blue-600 delay-1000 flex items-center gap-2 cursor-pointer">
                                                        Agendar <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                                
                                                {/* Success Toast (Appears after delay) */}
                                                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/90 backdrop-blur-md rounded-full shadow-2xl border border-green-400 text-xs font-bold text-white flex items-center gap-2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-500 delay-[1500ms]">
                                                    <CheckCircle2 className="w-4 h-4" /> Disparos Agendados!
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
                        </div>

                    </div>
                </section>

                {/* Features Grid Section */}
                <section id="recursos" className="w-full py-32 px-6 relative flex flex-col items-center bg-surface/20">
                    <div className="w-full max-w-7xl mx-auto">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Construída para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-indigo-400">Alta Performance.</span></h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Planejador de Lançamentos", desc: "Agende todas as mensagens do seu lançamento visualmente em um calendário unificado.", icon: CalendarDays },
                                { title: "Rotatividade de API", desc: "Integração segura via Evolution API com suporte a múltiplos números para evitar bloqueios em massa.", icon: Zap },
                                { title: "Relatórios de Engajamento", desc: "Saiba exatamente quais leads interagement, quem lê mais mensagens e rankeie seus melhores clientes.", icon: BarChart3 },
                            ].map((feature, i) => (
                                <div key={i} className="glass border border-border-subtle rounded-3xl p-8 hover:border-brand/40 hover:bg-brand/5 focus-ring group transition-all">
                                    <div className="w-12 h-12 glass border border-white/10 rounded-xl flex items-center justify-center mb-6 text-foreground-muted group-hover:text-brand group-hover:border-brand/30 transition-colors">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-foreground-muted text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing / Planos */}
                <section id="pricing" className="w-full pt-20 pb-40 px-6 flex flex-col items-center  border-t border-border-subtle/50 relative">
                     {/* Glossy background effect */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[400px] bg-brand/5 blur-[150px] rounded-[100%] pointer-events-none -z-10" />

                    <div className="w-full max-w-7xl mx-auto">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Pronto para a Escala?</h2>
                            <p className="text-foreground-muted text-xl max-w-2xl mx-auto font-medium">Escolha o plano que acompanha o ritmo do seu negócio.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                            {/* Starter */}
                            <div className="glass rounded-3xl p-10 border border-border-subtle flex flex-col transition-transform hover:-translate-y-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Saito Starter</h3>
                                    <p className="text-sm text-foreground-muted font-medium h-10">Para começar a validar ofertas e gerir tráfego leve.</p>
                                    <div className="mt-8 mb-10"><span className="text-5xl font-black text-white">R$197</span><span className="text-neutral-500 font-medium">/mês</span></div>
                                    <ul className="space-y-4 mb-10 border-t border-white/5 pt-8">
                                        {['Até 5.000 Leads', '2 Instâncias WhatsApp', 'Lançamentos Mutantes', 'Agendamento de Mensagens'].map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-semibold text-neutral-300"><CheckCircle2 className="w-5 h-5 text-neutral-500 shrink-0" />{f}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                    <Link href="/login" className="w-full block text-center py-4 rounded-xl bg-surface hover:bg-surface-hover border border-border text-white font-bold transition-colors">Assinar Starter</Link>
                                </div>
                            </div>

                            {/* Pro */}
                            <div className="glass rounded-3xl p-10 border-2 border-brand shadow-[0_0_50px_rgba(139,92,246,0.15)] bg-brand/5 relative flex flex-col transform md:-translate-y-6">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-brand-hover px-6 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-shadow-glow border border-white/20">
                                    Recomendado
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1">Saito Pro</h3>
                                    <p className="text-sm text-brand-light font-medium h-10 opacity-80">A máquina completa para co-produtores e 6 em 7.</p>
                                    <div className="mt-8 mb-10"><span className="text-5xl font-black text-white">R$497</span><span className="text-brand-light font-medium">/mês</span></div>
                                    <ul className="space-y-4 mb-10 border-t border-brand/20 pt-8">
                                        {[
                                            'Leads Ilimitados', 
                                            '10 Instâncias WhatsApp', 
                                            <span key="1"><strong>Gatekeeper IA</strong> (Anti-Spam)</span>, 
                                            'Automação de Transbordo', 
                                            'Planejador Avançado'
                                        ].map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-medium text-white"><CheckCircle2 className="w-5 h-5 text-brand shrink-0 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />{f}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                     <Link href="/login" className="w-full block text-center py-4 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-white font-bold transition-all shadow-shadow-glow hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] scale-100 hover:scale-[1.02] active:scale-[0.98]">
                                        Assinar Pro
                                    </Link>
                                </div>
                            </div>

                            {/* Enterprise */}
                            <div className="glass rounded-3xl p-10 border border-border-subtle flex flex-col transition-transform hover:-translate-y-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Saito X</h3>
                                    <p className="text-sm text-foreground-muted font-medium h-10">Agências de lançamentos que gerem múltiplos experts.</p>
                                    <div className="mt-8 mb-10"><span className="text-5xl font-black text-white">R$997</span><span className="text-neutral-500 font-medium">/mês</span></div>
                                    <ul className="space-y-4 mb-10 border-t border-white/5 pt-8">
                                        {['Tudo do Pro', '+30 Instâncias WhatsApp', 'IP Dedicado Opcional', 'Integração Webhooks API', 'Atendimento Prioritário'].map((f, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-semibold text-neutral-300"><CheckCircle2 className="w-5 h-5 text-neutral-500 shrink-0" />{f}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-auto pt-8">
                                    <Link href="/login" className="w-full block text-center py-4 rounded-xl bg-surface hover:bg-surface-hover border border-border text-white font-bold transition-colors">Falar com o Time</Link>
                                </div>
                            </div>
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
                                <a href="#solucoes" className="text-sm text-foreground-muted hover:text-white transition-colors">Soluções</a>
                                <a href="#pricing" className="text-sm text-foreground-muted hover:text-white transition-colors">Preços</a>
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
                        <div className="flex items-center gap-2">Feito para <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 font-bold border border-green-500/20">Produtores</span> de Alta Performance</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
