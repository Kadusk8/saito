'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    MessageSquareWarning,
    Settings,
    LogOut,
    ShieldAlert,
    Bot,
    Rocket,
    Sparkles,
    Loader2,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Gerenciar Grupos', href: '/dashboard/groups', icon: Users },
    { name: 'Enviar Mensagens', href: '/dashboard/broadcasts', icon: MessageSquareWarning },
    { name: 'Planejador', href: '/dashboard/planejador', icon: Sparkles },
    { name: 'Super Grupos', href: '/dashboard/super-grupos', icon: Rocket },
    { name: 'Agente AI', href: '/dashboard/ai', icon: Bot },
    { name: 'Strikes Log', href: '/dashboard/strikes', icon: ShieldAlert },
];

const bottomNavItems = [
    { name: 'Assinatura', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [loadingOut, setLoadingOut] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleLogout = async () => {
        setLoadingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const NavLink = ({ item }: { item: typeof navItems[0] }) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
            <Link
                href={item.href}
                className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
                    isActive
                        ? "text-brand"
                        : "text-foreground-muted hover:text-foreground"
                )}
            >
                {/* Background Selection Indicator Layer */}
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-brand/15 rounded-xl border border-brand/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                )}
                
                {/* Hover state for inactive items (Glass effect) */}
                {!isActive && (
                    <div className="absolute inset-0 bg-surface-hover opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
                )}

                <span className="relative z-10 flex items-center gap-3">
                    <Icon className={cn(
                        "w-5 h-5 transition-transform duration-300",
                        isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    {item.name}
                </span>
            </Link>
        );
    };

    return (
        <aside className="fixed inset-y-0 left-0 w-[260px] bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
            {/* Header/Logo Area */}
            <div className="h-20 flex items-center px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover shadow-shadow-glow">
                        <ShieldAlert className="w-5 h-5 text-white" />
                        <div className="absolute inset-0 rounded-xl box-shadow-[inset_0_1px_rgba(255,255,255,0.4)]" />
                    </div>
                    <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-white transition-colors">
                        Saito<span className="text-brand">.</span>
                    </span>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 flex flex-col gap-1 my-scroll-area">
                <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Menu Principal
                </div>
                {navItems.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}

                <div className="mt-8 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Sistema
                </div>
                {bottomNavItems.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}
            </nav>

            {/* User Details & Logout */}
            <div className="p-4 border-t border-border-subtle bg-surface/30 backdrop-blur-md">
                <div className="flex flex-col gap-2">
                    {userEmail && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface border border-border">
                            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center border border-brand/20">
                                <span className="text-brand text-xs font-bold uppercase">
                                    {userEmail.charAt(0)}
                                </span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium text-foreground truncate">
                                    {userEmail.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-foreground-muted truncate">
                                    Admin
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={handleLogout}
                        disabled={loadingOut}
                        className="group flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-foreground-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 disabled:opacity-50"
                    >
                        {loadingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        )}
                        <span>Encerrar Sessão</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
