'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Send, Loader2, CheckCircle2, XCircle, MessageSquare,
    ImageIcon, Video, FileText, Mic, Upload, X, Trash2,
    Link2, LayoutList, Layers, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion } from 'framer-motion';

// Direct Supabase client — bypasses the Next.js proxy entirely for large file uploads
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ScheduleMessagePanelProps {
    campaignId: string;
    onScheduled?: () => void;
}

type MsgType = 'text' | 'image' | 'video' | 'audio' | 'document';

const MSG_TABS: { key: MsgType; label: string; icon: React.ReactNode; accept?: string }[] = [
    { key: 'text', label: 'Texto', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'image', label: 'Imagem', icon: <ImageIcon className="w-3.5 h-3.5" />, accept: 'image/*' },
    { key: 'video', label: 'Vídeo', icon: <Video className="w-3.5 h-3.5" />, accept: 'video/*' },
    { key: 'audio', label: 'Áudio', icon: <Mic className="w-3.5 h-3.5" />, accept: 'audio/*' },
    { key: 'document', label: 'Documento', icon: <FileText className="w-3.5 h-3.5" />, accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip' },
];

const FILE_TYPES = new Set<MsgType>(['image', 'video', 'audio', 'document']);

function FieldLabel({ label }: { label: string }) {
    return <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{label}</label>;
}

function TInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1.5 flex-1">
            <FieldLabel label={label} />
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-brand/50 transition-colors" />
        </div>
    );
}

function TArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return (
        <div className="space-y-1.5 flex-1">
            <FieldLabel label={label} />
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-brand/50 transition-colors" />
        </div>
    );
}

function FileZone({ accept, onFile, file, onClear, label, uploading, progress }: { accept?: string; onFile: (f: File) => void; file: File | null; onClear: () => void; label: string; uploading?: boolean; progress?: number }) {
    const ref = useRef<HTMLInputElement>(null);
    return (
        <div className="space-y-1.5">
            <FieldLabel label={label} />
            {file ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand/10 border border-brand/30 rounded-xl">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{file.name}</p>
                        <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {uploading && (
                            <div className="mt-2 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                                <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progress || 0}%` }} />
                            </div>
                        )}
                    </div>
                    {!uploading && <button onClick={onClear} className="text-neutral-500 hover:text-red-400 transition-colors shrink-0"><X className="w-4 h-4" /></button>}
                </div>
            ) : (
                <div onClick={() => ref.current?.click()} className="w-full border-2 border-dashed border-border hover:border-brand/50 rounded-xl py-8 text-center cursor-pointer group transition-colors">
                    <Upload className="w-6 h-6 mx-auto text-neutral-600 group-hover:text-brand mb-2 transition-colors" />
                    <p className="text-sm text-neutral-500 group-hover:text-white transition-colors">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-neutral-700 mt-0.5">{accept || 'Qualquer formato'} · até 50MB</p>
                </div>
            )}
            <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { e.target.value = ''; onFile(f); } }} />
        </div>
    );
}

export function ScheduleMessagePanel({ campaignId, onScheduled }: ScheduleMessagePanelProps) {
    const [msgType, setMsgType] = useState<MsgType>('text');
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

    // Fields
    const [text, setText] = useState('');
    const [caption, setCaption] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [scheduledAt, setScheduledAt] = useState('');
    const [humanize, setHumanize] = useState(false);

    const clearFile = () => { setMediaFile(null); setUploadProgress(0); };
    const currentTab = MSG_TABS.find(t => t.key === msgType);
    const isFileMode = FILE_TYPES.has(msgType);

    /** Upload file directly to Supabase Storage, return { publicUrl, storagePath } */
    const uploadToStorage = async (file: File): Promise<{ publicUrl: string; storagePath: string }> => {
        const storagePath = `campaigns/${campaignId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        setUploadProgress(10);
        const { error } = await supabase.storage
            .from('saito-temp-media') // we can reuse this bucket
            .upload(storagePath, file, { contentType: file.type, upsert: true });

        if (error) throw new Error(`Erro no upload: ${error.message}`);

        setUploadProgress(80);
        const { data: urlData } = supabase.storage.from('saito-temp-media').getPublicUrl(storagePath);
        setUploadProgress(100);
        return { publicUrl: urlData.publicUrl, storagePath };
    };

    const handleSchedule = async () => {
        setIsSending(true);
        setStatus(null);
        setUploadProgress(0);

        if (!scheduledAt) {
            setStatus({ ok: false, msg: 'Por favor, selecione uma data e hora para o agendamento.' });
            setIsSending(false);
            return;
        }

        let mediaUrl: string | null = null;
        let storagePath: string | null = null;

        try {
            if (isFileMode) {
                if (!mediaFile) throw new Error('Selecione um arquivo primeiro');
                const upload = await uploadToStorage(mediaFile);
                storagePath = upload.storagePath;
                mediaUrl = upload.publicUrl;
            } else {
                if (!text.trim()) throw new Error('A mensagem não pode estar vazia');
            }

            const payload = {
                content_type: msgType,
                content: text || (mediaFile ? mediaFile.name : ''),
                caption,
                media_url: mediaUrl,
                scheduled_at: new Date(scheduledAt).toISOString(),
                humanize
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/api/super-grupos/${campaignId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao agendar');

            setStatus({ ok: true, msg: '✅ Mensagem agendada com sucesso!' });

            // clear form
            setText('');
            setCaption('');
            setScheduledAt('');
            clearFile();

            if (onScheduled) onScheduled();

        } catch (e: any) {
            // Cleanup on error
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
            className="space-y-5 bg-surface/80 backdrop-blur-xl border border-white/5 shadow-xl rounded-2xl p-6 relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand/10 rounded-lg text-brand"><Clock className="w-5 h-5" /></div>
                <div>
                    <h3 className="text-white font-semibold">Agendar Mensagem Tática</h3>
                    <p className="text-xs text-neutral-500">A mensagem será enviada para todos os grupos transbordados.</p>
                </div>
            </div>

            {/* Message type tabs */}
            <div className="flex gap-1 flex-wrap">
                {MSG_TABS.map(tab => (
                    <button key={tab.key} onClick={() => { setMsgType(tab.key); setStatus(null); clearFile(); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${msgType === tab.key ? 'bg-brand text-white border-brand' : 'border-border text-neutral-400 hover:text-white hover:border-neutral-500'}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Forms ─── */}
            <div className="flex gap-4">
                {msgType === 'text' && <TArea label="Mensagem" value={text} onChange={setText} placeholder="Digite sua mensagem..." rows={7} />}

                {isFileMode && msgType !== 'audio' && (
                    <div className="space-y-3 flex-1">
                        <FileZone
                            label={`Arquivo de ${msgType === 'image' ? 'Imagem' : msgType === 'video' ? 'Vídeo' : 'Documento'}`}
                            accept={currentTab?.accept}
                            file={mediaFile} onFile={setMediaFile} onClear={clearFile}
                            uploading={isSending && !!mediaFile} progress={uploadProgress}
                        />
                        <TArea label="Legenda (opcional)" value={caption} onChange={setCaption} placeholder="Descrição da mídia..." rows={2} />
                    </div>
                )}

                {msgType === 'audio' && (
                    <div className="space-y-3 flex-1">
                        <FileZone label="Arquivo de Áudio" accept="audio/*" file={mediaFile} onFile={setMediaFile} onClear={clearFile} uploading={isSending && !!mediaFile} progress={uploadProgress} />
                        <p className="text-xs text-neutral-500">Enviado como voz (PTT). Suporta .mp3, .ogg, .wav, .m4a.</p>
                    </div>
                )}
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                    <FieldLabel label="Data e Hora" />
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors"
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <button onClick={() => setHumanize(h => !h)} className="text-neutral-400">
                        {humanize ? <ToggleRight className="w-8 h-8 text-brand" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                    <span className="text-xs text-neutral-400 font-medium tracking-wide flex flex-col pt-1">
                        <span className="text-white uppercase">Humanize</span>
                        <span className="text-neutral-500 lowercase">(simula digitação por 10s)</span>
                    </span>
                </label>
            </div>


            {/* Upload info */}
            {isFileMode && (
                <p className="text-xs text-neutral-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    A mídia será indexada e enviada via link privado pelo micro-serviço do Evolution.
                </p>
            )}


            {/* Sending progress */}
            {isSending && isFileMode && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                    <p className="text-xs text-neutral-500">Fazendo upload... {uploadProgress}%</p>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Status */}
            {status && (
                <div className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${status.ok ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                    <div className="flex items-center gap-2">
                        {status.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                        {status.msg}
                    </div>
                </div>
            )}

            {/* Send */}
            <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSchedule} 
                disabled={isSending} 
                className="w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
            >
                {isSending ? <><Loader2 className="w-4 h-4 animate-spin" />{uploadProgress < 100 && isFileMode ? `Enviando arquivo... ${uploadProgress}%` : 'Agendando...'}</> : <><Send className="w-4 h-4" />Agendar para Todos os Grupos</>}
            </motion.button>
        </motion.div>
    );
}
