import { FastifyInstance } from 'fastify';
import { AIService } from '../services/ai-service';
import { authenticate } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../db';
import { createClient } from '@supabase/supabase-js';

export default async function aiRoutes(server: FastifyInstance) {
    // Helper to get an authenticated Supabase client using the request's token
    const getAuthSupabase = (request: AuthenticatedRequest) => {
        const authHeader = request.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) return supabase;

        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: { Authorization: `Bearer ${token}` }
                }
            }
        );
    };

    // AIService is used instead of local initialization

    // List all chats for the authenticated user
    server.get('/api/ai/chats', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const supabaseAuth = getAuthSupabase(request);
        const { data, error } = await supabaseAuth
            .from('ai_chats')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            return reply.code(500).send({ error: error.message });
        }

        return data;
    });

    // Get messages for a specific chat
    server.get('/api/ai/chats/:chatId/messages', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const { chatId } = request.params as { chatId: string };
        const supabaseAuth = getAuthSupabase(request);

        const { data, error } = await supabaseAuth
            .from('ai_messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) {
            return reply.code(500).send({ error: error.message });
        }

        return data.map((m: any) => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));
    });

    // Delete a specific chat and its messages
    server.delete('/api/ai/chats/:chatId', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const { chatId } = request.params as { chatId: string };
        const supabaseAuth = getAuthSupabase(request);

        // Delete messages first to avoid foreign key constraints (if not using cascade)
        const { error: msgError } = await supabaseAuth
            .from('ai_messages')
            .delete()
            .eq('chat_id', chatId);

        if (msgError) {
            return reply.code(500).send({ error: msgError.message });
        }

        const { error } = await supabaseAuth
            .from('ai_chats')
            .delete()
            .eq('id', chatId);

        if (error) {
            return reply.code(500).send({ error: error.message });
        }

        return { success: true };
    });

    server.post('/api/ai/chat', { preHandler: [authenticate] }, async (request: AuthenticatedRequest, reply) => {
        const { messages, chatId: existingChatId, title } = request.body as {
            messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
            chatId?: string,
            title?: string
        };

        if (!process.env.OPENAI_API_KEY) {
            return reply.code(500).send({ error: 'OPENAI_API_KEY not configured' });
        }

        if (!messages || !Array.isArray(messages)) {
            return reply.code(400).send({ error: 'messages array is required' });
        }

        try {
            let chatId = existingChatId;
            const supabaseAuth = getAuthSupabase(request);

            // 1. Ensure chat exists
            if (!chatId) {
                const userId = (request.user as { id: string }).id;
                const { data: newChat, error: chatError } = await supabaseAuth
                    .from('ai_chats')
                    .insert({
                        user_id: userId,
                        title: title || messages[messages.length - 1]?.parts?.[0]?.text?.substring(0, 50) || 'Nova Conversa'
                    })
                    .select()
                    .single();

                if (chatError) throw chatError;
                chatId = newChat.id;
            }

            // 2. Save the latest user message if it's not already in the DB
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                await supabaseAuth.from('ai_messages').insert({
                    chat_id: chatId,
                    role: 'user',
                    content: lastMessage.parts?.[0]?.text || ''
                });

                // Update chat timestamp
                await supabaseAuth.from('ai_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
            }

            const systemPrompt = `Você é o "Agente", o assistente virtual de inteligência artificial do Saito.
            Saito é uma plataforma SaaS premium para automação de WhatsApp, focada em Lançamentos, Super Grupos e Moderação Automática.
            
            Suas tarefas:
            1. Ajudar o usuário a navegar na plataforma.
            2. Dar dicas de marketing digital e estratégias de lançamento.
            3. Melhorar copies de mensagens para WhatsApp.
            4. Explicar funcionalidades (Super Grupos, Log de Strikes, Planejador).
            
            Diretrizes:
            - Seja extremamente cortês, profissional e estratégico.
            - Use um tom de "parceiro de negócios".
            - Formate suas respostas com Markdown para melhor legibilidade.
            - Mantenha respostas concisas e diretas ao ponto.
            - Nunca mencione que você é um modelo da Google ou o nome "Gemini" a menos que perguntado especificamente. Você é o Agente Saito.`;

            const aiResult = await AIService.chat(messages, systemPrompt);
            const text = aiResult.text || 'Desculpe, não consegui gerar uma resposta no momento.';

            // 3. Save AI response
            await supabaseAuth.from('ai_messages').insert({
                chat_id: chatId,
                role: 'model',
                content: text
            });

            return { text, chatId };
        } catch (error: any) {
            server.log.error({ err: error, body: request.body }, 'AI Chat Error');
            return reply.code(500).send({
                error: error.message || 'Failed to generate AI response',
                details: error.response?.data || error.stack
            });
        }
    });
}
