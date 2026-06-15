'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    LayoutDashboard, HardDrive, Shield, ShieldCheck,
    FileText, Archive, Building2, Settings, LogOut,
    ChevronRight, X, Zap
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navGroups = [
    {
        label: 'Geral',
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Operacional',
        items: [
            { href: '/backups',   label: 'Backups',   icon: HardDrive  },
            { href: '/licencas',  label: 'Licenças',  icon: Shield     },
            { href: '/archive',   label: 'Archive',   icon: Archive    },
            { href: '/suppliers', label: 'Suppliers', icon: Building2  },
        ],
    },
    {
        label: 'Segurança & Docs',
        items: [
            { href: '/infosec',       label: 'InfoSec',       icon: ShieldCheck },
            { href: '/documentacoes', label: 'Documentações', icon: FileText    },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { href: '/administracao', label: 'Administração', icon: Settings },
        ],
    },
];

export default function Sidebar() {
    const pathname    = usePathname();
    const router      = useRouter();
    const supabase    = createClient();
    const [mobileOpen,   setMobileOpen]   = useState(false);
    const [userEmail,    setUserEmail]    = useState('');
    const [userInitials, setUserInitials] = useState('??');

    useEffect(() => {
        const handler = () => setMobileOpen(o => !o);
        document.addEventListener('toggle-sidebar', handler);
        return () => document.removeEventListener('toggle-sidebar', handler);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    setUserEmail(user.email);
                    setUserInitials(user.email.slice(0, 2).toUpperCase());
                }
            } catch { /* ignore */ }
        };
        fetchUser();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <>
            {mobileOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>

                {/* ── Brand ── */}
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <Zap size={16} color="var(--accent)" strokeWidth={2.5} />
                    </div>
                    <div className={styles.brandInfo}>
                        <div className={styles.brandName}>Inventary</div>
                        <div className={styles.brandSub}>FGREAT Studio</div>
                    </div>
                    <span className={styles.brandBadge}>v2.1</span>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setMobileOpen(false)}
                        aria-label="Fechar menu"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className={styles.nav}>
                    {navGroups.map(group => (
                        <div key={group.label} className={styles.navGroup}>
                            <div className={styles.navGroupLabel}>{group.label}</div>
                            {group.items.map(({ href, label, icon: Icon }) => {
                                const active = href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(href);
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={`${styles.link} ${active ? styles.active : ''}`}
                                    >
                                        <Icon
                                            size={15}
                                            className={styles.linkIcon}
                                            strokeWidth={active ? 2.2 : 1.8}
                                        />
                                        <span>{label}</span>
                                        {active && (
                                            <ChevronRight size={12} className={styles.chevron} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* ── Footer ── */}
                <div className={styles.bottom}>
                    <div className={styles.statusRow}>
                        <div className={styles.statusDot} />
                        <span className={styles.statusText}>Sistema Online</span>
                    </div>
                    <div className={styles.userCard}>
                        <div className={styles.userAvatar}>{userInitials}</div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>
                                {userEmail.split('@')[0] || 'usuário'}
                            </div>
                            <div className={styles.userEmail}>{userEmail || '—'}</div>
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={handleLogout}
                            title="Sair da conta"
                            aria-label="Sair"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>

            </aside>
        </>
    );
}
