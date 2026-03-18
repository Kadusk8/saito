export declare class AIService {
    private static _openai;
    private static get openai();
    /**
     * Avalia a intenção da mensagem considerando uma lista de palavras negativas.
     */
    static evaluateMessageIntent(message: string, groupBlacklist: string[]): Promise<{
        isInfraction: boolean;
        reason: string;
    }>;
    /**
     * Verifica se a mensagem está de acordo com o tópico definido para o grupo.
     */
    static evaluateTopicConsistency(message: string, topic: string): Promise<{
        isInfraction: boolean;
        reason: string;
    }>;
    /**
     * Chat genérico para o Planejador e Agente.
     */
    static chat(messages: any[], systemPrompt: string, temperature?: number): Promise<{
        text: string;
    }>;
    /**
     * Refina uma copy para WhatsApp.
     */
    static refine(prompt: string): Promise<string>;
    /**
     * Analisa um lead com base na mensagem.
     */
    static analyzeLead(message: string): Promise<{
        classification: string;
        keywords_matched: string[];
        reasoning: string;
    }>;
}
//# sourceMappingURL=ai-service.d.ts.map