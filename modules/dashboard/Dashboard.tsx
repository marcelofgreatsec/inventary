'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface Log { id: string; action: string; table_name: string; user_email?: string; created_at: string; }

const ACTION_MAP: Record<string, string> = { 'CREATE': 'badge-green', 'DELETE': 'badge-red', 'UPDATE': 'badge-amber' };

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [user, setUser] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fmt = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

    const load = useCallback(async () => {
        try {
            const [assetsRes, backupsRes, licensesRes, infraRes, logsRes] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/backups'),
                fetch('/api/licenses'),
                fetch('/api/infrastructure'),
                fetch('/api/admin/logs'),
            ]);

            // If any returns 401, the user is not logged in yet — bail
            if (!assetsRes.ok) { setLoading(false); return; }

            const [assetsData, backupsData, licensesData, infraData, logsData] = await Promise.all([
                assetsRes.json(), backupsRes.json(), licensesRes.json(), infraRes.json(), logsRes.json()
            ]);

            setStats({
                assets: assetsData.length,
                assetsOk: assetsData.filter((a: { status: string }) => a.status === 'Ativo').length,
                backups: backupsData.length,
                backupsFail: backupsData.filter((b: { status: string }) => b.status === 'Falha').length,
                licenses: licensesData.length,
                licensesCost: licensesData.reduce((s: number, l: { monthly_cost: number }) => s + (l.monthly_cost || 0), 0),
                infra: infraData.length,
                infraOnline: infraData.filter((i: { status: string }) => i.status === 'Online').length,
            });
            setLogs(Array.isArray(logsData) ? logsData.slice(0, 5) : []);
        } catch { /* silent fail */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Get user name from localStorage/cookie via a client call
        const getUser = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                const { data: { user: u } } = await supabase.auth.getUser();
                if (u) setUser(u.user_metadata?.full_name || u.email?.split('@')[0] || 'Operador');
            } catch { /* ignore */ }
        };
        getUser();
        load();
    }, [load]);

    const kpis = stats ? [
        { label: 'Ativos Totais', value: stats.assets, sub: `${stats.assetsOk} ativos`, icon: Package, color: 'var(--blue)', ok: true },
        { label: 'Backups', value: stats.backups, sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s)` : 'Todos OK', icon: HardDrive, color: stats.backupsFail > 0 ? 'var(--red)' : 'var(--accent)', ok: stats.backupsFail === 0 },
        { label: 'Custo Licenças', value: fmt(stats.licensesCost), sub: `${stats.licenses} licença(s)`, icon: Shield, color: 'var(--amber)', ok: true },
        { label: 'Infraestrutura', value: stats.infra, sub: `${stats.infraOnline} online`, icon: Server, color: 'var(--purple)', ok: stats.infraOnline === stats.infra || stats.infra === 0 },
    ] : [];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Painel de Controle</h1>
                    <p className="page-subtitle">
                        Bem-vindo, <strong style={{ color: 'var(--accent)' }}>{user}</strong>{user && ' • '}
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={load} style={{ fontSize: 12 }}>↺ Atualizar</button>
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
                        <div key={k.label} className={`card ${styles.kpi}`}>
                            <div className={styles.kpiTop}>
                                <div className={styles.kpiIcon} style={{ background: `color-mix(in srgb, ${k.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${k.color} 25%, transparent)` }}>
                                    <k.icon size={22} color={k.color} />
                                </div>
                                <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                    {k.ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                                    {k.ok ? 'OK' : 'Atenção'}
                                </span>
                            </div>
                            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
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
                        <TrendingUp size={18} color="var(--accent)" />
                        <span className={styles.cardTitle}>Status de Conformidade</span>
                    </div>
                    <div className={styles.complianceItems}>
                        {[
                            { label: 'Inventário atualizado', ok: (stats?.assetsOk ?? 0) > 0 },
                            { label: 'Backups Funcionando', ok: (stats?.backupsFail ?? 1) === 0 && (stats?.backups ?? 0) > 0 },
                            { label: 'Licenças Ativas', ok: (stats?.licenses ?? 0) > 0 },
                            { label: 'Infra Monitorada', ok: (stats?.infraOnline ?? 0) > 0 },
                        ].map(item => (
                            <div key={item.label} className={styles.complianceRow}>
                                {item.ok
                                    ? <CheckCircle size={16} color="var(--green)" />
                                    : <Clock size={16} color="var(--amber)" />
                                }
                                <span style={{ color: item.ok ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 13 }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`card ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <AlertTriangle size={18} color="var(--amber)" />
                        <span className={styles.cardTitle}>Ações Recentes</span>
                    </div>
                    {logs.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>
                            Nenhuma ação registrada ainda.<br />
                            Crie um ativo ou backup para ver os logs aqui.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {logs.map(l => (
                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                                    <span className={`badge ${ACTION_MAP[l.action] || 'badge-blue'}`}>{l.action}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{l.table_name}</span>
                                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                                        {new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
