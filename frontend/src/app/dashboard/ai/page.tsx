'use client';

import { useState, useEffect } from 'react';
import { Bot, Plus, MessageSquare, History, Calendar, Trash2, Sparkles } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { AgenteChat } from '@/components/AgenteChat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Chat {
    id: string;
    title: string;
    updated_at: string;
}

export default function AgentePage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
    const [isLoadingChats, setIsLoadingChats] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchChats = async () => {
        setIsLoadingChats(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${BACKEND_URL}/api/ai/chats`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setChats(data);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, []);

    const startNewChat = () => {
        setSelectedChatId(undefined);
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Sidebar Histórico */}
            <div className="w-80 flex flex-col gap-4 glass bg-surface/30 border border-border-subtle rounded-3xl p-5 overflow-hidden shadow-sm relative z-10 shrink-0 hidden lg:flex">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-[0_0_10px_rgba(230,57,70,0.1)]">
                            <History className="w-4 h-4 text-brand" />
                        </div>
                        <span className="text-sm font-extrabold text-white tracking-tight">Histórico</span>
                    </div>
                    <button
                        onClick={startNewChat}
                        className="p-2 text-neutral-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all group border border-transparent hover:border-brand/20 shadow-inner"
                        title="Nova Conversa"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 my-scroll-area">
                    {isLoadingChats ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                            <Bot className="w-8 h-8 text-brand animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand">Carregando...</span>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-center py-12 px-4 border border-dashed border-border-subtle rounded-2xl bg-black/20 m-1">
                            <Sparkles className="w-6 h-6 text-neutral-600 mx-auto mb-3" />
                            <p className="text-xs text-neutral-500 font-medium leading-relaxed">Nenhuma conversa encontrada.<br/>Comece uma nova agora!</p>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChatId(chat.id)}
                                className={`w-full flex flex-col items-start p-3.5 rounded-2xl text-left transition-all border ${selectedChatId === chat.id
                                        ? 'bg-brand/10 border-brand/30 shadow-[0_0_15px_rgba(230,57,70,0.1)] ring-1 ring-brand/20'
                                        : 'bg-black/20 border-border-subtle hover:bg-surface hover:border-border'
                                    } group relative overflow-hidden`}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${selectedChatId === chat.id ? 'text-brand drop-shadow-[0_0_5px_rgba(230,57,70,0.5)]' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                                    <div className="min-w-0 flex-1">
                                        <span className={`text-sm font-extrabold truncate block ${selectedChatId === chat.id ? 'text-white' : 'text-neutral-300 group-hover:text-white transition-colors'}`}>
                                            {chat.title || 'Conversa sem título'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-neutral-500 mt-1 uppercase">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(chat.updated_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>
                                {selectedChatId === chat.id && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-md bg-brand shadow-[0_0_10px_rgba(230,57,70,0.5)]" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm relative z-10 w-full min-w-0">
                {/* Header Chat */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border/50 bg-black/20 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/30 shadow-[0_0_15px_rgba(230,57,70,0.2)]">
                            <Bot className="w-6 h-6 text-brand drop-shadow-[0_0_5px_rgba(230,57,70,0.5)]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-black text-white tracking-tight leading-none">Agente Saito</h1>
                                <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded uppercase font-black tracking-widest shadow-[0_0_10px_rgba(230,57,70,0.4)]">LLM</span>
                            </div>
                            <p className="text-xs font-medium text-foreground-muted tracking-wide">Inteligência Artificial Direcionada para Lançamentos</p>
                        </div>
                    </div>
                    {/* Mobile new chat button */}
                    <button
                        onClick={startNewChat}
                        className="lg:hidden flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand text-sm font-extrabold rounded-xl border border-brand/30 transition-all shadow-inner"
                    >
                        <Plus className="w-4 h-4" /> Nova Conversa
                    </button>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <AgenteChat
                        initialChatId={selectedChatId}
                        onChatCreated={(id) => {
                            if (id) {
                                setSelectedChatId(id);
                                fetchChats();
                            } else {
                                startNewChat();
                            }
                        }}
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    );
}
