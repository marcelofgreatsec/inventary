'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import styles from './Navbar.module.css';

const titles: Record<string, { label: string; prefix: string }> = {
    '/':               { label: 'Dashboard',         prefix: 'Relatório Executivo'   },
    '/inventario':     { label: 'Inventário',         prefix: 'Gestão de Ativos'      },
    '/backups':        { label: 'Backups',            prefix: 'Gestão de Backups'     },
    '/licencas':       { label: 'Licenças',           prefix: 'Software & Compliance' },
    '/documentacoes':  { label: 'Documentações',      prefix: 'Base de Conhecimento'  },
    '/infraestrutura': { label: 'Infraestrutura',     prefix: 'Mapeamento de Rede'    },
    '/administracao':  { label: 'Administração',      prefix: 'Configurações'         },
};

export default function Navbar({ userEmail }: { userEmail?: string }) {
    const pathname = usePathname();
    const page     = titles[pathname] ?? { label: 'Sistema', prefix: 'Inventary FGREAT' };
    const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??';

    const toggleSidebar = () => {
        document.dispatchEvent(new CustomEvent('toggle-sidebar'));
    };

    return (
        <header className={styles.navbar}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                    className={styles.hamburger}
                    onClick={toggleSidebar}
                    aria-label="Abrir menu de navegação"
                >
                    <Menu size={18} />
                </button>
                <div className={styles.titleWrapper}>
                    <span className={styles.titlePrefix}>{page.prefix}</span>
                    <h1 className={styles.title}>{page.label}</h1>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.iconBtn} aria-label="Notificações">
                    <Bell size={17} />
                    <span className={styles.notifDot} />
                </button>
                <div className={styles.avatar} title={userEmail}>{initials}</div>
            </div>
        </header>
    );
}
