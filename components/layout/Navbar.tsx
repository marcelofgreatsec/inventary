'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import styles from './Navbar.module.css';

const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/inventario': 'Inventário de Ativos',
    '/backups': 'Gestão de Backups',
    '/licencas': 'Licenças de Software',
    '/documentacoes': 'Documentações',
    '/infraestrutura': 'Infraestrutura',
    '/administracao': 'Administração',
};

export default function Navbar({ userEmail }: { userEmail?: string }) {
    const pathname = usePathname();
    const title = titles[pathname] ?? 'Sistema';
    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??';

    return (
        <header className={styles.navbar}>
            <div>
                <h1 className={styles.title}>{title}</h1>
            </div>
            <div className={styles.actions}>
                <button className={styles.iconBtn} aria-label="Notificações">
                    <Bell size={18} />
                    <span className={styles.badge} />
                </button>
                <div className={styles.avatar} title={userEmail}>{initials}</div>
            </div>
        </header>
    );
}
