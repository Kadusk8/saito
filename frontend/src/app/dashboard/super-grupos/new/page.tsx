'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    Rocket, ChevronRight, ChevronLeft, Plus, Trash2,
    Calendar, Users, Settings2, Loader2, Check, Search
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const STEPS = ['Dados da Campanha', 'Grupos', 'Confirmar'];

export default function NewCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [instances, setInstances] = useState<any[]>([]);
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');

    // Form data
    const [name, setName] = useState('');
    const [instanceId, setInstanceId] = useState('');
    const [instanceName, setInstanceName] = useState('');
    const [offerDate, setOfferDate] = useState('');
    const [overflowLimit, setOverflowLimit] = useState(250);
    const [selectedGroups, setSelectedGroups] = useState<{ group_jid: string; group_name: string }[]>([]);

    // Auto-create mode (creates groups via Evolution API after campaign is saved)
    const [autoCreate, setAutoCreate] = useState(false);
    const [autoCount, setAutoCount] = useState(3);
    const [autoNamePattern, setAutoNamePattern] = useState('');
    const [autoAdminNumber, setAutoAdminNumber] = useState('');
    const [autoCreating, setAutoCreating] = useState(false);
    const [autoResult, setAutoResult] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('instances').select('id, name, status');
                setInstances(data || []);
            } catch { setInstances([]); }
        })();
    }, []);

    async function loadGroups(iId: string) {
        if (!iId) return;
        setLoadingGroups(true);
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('groups')
                .select('id, name, jid')
                .eq('instance_id', iId);
            setAvailableGroups((data || []).map((g: any) => ({ jid: g.jid, name: g.name || g.jid })));
        } catch { setAvailableGroups([]); }
        finally { setLoadingGroups(false); }
    }

    function selectInstance(id: string, iName: string) {
        setInstanceId(id);
        setInstanceName(iName);
        loadGroups(id);
    }

    function toggleGroup(jid: string, name: string) {
        const exists = selectedGroups.find(g => g.group_jid === jid);
        if (exists) setSelectedGroups(s => s.filter(g => g.group_jid !== jid));
        else setSelectedGroups(s => [...s, { group_jid: jid, group_name: name }]);
    }

    function removeGroup(jid: string) {
        setSelectedGroups(s => s.filter(g => g.group_jid !== jid));
    }

    function moveGroup(fromIdx: number, toIdx: number) {
        const arr = [...selectedGroups];
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        setSelectedGroups(arr);
    }

    async function handleCreate() {
        if (!name || !instanceId || !offerDate) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API}/api/super-grupos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    name,
                    instance_id: instanceId,
                    offer_date: new Date(offerDate).toISOString(),
                    overflow_limit: overflowLimit,
                    groups: autoCreate ? [] : selectedGroups,
                }),
            });
            const data = await res.json();
            if (!data.id) throw new Error('No ID returned');

            if (autoCreate) {
                setAutoCreating(true);
                const acRes = await fetch(`${API}/api/super-grupos/${data.id}/auto-create-groups`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        count: autoCount,
                        name_pattern: autoNamePattern || `${name} {n}`,
                        admin_number: autoAdminNumber || undefined,
                    }),
                });
                const acData = await acRes.json();
                setAutoResult(acData);
                setAutoCreating(false);
            }

            router.push(`/dashboard/super-grupos/${data.id}`);
        } catch (e) {
            alert('Erro ao criar campanha');
        }
        setSaving(false);
    }

    const canNext = [
        name && instanceId && offerDate,
        autoCreate ? autoCount > 0 : selectedGroups.length > 0,
        true,
    ][step];

    const filteredGroups = availableGroups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-3xl mx-auto animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 bg-brand/10 rounded-xl text-brand">
                    <Rocket className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nova Campanha Super Grupos</h1>
                    <p className="text-neutral-400 text-sm">Configure sua estratégia em {STEPS.length} passos</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-10">
                {STEPS.map((label, i) => (
                    <div key={i} className="flex items-center gap-2 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-neutral-800 text-neutral-500'}`}>
                            {i < step ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-green-500' : 'bg-neutral-800'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 0: Setup */}
            {step === 0 && (
                <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-brand" /> Dados da Campanha
                    </h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Nome da Campanha</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Lançamento Curso XYZ"
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Instância WhatsApp</label>
                        <select
                            value={instanceId}
                            onChange={e => {
                                const opt = instances.find((i: any) => i.id === e.target.value);
                                selectInstance(e.target.value, opt?.name || '');
                            }}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                        >
                            <option value="">Selecione uma instância...</option>
                            {instances.map((i: any) => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Data da Oferta</label>
                            <input
                                type="datetime-local"
                                value={offerDate}
                                onChange={e => setOfferDate(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Limite por grupo (vagas)</label>
                            <input
                                type="number"
                                value={overflowLimit}
                                onChange={e => setOverflowLimit(parseInt(e.target.value) || 250)}
                                min={50}
                                max={1012}
                                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Groups */}
            {step === 1 && (
                <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand" /> Grupos da Campanha
                    </h2>

                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAutoCreate(false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${!autoCreate ? 'bg-brand border-brand text-white' : 'border-border text-neutral-400 hover:text-white'}`}
                        >
                            📂 Selecionar existentes
                        </button>
                        <button
                            onClick={() => setAutoCreate(true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${autoCreate ? 'bg-brand border-brand text-white' : 'border-border text-neutral-400 hover:text-white'}`}
                        >
                            🤖 Auto-criar grupos
                        </button>
                    </div>

                    {/* AUTO-CREATE MODE */}
                    {autoCreate && (
                        <div className="space-y-4">
                            <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-neutral-400">
                                🚀 O Saito vai criar os grupos automaticamente no WhatsApp, já salvando na campanha na ordem correta.
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Quantidade de grupos</label>
                                    <input
                                        type="number"
                                        value={autoCount}
                                        onChange={e => setAutoCount(Math.max(1, Math.min(20, +e.target.value)))}
                                        min={1} max={20}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Padrão do nome <span className="text-neutral-600">(use {'{n}'})</span></label>
                                    <input
                                        value={autoNamePattern}
                                        onChange={e => setAutoNamePattern(e.target.value)}
                                        placeholder={`Ex: Lançamento ${name || 'XYZ'} {n}`}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                                    Seu número (para ser adicionado como admin)
                                    <span className="text-neutral-600 ml-1 normal-case">ddd + número sem espaços</span>
                                </label>
                                <input
                                    value={autoAdminNumber}
                                    onChange={e => setAutoAdminNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="5511999999999"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50"
                                />
                            </div>

                            {/* Preview */}
                            {(autoNamePattern || name) && (
                                <div className="bg-background/50 rounded-xl p-3">
                                    <p className="text-xs text-neutral-500 mb-2">Preview dos grupos que serão criados:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from({ length: Math.min(autoCount, 5) }, (_, i) => (
                                            <span key={i} className="text-xs bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                                                {(autoNamePattern || `${name} {n}`).replace('{n}', String(i + 1))}
                                            </span>
                                        ))}
                                        {autoCount > 5 && <span className="text-xs text-neutral-600 px-2 py-1">+{autoCount - 5} mais...</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MANUAL MODE */}
                    {!autoCreate && (
                        <div className="space-y-4">
                            <p className="text-sm text-neutral-500">Selecione grupos já existentes no Saito. O Saito vai transbordar automaticamente para o próximo quando o anterior encher.</p>
                            <div>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                                    <input
                                        value={groupSearch}
                                        onChange={e => setGroupSearch(e.target.value)}
                                        placeholder="Buscar grupo..."
                                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50"
                                    />
                                </div>
                                {loadingGroups ? (
                                    <div className="flex items-center gap-2 text-neutral-500 py-4 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Carregando grupos...</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                        {filteredGroups.map(g => {
                                            const sel = selectedGroups.find(s => s.group_jid === g.jid);
                                            return (
                                                <button
                                                    key={g.jid}
                                                    onClick={() => toggleGroup(g.jid, g.name)}
                                                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${sel ? 'bg-brand border-brand text-white' : 'border-border text-neutral-400 hover:text-white hover:border-neutral-500'}`}
                                                >
                                                    {g.name}
                                                </button>
                                            );
                                        })}
                                        {filteredGroups.length === 0 && instanceId && <p className="text-neutral-600 text-sm">Nenhum grupo encontrado. Tente "Auto-criar grupos".</p>}
                                        {!instanceId && <p className="text-neutral-600 text-sm">Selecione uma instância no passo anterior.</p>}
                                    </div>
                                )}
                            </div>

                            {selectedGroups.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Ordem de Transbordo</p>
                                    <div className="space-y-2">
                                        {selectedGroups.map((g, i) => (
                                            <div key={g.group_jid} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border/50">
                                                <span className="w-6 h-6 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                                <span className="flex-1 text-sm text-white truncate">{g.group_name}</span>
                                                <div className="flex items-center gap-1">
                                                    {i > 0 && <button onClick={() => moveGroup(i, i - 1)} className="p-1 text-neutral-500 hover:text-white">↑</button>}
                                                    {i < selectedGroups.length - 1 && <button onClick={() => moveGroup(i, i + 1)} className="p-1 text-neutral-500 hover:text-white">↓</button>}
                                                    <button onClick={() => removeGroup(g.group_jid)} className="p-1 text-neutral-600 hover:text-red-400 ml-1"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
                <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-400" /> Confirmar e Criar
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-neutral-500">Nome</span>
                            <span className="text-white font-medium">{name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-neutral-500">Instância</span>
                            <span className="text-white font-medium">{instanceName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-neutral-500">Data da Oferta</span>
                            <span className="text-white font-medium">{offerDate ? new Date(offerDate).toLocaleString('pt-BR') : '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-neutral-500">Limite por grupo</span>
                            <span className="text-white font-medium">{overflowLimit} vagas</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-neutral-500">Grupos</span>
                            {autoCreate ? (
                                <span className="text-brand font-medium">🤖 {autoCount}x auto-criados pelo Saito</span>
                            ) : (
                                <span className="text-white font-medium">{selectedGroups.length}x selecionados</span>
                            )}
                        </div>
                    </div>

                    {autoCreate ? (
                        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-neutral-400">
                            🤖 O Saito vai criar <strong className="text-white">{autoCount} grupos</strong> no WhatsApp com o padrão <strong className="text-white">"{autoNamePattern || `${name} {n}`}"</strong> e configurar o transbordo automaticamente. Aguarde alguns segundos enquanto os grupos são criados.
                        </div>
                    ) : (
                        <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-neutral-400">
                            🚀 O Saito vai <strong className="text-white">transbordar automaticamente</strong> para o próximo grupo quando atingir {overflowLimit} membros.
                            Você poderá agendar conteúdo, ativar escassez e analisar leads no painel da campanha.
                        </div>
                    )}

                    {/* Auto-creating indicator */}
                    {autoCreating && (
                        <div className="flex items-center gap-3 text-sm text-brand animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Criando grupos no WhatsApp... isso pode levar alguns segundos.
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/dashboard/super-grupos')}
                    className="flex items-center gap-2 px-5 py-2.5 border border-border text-neutral-400 hover:text-white hover:border-neutral-500 text-sm font-medium rounded-xl transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {step === 0 ? 'Cancelar' : 'Voltar'}
                </button>

                {step < STEPS.length - 1 ? (
                    <button
                        disabled={!canNext}
                        onClick={() => setStep(s => s + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        Próximo <ChevronRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        disabled={saving}
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        {saving ? 'Criando...' : '🚀 Criar Campanha'}
                    </button>
                )}
            </div>
        </div>
    );
}
