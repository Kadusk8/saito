'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Loader2, CheckCircle2, XCircle, MessageSquare, Radio,
    ImageIcon, Video, FileText, Mic, Upload, X, Trash2,
    Link2, LayoutList, Layers, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';

// Direct Supabase client — bypasses the Next.js proxy entirely for large file uploads
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SendMessagePanelProps {
    instanceName: string;
    currentGroupJid?: string;
    currentGroupName?: string;
    /** Pre-loaded groups for broadcast mode (skips the load button) */
    groups?: { id: string; name: string }[];
}

type MsgType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'buttons' | 'list' | 'carousel';

const MSG_TABS: { key: MsgType; label: string; icon: React.ReactNode; accept?: string }[] = [
    { key: 'text', label: 'Texto', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'image', label: 'Imagem', icon: <ImageIcon className="w-4 h-4" />, accept: 'image/*' },
    { key: 'video', label: 'Vídeo', icon: <Video className="w-4 h-4" />, accept: 'video/*' },
    { key: 'audio', label: 'Áudio', icon: <Mic className="w-4 h-4" />, accept: 'audio/*' },
    { key: 'document', label: 'Documento', icon: <FileText className="w-4 h-4" />, accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip' },
];

const FILE_TYPES = new Set<MsgType>(['image', 'video', 'audio', 'document']);


function FieldLabel({ label, optional }: { label: string, optional?: boolean }) {
    return (
        <label className="text-xs font-semibold text-foreground-muted tracking-wide flex items-center justify-between">
            {label}
            {optional && <span className="text-[10px] font-normal text-neutral-600">Opcional</span>}
        </label>
    );
}

function TInput({ label, value, onChange, placeholder, optional }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean }) {
    return (
        <div className="space-y-2">
            <FieldLabel label={label} optional={optional} />
            <input 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder} 
                className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all shadow-sm" 
            />
        </div>
    );
}

function TArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return (
        <div className="space-y-2">
            <FieldLabel label={label} />
            <textarea 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder} 
                rows={rows} 
                className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all shadow-sm" 
            />
        </div>
    );
}

function FileZone({ accept, onFile, file, onClear, label, uploading, progress }: { accept?: string; onFile: (f: File) => void; file: File | null; onClear: () => void; label: string; uploading?: boolean; progress?: number }) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div className="space-y-2">
            <FieldLabel label={label} />
            {file ? (
                <div className="flex items-center gap-4 px-5 py-4 bg-brand-light border border-brand/20 shadow-shadow-glow rounded-xl">
                    <div className="p-2.5 bg-brand/20 rounded-lg shrink-0 text-brand">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate tracking-wide">{file.name}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {uploading && (
                            <div className="mt-3 h-1.5 rounded-full bg-surface-hover overflow-hidden border border-border/50">
                                <motion.div 
                                    className="h-full bg-brand rounded-full relative" 
                                    style={{ width: `${progress || 0}%` }}
                                    transition={{ ease: "easeOut" }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </motion.div>
                            </div>
                        )}
                    </div>
                    {!uploading && (
                        <button onClick={onClear} className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div onClick={() => ref.current?.click()} className="group relative w-full border-2 border-dashed border-border-subtle hover:border-brand/50 bg-surface/30 hover:bg-brand-light/30 rounded-xl py-10 text-center cursor-pointer transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="p-3 bg-surface rounded-full border border-border group-hover:border-brand/30 shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-5 h-5 text-neutral-500 group-hover:text-brand transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-foreground-muted group-hover:text-white transition-colors">Clique ou arraste um arquivo</p>
                        <p className="text-xs text-neutral-600 mt-1">{accept || 'Qualquer formato'} · Máximo 50MB</p>
                    </div>
                </div>
            )}
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; onFile(f); } }} />
        </div>
    );
}

export function SendMessagePanel({ instanceName, currentGroupJid, currentGroupName, groups: propGroups }: SendMessagePanelProps) {
    const [msgType, setMsgType] = useState<MsgType>('text');
    const [broadcastMode, setBroadcastMode] = useState(!!propGroups);
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

    // Fields
    const [text, setText] = useState('');
    const [caption, setCaption] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);

    const [groups, setGroups] = useState<{ id: string; name: string }[]>(propGroups || []);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [selectedJids, setSelectedJids] = useState<Set<string>>(new Set());

    const clearFile = () => { setMediaFile(null); setUploadProgress(0); };
    const currentTab = MSG_TABS.find(t => t.key === msgType);
    const isFileMode = FILE_TYPES.has(msgType);
    const isBroadcastOnly = !!propGroups; 

    const handleLoadGroups = async () => {
        setLoadingGroups(true);
        try {
            const data = await api.get(`/api/instances/${instanceName}/groups/sync-list`);
            setGroups((data || []).map((g: any) => ({ id: g.id, name: g.subject || g.id })));
        } catch { /* ignore */ }
        finally { setLoadingGroups(false); }
    };

    const uploadToStorage = async (file: File): Promise<{ publicUrl: string; storagePath: string }> => {
        const storagePath = `temp/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        setUploadProgress(10);
        const { error } = await supabase.storage
            .from('saito-temp-media')
            .upload(storagePath, file, { contentType: file.type, upsert: true });

        if (error) throw new Error(`Erro no upload: ${error.message}`);

        setUploadProgress(80);
        const { data: urlData } = supabase.storage.from('saito-temp-media').getPublicUrl(storagePath);
        setUploadProgress(100);
        return { publicUrl: urlData.publicUrl, storagePath };
    };

    const buildTextPayload = () => {
        if (msgType === 'text') return { type: 'text', text };
        return null;
    };

    const handleSend = async () => {
        setIsSending(true);
        setStatus(null);
        setUploadProgress(0);
        const targets = broadcastMode ? Array.from(selectedJids) : [currentGroupJid!];

        if (targets.length === 0 || (broadcastMode && selectedJids.size === 0)) {
            setStatus({ ok: false, msg: 'Selecione pelo menos um grupo para enviar.' });
            setIsSending(false);
            return;
        }

        let storagePath: string | null = null;

        try {
            if (isFileMode) {
                if (!mediaFile) throw new Error('Selecione um arquivo primeiro');

                const upload = await uploadToStorage(mediaFile);
                storagePath = upload.storagePath;

                for (let i = 0; i < targets.length; i++) {
                    const jid = targets[i];
                    await api.post(`/api/instances/${instanceName}/send-from-url`, {
                        type: msgType,
                        number: jid,
                        mediaUrl: upload.publicUrl,
                        storagePath: upload.storagePath,
                        caption,
                        fileName: mediaFile.name,
                    });

                    // Add a small delay between broadcast messages to avoid overwhelming Evolution API
                    if (broadcastMode && i < targets.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }

                clearFile();
            } else {
                const payload = buildTextPayload();
                for (const jid of targets) {
                    await api.post(`/api/instances/${instanceName}/send`, { ...payload, number: jid });
                }
            }

            if (storagePath) {
                await supabase.storage.from('saito-temp-media').remove([storagePath]).catch(() => { });
            }

            setStatus({ ok: true, msg: broadcastMode ? `Enviado para ${targets.length} grupos com sucesso!` : 'Mensagem enviada com sucesso!' });
            setText('');
            setCaption('');
        } catch (e: any) {
            if (storagePath) {
                await supabase.storage.from('saito-temp-media').remove([storagePath]).catch(() => { });
            }
            setStatus({ ok: false, msg: e.message });
        } finally {
            setIsSending(false);
            setUploadProgress(0);
        }
    };


    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-6 p-6 sm:p-8 rounded-2xl border border-white/5 shadow-xl bg-surface/80 backdrop-blur-xl relative overflow-hidden"
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            {!isBroadcastOnly && (
                <div className="flex items-center justify-between relative z-10 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-brand-light rounded-xl text-brand border border-brand/20 shadow-sm">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg text-white font-bold tracking-tight">Nova Mensagem</h3>
                            <p className="text-xs text-foreground-muted mt-0.5">
                                {!broadcastMode && currentGroupName ? `Destino: ${currentGroupName}` : 'Disparo em Massa (Enviar Mensagens)'}
                            </p>
                        </div>
                    </div>
                    {currentGroupJid && (
                        <button 
                            onClick={() => setBroadcastMode(b => !b)} 
                            className={cn(
                                "flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all duration-300",
                                broadcastMode 
                                    ? "border-brand text-brand bg-brand-light shadow-shadow-glow" 
                                    : "border-border-subtle text-foreground-muted bg-surface hover:text-white hover:border-neutral-500"
                            )}
                        >
                            <Radio className={cn("w-3.5 h-3.5", broadcastMode && "animate-pulse")} /> 
                            {broadcastMode ? 'Modo Enviar Mensagens' : 'Ativar Enviar Mensagens'}
                        </button>
                    )}
                </div>
            )}

            <div className="relative z-10 space-y-6">
                {/* Broadcast Selection */}
                {broadcastMode && (
                    <div className="space-y-3 bg-surface border border-border rounded-xl p-5">
                        <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand" /> Grupos Destino
                            </h4>
                            <span className="text-xs font-medium text-foreground-muted bg-surface-hover px-2 py-1 rounded-md">
                                {selectedJids.size} de {groups.length} selecionados
                            </span>
                        </div>

                        {groups.length === 0 ? (
                            <button 
                                onClick={handleLoadGroups} 
                                disabled={loadingGroups} 
                                className="w-full py-4 border border-dashed border-border hover:border-brand/50 bg-background/50 rounded-xl text-sm text-foreground-muted hover:text-white transition-all flex items-center justify-center gap-2 group"
                            >
                                {loadingGroups ? <Loader2 className="w-4 h-4 animate-spin text-brand" /> : <Radio className="w-4 h-4 group-hover:text-brand transition-colors" />}
                                {loadingGroups ? 'Sincronizando grupos...' : 'Carregar grupos da instância'}
                            </button>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto my-scroll-area pr-2">
                                    {groups.map(g => {
                                        const isSelected = selectedJids.has(g.id);
                                        return (
                                            <button 
                                                key={g.id} 
                                                onClick={() => setSelectedJids(s => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200",
                                                    isSelected 
                                                        ? "bg-brand text-white border-brand shadow-[0_0_10px_rgba(139,92,246,0.2)]" 
                                                        : "bg-background border-border text-foreground-muted hover:text-white hover:border-neutral-500"
                                                )}
                                            >
                                                {g.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => setSelectedJids(selectedJids.size === groups.length ? new Set() : new Set(groups.map(g => g.id)))}
                                        className="text-xs font-medium text-brand hover:text-brand-hover hover:underline transition-colors"
                                    >
                                        {selectedJids.size === groups.length ? 'Desmarcar todos' : 'Selecionar todos os grupos'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Message type tabs */}
                <div className="flex gap-2 flex-wrap bg-surface p-1.5 rounded-xl border border-border inline-flex">
                    {MSG_TABS.map(tab => {
                        const isActive = msgType === tab.key;
                        return (
                            <button 
                                key={tab.key} 
                                onClick={() => { setMsgType(tab.key); setStatus(null); clearFile(); }}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors z-10",
                                    isActive ? "text-white" : "text-foreground-muted hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="msg-type-tab"
                                        className="absolute inset-0 bg-brand rounded-lg shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {tab.icon} {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Forms Area */}
                <div className="space-y-4">
                    {msgType === 'text' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <TArea label="Conteúdo da Mensagem" value={text} onChange={setText} placeholder="Olá equipe! Segue o aviso importante..." rows={6} />
                        </motion.div>
                    )}

                    {isFileMode && msgType !== 'audio' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <FileZone
                                label={`Arquivo de ${msgType === 'image' ? 'Imagem' : msgType === 'video' ? 'Vídeo' : 'Documento'}`}
                                accept={currentTab?.accept}
                                file={mediaFile} onFile={setMediaFile} onClear={clearFile}
                                uploading={isSending && !!mediaFile} progress={uploadProgress}
                            />
                            <TInput label="Legenda" optional value={caption} onChange={setCaption} placeholder="Adicione uma descrição opcional para acompanhar a mídia..." />
                        </motion.div>
                    )}

                    {msgType === 'audio' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <FileZone label="Gravação de Áudio" accept="audio/*" file={mediaFile} onFile={setMediaFile} onClear={clearFile} uploading={isSending && !!mediaFile} progress={uploadProgress} />
                            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                <Mic className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-400/90 leading-relaxed">
                                    Este arquivo será enviado como uma mensagem de voz nativa (PTT). Recomendamos o uso de arquivos .ogg, .mp3, ou .m4a curtos.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {status && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                "flex items-center gap-3 text-sm font-medium rounded-xl px-4 py-3 border",
                                status.ok 
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                    : "text-red-400 bg-red-400/10 border-red-500/20"
                            )}
                        >
                            {status.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                            {status.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Action */}
                <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSend} 
                    disabled={isSending || (isFileMode && !mediaFile) || (msgType === 'text' && !text.trim())} 
                    className="group relative w-full h-12 bg-brand hover:bg-brand-hover disabled:bg-surface disabled:border-border disabled:text-neutral-500 border border-transparent text-white text-sm font-bold tracking-wide rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all overflow-hidden flex items-center justify-center gap-2"
                >
                    {/* Hover glare effect */}
                    {!isSending && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />}
                    
                    {isSending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {uploadProgress > 0 && uploadProgress < 100 && isFileMode ? `Enviando Payload... ${uploadProgress}%` : 'Processando Envio...'}
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                            Disparar Mensagem
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}
