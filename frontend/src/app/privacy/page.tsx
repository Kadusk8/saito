import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Política de Privacidade | Saito',
    description: 'Política de Privacidade da plataforma Saito.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <div className="mb-12 flex flex-col items-center text-center">
                    <Link href="/" className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-brand" />
                        </div>
                        <span className="font-black text-lg text-white">Saito</span>
                    </Link>
                    <h1 className="text-4xl font-black text-white mb-4">Política de Privacidade</h1>
                    <p className="text-foreground-muted">Última atualização: Março de 2025</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8 text-foreground-muted leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Dados que Coletamos</h2>
                        <p>Coletamos os seguintes tipos de informações:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong className="text-white">Dados de Conta:</strong> nome, endereço de e-mail e senha ao se cadastrar.</li>
                            <li><strong className="text-white">Dados de Pagamento:</strong> processados com segurança pelo Stripe — não armazenamos dados de cartão.</li>
                            <li><strong className="text-white">Dados de Uso:</strong> informações sobre como você interage com a plataforma para fins de melhoria do serviço.</li>
                            <li><strong className="text-white">Dados de Grupos:</strong> informações sobre os grupos gerenciados, como membros e mensagens (necessárias para o funcionamento da plataforma).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Como Usamos seus Dados</h2>
                        <p>Utilizamos suas informações para:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Fornecer, operar e melhorar a plataforma Saito</li>
                            <li>Processar pagamentos e gerenciar sua assinatura</li>
                            <li>Enviar notificações e comunicações relacionadas ao serviço</li>
                            <li>Cumprir obrigações legais e regulatórias</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Compartilhamento de Dados</h2>
                        <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong className="text-white">Stripe:</strong> para processamento seguro de pagamentos.</li>
                            <li><strong className="text-white">Supabase:</strong> provedor de banco de dados e autenticação.</li>
                            <li><strong className="text-white">Meta / WhatsApp:</strong> necessário para integração via Evolution API.</li>
                            <li>Autoridades legais, quando exigido por lei.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Segurança dos Dados</h2>
                        <p>Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou divulgação. Todos os dados são transmitidos via HTTPS e armazenados com criptografia.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Retenção de Dados</h2>
                        <p>Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer o serviço. Após o cancelamento, podemos reter dados por até 90 dias antes da exclusão definitiva.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Seus Direitos (LGPD)</h2>
                        <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Acessar, corrigir ou deletar seus dados pessoais</li>
                            <li>Revogar o consentimento para uso dos seus dados</li>
                            <li>Solicitar portabilidade dos seus dados</li>
                            <li>Ser informado sobre o uso dos seus dados</li>
                        </ul>
                        <p className="mt-3">Para exercer esses direitos, entre em contato: <a href="mailto:privacidade@saito.app.br" className="text-brand hover:underline">privacidade@saito.app.br</a></p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Cookies</h2>
                        <p>Usamos cookies essenciais para autenticação e funcionamento da plataforma. Não usamos cookies de rastreamento de terceiros para publicidade.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Alterações nesta Política</h2>
                        <p>Podemos atualizar esta Política periodicamente. Notificaremos você sobre alterações significativas por e-mail. Recomendamos revisar esta página regularmente.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Contato</h2>
                        <p>Dúvidas sobre privacidade? Fale conosco: <a href="mailto:privacidade@saito.app.br" className="text-brand hover:underline">privacidade@saito.app.br</a></p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border-subtle text-center">
                    <Link href="/" className="text-brand hover:underline text-sm">← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
    );
}
