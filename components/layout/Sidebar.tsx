'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard, Package, HardDrive, FileText,
    Shield, Server, Settings, LogOut, ChevronRight
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <div className={styles.brandIcon}>
                    <Shield size={20} color="#4f8ef7" />
                </div>
                <div>
                    <div className={styles.brandName}>Inventary</div>
                    <div className={styles.brandSub}>Gestão de TI</div>
                </div>
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
    );
}
