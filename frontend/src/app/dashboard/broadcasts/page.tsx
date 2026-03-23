'use client';

import { useState, useEffect } from 'react';
import { Radio, MessageSquare, Layers, Users, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SendMessagePanel } from '@/components/SendMessagePanel';

export default function BroadcastsPage() {
    const [instances, setInstances] = useState<{ id: string; name: string }[]>([]);
    const [selectedInstance, setSelectedInstance] = useState<string>('');
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Load instances on mount
    useEffect(() => {
        const supabase = createClient();
        const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetch(`${API}/api/instances`, {
                headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
            })
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    const active = (json.data || []).filter((i: any) => i.connectionStatus === 'open');
                    setInstances(active);
                    if (active.length > 0) setSelectedInstance(active[0].name);
                }
            })
            .catch(console.error);
        });
    }, []);

    // Load groups when instance changes
    useEffect(() => {
        if (!selectedInstance) return;
        setLoadingGroups(true);
        setGroups([]);
        const supabase = createClient();
        supabase
            .from('groups')
            .select('id, name, jid')
            .eq('instance_id', instances.find(i => i.name === selectedInstance)?.id || '')
            .then(({ data }) => {
                setGroups((data || []).map((g: any) => ({ id: g.jid, name: g.name })));
                setLoadingGroups(false);
            });
    }, [selectedInstance, instances]);

    return (
        <div className="p-8 pb-32 sm:p-12 w-full max-w-5xl mx-auto animate-in fade-in duration-500 relative">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 relative z-10 glass p-8 rounded-[2rem] border border-border-subtle shadow-sm bg-surface/40">
                <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-[0_0_15px_rgba(230,57,70,0.2)] shrink-0">
                        <Radio className="w-7 h-7 text-brand" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-brand text-white rounded-full shadow-[0_0_10px_rgba(230,57,70,0.3)]">
                                <Zap className="w-3.5 h-3.5" /> Fast Broadcast
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Disparo em Massa</h1>
                        <p className="text-sm font-medium text-foreground-muted mt-2 max-w-lg">Envie mensagens instantâneas para um ou vários grupos de uma vez. Ideal para avisos urgentes e ofertas flash fora do lançamento padrão.</p>
                    </div>
                </div>

                {/* Instance selector inside header for better layout */}
                {instances.length > 0 && (
                    <div className="shrink-0 bg-black/40 p-4 rounded-2xl border border-border-subtle shadow-inner w-full md:w-auto">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Instância Ativa</label>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedInstance}
                                onChange={e => setSelectedInstance(e.target.value)}
                                className="bg-surface/50 border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brand/50 transition-colors shadow-sm"
                            >
                                {instances.map(i => (
                                    <option key={i.id} value={i.name}>{i.name}</option>
                                ))}
                            </select>
                            <div className="flex flex-col items-center justify-center bg-brand/10 border border-brand/20 rounded-xl px-4 py-2 min-w-[80px]">
                                <span className="text-[10px] uppercase font-bold text-brand">Grupos</span>
                                <span className="text-xl font-black text-white leading-none mt-0.5">
                                    {loadingGroups ? '...' : groups.length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Area */}
            <div className="relative z-10">
                {instances.length === 0 ? (
                    <div className="glass p-16 text-center border border-border-subtle rounded-3xl bg-surface/30 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-neutral-800 border border-border flex items-center justify-center mb-6 shadow-inner">
                            <Layers className="w-10 h-10 text-neutral-500" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-white mb-2">Nenhuma Instância Conectada</h3>
                        <p className="text-sm font-medium text-neutral-400 max-w-sm mb-6">Você precisa conectar um aparelho WhatsApp antes de fazer disparos em massa.</p>
                        <button className="px-6 py-3 bg-brand hover:bg-brand-hover text-white text-sm font-extrabold rounded-xl shadow-[0_0_15px_rgba(230,57,70,0.3)] transition-all">
                            Adicionar Conexão
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {loadingGroups ? (
                            <div className="glass flex flex-col items-center justify-center border border-border-subtle rounded-3xl bg-surface/30 shadow-sm min-h-[400px]">
                                <div className="w-12 h-12 border-4 border-neutral-800 border-t-brand rounded-full animate-spin shadow-[0_0_15px_rgba(230,57,70,0.5)] mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted animate-pulse">Sincronizando grupos...</p>
                            </div>
                        ) : (
                            <SendMessagePanel
                                instanceName={selectedInstance}
                                groups={groups}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
