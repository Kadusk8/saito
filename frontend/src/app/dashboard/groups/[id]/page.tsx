'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ShieldAlert,
    Bot,
    Link as LinkIcon,
    Image as ImageIcon,
    MessageCircleOff,
    Users,
    Loader2,
    CheckCircle2,
    Mic,
    Sticker,
    Video,
} from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { AddParticipantsPanel } from '@/components/AddParticipantsPanel';

import { use } from 'react';

type Tab = 'rules' | 'engagement' | 'participants';

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createClient();
    const unwrappedParams = use(params);
    const groupId = unwrappedParams.id;

    const [tab, setTab] = useState<Tab>('rules');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    const [groupName, setGroupName] = useState('');
    const [groupJid, setGroupJid] = useState('');
    const [instanceName, setInstanceName] = useState('');

    const [rules, setRules] = useState({
        moderationEnabled: false,
        blockLinks: false,
        blockImage: false,
        blockAudio: false,
        blockVideo: false,
        blockSticker: false,
        floodControl: false,
        aiBlacklist: false,
        enforceTopic: false,
        panfleteiroAlert: false,
    });

    const [blacklistText, setBlacklistText] = useState("");
    const [topicText, setTopicText] = useState("");

    useEffect(() => {
        async function fetchRules() {
            const { data, error } = await supabase
                .from('groups')
                .select('rules, blacklist, jid, name, instance_id, instances(name)')
                .eq('id', groupId)
                .single();

            if (data) {
                if (data.rules) setRules({ ...rules, ...data.rules });
                if (data.blacklist) setBlacklistText(data.blacklist.join(', '));
                if (data.jid) setGroupJid(data.jid);
                if (data.name) setGroupName(data.name);
                if (data.rules?.topic) setTopicText(data.rules.topic);
                const inst = data.instances as any;
                if (inst?.name) setInstanceName(inst.name);
            }
            setIsLoading(false);
        }
        fetchRules();
    }, [supabase, groupId]);

    useEffect(() => {
        if (tab === 'engagement') fetchMembers();
    }, [tab]);

    async function fetchMembers() {
        setLoadingMembers(true);
        try {
            const { data } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', groupId)
                .order('message_count', { ascending: false });
            
            if (data) setMembers(data);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoadingMembers(false);
        }
    }

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const blacklistArray = blacklistText.split(',').map(s => s.trim()).filter(Boolean);

            const res = await fetch(`${API}/api/groups/${groupId}/rules`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    rules: { ...rules, topic: topicText },
                    blacklist: blacklistArray,
                }),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Falha ao salvar');
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            console.error('Failed to save rules:', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleRule = (key: keyof typeof rules) => {
        setRules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-5xl mx-auto space-y-8">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 glass p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm bg-surface/40">
                <div className="flex items-center gap-5">
                    <Link href="/dashboard/groups" className="p-2 bg-surface hover:bg-surface-hover border border-border-subtle hover:border-brand/50 rounded-xl text-neutral-400 hover:text-white transition-all shadow-sm group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                            {groupName || 'Configurações'}
                        </h1>
                        <p className="text-foreground-muted font-medium">Controle de Moderação e Inteligência do Grupo</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-3 mb-8 flex-wrap relative z-10">
                <button
                    onClick={() => setTab('rules')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${tab === 'rules' ? 'bg-brand/10 border-brand/30 text-brand shadow-[0_0_15px_rgba(230,57,70,0.1)]' : 'bg-surface/50 border-border-subtle text-foreground-muted hover:border-white/20 hover:text-white'}`}
                >
                    <ShieldAlert className="w-4 h-4" /> Regras de Moderação
                </button>
                <button
                    onClick={() => setTab('engagement')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${tab === 'engagement' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-surface/50 border-border-subtle text-foreground-muted hover:border-white/20 hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Engajamento & Ranking
                </button>
                <button
                    onClick={() => setTab('participants')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${tab === 'participants' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-surface/50 border-border-subtle text-foreground-muted hover:border-white/20 hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Participantes
                </button>
            </div>

            {/* Moderation Card */}
            {tab === 'rules' && (
                <div className="bg-surface border border-border rounded-2xl p-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between pb-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-brand" />
                            Status do Escudo (Moderação Ativa)
                        </h2>
                        <p className="text-neutral-400 text-sm mt-1">Mestre de regras. Desative para pausar toda a fiscalização neste grupo.</p>
                    </div>
                    <Switch checked={rules.moderationEnabled} onCheckedChange={() => toggleRule('moderationEnabled')} />
                </div>

                <div className="py-6 space-y-6">
                    <h3 className="text-sm font-medium text-brand tracking-wider uppercase">Filtros de Mídia e Links</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'blockLinks', icon: LinkIcon, label: 'Bloquear Links URL', desc: 'Impede qualquer membro de enviar http://' },
                            { key: 'blockImage', icon: ImageIcon, label: 'Bloquear Imagens', desc: 'Remove imagens enviadas por membros.' },
                            { key: 'blockVideo', icon: Video, label: 'Bloquear Vídeos', desc: 'Remove vídeos enviados por membros.' },
                            { key: 'blockAudio', icon: Mic, label: 'Bloquear Áudios', desc: 'Remove mensagens de voz enviadas.' },
                            { key: 'blockSticker', icon: Sticker, label: 'Bloquear Figurinhas', desc: 'Remove stickers enviados por membros.' },
                            { key: 'floodControl', icon: MessageCircleOff, label: 'Anti-Flood', desc: 'Strike em quem envia +5 msgs em 10 segundos.' },
                            { key: 'panfleteiroAlert', icon: ShieldAlert, label: 'Alerta de Panfleteiro', desc: 'Notifica admins sobre envio massivo de links.' },
                        ].map(({ key, icon: Icon, label, desc }) => (
                            <div key={key} className="flex items-start justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-surface-hover transition-colors">
                                <div className="flex gap-3">
                                    <Icon className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="text-white font-medium text-sm">{label}</h4>
                                        <p className="text-neutral-500 text-xs mt-1">{desc}</p>
                                    </div>
                                </div>
                                <Switch checked={rules[key as keyof typeof rules] as boolean} onCheckedChange={() => toggleRule(key as keyof typeof rules)} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="py-6 border-t border-border space-y-4">
                    <h3 className="text-sm font-medium text-brand tracking-wider uppercase flex items-center gap-2">
                        <Bot className="w-4 h-4" /> Inteligência Artificial
                    </h3>

                    {/* Enforce Topic */}
                    <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                        <div className="flex items-start justify-between p-4 hover:bg-surface-hover transition-colors">
                            <div className="flex gap-3">
                                <Bot className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-white font-medium text-sm">Controle de Assunto (IA)</h4>
                                    <p className="text-neutral-500 text-xs mt-1">Deleta mensagens fora do tópico definido abaixo.</p>
                                </div>
                            </div>
                            <Switch checked={rules.enforceTopic} onCheckedChange={() => toggleRule('enforceTopic')} />
                        </div>
                        {rules.enforceTopic && (
                            <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-4">
                                <label className="text-xs text-neutral-400 font-medium">Tópico Oficial do Grupo:</label>
                                <textarea
                                    value={topicText}
                                    onChange={(e) => setTopicText(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                                    rows={2}
                                    placeholder="ex: Dúvidas sobre o Curso de Culinária do Chef Silas"
                                />
                                <p className="text-[11px] text-neutral-500">A IA usará este texto para determinar o que é off-topic.</p>
                            </div>
                        )}
                    </div>

                    {/* AI Blacklist */}
                    <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                        <div className="flex items-start justify-between p-4 hover:bg-surface-hover transition-colors">
                            <div className="flex gap-3">
                                <Bot className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-white font-medium text-sm">Blacklist Dinâmica (IA)</h4>
                                    <p className="text-neutral-500 text-xs mt-1">Barra termos maliciosos mesmo quando disfarçados.</p>
                                </div>
                            </div>
                            <Switch checked={rules.aiBlacklist} onCheckedChange={() => toggleRule('aiBlacklist')} />
                        </div>
                        {rules.aiBlacklist && (
                            <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-4">
                                <label className="text-xs text-neutral-400 font-medium">Termos Proibidos:</label>
                                <textarea
                                    value={blacklistText}
                                    onChange={(e) => setBlacklistText(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                                    rows={2}
                                    placeholder="ex: vendas, golpe, afiliados, pirâmide"
                                />
                                <p className="text-[11px] text-neutral-500">Separe os termos por vírgula. A IA fará a análise semântica.</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}

            {/* Engagement Tab */}
            {tab === 'engagement' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="glass bg-surface/30 border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-border-subtle bg-black/20 flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-400" /> Membros Mais Ativos
                            </h3>
                            <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-border-subtle">
                                {members.length} Participantes
                            </span>
                        </div>

                        {loadingMembers ? (
                            <div className="p-20 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Cruzando dados de atividade...</p>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="p-16 text-center text-foreground-muted font-medium">Nenhum histórico de mensagens detectado ainda.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border-subtle bg-black/10">
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">Membro</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground-muted text-center">Posts</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground-muted text-center">Strikes</th>
                                            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground-muted text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-subtle/30">
                                        {members.map((member) => (
                                            <tr key={member.id} className="hover:bg-brand/5 transition-colors">
                                                <td className="px-8 py-4">
                                                    <p className="text-sm font-bold text-white">{member.push_name || 'Desconhecido'}</p>
                                                    <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{member.jid.split('@')[0]}</p>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className="bg-black/30 border border-border-subtle px-2 py-1 rounded text-xs font-bold text-white">
                                                        {member.message_count}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${member.strikes > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-neutral-600'}`}>
                                                        {member.strikes || 0}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <span className="text-sm font-black text-brand">{member.lead_score || 0}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Participants Tab */}
            {tab === 'participants' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    {instanceName && groupJid ? (
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <AddParticipantsPanel instanceName={instanceName} groupJid={groupJid} />
                        </div>
                    ) : (
                        <div className="bg-surface border border-border rounded-2xl p-16 text-center text-neutral-500 text-sm">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-white text-lg">Nenhuma instância vinculada</p>
                            <p className="mt-1">Para adicionar participantes, sincronize os grupos primeiro na tela de instâncias.</p>
                        </div>
                    )}
                </div>
            )}
            {/* Save Button Floating or at Bottom */}
            <div className="sticky bottom-8 flex justify-end relative z-20">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-3 px-10 py-4 bg-brand hover:bg-brand/90 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(230,57,70,0.4)] hover:shadow-[0_15px_40px_rgba(230,57,70,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50 active:scale-95 group"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : saveStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <ShieldAlert className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    )}
                    {isSaving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
}
