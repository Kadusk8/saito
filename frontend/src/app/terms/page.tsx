import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Termos de Uso | Saito',
    description: 'Termos de Uso da plataforma Saito.',
};

export default function TermsPage() {
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
                    <h1 className="text-4xl font-black text-white mb-4">Termos de Uso</h1>
                    <p className="text-foreground-muted">Última atualização: Março de 2025</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-8 text-foreground-muted leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Aceitação dos Termos</h2>
                        <p>Ao acessar e usar a plataforma Saito, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Descrição do Serviço</h2>
                        <p>O Saito é uma plataforma de gestão avançada de grupos de WhatsApp com funcionalidades de governança, moderação por IA, campanhas de disparo em massa e relatórios de engajamento. O serviço é oferecido mediante assinatura paga.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Uso Permitido</h2>
                        <p>Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. É expressamente proibido:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Enviar spam ou mensagens não solicitadas em massa</li>
                            <li>Usar o serviço para disseminar conteúdo ilegal, difamatório ou discriminatório</li>
                            <li>Violar os Termos de Serviço do WhatsApp ou Meta</li>
                            <li>Tentar acessar sistemas ou contas sem autorização</li>
                            <li>Revender ou sublicenciar o acesso à plataforma sem autorização expressa</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Contas e Responsabilidade</h2>
                        <p>Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de uso não autorizado.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Assinaturas e Pagamentos</h2>
                        <p>As assinaturas são cobradas mensalmente ou anualmente, conforme o plano escolhido. Os valores são cobrados antecipadamente e não são reembolsáveis, exceto conforme exigido por lei. O cancelamento pode ser feito a qualquer momento e terá efeito ao final do período pago.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Propriedade Intelectual</h2>
                        <p>Todo o conteúdo, software, design e tecnologia da plataforma Saito são de propriedade exclusiva da empresa ou de seus licenciadores e são protegidos por leis de propriedade intelectual.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Limitação de Responsabilidade</h2>
                        <p>O Saito não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso do serviço. Nossa responsabilidade total será limitada ao valor pago pelo serviço nos últimos 3 meses.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Rescisão</h2>
                        <p>Reservamo-nos o direito de suspender ou encerrar sua conta imediatamente, sem aviso prévio, em caso de violação destes Termos ou por qualquer outra razão a nosso exclusivo critério.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Alterações nos Termos</h2>
                        <p>Podemos modificar estes Termos a qualquer momento. Notificaremos você sobre alterações significativas por e-mail ou por meio da plataforma. O uso continuado após as alterações constitui aceitação dos novos Termos.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Contato</h2>
                        <p>Dúvidas sobre estes Termos? Entre em contato: <a href="mailto:contato@saito.app.br" className="text-brand hover:underline">contato@saito.app.br</a></p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border-subtle text-center">
                    <Link href="/" className="text-brand hover:underline text-sm">← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
    );
}
