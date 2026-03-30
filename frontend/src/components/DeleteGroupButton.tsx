'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteGroupButtonProps {
    groupId: string;
    groupName: string;
    onDeleted?: () => void;
}

import { api } from '@/lib/api-client';

export function DeleteGroupButton({ groupId, groupName, onDeleted }: DeleteGroupButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if this button is inside a Link or clickable card
        e.stopPropagation();

        if (!confirm(`Tem certeza que deseja parar de monitorar o grupo "${groupName}"? Isso excluirá as regras associadas.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/api/groups/${groupId}`);

            if (onDeleted) onDeleted();
            else window.location.reload();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Excluir Monitoramento do Grupo"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
    );
}
