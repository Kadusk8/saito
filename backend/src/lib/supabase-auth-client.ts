import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from '../middleware/auth';

/**
 * Retorna um cliente Supabase autenticado com o token do usuário da request,
 * permitindo que as queries respeitem as políticas de RLS do usuário.
 * Fallback para o client anônimo se não houver token.
 */
export function getAuthSupabase(request: AuthenticatedRequest): SupabaseClient {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new Error('No authorization token found on request');
    }

    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            global: { headers: { Authorization: `Bearer ${token}` } }
        }
    );
}
