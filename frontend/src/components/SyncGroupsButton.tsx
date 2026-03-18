'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SyncGroupsButtonProps {
    instanceName: string;
    isConnected: boolean;
}

import { api } from '@/lib/api-client';

export function SyncGroupsButton({ instanceName, isConnected }: SyncGroupsButtonProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await api.post(`/api/instances/${instanceName}/groups/sync`);

            // Sync successful, reload to show the groups
            window.location.reload();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={!isConnected || isSyncing}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors disabled:opacity-50 flex items-center gap-2"
        >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Grupos'}
        </button>
    );
}
