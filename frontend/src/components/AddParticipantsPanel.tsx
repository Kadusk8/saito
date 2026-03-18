'use client';

import { useState, useRef } from 'react';
import { UserPlus, Loader2, CheckCircle2, XCircle, Upload, Users, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddParticipantsProps {
    instanceName: string;
    groupJid: string;
}

interface ParticipantResult {
    number: string;
    status: string;
    error?: string | null;
}

type InputMode = 'text' | 'csv' | 'group';

function parseNumbers(raw: string): string[] {
    return raw.split(/[\n,;]+/).map(n => n.trim().replace(/\D/g, '')).filter(n => n.length >= 8);
}

export function AddParticipantsPanel({ instanceName, groupJid }: AddParticipantsProps) {
    const [mode, setMode] = useState<InputMode>('text');
    const [numbersText, setNumbersText] = useState('');
    const [csvFileName, setCsvFileName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [results, setResults] = useState<ParticipantResult[]>([]);
    const [error, setError] = useState('');

    // CSV upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Copy from group
    const [groups, setGroups] = useState<{ id: string; subject: string }[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [selectedGroupJid, setSelectedGroupJid] = useState('');
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            // For CSV, extract any 8-15 digit sequences
            const numbers = (text.match(/\d{8,15}/g) || []).join('\n');
            setNumbersText(numbers);
        };
        reader.readAsText(file);
    };

    const handleLoadGroups = async () => {
        setLoadingGroups(true);
        setError('');
        try {
            const res = await fetch(`/api/instances/${instanceName}/groups/sync-list`);
            if (!res.ok) throw new Error('Erro ao carregar grupos');
            const data = await res.json();
            setGroups((data || []).map((g: any) => ({ id: g.id, subject: g.subject || g.name || g.id })));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleImportFromGroup = async () => {
        if (!selectedGroupJid) return;
        setLoadingParticipants(true);
        setError('');
        try {
            const res = await fetch(`/api/instances/${instanceName}/groups/${encodeURIComponent(selectedGroupJid)}/participants`);
            if (!res.ok) throw new Error('Erro ao buscar participantes do grupo');
            const data = await res.json();
            const numbers = (data.participants || []).map((p: any) => p.number).join('\n');
            setNumbersText(numbers);
            setMode('text');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleAdd = async () => {
        const raw = parseNumbers(numbersText);
        if (raw.length === 0) {
            setError('Insira ao menos um número válido.');
            return;
        }

        setIsAdding(true);
        setError('');
        setResults([]);

        try {
            const res = await fetch(`/api/instances/${instanceName}/groups/${encodeURIComponent(groupJid)}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numbers: raw }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao adicionar participantes');

            setResults(data.results?.length ? data.results : raw.map((n: string) => ({ number: n, status: 'sent' })));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const parsedCount = parseNumbers(numbersText).length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="space-y-5 bg-surface/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                    <UserPlus className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-white font-semibold">Adicionar Participantes em Massa</h3>
                    <p className="text-xs text-neutral-500">Cole números, importe um CSV, ou copie de outro grupo.</p>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-background rounded-xl border border-border">
                {([
                    { key: 'text', label: 'Colar Números', icon: <UserPlus className="w-3.5 h-3.5" /> },
                    { key: 'csv', label: 'Upload CSV', icon: <Upload className="w-3.5 h-3.5" /> },
                    { key: 'group', label: 'De outro Grupo', icon: <Users className="w-3.5 h-3.5" /> },
                ] as { key: InputMode; label: string; icon: React.ReactNode }[]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setMode(tab.key); setError(''); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${mode === tab.key
                                ? 'bg-brand text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white hover:bg-surface-hover'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mode: Text paste */}
            {mode === 'text' && (
                <div className="space-y-2">
                    <textarea
                        value={numbersText}
                        onChange={e => setNumbersText(e.target.value)}
                        placeholder={"5511999999999\n5521888888888\n5531777777777"}
                        rows={6}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-brand/50 transition-colors font-mono"
                    />
                    {parsedCount > 0 && (
                        <p className="text-xs text-neutral-500">{parsedCount} número{parsedCount !== 1 ? 's' : ''} detectado{parsedCount !== 1 ? 's' : ''}</p>
                    )}
                </div>
            )}

            {/* Mode: CSV Upload */}
            {mode === 'csv' && (
                <div className="space-y-3">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border hover:border-brand/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
                    >
                        <Upload className="w-8 h-8 mx-auto text-neutral-600 group-hover:text-brand transition-colors mb-2" />
                        <p className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                            {csvFileName ? (
                                <span className="text-brand font-medium">{csvFileName}</span>
                            ) : (
                                <>Clique para selecionar um arquivo <span className="font-semibold">.csv</span> ou <span className="font-semibold">.txt</span></>
                            )}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">O sistema extrai automaticamente todos os números de telefone do arquivo.</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv,.txt,.xls,.xlsx" className="hidden" onChange={handleCSVUpload} />
                    {parsedCount > 0 && (
                        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {parsedCount} números extraídos do arquivo. Clique em "Adicionar" abaixo.
                        </div>
                    )}
                </div>
            )}

            {/* Mode: Copy from group */}
            {mode === 'group' && (
                <div className="space-y-3">
                    {groups.length === 0 ? (
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleLoadGroups}
                            disabled={loadingGroups}
                            className="w-full py-3 border border-dashed border-border hover:border-brand/50 rounded-xl text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            {loadingGroups ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            {loadingGroups ? 'Carregando grupos...' : 'Carregar grupos disponíveis'}
                        </motion.button>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative">
                                <select
                                    value={selectedGroupJid}
                                    onChange={e => setSelectedGroupJid(e.target.value)}
                                    className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors pr-10"
                                >
                                    <option value="">-- Selecione um grupo --</option>
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id}>{g.subject}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleImportFromGroup}
                                disabled={!selectedGroupJid || loadingParticipants}
                                className="w-full py-2.5 bg-surface-hover border border-white/5 hover:border-brand/50 hover:bg-white/5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loadingParticipants ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                {loadingParticipants ? 'Importando participantes...' : 'Importar participantes deste grupo'}
                            </motion.button>
                        </div>
                    )}
                    {parsedCount > 0 && (
                        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {parsedCount} participantes importados. Clique em "Adicionar" abaixo.
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Add Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                disabled={isAdding || parsedCount === 0}
                className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
            >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {isAdding ? 'Adicionando...' : `Adicionar ${parsedCount > 0 ? parsedCount + ' ' : ''}Participante${parsedCount !== 1 ? 's' : ''}`}
            </motion.button>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Resultado ({results.length}):</p>
                    {results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-background/50 border border-border/50">
                            <span className="text-neutral-300 font-mono">+{r.number}</span>
                            {r.status === 'error' ? (
                                <span className="flex items-center gap-1 text-red-400 text-xs">
                                    <XCircle className="w-3.5 h-3.5" /> {r.error || 'Erro'}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Adicionado
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
