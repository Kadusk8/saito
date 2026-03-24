'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Zap } from 'lucide-react';

export default function SetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 8) {
            setError('A senha precisa ter no mínimo 8 caracteres.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.replace('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md glass rounded-3xl border border-border-subtle p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-brand" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Quase lá!</h1>
                <p className="text-foreground-muted mb-8">Crie uma senha para acessar sua conta Saito.</p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest block mb-2">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-foreground-muted uppercase tracking-widest block mb-2">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors"
                            placeholder="Repita a senha"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Definir Senha e Entrar →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
