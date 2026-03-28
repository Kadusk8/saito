'use client';

import { useState, useEffect } from 'react';
import {
    Settings,
    User,
    Building2,
    Key,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Users as UsersIcon,
    Terminal,
    CreditCard,
    Globe,
    Clock,
    Phone,
    ExternalLink,
    Crown,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NICHES = [
    { value: '', label: 'Selecione seu nicho...' },
    { value: 'infoproduto', label: 'Infoproduto / Curso Online' },
    { value: 'produto_fisico', label: 'Produto Físico / E-commerce' },
    { value: 'servico', label: 'Serviço / Consultoria' },
    { value: 'saas', label: 'SaaS / Software' },
    { value: 'agencia', label: 'Agência de Marketing' },
    { value: 'outro', label: 'Outro' },
];

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
    { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
    { value: 'America/Belem', label: 'Belém (UTC-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (UTC-3)' },
    { value: 'America/Recife', label: 'Recife (UTC-3)' },
    { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
    { value: 'America/Porto_Velho', label: 'Porto Velho (UTC-4)' },
    { value: 'America/Boa_Vista', label: 'Boa Vista (UTC-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
    { value: 'America/New_York', label: 'Nova York (UTC-5/-4)' },
    { value: 'Europe/Lisbon', label: 'Lisboa (UTC+0/+1)' },
];

type Tab = 'geral' | 'equipe' | 'assinatura';

export default function SettingsPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('geral');

    // User
    const [user, setUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');

    // Organization
    const [organization, setOrganization] = useState<any>(null);
    const [orgName, setOrgName] = useState('');
    const [orgNiche, setOrgNiche] = useState('');
    const [orgWebsite, setOrgWebsite] = useState('');
    const [orgWhatsapp, setOrgWhatsapp] = useState('');
    const [orgTimezone, setOrgTimezone] = useState('America/Sao_Paulo');

    // Team
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamCount, setTeamCount] = useState(1);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    // Integrations
    const [evolutionOnline, setEvolutionOnline] = useState(false);

    // Subscription
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (!user) return;

            setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');

            const { data: { session } } = await supabase.auth.getSession();
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const headers = { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };

            // Org via user_roles
            const { data: orgMap } = await supabase
                .from('user_roles')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            const orgId = orgMap?.organization_id;
            if (orgId) {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', orgId)
                    .single();

                if (orgData) {
                    setOrganization(orgData);
                    setOrgName(orgData.name || '');
                    setOrgNiche(orgData.niche || '');
                    setOrgWebsite(orgData.website || '');
                    setOrgWhatsapp(orgData.whatsapp_owner || '');
                    setOrgTimezone(orgData.timezone || 'America/Sao_Paulo');
                }

                // Team members
                try {
                    const res = await fetch(`${API}/api/team/members`, { headers });
                    if (res.ok) {
                        const members = await res.json();
                        setTeamMembers(members);
                        setTeamCount(members.length || 1);
                    }
                } catch { /* silent */ }

                // Evolution status
                try {
                    const res = await fetch(`${API}/api/instances`, { headers });
                    const json = await res.json();
                    if (json.success && json.data) {
                        setEvolutionOnline(json.data.some((i: any) => i.connectionStatus === 'open'));
                    }
                } catch { /* silent */ }

                // Subscription
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('organization_id', orgId)
                    .maybeSingle();
                setSubscription(subData);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);
        try {
            const { error: userError } = await supabase.auth.updateUser({
                data: { full_name: displayName }
            });
            if (userError) throw userError;

            if (organization?.id) {
                const { error: orgError } = await supabase
                    .from('organizations')
                    .update({
                        name: orgName,
                        niche: orgNiche || null,
                        website: orgWebsite || null,
                        whatsapp_owner: orgWhatsapp || null,
                        timezone: orgTimezone,
                    })
                    .eq('id', organization.id);
                if (orgError) throw orgError;
            }

            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            setTimeout(() => setMessage(null), 5000);
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro: ${error.message || 'Falha ao salvar.'}` });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setSaving(false);
        }
    }

    async function handleInvite() {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                body: JSON.stringify({ email: inviteEmail })
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: json.error || 'Falha ao enviar convite' });
            } else {
                setMessage({ type: 'success', text: `Convite enviado para ${inviteEmail}` });
                setInviteEmail('');
                setTeamCount(c => c + 1);
            }
        } catch {
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
        } finally {
            setInviting(false);
            setTimeout(() => setMessage(null), 4000);
        }
    }

    async function handleBillingPortal() {
        setLoadingPortal(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/portal`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const json = await res.json();
            if (json.url) window.location.href = json.url;
            else setMessage({ type: 'error', text: json.error || 'Falha ao abrir portal' });
        } catch {
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
        } finally {
            setLoadingPortal(false);
        }
    }

    function getPlanName(priceId: string) {
        if (!priceId) return 'Desconhecido';
        const starter = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID;
        const pro = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
        const master = process.env.NEXT_PUBLIC_STRIPE_MASTER_PRICE_ID;
        if (priceId === master) return 'Master';
        if (priceId === pro) return 'Pro';
        if (priceId === starter) return 'Starter';
        return 'Pro';
    }

    const inputClass = "w-full px-5 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:border-white/10";
    const labelClass = "text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1 group-focus-within:text-brand transition-colors";
    const selectClass = `${inputClass} appearance-none cursor-pointer`;

    const TABS: { id: Tab; label: string; icon: any }[] = [
        { id: 'geral', label: 'Geral', icon: Settings },
        { id: 'equipe', label: 'Equipe', icon: UsersIcon },
        { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
                <Loader2 className="w-10 h-10 animate-spin text-brand drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                <p className="text-foreground-muted mt-4 font-medium animate-pulse">Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="glass p-8 rounded-3xl border border-border-subtle shadow-premium bg-surface/40 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Configurações</h1>
                    <p className="text-foreground-muted font-medium text-lg">Gerencie seu perfil, organização e assinatura.</p>
                </div>
                {message && (
                    <div className={cn(
                        "px-5 py-3 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 shadow-lg",
                        message.type === 'success'
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                {/* Sidebar */}
                <div className="md:col-span-4 lg:col-span-3 space-y-2">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <motion.button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all border",
                                activeTab === id
                                    ? "bg-brand border-brand/50 text-white shadow-shadow-glow"
                                    : "text-neutral-400 hover:text-white hover:bg-surface-hover border-transparent hover:border-white/5"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                {label}
                            </div>
                            {activeTab === id && <ChevronRight className="w-4 h-4" />}
                        </motion.button>
                    ))}
                </div>

                {/* Content */}
                <div className="md:col-span-8 lg:col-span-9 space-y-8">

                    {/* ── GERAL ── */}
                    {activeTab === 'geral' && (
                        <>
                            {/* Perfil */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <User className="w-5 h-5 text-brand" /> Seu Perfil
                                    </h2>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2 group">
                                        <label className={labelClass}>E-mail</label>
                                        <input type="text" value={user?.email || ''} disabled
                                            className="w-full px-5 py-3.5 bg-black/40 border border-border-subtle rounded-xl text-neutral-500 cursor-not-allowed text-sm font-medium" />
                                        <p className="text-[11px] text-neutral-600 font-medium pl-1">O e-mail não pode ser alterado diretamente.</p>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className={labelClass}>Nome do Operador</label>
                                        <input type="text" placeholder="Ex: João Silva" value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            {/* Organização */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-indigo-400" /> Organização / Empresa
                                    </h2>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 group">
                                            <label className={labelClass}>Nome da Organização</label>
                                            <input type="text" placeholder="Ex: Minha Agência" value={orgName}
                                                onChange={(e) => setOrgName(e.target.value)} className={inputClass} />
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className={labelClass}>Nicho / Segmento</label>
                                            <select value={orgNiche} onChange={(e) => setOrgNiche(e.target.value)} className={selectClass}>
                                                {NICHES.map(n => (
                                                    <option key={n.value} value={n.value} className="bg-neutral-900">{n.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 group">
                                            <label className={labelClass}>
                                                <Globe className="w-3 h-3 inline mr-1" />
                                                Site / Link de Checkout Padrão
                                            </label>
                                            <input type="url" placeholder="https://..." value={orgWebsite}
                                                onChange={(e) => setOrgWebsite(e.target.value)} className={inputClass} />
                                            <p className="text-[11px] text-neutral-600 pl-1">Preenchido automaticamente como <code className="text-neutral-500">{'{{'}</code><code className="text-brand">link_checkout</code><code className="text-neutral-500">{'}}'}</code> no Planner.</p>
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className={labelClass}>
                                                <Phone className="w-3 h-3 inline mr-1" />
                                                WhatsApp do Responsável
                                            </label>
                                            <input type="text" placeholder="5511999999999" value={orgWhatsapp}
                                                onChange={(e) => setOrgWhatsapp(e.target.value)} className={inputClass} />
                                            <p className="text-[11px] text-neutral-600 pl-1">Recebe alertas de segurança e notificações importantes.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className={labelClass}>
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            Fuso Horário
                                        </label>
                                        <select value={orgTimezone} onChange={(e) => setOrgTimezone(e.target.value)} className={selectClass}>
                                            {TIMEZONES.map(tz => (
                                                <option key={tz.value} value={tz.value} className="bg-neutral-900">{tz.label}</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-neutral-600 pl-1">Usado para agendamentos de mensagens no Planner.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Integrações */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <Key className="w-5 h-5 text-orange-400" /> Status de Integrações
                                    </h2>
                                </div>
                                <div className="p-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-border-subtle/50 hover:border-emerald-500/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                                <Terminal className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-white leading-tight">OpenAI</p>
                                                <p className="text-xs font-medium text-foreground-muted mt-0.5">Planner & Moderação IA</p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase tracking-widest">
                                            Online
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-border-subtle/50 hover:border-brand/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-white leading-tight">Evolution API</p>
                                                <p className="text-xs font-medium text-foreground-muted mt-0.5">Integração WhatsApp</p>
                                            </div>
                                        </div>
                                        <span className={cn("flex items-center gap-1.5 px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest",
                                            evolutionOnline
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                                        )}>
                                            {evolutionOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center justify-end gap-4 pt-2">
                                <button onClick={loadData} className="px-6 py-3 text-sm font-bold text-foreground-muted hover:text-white transition-colors">
                                    Cancelar
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleSave} disabled={saving}
                                    className="px-8 py-3.5 bg-brand text-white text-sm font-extrabold rounded-2xl hover:bg-brand-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center gap-2.5 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Salvar Alterações
                                </motion.button>
                            </div>
                        </>
                    )}

                    {/* ── EQUIPE ── */}
                    {activeTab === 'equipe' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Invite */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <UsersIcon className="w-5 h-5 text-brand" /> Convidar Membro
                                    </h2>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 space-y-2 group">
                                            <label className={labelClass}>E-mail do novo membro</label>
                                            <input
                                                type="email"
                                                placeholder="exemplo@email.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                                                onClick={handleInvite}
                                                disabled={!inviteEmail || inviting}
                                                className="px-8 py-3.5 h-[50px] bg-brand text-white text-sm font-extrabold rounded-2xl hover:bg-brand-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                Enviar Convite
                                            </motion.button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground-muted">
                                        O membro receberá um e-mail para criar a conta e acessar a organização <strong className="text-white">{orgName || 'atual'}</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Members list */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20 flex justify-between items-center">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <User className="w-5 h-5 text-indigo-400" /> Membros da Equipe
                                    </h2>
                                    <span className="bg-white/5 text-neutral-300 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                        {teamCount} {teamCount === 1 ? 'membro' : 'membros'}
                                    </span>
                                </div>
                                <div className="divide-y divide-border/30">
                                    {teamMembers.length > 0 ? teamMembers.map((member: any) => {
                                        const isMe = member.email === user?.email;
                                        const initial = (member.email || '?').charAt(0).toUpperCase();
                                        return (
                                            <div key={member.user_id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-base border border-brand/30">
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{member.email}</p>
                                                        <p className="text-xs text-neutral-500">
                                                            Desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isMe && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 rounded-md">você</span>
                                                    )}
                                                    <span className={cn("px-3 py-1 text-xs font-bold rounded-lg border",
                                                        member.role === 'owner'
                                                            ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                                                            : "text-indigo-400 bg-indigo-400/10 border-indigo-400/20"
                                                    )}>
                                                        {member.role === 'owner' ? 'Owner' : 'Membro'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-base border border-brand/30">
                                                    {(displayName || user?.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{displayName || user?.email}</p>
                                                    <p className="text-xs text-neutral-500">{user?.email}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">Owner</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ASSINATURA ── */}
                    {activeTab === 'assinatura' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Plan card */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <Crown className="w-5 h-5 text-yellow-400" /> Plano Atual
                                    </h2>
                                </div>
                                <div className="p-8">
                                    {subscription ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-3xl font-extrabold text-white">Saito {getPlanName(subscription.price_id)}</p>
                                                    <p className="text-sm text-foreground-muted mt-1">
                                                        Renova em{' '}
                                                        <span className="text-white font-bold">
                                                            {new Date(subscription.current_period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </span>
                                                    </p>
                                                </div>
                                                <span className={cn("px-4 py-1.5 text-xs font-black rounded-full border uppercase tracking-widest",
                                                    subscription.status === 'active' || subscription.status === 'trialing'
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                                )}>
                                                    {subscription.status === 'active' ? 'Ativo' :
                                                        subscription.status === 'trialing' ? 'Trial' :
                                                            subscription.status === 'canceled' ? 'Cancelado' : subscription.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'WhatsApp', value: getPlanName(subscription.price_id) === 'Starter' ? '2' : getPlanName(subscription.price_id) === 'Pro' ? '5' : '15' },
                                                    { label: 'Membros', value: getPlanName(subscription.price_id) === 'Starter' ? '1' : getPlanName(subscription.price_id) === 'Pro' ? '2' : '10' },
                                                    { label: 'IA', value: 'Inclusa' },
                                                ].map(item => (
                                                    <div key={item.label} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                                        <p className="text-xl font-extrabold text-white">{item.value}</p>
                                                        <p className="text-xs text-neutral-500 mt-1 font-medium">{item.label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                                                onClick={handleBillingPortal}
                                                disabled={loadingPortal}
                                                className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                                            >
                                                {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                                Gerenciar Assinatura no Stripe
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 space-y-4">
                                            <p className="text-neutral-400 font-medium">Nenhuma assinatura ativa encontrada.</p>
                                            <motion.a
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
                                                href="/pricing"
                                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white text-sm font-extrabold rounded-2xl hover:bg-brand-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                            >
                                                <Crown className="w-4 h-4" />
                                                Ver Planos
                                            </motion.a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
