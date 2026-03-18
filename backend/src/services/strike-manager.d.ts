export declare class StrikeManager {
    static addStrike(groupId: string, memberJid: string, reason: string, instanceName: string, groupJid: string): Promise<void>;
    static resetStrikes(memberId: string): Promise<void>;
    static incrementMessageCount(groupId: string, memberJid: string): Promise<void>;
}
//# sourceMappingURL=strike-manager.d.ts.map