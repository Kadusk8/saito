import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Saito | Missão de Controle',
  description: 'Governança avançada e IA para grupos de WhatsApp',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased dark selection:bg-brand selection:text-white`}>
      <body className="bg-background text-foreground min-h-screen w-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
