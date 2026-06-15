'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    HardDrive, Shield, ShieldCheck, FileText, Archive,
    Building2, AlertTriangle, CheckCircle, TrendingUp,
    DollarSign, Activity, RefreshCw, ArrowUpRight,
    Zap, Settings, Sun, Moon, Wifi
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from './Dashboard.module.css';

/* ── Types ── */
interface Stats {
    assets: number; assetsOk: number; assetsMaint: number;
    backups: number; backupsFail: number;
    licenses: number; licensesCost: number;
    infra: number; infraOnline: number;
}
interface Log  { id: string; action: string; table_name: string; user_email?: string; created_at: string; }
interface Alert { id: string; name: string; days: number; }
interface CostData { name: string; value: number; }

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

const actionColor = (a: string) =>
    a === 'CREATE' ? 'var(--green)' : a === 'DELETE' ? 'var(--red)' : 'var(--amber)';

const actionLabel = (a: string) =>
    a === 'CREATE' ? 'criou' : a === 'DELETE' ? 'removeu' : 'editou';

/* ── Module tiles config ── */
const MODULES = [
    { href: '/backups',       label: 'Backups',       sub: 'Proteção de dados',       icon: HardDrive,  color: 'var(--accent)',  glow: 'rgba(0,212,170,0.12)'  },
    { href: '/licencas',      label: 'Licenças',      sub: 'Software & Compliance',   icon: Shield,     color: 'var(--blue)',    glow: 'rgba(74,143,255,0.12)' },
    { href: '/infosec',       label: 'InfoSec',       sub: 'Segurança',               icon: ShieldCheck, color: 'var(--purple)', glow: 'rgba(167,139,250,0.12)'},
    { href: '/documentacoes', label: 'Docs',          sub: 'Base de conhecimento',    icon: FileText,   color: 'var(--amber)',   glow: 'rgba(245,158,11,0.12)' },
    { href: '/archive',       label: 'Archive',       sub: 'Usuários desligados',     icon: Archive,    color: 'var(--red)',     glow: 'rgba(244,63,94,0.12)'  },
    { href: '/suppliers',     label: 'Suppliers',     sub: 'Fornecedores',            icon: Building2,  color: 'var(--green)',   glow: 'rgba(34,214,105,0.12)' },
    { href: '/administracao', label: 'Admin',         sub: 'Configurações do sistema', icon: Settings,  color: 'var(--text-secondary)', glow: 'rgba(120,148,180,0.10)'},
];

/* ── Custom chart tooltip ── */
const ChartTooltip = ({ active, payload, label, fmt }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
            borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow)',
            fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
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

/* ── Skeleton KPI ── */
function SkeletonKpi() {
    return (
        <div className={`card ${styles.kpi} ${styles.skeletonKpi}`}>
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '50%', height: 36, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4, marginBottom: 3 }} />
            <div className="skeleton" style={{ width: '45%', height: 11, borderRadius: 4 }} />
        </div>
    );
}

/* ── Main component ── */
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
                    .slice(0, 8)
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
            label: 'Saúde de Backup',
            value: stats.backups,
            sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s) crítica(s)` : 'Todos protegidos',
            icon: HardDrive,
            color: stats.backupsFail > 0 ? 'var(--red)' : 'var(--accent)',
            ok: stats.backupsFail === 0,
            perc: stats.backups > 0 ? ((stats.backups - stats.backupsFail) / stats.backups) * 100 : 0,
        },
        {
            label: 'Licenças Ativas',
            value: stats.licenses,
            sub: alerts.length > 0 ? `${alerts.length} vencem em 30d` : 'Todas em dia',
            icon: Shield,
            color: 'var(--blue)',
            ok: alerts.length === 0,
            perc: 100,
        },
        {
            label: 'Custo Mensal',
            value: fmt(stats.licensesCost),
            sub: 'Total em licenças',
            icon: DollarSign,
            color: 'var(--amber)',
            ok: true,
            perc: 100,
        },
        {
            label: 'Disponibilidade',
            value: stats.infra > 0 ? `${Math.round((stats.infraOnline / stats.infra) * 100)}%` : '—',
            sub: stats.infra > 0 ? `${stats.infraOnline}/${stats.infra} online` : 'Sem registros',
            icon: Wifi,
            color: (stats.infraOnline === stats.infra || stats.infra === 0) ? 'var(--green)' : 'var(--red)',
            ok: stats.infraOnline === stats.infra || stats.infra === 0,
            perc: stats.infra > 0 ? (stats.infraOnline / stats.infra) * 100 : 0,
        },
    ] : [], [stats, alerts.length, fmt]);

    const isDayTime = now.getHours() < 18;

    return (
        <div className={styles.root}>

            {/* ── Error banner ── */}
            {error && (
                <div className={styles.errorBanner}>
                    <AlertTriangle size={15} color="var(--red)" />
                    <span>Falha ao carregar dados do painel.</span>
                    <button className="btn btn-ghost" style={{ fontSize: 12, marginLeft: 'auto' }} onClick={load}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* ── Hero ── */}
            <div className={styles.hero}>
                <div className={styles.heroBg} aria-hidden="true" />
                <div className={styles.heroContent}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroGreeting}>
                            {isDayTime
                                ? <Sun size={20} color="var(--amber)" strokeWidth={1.8} />
                                : <Moon size={20} color="var(--blue)" strokeWidth={1.8} />
                            }
                            <span>{getGreeting()},</span>
                            <strong className={styles.heroName}>{user || '...'}</strong>
                        </div>
                        <div className={styles.heroDate}>
                            {now.toLocaleDateString('pt-BR', {
                                weekday: 'long', day: 'numeric',
                                month: 'long', year: 'numeric',
                            })}
                        </div>
                    </div>
                    <div className={styles.heroRight}>
                        <div className={styles.systemStatus}>
                            <div className={styles.statusDot} />
                            <span>Sistema Operacional</span>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={load}
                            disabled={isSyncing}
                            style={{ fontSize: 12 }}
                        >
                            <RefreshCw size={13} className={isSyncing ? styles.syncing : ''} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KPI Grid ── */}
            <div className={styles.kpiGrid}>
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)
                    : kpis.map((k) => (
                        <div
                            key={k.label}
                            className={`card ${styles.kpi}`}
                            style={{ '--card-color': k.color } as React.CSSProperties}
                        >
                            <div className={styles.kpiHeader}>
                                <div className={styles.kpiIcon} style={{
                                    background: `color-mix(in srgb, ${k.color} 12%, transparent)`,
                                    border: `1px solid color-mix(in srgb, ${k.color} 22%, transparent)`,
                                }}>
                                    <k.icon size={20} color={k.color} strokeWidth={1.8} />
                                </div>
                                <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                    {k.ok ? '● OK' : '● ALERTA'}
                                </span>
                            </div>
                            <div className={styles.kpiValue} style={{ color: k.color }}>
                                {k.value}
                            </div>
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

            {/* ── Module tiles ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Zap size={13} color="var(--accent)" strokeWidth={2.5} />
                    <span>Acesso Rápido</span>
                </div>
                <div className={styles.moduleGrid}>
                    {MODULES.map((m, i) => (
                        <Link
                            key={m.href}
                            href={m.href}
                            className={styles.moduleTile}
                            style={{
                                '--tile-color': m.color,
                                '--tile-glow': m.glow,
                                animationDelay: `${0.04 + i * 0.04}s`,
                            } as React.CSSProperties}
                        >
                            <div className={styles.tileIcon} style={{
                                background: m.glow,
                                border: `1px solid color-mix(in srgb, ${m.color} 28%, transparent)`,
                            }}>
                                <m.icon size={16} color={m.color} strokeWidth={1.8} />
                            </div>
                            <div className={styles.tileBody}>
                                <span className={styles.tileLabel}>{m.label}</span>
                                <span className={styles.tileSub}>{m.sub}</span>
                            </div>
                            <ArrowUpRight size={13} className={styles.tileArrow} color={m.color} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Charts + Activity feed ── */}
            {!loading && (
                <div className={styles.mainGrid}>

                    {/* Cost bar chart */}
                    <div className={`card ${styles.chartCard}`}>
                        <div className={styles.cardHeader}>
                            <TrendingUp size={14} color="var(--blue)" strokeWidth={1.8} />
                            <span className={styles.cardTitle}>Custos por Fornecedor</span>
                            {costData.length > 0 && (
                                <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 9 }}>
                                    {costData.length} fornecedor{costData.length > 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>
                        {costData.length > 0 ? (
                            <div className={styles.chartWrap}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={costData}
                                        layout="vertical"
                                        margin={{ left: 0, right: 14, top: 4, bottom: 4 }}
                                    >
                                        <XAxis
                                            type="number"
                                            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                                            tickFormatter={(v: number) => fmt(v)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={106}
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Inter' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={<ChartTooltip fmt={fmt} />}
                                            cursor={{ fill: 'rgba(0,212,170,0.04)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                            {costData.map((_, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={`hsl(${188 + i * 10}, 75%, ${54 - i * 2}%)`}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <TrendingUp size={28} style={{ opacity: 0.12 }} />
                                <span>Sem dados financeiros</span>
                            </div>
                        )}
                    </div>

                    {/* Activity feed */}
                    <div className={`card ${styles.feedCard}`}>
                        <div className={styles.cardHeader}>
                            <Activity size={14} color="var(--accent)" strokeWidth={1.8} />
                            <span className={styles.cardTitle}>Atividade Recente</span>
                            {logs.length > 0 && (
                                <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 9 }}>
                                    {logs.length}
                                </span>
                            )}
                        </div>
                        {logs.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Activity size={28} style={{ opacity: 0.12 }} />
                                <span>Nenhuma atividade</span>
                            </div>
                        ) : (
                            <div className={styles.feedList}>
                                {logs.map((l, i) => (
                                    <div
                                        key={l.id}
                                        className={styles.feedItem}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                    >
                                        <div
                                            className={styles.feedDot}
                                            style={{ background: actionColor(l.action) }}
                                        />
                                        <div className={styles.feedContent}>
                                            <div className={styles.feedText}>
                                                <span style={{ color: actionColor(l.action), fontWeight: 600 }}>
                                                    {actionLabel(l.action)}
                                                </span>{' '}
                                                <span className={styles.feedModule}>{l.table_name}</span>
                                            </div>
                                            <div className={styles.feedMeta}>
                                                <span>{l.user_email?.split('@')[0] ?? '—'}</span>
                                                <span className={styles.feedMetaSep}>·</span>
                                                <span>
                                                    {new Date(l.created_at).toLocaleString('pt-BR', {
                                                        day: '2-digit', month: '2-digit',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* ── License alerts ── */}
            {!loading && alerts.length > 0 && (
                <div className={`card ${styles.alertsCard}`}>
                    <div className={styles.cardHeader}>
                        <AlertTriangle size={14} color="var(--red)" strokeWidth={1.8} />
                        <span className={styles.cardTitle}>Licenças Vencendo em 30 Dias</span>
                        <span className="badge badge-red" style={{ marginLeft: 'auto', fontSize: 9 }}>
                            {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className={styles.alertsGrid}>
                        {alerts.map(a => (
                            <div key={a.id} className={styles.alertItem}>
                                <div className={styles.alertDot} />
                                <span className={styles.alertName}>{a.name}</span>
                                <span className={styles.alertDays}>{a.days}d</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/licencas" className={styles.alertCta}>
                        Ver todas as licenças
                        <ArrowUpRight size={13} />
                    </Link>
                </div>
            )}

            {/* ── All clear (no alerts) ── */}
            {!loading && alerts.length === 0 && stats !== null && (
                <div className={`card ${styles.allClear}`}>
                    <CheckCircle size={16} color="var(--green)" strokeWidth={1.8} />
                    <span>Nenhum alerta de vencimento para os próximos 30 dias</span>
                </div>
            )}

        </div>
    );
}
