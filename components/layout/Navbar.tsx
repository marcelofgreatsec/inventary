'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
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
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
        };
        update();
        const t = setInterval(update, 30000);
        return () => clearInterval(t);
    }, []);

    const toggleSidebar = () => {
        document.dispatchEvent(new CustomEvent('toggle-sidebar'));
    };

    return (
        <header className={styles.navbar}>

            {/* Left: hamburger + breadcrumb */}
            <div className={styles.left}>
                <button
                    className={styles.hamburger}
                    onClick={toggleSidebar}
                    aria-label="Abrir menu de navegação"
                >
                    <Menu size={16} />
                </button>
                <div className={styles.breadcrumb}>
                    <span className={styles.breadcrumbRoot}>Inventary</span>
                    <span className={styles.breadcrumbSep}>/</span>
                    <h1 className={styles.title}>{title}</h1>
                </div>
            </div>

            {/* Right: datetime + bell + avatar */}
            <div className={styles.right}>
                <div className={styles.clock}>
                    <span className={styles.clockDate}>{date}</span>
                    <span className={styles.clockSep}>·</span>
                    <span className={styles.clockTime}>{time}</span>
                </div>
                <button className={styles.iconBtn} aria-label="Notificações">
                    <Bell size={15} />
                    <span className={styles.notifDot} />
                </button>
                <div className={styles.avatar} title={userEmail}>{initials}</div>
            </div>

        </header>
    );
}
