'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';

interface CreateGroupButtonProps {
    instanceName: string;
}

export function CreateGroupButton({ instanceName }: CreateGroupButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-all"
            >
                <Plus className="w-4 h-4" />
                Criar Grupo
            </motion.button>
            <AnimatePresence>
                {open && (
                    <CreateGroupModal
                        instanceName={instanceName}
                        onClose={() => setOpen(false)}
                        onCreated={async () => {
                            try {
                                await api.post(`/api/instances/${instanceName}/groups/sync`);
                            } catch (e) {
                                console.error('Error auto-syncing:', e);
                            }
                            window.location.reload();
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
