'use client';

import { useState } from 'react';
import { Smartphone, Loader2, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';

export function ConnectInstanceModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [instanceName, setInstanceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        if (!instanceName.trim()) {
            setError('Digite um nome para a instância');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const data = await api.post('/api/instances', { instanceName: instanceName.trim() });

            // Check how Evolution returns it (v1 returns it here, v2 requires polling)
            let qr = data.data?.qrcode?.base64;
            let tries = 0;

            while (!qr && tries < 30) {
                await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds
                try {
                    const pollData = await api.get(`/api/instances/${instanceName.trim()}/qrcode`);
                    if (pollData && pollData.base64) {
                        qr = pollData.base64;
                    }
                } catch (e) {
                    // Ignore network errors and keep polling
                }
                tries++;
            }

            if (qr) {
                setQrCodeBase64(qr);
            } else {
                setError("O tempo limite foi excedido aguardando o QR Code (60 segundos). A API pode estar congestionada ou há um problema de conexão nos containers.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(true)}
                className="bg-brand text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-shadow"
            >
                <Smartphone className="w-5 h-5" />
                Conectar Novo Número
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>

                        <h2 className="text-xl font-bold text-white mb-2">Conectar Instância</h2>
                        <p className="text-neutral-400 text-sm mb-6">
                            Digite um nome de identificação para o número do WhatsApp. (Ex: suporte_01, sem acentos ou espaços)
                        </p>

                        {!qrCodeBase64 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-neutral-400 font-medium mb-1 block">Nome da Instância</label>
                                    <input
                                        type="text"
                                        value={instanceName}
                                        onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand"
                                        placeholder="ex: suporte_comercial"
                                    />
                                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConnect}
                                    disabled={isLoading}
                                    className="w-full bg-brand text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-shadow disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                                    Gerar QR Code
                                </motion.button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-white p-4 rounded-xl w-64 h-64 flex items-center justify-center">
                                    <img
                                        src={qrCodeBase64.includes('base64') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                                        alt="QR Code"
                                        className="max-w-full max-h-full"
                                    />
                                </div>
                                <p className="text-sm text-neutral-400 text-center">
                                    Aponte o celular e escaneie o QR Code dentro do WhatsApp (Aparelhos Conectados).
                                </p>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setQrCodeBase64(null);
                                        setInstanceName('');
                                    }}
                                    className="w-full mt-4 bg-surface-hover text-white py-2 rounded-xl text-sm font-medium border border-border hover:bg-white/5 transition-colors"
                                >
                                    Fechar Janela
                                </button>
                            </div>
                        )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
