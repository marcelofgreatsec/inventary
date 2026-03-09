'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, HardDrive, Shield, Server, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import styles from './Dashboard.module.css';

interface Stats {
    assets: number;
    assetsOk: number;
    backups: number;
    backupsFail: number;
    licenses: number;
    licensesCost: number;
    infra: number;
    infraOnline: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<string>('');
    const supabase = createClient();

    useEffect(() => {
        const load = async () => {
            const { data: { user: u } } = await supabase.auth.getUser();
            if (u) setUser(u.user_metadata?.full_name || u.email?.split('@')[0] || 'Operador');

            const [assets, backups, licenses, infra] = await Promise.all([
                supabase.from('assets').select('status'),
                supabase.from('backups').select('status'),
                supabase.from('licenses').select('status, monthly_cost'),
                supabase.from('infrastructure').select('status'),
            ]);

            const assetsData = assets.data || [];
            const backupsData = backups.data || [];
            const licensesData = licenses.data || [];
            const infraData = infra.data || [];

            setStats({
                assets: assetsData.length,
                assetsOk: assetsData.filter(a => a.status === 'Ativo').length,
                backups: backupsData.length,
                backupsFail: backupsData.filter(b => b.status === 'Falha').length,
                licenses: licensesData.length,
                licensesCost: licensesData.reduce((s, l) => s + (l.monthly_cost || 0), 0),
                infra: infraData.length,
                infraOnline: infraData.filter(i => i.status === 'Online').length,
            });
            setLoading(false);
        };
        load();
    }, []);

    const fmt = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

    const kpis = stats ? [
        {
            label: 'Ativos Totais',
            value: stats.assets,
            sub: `${stats.assetsOk} ativos`,
            icon: Package,
            color: '#4f8ef7',
            ok: true,
        },
        {
            label: 'Backups',
            value: stats.backups,
            sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s)` : 'Todos OK',
            icon: HardDrive,
            color: stats.backupsFail > 0 ? '#ef4444' : '#22d3a5',
            ok: stats.backupsFail === 0,
        },
        {
            label: 'Custo Licenças',
            value: fmt(stats.licensesCost),
            sub: `${stats.licenses} licença(s)`,
            icon: Shield,
            color: '#f59e0b',
            ok: true,
        },
        {
            label: 'Infraestrutura',
            value: stats.infra,
            sub: `${stats.infraOnline} online`,
            icon: Server,
            color: '#a78bfa',
            ok: stats.infraOnline === stats.infra,
        },
    ] : [];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Painel de Controle</h1>
                    <p className="page-subtitle">
                        Bem-vindo, <strong>{user}</strong> •{' '}
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className={styles.kpiGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`card ${styles.kpiSkeleton}`}>
                            <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 36, width: '40%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 14, width: '50%' }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.kpiGrid}>
                    {kpis.map(k => (
                        <div key={k.label} className={`card ${styles.kpi}`} style={{ '--c': k.color } as any}>
                            <div className={styles.kpiTop}>
                                <div className={styles.kpiIcon} style={{ background: `${k.color}18` }}>
                                    <k.icon size={22} color={k.color} />
                                </div>
                                <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                    {k.ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                                    {k.ok ? 'OK' : 'Atenção'}
                                </span>
                            </div>
                            <div className={styles.kpiValue}>{k.value}</div>
                            <div className={styles.kpiLabel}>{k.label}</div>
                            <div className={styles.kpiSub}>{k.sub}</div>
                            <div className={styles.kpiBar}>
                                <div className={styles.kpiBarFill} style={{ background: k.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.row2}>
                <div className={`card ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <TrendingUp size={18} color="#4f8ef7" />
                        <span className={styles.cardTitle}>Status de Conformidade</span>
                    </div>
                    <div className={styles.complianceItems}>
                        {[
                            { label: 'Inventário atualizado', ok: (stats?.assetsOk ?? 0) > 0 },
                            { label: 'Backups Funcionando', ok: (stats?.backupsFail ?? 1) === 0 },
                            { label: 'Licenças Ativas', ok: (stats?.licenses ?? 0) > 0 },
                            { label: 'Infra Monitorada', ok: (stats?.infraOnline ?? 0) > 0 },
                        ].map(item => (
                            <div key={item.label} className={styles.complianceRow}>
                                {item.ok
                                    ? <CheckCircle size={16} color="var(--green)" />
                                    : <Clock size={16} color="var(--amber)" />
                                }
                                <span style={{ color: item.ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`card ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <AlertTriangle size={18} color="#f59e0b" />
                        <span className={styles.cardTitle}>Ações Recentes</span>
                    </div>
                    <div className={styles.actionsPlaceholder}>
                        <p>Acesse a seção de <strong>Administração</strong> para ver os logs completos de auditoria do sistema.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
