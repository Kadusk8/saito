'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ShieldAlert, Bot, Settings2 } from 'lucide-react';
import { SyncGroupsButton } from '@/components/SyncGroupsButton';
import { DeleteGroupButton } from '@/components/DeleteGroupButton';
import { CreateGroupButton } from '@/components/CreateGroupButton';
import { api } from '@/lib/api-client';

export default function InstanceGroupsPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = use(params);

    const [isConnected, setIsConnected] = useState(false);
    const [instanceDbId, setInstanceDbId] = useState<string | null>(null);
    const [monitoredGroups, setMonitoredGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, [name]);

    async function load() {
        setLoading(true);
        try {
            const data = await api.get(`/api/instances/${name}/detail`);
            setInstanceDbId(data.id);
            setIsConnected(data.connectionStatus === 'open');
            setMonitoredGroups(data.groups || []);
        } catch (e) {
            console.error('Failed to load instance data', e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 pb-20 sm:p-12 w-full max-w-7xl mx-auto flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3 text-foreground-muted">
                    <MessageSquare className="w-10 h-10 animate-pulse text-brand" />
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-7xl mx-auto space-y-10 relative">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-50 glass p-8 rounded-3xl border border-border-subtle shadow-premium bg-surface/40">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard/groups" className="p-2.5 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-brand/50 rounded-xl text-neutral-400 hover:text-white transition-all shadow-sm group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Grupos da Instância</h1>
                            <span className="text-xs font-bold text-brand bg-brand-light px-3 py-1 rounded-full border border-brand/20">
                                {monitoredGroups.length} Grupos
                            </span>
                        </div>
                        <p className="text-foreground-muted font-medium">
                            Instância: <span className="text-brand/90 font-bold">{name}</span>
                            <span className={`ml-3 text-xs font-bold px-2 py-0.5 rounded-md border ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {isConnected ? 'Conectada' : 'Desconectada'}
                            </span>
                        </p>
                    </div>
                </div>
                {instanceDbId && (
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <CreateGroupButton instanceName={name} />
                        <SyncGroupsButton instanceName={name} isConnected={isConnected} onSynced={load} />
                    </div>
                )}
            </div>

            {/* Content */}
            {!isConnected ? (
                <div className="glass border border-dashed border-rose-500/30 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 bg-rose-500/5 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-surface border border-rose-500/20 flex items-center justify-center text-rose-500 mb-2 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        <ShieldAlert className="w-8 h-8 opacity-80" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg">Instância Desconectada</p>
                        <p className="text-foreground-muted text-sm mt-1 max-w-md mx-auto">Conecte seu WhatsApp lendo o QR Code no painel de instâncias para visualizar e gerenciar os grupos.</p>
                        <Link href="/dashboard/groups" className="inline-block mt-6 px-6 py-2.5 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 rounded-xl font-bold transition-all shadow-sm">
                            Ir para Conexões
                        </Link>
                    </div>
                </div>
            ) : monitoredGroups.length === 0 ? (
                <div className="glass border border-dashed border-border-subtle rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 bg-surface/30 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-neutral-600 mb-2">
                        <MessageSquare className="w-8 h-8 opacity-50" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg">Nenhum grupo encontrado</p>
                        <p className="text-foreground-muted text-sm mt-1 max-w-md mx-auto">Esta instância não possui grupos monitorados. Clique em "Sincronizar" para buscar do WhatsApp ou "Criar Novo" para gerar.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                    {monitoredGroups.map(group => (
                        <div key={group.id} className="relative group flex flex-col justify-between glass border border-border-subtle rounded-2xl p-6 hover:border-brand/40 hover:bg-surface/60 transition-all shadow-sm overflow-hidden">
                            {/* Card Hover Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[40px] rounded-full group-hover:bg-brand/10 transition-colors pointer-events-none" />

                            <div className="relative z-10 flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4 pr-8">
                                    <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl text-brand shadow-shadow-glow shrink-0">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-white font-bold text-lg leading-tight truncate" title={group.name}>{group.name}</h4>
                                        <span className="text-xs font-medium text-foreground-muted truncate block max-w-[180px] mt-1">{group.jid?.split('@')[0]}</span>
                                    </div>
                                </div>

                                {/* Moderation Toggle Indicator */}
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Moderação</span>
                                    <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors border shadow-inner ${group.rules?.moderationEnabled ? 'bg-brand border-brand/50' : 'bg-surface border-border-subtle'}`}>
                                        <div className={`w-4 h-4 rounded-full transition-transform shadow-sm ${group.rules?.moderationEnabled ? 'bg-white translate-x-4' : 'bg-neutral-500 translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-surface/50 rounded-xl p-3 border border-border-subtle/50">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                                        <Bot className="w-3.5 h-3.5" /> IA Anti-Spam
                                    </div>
                                    <div className={`text-sm font-bold flex items-center gap-1.5 ${group.rules?.aiBlacklist ? 'text-amber-400' : 'text-neutral-500'}`}>
                                        {group.rules?.aiBlacklist ? (
                                            <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Ativa</>
                                        ) : 'Desativada'}
                                    </div>
                                </div>
                                <div className="bg-surface/50 rounded-xl p-3 border border-border-subtle/50">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                                        <Settings2 className="w-3.5 h-3.5" /> Funil Automático
                                    </div>
                                    <div className="text-sm font-bold text-neutral-500 flex items-center gap-1.5">
                                        Inativo
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="relative z-10 flex items-center justify-between pt-5 border-t border-border-subtle/50">
                                <Link href={`/dashboard/groups/${group.id}`} className="flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-hover transition-colors py-2 px-3 hover:bg-brand-light rounded-lg -ml-3">
                                    <ShieldAlert className="w-4 h-4" />
                                    Painel de Regras
                                </Link>
                                <div className="flex items-center gap-3">
                                    <DeleteGroupButton groupId={group.id} groupName={group.name} onDeleted={load} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
