'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteInstanceButtonProps {
    instanceName: string;
    onDeleted?: () => void;
}

import { api } from '@/lib/api-client';

export function DeleteInstanceButton({ instanceName, onDeleted }: DeleteInstanceButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja desconectar e APAGAR a instância "${instanceName}"? Isso removerá a conexão com o WhatsApp.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            console.log("Sending DELETE to backend for", instanceName);
            await api.delete(`/api/instances/${instanceName}`);
            console.log("DELETE Request finished");

            if (onDeleted) onDeleted();
            window.location.reload();
        } catch (error: any) {
            console.error("DELETE Request failed entirely:", error);
            alert(`Erro na requisição: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Desconectar e Excluir Instância"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
    );
}
