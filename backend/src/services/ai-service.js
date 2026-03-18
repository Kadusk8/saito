"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
class AIService {
    static _openai;
    static get openai() {
        if (!this._openai) {
            this._openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY || ''
            });
        }
        return this._openai;
    }
    /**
     * Avalia a intenção da mensagem considerando uma lista de palavras negativas.
     */
    static async evaluateMessageIntent(message, groupBlacklist) {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY is not set. Skipping AI moderation.");
            return { isInfraction: false, reason: '' };
        }
        if (!groupBlacklist || groupBlacklist.length === 0) {
            return { isInfraction: false, reason: '' };
        }
        const prompt = `
      Você é um moderador super-rígido de um grupo de WhatsApp focado em evitar SPAM, GOLPES e OFENSAS.
      Sua tarefa é analisar a mensagem abaixo e determinar se ela viola as regras, mesmo que tente camuflar palavras-chave.
      
      Blacklist de Palavras/Temas Proibidos: ${groupBlacklist.map(w => `"${w}"`).join(', ')}
      
      Mensagem do Usuário: "${message}"
      
      Critérios de Infração:
      1. TENTATIVA DE VENDA/PROMOÇÃO: Uso de palavras como "vendas", "promoção", "clique aqui", "saiba mais" (mesmo camufladas como v3nd4s, v.enda, etc).
      2. LINKS EXTERNOS: Se a mensagem parecer focar em levar o usuário para fora do grupo (link de outros grupos, produtos, afiliados).
      3. GOLPES/SCAMS: Promessas de dinheiro fácil, investimentos, Pix, jogos de azar (Blaze, Tigrinho).
      4. OFENSAS: Linguagem abusiva, preconceituosa ou agressiva.
      
      Responda ESTRITAMENTE em formato JSON com as seguintes propriedades:
      "isInfraction" (boolean): true se violou as regras, false caso contrário.
      "reason" (string): uma breve explicação técnica do porquê violou.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                return { isInfraction: false, reason: '' };
            return JSON.parse(content);
        }
        catch (err) {
            console.error("OpenAI API Error during intent evaluation:", err);
            return { isInfraction: false, reason: '' };
        }
    }
    /**
     * Verifica se a mensagem está de acordo com o tópico definido para o grupo.
     */
    static async evaluateTopicConsistency(message, topic) {
        if (!process.env.OPENAI_API_KEY || !topic) {
            return { isInfraction: false, reason: '' };
        }
        const prompt = `
      Você é um moderador de grupo de WhatsApp. O tema/tópico oficial do grupo é: "${topic}".
      Analise a mensagem abaixo e determine se ela é totalmente irrelevante ou "off-topic" em relação a esse tema.
      
      Mensagem: "${message}"
      
      Importante:
      - Seja tolerante com conversas casuais curtas, mas rígido com propagandas de outros assuntos, spam ou discussões que não têm nada a ver com o tema.
      - Se a mensagem for claramente for fora do tópico, considere uma infração.
      
      Responda ESTRITAMENTE em formato JSON:
      "isInfraction" (boolean): true se for off-topic, false caso contrário.
      "reason" (string): justificativa curta se for true.
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                return { isInfraction: false, reason: '' };
            return JSON.parse(content);
        }
        catch (err) {
            console.error("OpenAI API Error during topic evaluation:", err);
            return { isInfraction: false, reason: '' };
        }
    }
    /**
     * Chat genérico para o Planejador e Agente.
     */
    static async chat(messages, systemPrompt, temperature = 0.7) {
        if (!process.env.OPENAI_API_KEY)
            throw new Error('OPENAI_API_KEY not configured');
        // Formata mensagens para o formato da OpenAI
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'model' ? 'assistant' : m.role,
                content: m.parts?.[0]?.text || m.content || ''
            }))
        ];
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: formattedMessages,
            temperature
        });
        return { text: response.choices[0]?.message?.content || '' };
    }
    /**
     * Refina uma copy para WhatsApp.
     */
    static async refine(prompt) {
        if (!process.env.OPENAI_API_KEY)
            throw new Error('OPENAI_API_KEY not configured');
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_completion_tokens: 512
        });
        return response.choices[0]?.message?.content || '';
    }
    /**
     * Analisa um lead com base na mensagem.
     */
    static async analyzeLead(message) {
        if (!process.env.OPENAI_API_KEY) {
            return { classification: 'cold', keywords_matched: [], reasoning: 'API Key missing' };
        }
        const prompt = `Analise esta mensagem de um grupo de WhatsApp durante um lançamento de produto e classifique o lead.

Mensagem: "${message}"

Responda SOMENTE em JSON com este formato:
{
  "classification": "hot" | "warm" | "cold",
  "keywords_matched": ["palavra1", "palavra2"],
  "reasoning": "explicação em 1 frase"
}

Classificação:
- hot: Pronto para comprar. Menciona preço, parcelamento, garantia, desconto, comprar agora, como pagar
- warm: Interessado mas com dúvidas. Faz perguntas sobre o produto, pede mais informações
- cold: Apenas curioso ou sem intenção clara de compra`;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                return { classification: 'cold', keywords_matched: [], reasoning: '' };
            return JSON.parse(content);
        }
        catch (err) {
            console.error("OpenAI API Error during lead analysis:", err);
            return { classification: 'cold', keywords_matched: [], reasoning: 'Error during analysis' };
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=ai-service.js.map