'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    HardDrive, Shield, ShieldCheck, FileText, Archive,
    Building2, AlertTriangle, CheckCircle, TrendingUp,
    DollarSign, Activity, RefreshCw, ArrowRight,
    Settings, Sun, Moon, Wifi
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import styles from './Dashboard.module.css';

/* ── Types ── */
interface Stats {
    assets: number; assetsOk: number; assetsMaint: number;
    backups: number; backupsFail: number;
    licenses: number; licensesCost: number;
    infra: number; infraOnline: number;
}
interface Log   { id: string; action: string; table_name: string; user_email?: string; created_at: string; }
interface Alert { id: string; name: string; days: number; }
interface CostData { name: string; value: number; }

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

const ACTION_COLORS: Record<string, string> = {
    CREATE: '#34d399',
    DELETE: '#f87171',
    UPDATE: '#fbbf24',
};
const ACTION_LABELS: Record<string, string> = {
    CREATE: 'criou',
    DELETE: 'removeu',
    UPDATE: 'editou',
};

const CHART_COLORS = [
    '#00d4aa','#60a5fa','#a78bfa','#fbbf24','#f87171','#34d399','#fb923c','#e879f9',
];

/* ── Module list ── */
const MODULES = [
    { href: '/backups',       icon: HardDrive,  label: 'Backups',       sub: 'Proteção de dados',       color: '#00d4aa' },
    { href: '/licencas',      icon: Shield,     label: 'Licenças',      sub: 'Software & Compliance',   color: '#60a5fa' },
    { href: '/infosec',       icon: ShieldCheck,label: 'InfoSec',       sub: 'Segurança',               color: '#a78bfa' },
    { href: '/documentacoes', icon: FileText,   label: 'Docs',          sub: 'Base de conhecimento',    color: '#fbbf24' },
    { href: '/archive',       icon: Archive,    label: 'Archive',       sub: 'Usuários desligados',     color: '#f87171' },
    { href: '/suppliers',     icon: Building2,  label: 'Suppliers',     sub: 'Fornecedores',            color: '#34d399' },
    { href: '/administracao', icon: Settings,   label: 'Admin',         sub: 'Configurações',           color: '#94a3b8' },
];

/* ── Chart tooltip ── */
const ChartTooltip = ({ active, payload, label, fmt }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-mid)',
            borderRadius: 8, padding: '10px 14px',
            boxShadow: 'var(--shadow)', fontSize: 12,
        }}>
            {label && <div style={{ color: 'var(--text-secondary)', marginBottom: 4, fontSize: 11 }}>{label}</div>}
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ color: p.color || 'var(--accent)', fontWeight: 600 }}>
                    {fmt ? fmt(p.value) : p.value}
                </div>
            ))}
        </div>
    );
};

/* ── Skeleton KPI ── */
function SkeletonKpi() {
    return (
        <div className={`card ${styles.kpiCard}`}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 20 }} />
            <div className="skeleton" style={{ width: '55%', height: 32, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }} />
            <div className="skeleton" style={{ width: '42%', height: 11, borderRadius: 4 }} />
        </div>
    );
}

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
export default function Dashboard() {
    const [stats,     setStats]     = useState<Stats | null>(null);
    const [logs,      setLogs]      = useState<Log[]>([]);
    const [alerts,    setAlerts]    = useState<Alert[]>([]);
    const [costData,  setCostData]  = useState<CostData[]>([]);
    const [user,      setUser]      = useState('');
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [now,       setNow]       = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

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
                infraRes.json(),  logsRes.json(),
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

            const today  = new Date();
            const next30 = new Date(); next30.setDate(today.getDate() + 30);
            setAlerts(
                licensesData
                    .filter((l: any) => {
                        if (!l.renewal_date) return false;
                        const d = new Date(l.renewal_date);
                        return d > today && d < next30;
                    })
                    .map((l: any) => ({
                        id: l.id, name: l.name,
                        days: Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / 86_400_000),
                    }))
            );

            const costs = licensesData.reduce((acc: any, curr: any) => {
                acc[curr.vendor] = (acc[curr.vendor] || 0) + (curr.monthly_cost || 0);
                return acc;
            }, {});
            setCostData(
                Object.entries(costs)
                    .map(([name, value]) => ({ name, value: value as number }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 7)
            );

            setLogs(Array.isArray(logsData) ? logsData.slice(0, 8) : []);
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
            label: 'Backups',
            value: stats.backups,
            sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s) detectada(s)` : 'Todos os backups íntegros',
            icon: HardDrive,
            color: stats.backupsFail > 0 ? 'var(--red)' : 'var(--accent)',
            ok: stats.backupsFail === 0,
            perc: stats.backups > 0 ? ((stats.backups - stats.backupsFail) / stats.backups) * 100 : 0,
        },
        {
            label: 'Licenças',
            value: stats.licenses,
            sub: alerts.length > 0 ? `${alerts.length} vencem em 30 dias` : 'Nenhum vencimento próximo',
            icon: Shield,
            color: 'var(--blue)',
            ok: alerts.length === 0,
            perc: 100,
        },
        {
            label: 'Custo Mensal',
            value: fmt(stats.licensesCost),
            sub: 'Total em licenças ativas',
            icon: DollarSign,
            color: 'var(--amber)',
            ok: true,
            perc: 100,
        },
        {
            label: 'Disponibilidade',
            value: stats.infra > 0 ? `${Math.round((stats.infraOnline / stats.infra) * 100)}%` : '—',
            sub: stats.infra > 0 ? `${stats.infraOnline} de ${stats.infra} online` : 'Sem registros de infraestrutura',
            icon: Wifi,
            color: (stats.infra === 0 || stats.infraOnline === stats.infra) ? 'var(--green)' : 'var(--red)',
            ok: stats.infra === 0 || stats.infraOnline === stats.infra,
            perc: stats.infra > 0 ? (stats.infraOnline / stats.infra) * 100 : 100,
        },
    ] : [], [stats, alerts.length, fmt]);

    const isDayTime = now.getHours() < 18;

    return (
        <div className={styles.root}>

            {/* ── Error ── */}
            {error && (
                <div className={styles.errorBanner}>
                    <AlertTriangle size={15} />
                    <span>Falha ao carregar dados.</span>
                    <button className="btn btn-ghost" onClick={load} style={{ marginLeft: 'auto', fontSize: 12 }}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* ═══════════════ HERO ═══════════════ */}
            <div className={styles.hero}>
                <div className={styles.heroLeft}>
                    <div className={styles.heroIcon}>
                        {isDayTime
                            ? <Sun size={18} strokeWidth={1.8} />
                            : <Moon size={18} strokeWidth={1.8} />
                        }
                    </div>
                    <div>
                        <h2 className={styles.heroGreeting}>
                            {getGreeting()}, <span className={styles.heroName}>{user || '...'}</span>
                        </h2>
                        <p className={styles.heroDate}>
                            {now.toLocaleDateString('pt-BR', {
                                weekday: 'long', day: 'numeric',
                                month: 'long', year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
                <div className={styles.heroRight}>
                    <div className={styles.onlinePill}>
                        <span className={styles.onlineDot} />
                        Sistema Operacional
                    </div>
                    <button
                        className={`btn btn-primary ${styles.syncBtn}`}
                        onClick={load}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={13} className={isSyncing ? styles.syncing : ''} strokeWidth={2} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                </div>
            </div>

            {/* ═══════════════ KPIs ═══════════════ */}
            <div className={styles.kpiGrid}>
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
                    : kpis.map((k) => (
                        <div
                            key={k.label}
                            className={`card ${styles.kpiCard}`}
                            style={{ '--kpi-color': k.color } as React.CSSProperties}
                        >
                            {/* Colored top accent line */}
                            <div className={styles.kpiAccent} style={{ background: k.color }} />

                            <div className={styles.kpiTop}>
                                <div className={styles.kpiIconWrap} style={{
                                    background: `color-mix(in srgb, ${k.color} 10%, transparent)`,
                                    border: `1px solid color-mix(in srgb, ${k.color} 20%, transparent)`,
                                }}>
                                    <k.icon size={18} color={k.color} strokeWidth={1.8} />
                                </div>
                                <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                    {k.ok ? 'Normal' : 'Alerta'}
                                </span>
                            </div>

                            <div className={styles.kpiValue} style={{ color: k.color }}>
                                {k.value}
                            </div>
                            <div className={styles.kpiLabel}>{k.label}</div>
                            <div className={styles.kpiSub}>{k.sub}</div>

                            <div className={styles.kpiProgress}>
                                <div
                                    className={styles.kpiProgressFill}
                                    style={{ width: `${k.perc}%`, background: k.color }}
                                />
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* ═══════════════ MODULES ═══════════════ */}
            <section>
                <p className={styles.sectionLabel}>Módulos</p>
                <div className={styles.moduleGrid}>
                    {MODULES.map((m, i) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className={`card ${styles.moduleTile}`}
                            style={{ animationDelay: `${0.05 + i * 0.04}s` } as React.CSSProperties}
                        >
                            <div
                                className={styles.moduleIcon}
                                style={{
                                    background: `${m.color}14`,
                                    border: `1px solid ${m.color}28`,
                                }}
                            >
                                <m.icon size={16} color={m.color} strokeWidth={1.8} />
                            </div>
                            <div className={styles.moduleBody}>
                                <span className={styles.moduleLabel}>{m.label}</span>
                                <span className={styles.moduleSub}>{m.sub}</span>
                            </div>
                            <ArrowRight size={14} className={styles.moduleArrow} />
                        </Link>
                    ))}
                </div>
            </section>

            {/* ═══════════════ CHART + FEED ═══════════════ */}
            {!loading && (
                <div className={styles.analysisGrid}>

                    {/* Cost chart */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className={styles.cardHeader}>
                            <TrendingUp size={15} color="var(--blue)" strokeWidth={1.8} />
                            <h3 className={styles.cardTitle}>Custos por Fornecedor</h3>
                            {costData.length > 0 && (
                                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
                                    {costData.length} fornecedores
                                </span>
                            )}
                        </div>
                        {costData.length > 0 ? (
                            <div className={styles.chartWrap}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={costData}
                                        layout="vertical"
                                        margin={{ left: 0, right: 12, top: 2, bottom: 2 }}
                                    >
                                        <XAxis
                                            type="number"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                            tickFormatter={(v: number) => fmt(v)}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <Tooltip
                                            content={<ChartTooltip fmt={fmt} />}
                                            cursor={{ fill: 'var(--bg-elevated)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={20}>
                                            {costData.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={styles.emptyChart}>
                                <TrendingUp size={28} strokeWidth={1} />
                                <p>Sem dados financeiros</p>
                            </div>
                        )}
                    </div>

                    {/* Activity feed */}
                    <div className={`card ${styles.feedCard}`}>
                        <div className={styles.cardHeader}>
                            <Activity size={15} color="var(--accent)" strokeWidth={1.8} />
                            <h3 className={styles.cardTitle}>Atividade Recente</h3>
                        </div>
                        {logs.length === 0 ? (
                            <div className={styles.emptyChart}>
                                <Activity size={28} strokeWidth={1} />
                                <p>Sem atividade registrada</p>
                            </div>
                        ) : (
                            <ul className={styles.feedList}>
                                {logs.map((l, i) => {
                                    const col = ACTION_COLORS[l.action] ?? 'var(--text-muted)';
                                    return (
                                        <li
                                            key={l.id}
                                            className={styles.feedItem}
                                            style={{ animationDelay: `${i * 0.04}s` } as React.CSSProperties}
                                        >
                                            <span className={styles.feedDot} style={{ background: col }} />
                                            <div className={styles.feedContent}>
                                                <p className={styles.feedText}>
                                                    <span style={{ color: col, fontWeight: 600 }}>
                                                        {ACTION_LABELS[l.action] ?? l.action.toLowerCase()}
                                                    </span>{' '}
                                                    <span className={styles.feedTable}>{l.table_name}</span>
                                                </p>
                                                <p className={styles.feedMeta}>
                                                    {l.user_email?.split('@')[0]}
                                                    <span className={styles.feedSep}>·</span>
                                                    {new Date(l.created_at).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                </div>
            )}

            {/* ═══════════════ ALERTS ═══════════════ */}
            {!loading && alerts.length > 0 && (
                <div className={`card ${styles.alertsCard}`}>
                    <div className={styles.cardHeader}>
                        <AlertTriangle size={15} color="var(--red)" strokeWidth={1.8} />
                        <h3 className={styles.cardTitle}>Licenças Vencendo em 30 Dias</h3>
                        <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
                            {alerts.length} alertas
                        </span>
                    </div>
                    <div className={styles.alertsGrid}>
                        {alerts.map(a => (
                            <div key={a.id} className={styles.alertItem}>
                                <span className={styles.alertDot} />
                                <span className={styles.alertName}>{a.name}</span>
                                <span className={styles.alertDays}>{a.days}d</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/licencas" className={styles.alertLink}>
                        Gerenciar licenças <ArrowRight size={13} />
                    </Link>
                </div>
            )}

            {/* ═══════════════ ALL CLEAR ═══════════════ */}
            {!loading && alerts.length === 0 && stats !== null && (
                <div className={`card ${styles.allClear}`}>
                    <CheckCircle size={15} color="var(--green)" strokeWidth={1.8} />
                    <span>Nenhum alerta de vencimento nos próximos 30 dias.</span>
                </div>
            )}

        </div>
    );
}
