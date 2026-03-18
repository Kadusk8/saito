import { Sidebar } from '@/components/Sidebar';
import { AgenteFloatingBubble } from '@/components/AgenteFloatingBubble';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
                {children}
            </main>
            <AgenteFloatingBubble />
        </>
    );
}
