'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

const titles: Record<string, string> = {
    '/':               'Dashboard',
    '/backups':        'Backups',
    '/licencas':       'Licenças',
    '/infosec':        'InfoSec',
    '/documentacoes':  'Documentações',
    '/archive':        'Archive',
    '/suppliers':      'Suppliers',
    '/administracao':  'Administração',
};

export default function Navbar({ userEmail }: { userEmail?: string }) {
    const pathname = usePathname();
    const title    = titles[pathname] ?? 'Sistema';
    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??';

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [time,  setTime]  = useState('');
    const [date,  setDate]  = useState('');

    useEffect(() => {
        const stored = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
        if (stored) setTheme(stored);
    }, []);

    useEffect(() => {
        const update = () => {
            const n = new Date();
            setTime(n.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            setDate(n.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        };
        update();
        const t = setInterval(update, 30_000);
        return () => clearInterval(t);
    }, []);

    const toggleTheme = () => {
        const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch { /* ignore */ }
    };

    const toggleSidebar = () => {
        document.dispatchEvent(new CustomEvent('toggle-sidebar'));
    };

    return (
        <header className={styles.navbar}>

            {/* Left */}
            <div className={styles.left}>
                <button
                    className={styles.hamburger}
                    onClick={toggleSidebar}
                    aria-label="Abrir menu"
                >
                    <Menu size={16} />
                </button>
                <nav className={styles.breadcrumb} aria-label="breadcrumb">
                    <span className={styles.breadcrumbRoot}>Inventary</span>
                    <span className={styles.breadcrumbSep} aria-hidden>/</span>
                    <h1 className={styles.title}>{title}</h1>
                </nav>
            </div>

            {/* Right */}
            <div className={styles.right}>
                <div className={styles.clock} aria-label="Data e hora">
                    <span>{date}</span>
                    <span className={styles.sep}>·</span>
                    <span>{time}</span>
                </div>

                <button
                    className={styles.iconBtn}
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                    title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                >
                    {theme === 'dark'
                        ? <Sun size={15} strokeWidth={1.8} />
                        : <Moon size={15} strokeWidth={1.8} />
                    }
                </button>

                <button className={styles.iconBtn} aria-label="Notificações">
                    <Bell size={15} strokeWidth={1.8} />
                    <span className={styles.notifDot} />
                </button>

                <div className={styles.avatar} title={userEmail}>{initials}</div>
            </div>

        </header>
    );
}
