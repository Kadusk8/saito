'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Eraser, MessageSquare, ArrowUp } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface AgenteChatProps {
    initialChatId?: string;
    onChatCreated?: (chatId: string) => void;
    className?: string;
}

export function AgenteChat({ initialChatId, onChatCreated, className }: AgenteChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState<string | undefined>(initialChatId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load messages if chatId changes
    useEffect(() => {
        if (initialChatId) {
            setChatId(initialChatId);
            loadMessages(initialChatId);
        } else {
            setMessages([]);
            setChatId(undefined);
        }
    }, [initialChatId]);

    const loadMessages = async (id: string) => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${BACKEND_URL}/api/ai/chats/${id}/messages`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const newMsg: Message = { role: 'user', parts: [{ text }] };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                    chatId: chatId
                }),
            });

            const data = await response.json();
            if (data.text) {
                setMessages([...updatedMessages, { role: 'model', parts: [{ text: data.text }] }]);
                if (data.chatId && data.chatId !== chatId) {
                    setChatId(data.chatId);
                    onChatCreated?.(data.chatId);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setChatId(undefined);
        onChatCreated?.('');
    };

    return (
        <div className={`flex flex-col h-full bg-black/10 ${className}`}>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8 my-scroll-area">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
                        <div className="w-24 h-24 rounded-[2rem] bg-brand/10 border border-brand/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(230,57,70,0.15)] relative">
                            <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full" />
                            <Sparkles className="w-10 h-10 text-brand relative z-10" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Agente Saito</h2>
                        <p className="text-base text-neutral-400 font-medium leading-relaxed mb-8">
                            Sou sua inteligência artificial focada em lançamentos no WhatsApp. Como posso escalar seus resultados hoje?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {[
                                "Como criar uma cópia de escassez?",
                                "Melhores horários de disparo",
                                "Funil para leads frios",
                                "Estratégia de transbordo",
                            ].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setInput(s)}
                                    className="p-4 rounded-2xl bg-surface/50 border border-border-subtle hover:border-brand/40 text-sm font-semibold text-neutral-300 hover:text-white transition-all text-left shadow-sm group"
                                >
                                    {s}
                                    <ArrowUp className="w-4 h-4 float-right opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 max-w-4xl mx-auto w-full pb-10">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${m.role === 'user'
                                    ? 'bg-brand/20 border-brand/30 shadow-[0_0_10px_rgba(230,57,70,0.1)]'
                                    : 'bg-black/40 border-border-subtle'
                                    }`}>
                                    {m.role === 'user' ? <User className="w-5 h-5 text-brand" /> : <Bot className="w-5 h-5 text-brand drop-shadow-md" />}
                                </div>
                                <div className={`max-w-[85%] sm:max-w-[75%] p-5 rounded-3xl text-[15px] shadow-sm leading-relaxed relative ${m.role === 'user'
                                    ? 'bg-brand/10 border border-brand/20 text-white rounded-tr-sm'
                                    : 'glass bg-surface/50 text-neutral-200 border border-border-subtle rounded-tl-sm'
                                    }`}>
                                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-border-subtle prose-pre:rounded-xl prose-pre:shadow-inner prose-headings:font-extrabold prose-a:text-brand hover:prose-a:text-brand-hover">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.parts[0].text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-4 animate-in fade-in duration-300">
                                <div className="w-10 h-10 rounded-2xl bg-black/40 border border-border-subtle flex items-center justify-center shadow-sm">
                                    <Bot className="w-5 h-5 text-brand animate-pulse" />
                                </div>
                                <div className="glass bg-surface/50 p-5 rounded-3xl rounded-tl-sm border border-border-subtle min-w-[100px] flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-black/20 border-t border-border/50 relative z-10">
                <div className="max-w-4xl mx-auto relative">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(input);
                        }}
                        className="relative flex items-end gap-2 bg-black/60 border border-border-subtle focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10 rounded-[2rem] p-2 pr-2.5 transition-all shadow-inner"
                    >
                        <textarea
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(input);
                                }
                            }}
                            placeholder="Mensagem para o Agente Saito..."
                            disabled={isLoading}
                            className="w-full bg-transparent min-h-[44px] max-h-[200px] py-3 pl-5 text-[15px] font-medium text-white placeholder-neutral-500 outline-none resize-none my-scroll-area leading-relaxed"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-12 h-12 shrink-0 bg-brand hover:bg-brand-hover text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-surface disabled:text-neutral-500 shadow-[0_0_15px_rgba(230,57,70,0.3)] disabled:shadow-none active:scale-95 mb-0.5"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-6 h-6 stroke-[3]" />}
                        </button>
                    </form>
                    <p className="text-center text-[10px] font-medium text-neutral-600 tracking-wide mt-3 uppercase">
                        A IA pode cometer erros. Verifique informações importantes.
                    </p>
                </div>
            </div>
        </div>
    );
}
