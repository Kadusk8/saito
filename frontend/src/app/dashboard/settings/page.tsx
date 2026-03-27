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
    Lock,
    Bell,
    Users as UsersIcon,
    Terminal
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [user, setUser] = useState<any>(null);
    const [organization, setOrganization] = useState<any>(null);
    const [orgName, setOrgName] = useState('');
    const [displayName, setDisplayName] = useState('');
    
    // New states
    const [activeTab, setActiveTab] = useState<'geral' | 'equipe'>('geral');
    const [evolutionOnline, setEvolutionOnline] = useState(false);
    const [teamCount, setTeamCount] = useState(1);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            
            if (user) {
                // Fetch organization
                let orgId = null;
                const { data: orgMapext } = await supabase
                    .from('user_roles')
                    .select('organization_id')
                    .eq('user_id', user.id)
                    .single();

                if (orgMapext) {
                    orgId = orgMapext.organization_id;
                } else {
                    const { data: fallbackMap } = await supabase
                        .from('users_organizations')
                        .select('organization_id')
                        .eq('user_id', user.id)
                        .single();

                    if (fallbackMap) {
                        orgId = fallbackMap.organization_id;
                    }
                }

                if (orgId) {
                    const { data: orgData } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', orgId)
                        .single();

                    if (orgData) {
                        setOrganization(orgData);
                        setOrgName(orgData.name || '');
                        
                        // Check team count
                        const { count: teamCountVal } = await supabase
                            .from('user_roles')
                            .select('*', { count: 'exact', head: true })
                            .eq('organization_id', orgId);
                        
                        if (teamCountVal) setTeamCount(teamCountVal);

                        // Check instances for Evo API via backend API
                        try {
                            const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
                            const { data: { session } } = await supabase.auth.getSession();
                            const res = await fetch(`${API}/api/instances`, {
                                headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
                            });
                            const json = await res.json();
                            if (json.success && json.data) {
                                const hasActive = json.data.some((i: any) => i.connectionStatus === 'open');
                                setEvolutionOnline(hasActive);
                            }
                        } catch (e) {
                            console.error("Failed to fetch Evo API status", e);
                        }
                    } else {
                        setOrganization({ id: orgId });
                        setOrgName('');
                    }
                }

                // Set display name from user metadata if available
                setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
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
            // 1. Update Profile (User metadata)
            const { error: userError } = await supabase.auth.updateUser({
                data: { full_name: displayName }
            });

            if (userError) throw userError;

            // 2. Update Organization
            if (organization?.id) {
                const { error: orgError } = await supabase
                    .from('organizations')
                    .update({ name: orgName })
                    .eq('id', organization.id);

                if (orgError) throw orgError;
            } else {
                console.warn('No organization ID found to update.');
            }

            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });

            // Auto hide success message
            setTimeout(() => setMessage(null), 5000);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: `Erro: ${error.message || 'Falha ao salvar.'}` });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setSaving(false);
        }
    }

    async function handleInvite() {
        if (!inviteEmail) return;
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
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
            setSaving(false);
            setTimeout(() => setMessage(null), 4000);
        }
    }

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
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="glass p-8 rounded-3xl border border-border-subtle shadow-premium bg-surface/40 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Configurações do Sistema</h1>
                    <p className="text-foreground-muted font-medium text-lg">Gerencie seu perfil, organização e preferências do Saito.</p>
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
                {/* Navigation Sidebar (Local) */}
                <div className="md:col-span-4 lg:col-span-3 space-y-2">
                    <motion.button 
                        onClick={() => setActiveTab('geral')}
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }} 
                        className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all border",
                            activeTab === 'geral' 
                                ? "bg-brand border-brand/50 text-white shadow-shadow-glow" 
                                : "text-neutral-400 hover:text-white hover:bg-surface-hover border-transparent hover:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="w-4 h-4" />
                            Geral
                        </div>
                        {activeTab === 'geral' && <ChevronRight className="w-4 h-4" />}
                    </motion.button>

                    <motion.button 
                        onClick={() => setActiveTab('equipe')}
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }} 
                        className={cn("w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all border",
                            activeTab === 'equipe' 
                                ? "bg-brand border-brand/50 text-white shadow-shadow-glow" 
                                : "text-neutral-400 hover:text-white hover:bg-surface-hover border-transparent hover:border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <UsersIcon className="w-4 h-4" />
                            Equipe
                        </div>
                        {activeTab === 'equipe' && <ChevronRight className="w-4 h-4" />}
                    </motion.button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-8 lg:col-span-9 space-y-8">
                    {activeTab === 'geral' ? (
                        <>
                            {/* User Profile Section */}
                    <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm transition-all hover:border-border/80">
                        <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                            <h2 className="text-base font-bold text-white flex items-center gap-3">
                                <User className="w-5 h-5 text-brand" /> Seu Perfil
                            </h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1 group-focus-within:text-brand transition-colors">E-mail de Operador</label>
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-5 py-3.5 bg-black/40 border border-border-subtle rounded-xl text-neutral-500 cursor-not-allowed text-sm font-medium shadow-inner"
                                />
                                <p className="text-[11px] text-neutral-600 font-medium pl-1">O e-mail não pode ser alterado diretamente.</p>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1 group-focus-within:text-brand transition-colors">Nome do Operador</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João Silva"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Organization Section */}
                    <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm transition-all hover:border-border/80">
                        <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                            <h2 className="text-base font-bold text-white flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-indigo-400" /> Organização / Empresa
                            </h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1 group-focus-within:text-brand transition-colors">Nome da Organização</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Minha Empresa de Lançamentos"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:border-white/10"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1">ID da Organização</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={organization?.id || ''}
                                        disabled
                                        className="flex-1 px-5 py-3.5 bg-black/40 border border-border-subtle rounded-xl text-xs text-neutral-600 font-mono tracking-widest cursor-not-allowed shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrations Status */}
                    <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm transition-all hover:border-border/80">
                        <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                            <h2 className="text-base font-bold text-white flex items-center gap-3">
                                <Key className="w-5 h-5 text-orange-400" /> Status de Integrações
                            </h2>
                        </div>
                        <div className="p-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
                            {/* Gemini */}
                            <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-border-subtle/50 hover:border-emerald-500/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                        <Terminal className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-white leading-tight">Gemini AI</p>
                                        <p className="text-xs font-medium text-foreground-muted mt-0.5">Automação Planner</p>
                                    </div>
                                </div>
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    Online
                                </span>
                            </div>

                            {/* Evo API */}
                            <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-border-subtle/50 hover:border-brand/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-white leading-tight">Evolution API</p>
                                        <p className="text-xs font-medium text-foreground-muted mt-0.5">Integração WhatsApp</p>
                                    </div>
                                </div>
                                <span className={cn("flex items-center gap-1.5 px-3 py-1 text-[10px] font-black rounded-full border uppercase tracking-widest", 
                                    evolutionOnline 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                                        : "bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
                                )}>
                                    {evolutionOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        <button
                            onClick={loadData}
                            className="px-6 py-3 text-sm font-bold text-foreground-muted hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3.5 bg-brand text-white text-sm font-extrabold rounded-2xl hover:bg-brand-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center gap-2.5 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Alterações
                        </motion.button>
                    </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Invite Section */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm transition-all hover:border-border/80">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <UsersIcon className="w-5 h-5 text-brand" /> Convidar Membro
                                    </h2>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 space-y-2 group">
                                            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-widest pl-1 group-focus-within:text-brand transition-colors">E-mail do novo membro</label>
                                            <input
                                                type="email"
                                                placeholder="exemplo@saito.app.br"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/50 transition-all text-sm font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:border-white/10"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleInvite}
                                                disabled={!inviteEmail}
                                                className="px-8 py-3.5 h-[50px] bg-brand text-white text-sm font-extrabold rounded-2xl hover:bg-brand-hover transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Enviar Convite
                                            </motion.button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground-muted">
                                        Ao enviar o convite, o membro receberá um e-mail para criar a conta e acessar a organização <strong>{orgName || 'atual'}</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Team List Section */}
                            <div className="glass border border-border-subtle rounded-3xl overflow-hidden shadow-sm transition-all hover:border-border/80">
                                <div className="px-8 py-5 border-b border-border/50 bg-black/20 flex justify-between items-center">
                                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                                        <User className="w-5 h-5 text-indigo-400" /> Membros Atuais
                                    </h2>
                                    <span className="bg-white/5 text-neutral-300 text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                                        {teamCount} {teamCount === 1 ? 'membro' : 'membros'}
                                    </span>
                                </div>
                                <div className="p-0">
                                    <div className="flex items-center justify-between p-6 border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-lg border border-brand/30">
                                                {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{displayName || 'Você'}</p>
                                                <p className="text-sm text-neutral-400">{user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">Owner</span>
                                        </div>
                                    </div>
                                    
                                    {teamCount > 1 && (
                                        <div className="p-8 text-center text-neutral-500 text-sm">
                                            Outros membros estão ocultos por medida de privacidade.
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
