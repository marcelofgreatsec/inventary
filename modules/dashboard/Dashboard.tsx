'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Package, HardDrive, Shield, Server,
    AlertTriangle, CheckCircle, Clock, TrendingUp,
    DollarSign, Activity, RefreshCw
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import styles from './Dashboard.module.css';

interface Stats {
    assets: number; assetsOk: number; assetsMaint: number;
    backups: number; backupsFail: number;
    licenses: number; licensesCost: number;
    infra: number; infraOnline: number;
}
interface Log { id: string; action: string; table_name: string; user_email?: string; created_at: string; }
interface CostData { name: string; value: number; }

const STATUS_COLORS = ['#00d4aa', '#f59e0b', '#f43f5e'];

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Skeleton KPI card
function SkeletonKpi() {
    return (
        <div className={`card ${styles.kpi} ${styles.skeletonKpi}`}>
            <div className={styles.kpiTop}>
                <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 12 }} />
                <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 4 }} />
            </div>
            <div className="skeleton" style={{ width: '50%', height: 32, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 4, marginBottom: 4 }} />
            <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
        </div>
    );
}

// Custom chart tooltip
const ChartTooltip = ({ active, payload, label, fmt }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-mid)',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: 'var(--shadow)',
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
        }}>
            {label && <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>}
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ color: p.color || 'var(--accent)' }}>
                    {fmt ? fmt(p.value) : p.value}
                </div>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const [stats,     setStats]     = useState<Stats | null>(null);
    const [logs,      setLogs]      = useState<Log[]>([]);
    const [alerts,    setAlerts]    = useState<any[]>([]);
    const [costData,  setCostData]  = useState<CostData[]>([]);
    const [user,      setUser]      = useState<string>('');
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const fmt = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

    const load = useCallback(async () => {
        setError(false);
        setIsSyncing(true);
        try {
            const [assetsRes, backupsRes, licensesRes, infraRes, logsRes] = await Promise.all([
                fetch('/api/assets'),
                fetch('/api/backups'),
                fetch('/api/licenses'),
                fetch('/api/infrastructure'),
                fetch('/api/admin/logs'),
            ]);

            if (!assetsRes.ok) { setLoading(false); setIsSyncing(false); return; }

            const [assetsData, backupsData, licensesData, infraData, logsData] = await Promise.all([
                assetsRes.json(), backupsRes.json(), licensesRes.json(),
                infraRes.json(), logsRes.json()
            ]);

            setStats({
                assets:       assetsData.length,
                assetsOk:     assetsData.filter((a: any) => a.status === 'Ativo').length,
                assetsMaint:  assetsData.filter((a: any) => a.status === 'Manutenção').length,
                backups:      backupsData.length,
                backupsFail:  backupsData.filter((b: any) => b.status === 'Falha').length,
                licenses:     licensesData.length,
                licensesCost: licensesData.reduce((s: number, l: any) => s + (l.monthly_cost || 0), 0),
                infra:        infraData.length,
                infraOnline:  infraData.filter((i: any) => i.status === 'Online').length,
            });

            // Alertas de vencimento (próximos 30 dias)
            const today  = new Date();
            const next30 = new Date();
            next30.setDate(today.getDate() + 30);
            const expiring = licensesData
                .filter((l: any) => {
                    if (!l.renewal_date) return false;
                    const d = new Date(l.renewal_date);
                    return d > today && d < next30;
                })
                .map((l: any) => ({
                    id: l.id, name: l.name,
                    days: Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / 86_400_000)
                }));
            setAlerts(expiring);

            // Custos por fornecedor
            const costs = licensesData.reduce((acc: any, curr: any) => {
                acc[curr.vendor] = (acc[curr.vendor] || 0) + (curr.monthly_cost || 0);
                return acc;
            }, {});
            setCostData(
                Object.entries(costs)
                    .map(([name, value]) => ({ name, value: value as number }))
                    .sort((a, b) => b.value - a.value)
            );

            setLogs(Array.isArray(logsData) ? logsData.slice(0, 6) : []);
        } catch { setError(true); }
        setLoading(false);
        setTimeout(() => setIsSyncing(false), 600);
    }, []);

    useEffect(() => {
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

    const kpis = useMemo(() => stats ? [
        {
            label: 'Ativos Totais',
            value: stats.assets,
            sub: `${stats.assetsOk} ativos operacionais`,
            icon: Package,
            color: 'var(--blue)',
            ok: true,
            perc: stats.assets > 0 ? (stats.assetsOk / stats.assets) * 100 : 0,
        },
        {
            label: 'Saúde de Backup',
            value: stats.backups,
            sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s) crítica(s)` : '100% Protegido',
            icon: HardDrive,
            color: stats.backupsFail > 0 ? 'var(--red)' : 'var(--accent)',
            ok: stats.backupsFail === 0,
            perc: stats.backups > 0 ? ((stats.backups - stats.backupsFail) / stats.backups) * 100 : 0,
        },
        {
            label: 'Custo Mensal',
            value: fmt(stats.licensesCost),
            sub: `${stats.licenses} licença(s) ativas`,
            icon: DollarSign,
            color: 'var(--amber)',
            ok: true,
            perc: 100,
        },
        {
            label: 'Disponibilidade',
            value: stats.infra,
            sub: `${stats.infraOnline} de ${stats.infra} online`,
            icon: Server,
            color: 'var(--purple)',
            ok: stats.infraOnline === stats.infra || stats.infra === 0,
            perc: stats.infra > 0 ? (stats.infraOnline / stats.infra) * 100 : 0,
        },
    ] : [], [stats, fmt]);

    const assetChartData = useMemo(() => stats ? [
        { name: 'Ativos',     value: stats.assetsOk },
        { name: 'Manutenção', value: stats.assetsMaint },
        { name: 'Offline',    value: Math.max(0, stats.assets - stats.assetsOk - stats.assetsMaint) },
    ] : [], [stats]);

    const actionColor = (a: string) =>
        a === 'CREATE' ? 'var(--green)' : a === 'DELETE' ? 'var(--red)' : 'var(--amber)';

    return (
        <div>
            {/* Error banner */}
            {error && (
                <div style={{
                    background: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: 10, padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 12,
                    animation: 'fadeInUp 0.3s var(--ease-out-expo)',
                }}>
                    <AlertTriangle size={18} color="var(--red)" />
                    <span style={{ flex: 1, fontSize: 13 }}>Falha ao carregar dados do painel.</span>
                    <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={load}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Page header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Relatório Executivo</h1>
                    <p className="page-subtitle">
                        {getGreeting()}, <strong style={{ color: 'var(--accent)' }}>{user}</strong>
                        &nbsp;·&nbsp;
                        {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={load}
                    disabled={isSyncing}
                    style={{ fontSize: 12, minWidth: 150 }}
                >
                    <RefreshCw size={14} className={isSyncing ? styles.syncing : ''} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                </button>
            </div>

            {/* KPI grid */}
            <div className={styles.kpiGrid}>
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
                    : kpis.map(k => (
                        <div key={k.label} className={`card ${styles.kpi}`}>
                            <div className={styles.kpiTop}>
                                <div className={styles.kpiIcon} style={{
                                    background: `color-mix(in srgb, ${k.color} 12%, transparent)`,
                                    border: `1px solid color-mix(in srgb, ${k.color} 25%, transparent)`,
                                    boxShadow: `0 0 16px color-mix(in srgb, ${k.color} 15%, transparent)`,
                                }}>
                                    <k.icon size={22} color={k.color} />
                                </div>
                                <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                    {k.ok ? 'Nominal' : 'Crítico'}
                                </span>
                            </div>
                            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
                            <div className={styles.kpiLabel}>{k.label}</div>
                            <div className={styles.kpiSub}>{k.sub}</div>
                            <div className={styles.kpiBar}>
                                <div
                                    className={styles.kpiBarFill}
                                    style={{ background: k.color, width: `${k.perc}%` }}
                                />
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Charts row */}
            {!loading && (
                <div className={styles.mainGrid}>
                    {/* Bar chart — costs */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className={styles.cardHeader}>
                            <TrendingUp size={17} color="var(--accent)" />
                            <span className={styles.cardTitle}>Distribuição Financeira por Fornecedor</span>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={costData} layout="vertical">
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                        tickFormatter={(v: number) => fmt(v)}
                                        axisLine={false} tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={110}
                                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                        axisLine={false} tickLine={false}
                                    />
                                    <Tooltip
                                        content={<ChartTooltip fmt={fmt} />}
                                    />
                                    <Bar dataKey="value" fill="var(--blue)" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie chart — asset status */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className={styles.cardHeader}>
                            <Shield size={17} color="var(--purple)" />
                            <span className={styles.cardTitle}>Status dos Ativos</span>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetChartData}
                                        innerRadius={56}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {assetChartData.map((_, index) => (
                                            <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: 11, paddingTop: 12, fontFamily: 'JetBrains Mono' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Info row */}
            {!loading && (
                <div className={styles.infoGrid}>
                    {/* Alerts */}
                    <div className={`card ${styles.infoCard} ${alerts.length > 0 ? styles.alertCard : ''}`}>
                        <div className={styles.cardHeader}>
                            <AlertTriangle size={17} color={alerts.length > 0 ? 'var(--red)' : 'var(--amber)'} />
                            <span className={styles.cardTitle}>Alertas de Vencimento</span>
                        </div>
                        {alerts.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                paddingTop: 24, gap: 10, color: 'var(--text-muted)',
                            }}>
                                <CheckCircle size={28} style={{ opacity: 0.35 }} color="var(--green)" />
                                <p style={{ fontSize: 13 }}>Tudo em dia para os próximos 30 dias.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {alerts.slice(0, 4).map(a => (
                                    <div key={a.id} className={styles.alertItem}>
                                        <div className={styles.alertDot} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                Vence em {a.days} dia{a.days !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <AlertTriangle size={14} color="var(--red)" style={{ opacity: 0.7 }} />
                                    </div>
                                ))}
                                {alerts.length > 4 && (
                                    <a href="/licencas" style={{
                                        fontSize: 11, color: 'var(--accent)',
                                        textAlign: 'center', marginTop: 8,
                                        display: 'block', textDecoration: 'none',
                                        fontFamily: 'JetBrains Mono',
                                    }}>
                                        + {alerts.length - 4} outros → ver todos
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Activity log */}
                    <div className={`card ${styles.infoCard}`}>
                        <div className={styles.cardHeader}>
                            <Clock size={17} color="var(--blue)" />
                            <span className={styles.cardTitle}>Últimas Movimentações</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {logs.slice(0, 6).map(l => (
                                <div key={l.id} className={styles.logItem}>
                                    <div className={styles.logIcon} style={{ color: actionColor(l.action) }}>
                                        <Activity size={14} />
                                    </div>
                                    <div className={styles.logText}>
                                        <div className={styles.logAction}>
                                            <span style={{ color: actionColor(l.action), fontWeight: 700 }}>
                                                {l.action}
                                            </span>
                                            {' '}{l.table_name}
                                        </div>
                                        <div className={styles.logMeta}>
                                            {l.user_email?.split('@')[0]} · {new Date(l.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <span className={styles.logDate}>
                                        {new Date(l.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
