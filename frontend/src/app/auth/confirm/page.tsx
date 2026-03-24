'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// This page handles the hash-based Supabase auth callback (invite, magic link)
// The /auth/confirm/route.ts handles the PKCE flow (token_hash in query params)
// This page handles the implicit flow (access_token in the URL hash fragment)
export default function AuthConfirmPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/dashboard';

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Parse the hash fragment from the URL to extract auth tokens
        const hash = window.location.hash.substring(1); // Remove leading #
        if (!hash) {
            // No hash, check if there's an error in query params
            const error = searchParams.get('error');
            if (error) {
                router.replace(`/login?error=${error}`);
            } else {
                router.replace('/dashboard');
            }
            return;
        }

        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        if (access_token && refresh_token) {
            supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
                if (error) {
                    console.error('Failed to set session:', error);
                    router.replace('/login?error=link_expired');
                } else {
                    // If this is an invite, the user needs to set their password
                    if (type === 'invite') {
                        router.replace('/signup/set-password');
                    } else {
                        router.replace(next);
                    }
                }
            });
        } else {
            router.replace('/login?error=link_expired');
        }
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
