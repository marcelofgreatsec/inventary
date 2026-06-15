import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Inventary — Gestão de TI',
    description: 'Sistema premium de inventário e compliance de TI',
};

/* This script runs synchronously before first paint, avoiding any theme flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
