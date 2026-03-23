'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Send, Loader2, ArrowLeft, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Role = 'user' | 'model';
interface Message { role: Role; text: string; isTyping?: boolean; }

const PRODUCT_TYPES = [
    { key: 'infoproduto', label: '🧠 Infoproduto', desc: 'Curso, ebook, mentoria' },
    { key: 'produto_fisico', label: '📦 Produto Físico', desc: 'E-commerce, estoque' },
    { key: 'servico', label: '🎯 Serviço', desc: 'Consultoria, agência' },
];

export default function NovoPlanejadorPage() {
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [productType, setProductType] = useState<string | null>(null);
    const [planId, setPlanId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [planReady, setPlanReady] = useState(false);
    const [creating, setCreating] = useState(false);
    const [instances, setInstances] = useState<any[]>([]);

    // Fetch instances on mount
    useEffect(() => {
        async function fetchInstances() {
            const { data } = await supabase.from('instances').select('id, name, status');
            setInstances(data || []);
        }
        fetchInstances();
    }, []);

    // Initial greeting
    useEffect(() => {
        setMessages([{
            role: 'model',
            text: 'Oi! Sou o **Saito Strategist** 🚀\n\nVou montar o seu lançamento completo — timeline, copies e tudo mais.\n\nO que vamos escalar hoje?',
        }]);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function selectProductType(type: string) {
        setProductType(type);

        // Create plan in DB
        const { data: { session } } = await supabase.auth.getSession();
        
        // Use the first instance available or a fallback if none found
        const targetInstanceId = instances[0]?.id;
        const typeLabel = PRODUCT_TYPES.find(t => t.key === type)?.label || type;
        
        let plan: any;
        try {
            const res = await fetch(`${API}/api/planner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ 
                    product_type: type, 
                    product_name: 'Novo Produto',
                    instance_id: targetInstanceId
                }),
            });
            plan = await res.json();
            if (res.ok && plan.id) {
                setPlanId(plan.id);
            } else {
                console.error("Plan creation error:", plan);
                setMessages(prev => [...prev, 
                    { role: 'user', text: typeLabel },
                    { role: 'model', text: `⚠️ **Erro Crítico:** Não foi possível criar o plano no servidor. Motivo: ${plan.error || 'Desconhecido'}.\n\nPara o botão "Ver Timeline" funcionar depois, o plano precisa ser salvo agora. Recarregue a página ou confira sua assinatura/banco e tente novamente.` }
                ]);
                return;
            }
        } catch (err: any) {
            console.error('Plan creation failed:', err);
            setMessages(prev => [...prev, 
                { role: 'user', text: typeLabel },
                { role: 'model', text: `⚠️ **Erro de Conexão:** Falha ao comunicar com a API para criar o plano. ${err.message}` }
            ]);
            return;
        }

        // Add user message
        const userMsg: Message = { role: 'user', text: typeLabel };
        setMessages(prev => [...prev, userMsg]);

        // Call AI 
        await callAI([...messages, userMsg], type, plan.id);
    }

    async function callAI(history: Message[], type: string, pid: string) {
        setLoading(true);

        // Show typing indicator
        setMessages(prev => [...prev, { role: 'model', text: '', isTyping: true }]);

        try {
            const formattedHistory = history
                .filter(m => !m.isTyping)
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }],
                }));

            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/planner/ai-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    messages: formattedHistory,
                    product_type: type,
                    plan_id: pid,
                }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                let errMsg = data.error === 'OPENAI_API_KEY not configured'
                    ? '⚠️ A chave da API da OpenAI não está configurada no backend. Adicione `OPENAI_API_KEY` no arquivo `.env` do backend.'
                    : `⚠️ Erro: ${data.error || 'Falha na comunicação com o servidor.'}`;
                
                if (data.details) {
                    errMsg += `\n\nDetalhes:\n${JSON.stringify(data.details, null, 2)}`;
                }

                setMessages(prev => [
                    ...prev.filter(m => !m.isTyping),
                    { role: 'model', text: errMsg },
                ]);
                setLoading(false);
                return;
            }

            // Remove typing indicator and add real response
            const cleanText = data.text?.replace(/```json[\s\S]*?```/g, '').trim() || '';
            setMessages(prev => [
                ...prev.filter(m => !m.isTyping),
                { role: 'model', text: cleanText },
            ]);

            if (data.plan_ready) {
                setPlanReady(true);
            }
        } catch {
            setMessages(prev => [
                ...prev.filter(m => !m.isTyping),
                { role: 'model', text: '⚠️ Problema de conexão com o servidor. Verifique se o backend está rodando.' },
            ]);
        }
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }

    async function sendMessage() {
        if (!input.trim() || loading || !productType) return;
        const text = input.trim();
        setInput('');

        const userMsg: Message = { role: 'user', text };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);

        await callAI(newHistory, productType, planId || '');
    }

    async function goToPlan() {
        if (!planId) return;
        setCreating(true);
        router.push(`/dashboard/planejador/${planId}`);
    }

    function renderText(text: string) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] sm:h-screen bg-background relative selection:bg-brand/30 selection:text-brand-light font-sans overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Top bar */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-border/50 bg-surface/50 backdrop-blur-md shrink-0 relative z-20 shadow-sm">
                <button
                    onClick={() => router.push('/dashboard/planejador')}
                    className="p-2.5 text-foreground-muted hover:text-white transition-colors rounded-xl hover:bg-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center border border-brand/20 shadow-shadow-glow">
                    <Rocket className="w-5 h-5 text-brand" />
                </div>
                <div>
                    <p className="text-base font-bold text-white tracking-tight">Saito Strategist</p>
                    <p className="text-xs font-medium text-foreground-muted">Briefing Room • Planejador de Campanhas</p>
                </div>
                <div className="ml-auto">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold tracking-widest uppercase text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        Online
                    </span>
                </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 sm:px-10 scrollbar-hide relative z-10 w-full max-w-4xl mx-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-2xl bg-surface border border-brand/20 flex items-center justify-center mr-4 shrink-0 shadow-shadow-glow">
                                <Rocket className="w-5 h-5 text-brand" />
                            </div>
                        )}
                        <div className={`max-w-xl px-6 py-4 text-sm md:text-base leading-relaxed break-words shadow-sm ${msg.role === 'user'
                            ? 'bg-brand text-white rounded-3xl rounded-br-sm shadow-[0_4px_20px_rgba(230,57,70,0.2)]'
                            : 'glass border border-border-subtle text-neutral-200 rounded-3xl rounded-bl-sm bg-surface-hover/80'
                            }`}>
                            {msg.isTyping ? (
                                <span className="flex items-center gap-2 text-foreground-muted py-2">
                                    <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce [animation-delay:0ms]" />
                                    <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce [animation-delay:150ms]" />
                                    <span className="w-2 h-2 rounded-full bg-brand/60 animate-bounce [animation-delay:300ms]" />
                                </span>
                            ) : (
                                <div className="space-y-4" dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                            )}
                        </div>
                    </div>
                ))}

                {/* Product type selection buttons */}
                {!productType && messages.length === 1 && (
                    <div className="flex justify-start pl-[3.5rem] mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {PRODUCT_TYPES.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => selectProductType(t.key)}
                                    className="flex items-center gap-4 px-5 py-4 glass border border-border-subtle hover:border-brand/50 bg-surface/40 hover:bg-surface-hover text-left rounded-2xl transition-all shadow-sm hover:shadow-premium group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-2xl relative z-10">{t.label.split(' ')[0]}</span>
                                    <div className="relative z-10">
                                        <p className="text-white font-bold group-hover:text-brand transition-colors text-sm tracking-wide">
                                            {t.label.split(' ').slice(1).join(' ')}
                                        </p>
                                        <p className="text-xs font-medium text-foreground-muted mt-0.5">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plan ready CTA */}
                {planReady && (
                    <div className="flex justify-start pl-[3.5rem] mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={goToPlan}
                            disabled={creating}
                            className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-neutral-200 text-black rounded-2xl font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95"
                        >
                            {creating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Check className="w-5 h-5" />
                            )}
                            Ver Timeline Completa →
                        </button>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input bar */}
            {productType && !planReady && (
                <div className="px-4 py-5 sm:px-10 border-t border-border/50 glass bg-surface/40 shrink-0 relative z-20">
                    <div className="max-w-4xl mx-auto flex items-center gap-3 bg-black/40 border border-border-subtle rounded-3xl px-5 py-4 focus-within:border-brand/50 focus-within:bg-surface-hover transition-all shadow-inner">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Mensagem para o Saito Strategist..."
                            className="flex-1 bg-transparent text-sm md:text-base font-medium text-white placeholder-neutral-600 focus:outline-none"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="w-10 h-10 bg-brand hover:bg-brand-hover rounded-xl flex items-center justify-center text-white disabled:opacity-30 disabled:hover:bg-brand transition-all shadow-shadow-glow active:scale-90"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                    </div>
                    <p className="text-center text-[10px] sm:text-xs font-semibold text-foreground-muted mt-3 uppercase tracking-widest hidden sm:block">
                        A IA pode cometer erros. Revise o plano final.
                    </p>
                </div>
            )}
        </div>
    );
}
