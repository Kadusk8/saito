'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function AuthConfirmInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/dashboard';

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const handleAuth = async () => {
            // ── PKCE Flow: token_hash in query params ──────────────
            const token_hash = searchParams.get('token_hash');
            const type = searchParams.get('type') as any;

            if (token_hash && type) {
                const { error } = await supabase.auth.verifyOtp({ type, token_hash });
                if (!error) {
                    router.replace(next);
                } else {
                    router.replace('/login?error=link_expired');
                }
                return;
            }

            // ── Implicit Flow: access_token in URL hash fragment ───
            const hash = window.location.hash.substring(1);
            if (!hash) {
                const error = searchParams.get('error');
                router.replace(error ? `/login?error=${error}` : '/dashboard');
                return;
            }

            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const inviteType = params.get('type');

            if (access_token && refresh_token) {
                const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                if (error) {
                    router.replace('/login?error=link_expired');
                } else if (inviteType === 'invite' || inviteType === 'recovery') {
                    router.replace('/signup/set-password');
                } else {
                    router.replace(next);
                }
            } else {
                router.replace('/login?error=link_expired');
            }
        };

        handleAuth();
    }, [router, next, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-foreground-muted">Verificando seu acesso...</p>
            </div>
        </div>
    );
}

export default function AuthConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        }>
            <AuthConfirmInner />
        </Suspense>
    );
}
