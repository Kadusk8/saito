import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ConnectInstanceModal } from '@/components/ConnectInstanceModal';
import { DeleteInstanceButton } from '@/components/DeleteInstanceButton';

export default async function GroupsPage() {
    let instances: any[] = [];

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001';
        const res = await fetch(`${apiUrl}/api/instances`, { cache: 'no-store' });
        const json = await res.json();
        if (json.success) {
            instances = json.data || [];
        }

    } catch (e) {
        console.error("Failed to fetch data", e);
    }

    return (
        <div className="p-8 pb-20 sm:p-12 w-full max-w-7xl mx-auto space-y-10 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-50 glass p-8 rounded-3xl border border-border-subtle shadow-premium bg-surface/40">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-brand-light border border-brand/20 rounded-xl text-brand shadow-shadow-glow">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dispositivos Conectados</h1>
                    </div>
                    <p className="text-foreground-muted font-medium ml-1">Gerencie suas conexões de WhatsApp e configure novos aparelhos para transbordo e envios.</p>
                </div>
                <div className="shrink-0">
                    <ConnectInstanceModal />
                </div>
            </div>

            {/* Instâncias list */}
            <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white tracking-tight">Instâncias Ativas</h2>
                    <span className="text-xs font-semibold text-brand bg-brand-light px-3 py-1 rounded-full border border-brand/20">
                        Total: {instances.length}
                    </span>
                </div>

                {instances.length === 0 ? (
                    <div className="glass border border-dashed border-border-subtle rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 bg-surface/30">
                        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-neutral-600 mb-2">
                            <Smartphone className="w-8 h-8 opacity-50" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-lg">Nenhum dispositivo encontrado</p>
                            <p className="text-foreground-muted text-sm mt-1">Conecte um novo número de WhatsApp para começar a gerenciar seus grupos.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {instances.map((instance) => {
                            const isConnected = instance.connectionStatus === 'open';
                            return (
                                <div key={instance.id || instance.name} className="glass border border-border-subtle rounded-2xl p-6 flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-brand/40 hover:bg-surface/60 transition-all shadow-sm group">
                                    <div className="flex w-full lg:w-auto items-center gap-5">
                                        {/* Avatar area */}
                                        <div className="relative shrink-0">
                                            {instance.profilePicUrl ? (
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border shadow-sm group-hover:border-brand/50 transition-colors">
                                                    <img src={instance.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-shadow-glow">
                                                    <Smartphone className="w-8 h-8" />
                                                </div>
                                            )}
                                            {/* Status Dot Ring */}
                                            <div className="absolute -bottom-1 -right-1 p-1 bg-surface rounded-full">
                                                <div className={`w-3.5 h-3.5 rounded-full border-2 border-surface ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`} />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-white font-bold text-lg truncate">
                                                    {instance.profileName || instance.name}
                                                </h3>
                                                {instance.ownerJid && (
                                                    <span className="text-xs font-medium text-foreground-muted bg-surface-hover px-2 py-0.5 rounded-md border border-border/50 truncate max-w-[120px]">
                                                        {instance.ownerJid.split('@')[0]}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm">
                                                {isConnected ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                                        <CheckCircle2 className="w-4 h-4" /> Conectado e Operante
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-red-400 font-medium">
                                                        <AlertCircle className="w-4 h-4" /> Desconectado ({instance.connectionStatus})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex w-full lg:w-auto items-center gap-3 self-end lg:self-center shrink-0">
                                        <Link href={`/dashboard/instances/${instance.name}/groups`} className="px-5 py-2.5 bg-surface border border-border hover:border-brand/50 rounded-xl text-sm font-semibold text-white hover:bg-brand-light transition-all shadow-sm flex items-center gap-2 flex-1 justify-center">
                                            Gerenciar Grupos
                                        </Link>
                                        <DeleteInstanceButton instanceName={instance.name} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
