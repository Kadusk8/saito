'use client';

import { useState, useRef } from 'react';
import { X, Users, UserPlus, Upload, Loader2, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateGroupModalProps {
    instanceName: string;
    onClose: () => void;
    onCreated?: (groupName: string) => void;
}

function parseNumbers(raw: string): string[] {
    return raw.split(/[\n,;]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length >= 8);
}

export function CreateGroupModal({ instanceName, onClose, onCreated }: CreateGroupModalProps) {
    const [subject, setSubject] = useState('');
    const [numbersText, setNumbersText] = useState('');
    const [csvFileName, setCsvFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const numbers = (text.match(/\d{8,15}/g) || []).join('\n');
            setNumbersText(numbers);
        };
        reader.readAsText(file);
    };

    const handleCreate = async () => {
        if (!subject.trim()) return;
        const participants = parseNumbers(numbersText);
        setIsCreating(true);
        setResult(null);
        try {
            const res = await fetch(`/api/instances/${instanceName}/groups/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: subject.trim(), participants }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao criar grupo');
            setResult({ success: true, message: `Grupo "${subject}" criado com sucesso!` });
            onCreated?.(subject);
            setTimeout(onClose, 2000);
        } catch (err: any) {
            setResult({ success: false, message: err.message });
        } finally {
            setIsCreating(false);
        }
    };

    const parsedCount = parseNumbers(numbersText).length;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/10 rounded-lg text-brand">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-lg">Criar Novo Grupo</h2>
                            <p className="text-neutral-500 text-xs">via instância <span className="text-brand">{instanceName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Group Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Nome do Grupo *</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Ex: Turma VIP 2025"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                </div>

                {/* Participants */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Participantes (opcional)</label>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-brand transition-colors"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            {csvFileName || 'Upload CSV'}
                        </button>
                        <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVUpload} />
                    </div>
                    <textarea
                        value={numbersText}
                        onChange={e => setNumbersText(e.target.value)}
                        rows={4}
                        placeholder={"5511999999999\n5521888888888"}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-brand/50 transition-colors font-mono"
                    />
                    {parsedCount > 0 && (
                        <p className="text-xs text-neutral-500">{parsedCount} número{parsedCount !== 1 ? 's' : ''} detectado{parsedCount !== 1 ? 's' : ''}</p>
                    )}
                </div>

                {/* Result */}
                {result && (
                    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${result.success ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                        {result.message}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-border text-neutral-400 hover:text-white hover:border-neutral-400 rounded-xl text-sm transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !subject.trim()}
                        className="flex-1 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isCreating ? 'Criando...' : 'Criar Grupo'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
