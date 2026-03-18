'use client';

import { useState, useRef, useEffect } from 'react';
import { Rocket, Send, Loader2, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

type Role = 'user' | 'model';
interface Message { role: Role; text: string; isTyping?: boolean; }

const PRODUCT_TYPES = [
    { key: 'infoproduto', label: '🧠 Infoproduto', desc: 'Curso, ebook, mentoria' },
    { key: 'produto_fisico', label: '📦 Produto Físico', desc: 'E-commerce, estoque' },
    { key: 'servico', label: '🎯 Serviço', desc: 'Consultoria, agência' },
];

interface BlueprintStrategistProps {
    campaignId: string;
    onPlanApplied?: () => void;
}

export function BlueprintStrategist({ campaignId, onPlanApplied }: BlueprintStrategistProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [productType, setProductType] = useState<string | null>(null);
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [planReady, setPlanReady] = useState(false);
    const [applying, setApplying] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Load existing plan if any
    useEffect(() => {
        async function checkExistingPlan() {
            setInitialLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`${API}/api/planner/campaign/${campaignId}`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setPlan(data);
                    setProductType(data.product_type);
                    setPlanReady(data.launch_plan_messages?.length > 0);
                    
                    // Add a summary message
                    setMessages([
                        { role: 'model', text: `Oi! Sou o **Saito Strategist** 🚀\n\nIdentifiquei que já temos um planejamento em andamento para este Super Grupo.\n\nProduto: **${data.product_name}**\nTipo: **${data.product_type}**\n\nPodemos continuar ajustando ou você pode aplicar a estratégia na timeline.` }
                    ]);
                } else {
                    // Initial greeting for new plan
                    setMessages([{
                        role: 'model',
                        text: 'Oi! Sou o **Saito Strategist** 🚀\n\nVou montar a estratégia **Meteórico Starter** completa para este Super Grupo.\n\nO que vamos escalar hoje?',
                    }]);
                }
            } catch (e) {
                console.error('Error fetching plan:', e);
            } finally {
                setInitialLoading(false);
            }
        }
        checkExistingPlan();
    }, [campaignId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function selectProductType(type: string) {
        setProductType(type);
        const { data: { session } } = await supabase.auth.getSession();
        
        // Create plan linked to campaign
        let newPlan;
        try {
            const res = await fetch(`${API}/api/planner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ 
                    product_type: type, 
                    product_name: 'Estratégia Super Grupo',
                    campaign_id: campaignId
                }),
            });
            newPlan = await res.json();
            if (newPlan.id) setPlan(newPlan);
        } catch (err) {
            console.error('Plan creation failed:', err);
        }

        const typeLabel = PRODUCT_TYPES.find(t => t.key === type)?.label || type;
        const userMsg: Message = { role: 'user', text: typeLabel };
        setMessages(prev => [...prev, userMsg]);

        await callAI([...messages, userMsg], type, newPlan?.id || '');
    }

    async function callAI(history: Message[], type: string, pid: string) {
        setLoading(true);
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
                const errMsg = `⚠️ Erro: ${data.error || 'Falha na comunicação com o servidor.'}`;
                setMessages(prev => [...prev.filter(m => !m.isTyping), { role: 'model', text: errMsg }]);
                setLoading(false);
                return;
            }

            const cleanText = data.text?.replace(/```json[\s\S]*?```/g, '').trim() || '';
            setMessages(prev => [...prev.filter(m => !m.isTyping), { role: 'model', text: cleanText }]);

            if (data.plan_ready) {
                setPlanReady(true);
            }
        } catch {
            setMessages(prev => [...prev.filter(m => !m.isTyping), { role: 'model', text: '⚠️ Problema de conexão com o servidor.' }]);
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

        await callAI(newHistory, productType, plan?.id || '');
    }

    async function applyStrategy() {
        if (!plan?.id) return;
        setApplying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/planner/plan/${plan.id}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'model', text: '✅ **Estratégia aplicada com sucesso!**\n\nTodas as mensagens foram agendadas na aba de Conteúdo. Você já pode fechar este chat.' }]);
                if (onPlanApplied) onPlanApplied();
            } else {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'model', text: `❌ **Erro ao aplicar:** ${data.error}` }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: '⚠️ Erro de conexão ao aplicar estratégia.' }]);
        }
        setApplying(false);
    }

    function renderText(text: string) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
    }

    if (initialLoading) return (
        <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl border border-border-subtle">
            <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
            <p className="text-foreground-muted font-medium">Conectando ao Saito Strategist...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[600px] glass rounded-3xl border border-border-subtle overflow-hidden relative shadow-premium bg-surface/40">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3 bg-black/20">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center border border-brand/20">
                    <Rocket className="w-5 h-5 text-brand" />
                </div>
                <div>
                    <h3 className="text-sm font-extrabold text-white">Saito Strategist (IA)</h3>
                    <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Estratégia Meteórico Starter</p>
                </div>
                {planReady && (
                   <button
                       onClick={applyStrategy}
                       disabled={applying}
                       className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                   >
                       {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                       APLICAR NA CAMPANHA
                   </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed rounded-2xl ${
                            msg.role === 'user'
                            ? 'bg-brand text-white rounded-tr-sm'
                            : 'bg-surface border border-border-subtle text-neutral-200 rounded-tl-sm'
                        }`}>
                            {msg.isTyping ? (
                                <span className="flex items-center gap-1.5 py-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand/60 animate-bounce [animation-delay:300ms]" />
                                </span>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />
                            )}
                        </div>
                    </div>
                ))}
                
                {!productType && (
                    <div className="grid grid-cols-1 gap-2 mt-4 max-w-sm">
                        {PRODUCT_TYPES.map(t => (
                            <button
                                key={t.key}
                                onClick={() => selectProductType(t.key)}
                                className="flex flex-col p-4 glass border border-border-subtle hover:border-brand/50 bg-black/20 hover:bg-surface text-left rounded-2xl transition-all group"
                            >
                                <span className="text-white font-bold text-sm group-hover:text-brand transition-colors">{t.label}</span>
                                <span className="text-[10px] text-foreground-muted font-medium mt-0.5">{t.desc}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div ref={bottomRef} className="h-2" />
            </div>

            {/* Input */}
            {productType && !applying && (
                <div className="p-4 border-t border-border/50 bg-black/20">
                    <div className="flex items-center gap-2 bg-surface-hover/50 border border-border-subtle rounded-2xl px-4 py-3 focus-within:border-brand/50 transition-all">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                            placeholder="Diga ao estrategista..."
                            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-neutral-600"
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="p-2 bg-brand hover:bg-brand-hover text-white rounded-xl transition-all disabled:opacity-30"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
