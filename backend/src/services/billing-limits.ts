import { supabase } from '../db';

export type PlanLevel = 'starter' | 'pro' | 'enterprise' | 'free';

/**
 * Maps Stripe price IDs to Plan Levels
 */
export function getPlanLevelFromPriceId(priceId: string | undefined | null): PlanLevel {
    if (!priceId) return 'free';

    const STARTER_PRICE = process.env.STRIPE_STARTER_PRICE_ID;
    const PRO_PRICE = process.env.STRIPE_PRO_PRICE_ID;
    const ENTERPRISE_PRICE = process.env.STRIPE_ENTERPRISE_PRICE_ID;

    if (priceId === ENTERPRISE_PRICE) return 'enterprise';
    if (priceId === PRO_PRICE) return 'pro';
    if (priceId === STARTER_PRICE) return 'starter';

    // Fallback if price ID is unknown but they have an active sub
    return 'starter';
}

/**
 * Returns the maximum allowed WhatsApp Instances for a given Plan Level
 */
export function getMaxInstancesForPlan(level: PlanLevel): number {
    switch (level) {
        case 'enterprise': return 10;
        case 'pro': return 5;
        case 'starter': return 2;
        default: return 0; // Free has no WA instances allowed in our standard rule
    }
}

/**
 * Validates if the organization can create a new WA instance.
 * Throws an error string if blocked.
 */
export async function checkInstanceCreationLimit(organizationId: string, subscription: any): Promise<{ allowed: boolean, reason?: string }> {

    // Determine their plan level
    const level = getPlanLevelFromPriceId(subscription?.price_id);
    const maxAllowed = getMaxInstancesForPlan(level);

    // If maxAllowed is somehow 0 (free tier or err)
    if (maxAllowed === 0) {
        return { allowed: false, reason: 'Seu plano atual não permite criar conexões no WhatsApp. Faça upgrade para o plano Starter.' };
    }

    // Count how many ACTIVE instances this org already has
    const { count, error } = await supabase
        .from('instances')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

    if (error) {
        throw new Error('Falha ao contar as instâncias da conta.');
    }

    const currentCount = count || 0;

    if (currentCount >= maxAllowed) {
        return {
            allowed: false,
            reason: `Limite do plano atingido: Você já possui ${currentCount} de ${maxAllowed} instâncias permitidas no plano ${level.toUpperCase()}.`
        };
    }

    return { allowed: true };
}

/**
 * Checks if the plan level allows Premium features like Humanization strings
 */
export function canUsePremiumBroadcasting(level: PlanLevel): boolean {
    // Only Pro and Enterprise
    return level === 'pro' || level === 'enterprise';
}
