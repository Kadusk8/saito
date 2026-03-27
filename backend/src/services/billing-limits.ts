import { supabase } from '../db';

export type PlanLevel = 'starter' | 'pro' | 'master' | 'free';

/**
 * Maps Stripe price IDs to Plan Levels
 */
export function getPlanLevelFromPriceId(priceId: string | undefined | null): PlanLevel {
    if (!priceId) return 'free';

    const STARTER_PRICE = process.env.STRIPE_STARTER_PRICE_ID;
    const PRO_PRICE = process.env.STRIPE_PRO_PRICE_ID;
    const MASTER_PRICE = process.env.STRIPE_MASTER_PRICE_ID;

    if (priceId === MASTER_PRICE) return 'master';
    if (priceId === PRO_PRICE) return 'pro';
    if (priceId === STARTER_PRICE) return 'starter';

    return 'starter';
}

/**
 * Returns the maximum allowed WhatsApp Instances for a given Plan Level
 */
export function getMaxInstancesForPlan(level: PlanLevel): number {
    switch (level) {
        case 'master': return 15;
        case 'pro': return 5;
        case 'starter': return 2;
        default: return 0;
    }
}

/**
 * Returns the maximum allowed team members for a given Plan Level
 */
export function getMaxTeamMembersForPlan(level: PlanLevel): number {
    switch (level) {
        case 'master': return 10;
        case 'pro': return 2;
        case 'starter': return 1;
        default: return 1;
    }
}

/**
 * Validates if the organization can create a new WA instance.
 */
export async function checkInstanceCreationLimit(organizationId: string, subscription: any): Promise<{ allowed: boolean, reason?: string }> {
    const level = getPlanLevelFromPriceId(subscription?.price_id);
    const maxAllowed = getMaxInstancesForPlan(level);

    if (maxAllowed === 0) {
        return { allowed: false, reason: 'Seu plano atual não permite criar conexões no WhatsApp. Faça upgrade para o plano Starter.' };
    }

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
 * Validates if the organization can add a new team member.
 */
export async function checkTeamMemberLimit(organizationId: string, subscription: any): Promise<{ allowed: boolean, reason?: string }> {
    const level = getPlanLevelFromPriceId(subscription?.price_id);
    const maxAllowed = getMaxTeamMembersForPlan(level);

    const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

    if (error) {
        throw new Error('Falha ao contar os membros da equipe.');
    }

    const currentCount = count || 0;

    if (currentCount >= maxAllowed) {
        return {
            allowed: false,
            reason: `Limite do plano atingido: Seu plano ${level.toUpperCase()} permite até ${maxAllowed} ${maxAllowed === 1 ? 'membro' : 'membros'} de equipe.`
        };
    }

    return { allowed: true };
}

/**
 * Checks if the plan level allows Premium features like Humanization strings
 */
export function canUsePremiumBroadcasting(level: PlanLevel): boolean {
    return level === 'pro' || level === 'master';
}
