'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard, Package, HardDrive, FileText,
    Shield, Server, Settings, LogOut, ChevronRight, X
} from 'lucide-react';
import styles from './Sidebar.module.css';

const nav = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inventario', label: 'Inventário', icon: Package },
    { href: '/backups', label: 'Backups', icon: HardDrive },
    { href: '/licencas', label: 'Licenças', icon: Shield },
    { href: '/documentacoes', label: 'Documentações', icon: FileText },
    { href: '/infraestrutura', label: 'Infraestrutura', icon: Server },
    { href: '/administracao', label: 'Administração', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handler = () => setMobileOpen(o => !o);
        document.addEventListener('toggle-sidebar', handler);
        return () => document.removeEventListener('toggle-sidebar', handler);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <>
        {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
            <div className={styles.brand}>
                <div className={styles.brandIcon}>
                    <Shield size={20} color="var(--accent)" />
                </div>
                <div>
                    <div className={styles.brandName}>Inventary</div>
                    <div className={styles.brandSub}>Gestão de TI</div>
                </div>
                <button
                    className={styles.closeBtn}
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fechar menu"
                >
                    <X size={16} />
                </button>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navSection}>Principal</div>
                {nav.map(({ href, label, icon: Icon }) => {
                    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} className={`${styles.link} ${active ? styles.active : ''}`}>
                            <Icon size={17} className={styles.linkIcon} />
                            <span>{label}</span>
                            {active && <ChevronRight size={14} className={styles.chevron} />}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.bottom}>
                <button className={styles.logout} onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
        </>
    );
}
