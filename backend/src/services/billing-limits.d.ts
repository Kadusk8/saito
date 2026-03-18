export type PlanLevel = 'starter' | 'pro' | 'enterprise' | 'free';
/**
 * Maps Stripe price IDs to Plan Levels
 */
export declare function getPlanLevelFromPriceId(priceId: string | undefined | null): PlanLevel;
/**
 * Returns the maximum allowed WhatsApp Instances for a given Plan Level
 */
export declare function getMaxInstancesForPlan(level: PlanLevel): number;
/**
 * Validates if the organization can create a new WA instance.
 * Throws an error string if blocked.
 */
export declare function checkInstanceCreationLimit(organizationId: string, subscription: any): Promise<{
    allowed: boolean;
    reason?: string;
}>;
/**
 * Checks if the plan level allows Premium features like Humanization strings
 */
export declare function canUsePremiumBroadcasting(level: PlanLevel): boolean;
//# sourceMappingURL=billing-limits.d.ts.map