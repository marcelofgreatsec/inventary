import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Inventary — Gestão de TI',
    description: 'Sistema premium de inventário e compliance de TI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>{children}</body>
        </html>
    );
}
