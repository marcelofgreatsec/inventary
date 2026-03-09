'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Package, HardDrive, Shield, Server, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import styles from './Dashboard.module.css';

interface Stats {
    assets: number;
    assetsOk: number;
    assetsMaint: number;
    backups: number;
    backupsFail: number;
    licenses: number;
    licensesCost: number;
    infra: number;
    infraOnline: number;
}

interface Log { id: string; action: string; table_name: string; user_email?: string; created_at: string; }
interface CostData { name: string; value: number; }

const ACTION_MAP: Record<string, string> = { 'CREATE': 'badge-green', 'DELETE': 'badge-red', 'UPDATE': 'badge-amber' };
const STATUS_COLORS = ['#00d4aa', '#f0a500', '#ff4757'];

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [costData, setCostData] = useState<CostData[]>([]);
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

            if (!assetsRes.ok) { setLoading(false); return; }

            const [assetsData, backupsData, licensesData, infraData, logsData] = await Promise.all([
                assetsRes.json(), backupsRes.json(), licensesRes.json(), infraRes.json(), logsRes.json()
            ]);

            setStats({
                assets: assetsData.length,
                assetsOk: assetsData.filter((a: any) => a.status === 'Ativo').length,
                assetsMaint: assetsData.filter((a: any) => a.status === 'Manutenção').length,
                backups: backupsData.length,
                backupsFail: backupsData.filter((b: any) => b.status === 'Falha').length,
                licenses: licensesData.length,
                licensesCost: licensesData.reduce((s: number, l: any) => s + (l.monthly_cost || 0), 0),
                infra: infraData.length,
                infraOnline: infraData.filter((i: any) => i.status === 'Online').length,
            });

            // Group costs by vendor
            const costs = licensesData.reduce((acc: any, curr: any) => {
                acc[curr.vendor] = (acc[curr.vendor] || 0) + (curr.monthly_cost || 0);
                return acc;
            }, {});
            setCostData(Object.entries(costs).map(([name, value]) => ({ name, value: value as number })));

            setLogs(Array.isArray(logsData) ? logsData.slice(0, 6) : []);
        } catch { /* silent fail */ }
        setLoading(false);
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
        { label: 'Ativos Totais', value: stats.assets, sub: `${stats.assetsOk} ativos`, icon: Package, color: 'var(--blue)', ok: true, perc: stats.assets > 0 ? (stats.assetsOk / stats.assets) * 100 : 0 },
        { label: 'Saúde Backup', value: stats.backups, sub: stats.backupsFail > 0 ? `${stats.backupsFail} falha(s)` : '100% Protegido', icon: HardDrive, color: stats.backupsFail > 0 ? 'var(--red)' : 'var(--accent)', ok: stats.backupsFail === 0, perc: stats.backups > 0 ? ((stats.backups - stats.backupsFail) / stats.backups) * 100 : 0 },
        { label: 'Custo Mensal', value: fmt(stats.licensesCost), sub: `${stats.licenses} licença(s)`, icon: DollarSign, color: 'var(--amber)', ok: true, perc: 100 },
        { label: 'Disponibilidade', value: stats.infra, sub: `${stats.infraOnline} online`, icon: Server, color: 'var(--purple)', ok: stats.infraOnline === stats.infra || stats.infra === 0, perc: stats.infra > 0 ? (stats.infraOnline / stats.infra) * 100 : 0 },
    ] : [], [stats]);

    const assetChartData = useMemo(() => stats ? [
        { name: 'Ativos', value: stats.assetsOk },
        { name: 'Manutenção', value: stats.assetsMaint },
        { name: 'Offline', value: stats.assets - stats.assetsOk - stats.assetsMaint },
    ] : [], [stats]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Relatório Executivo</h1>
                    <p className="page-subtitle">
                        Análise de Governança de TI • <strong style={{ color: 'var(--accent)' }}>{user}</strong> •
                        {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={load} style={{ fontSize: 12 }}><Activity size={14} /> Sincronizar Dados</button>
            </div>

            <div className={styles.kpiGrid}>
                {kpis.map(k => (
                    <div key={k.label} className={`card ${styles.kpi}`}>
                        <div className={styles.kpiTop}>
                            <div className={styles.kpiIcon} style={{ background: `color-mix(in srgb, ${k.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${k.color} 30%, transparent)` }}>
                                <k.icon size={22} color={k.color} />
                            </div>
                            <span className={`badge ${k.ok ? 'badge-green' : 'badge-red'}`}>
                                {k.ok ? 'Nominal' : 'Crítico'}
                            </span>
                        </div>
                        <div className={styles.kpiValue} style={{ color: 'var(--text-primary)' }}>{k.value}</div>
                        <div className={styles.kpiLabel}>{k.label}</div>
                        <div className={styles.kpiSub}>{k.sub}</div>
                        <div className={styles.kpiBar}>
                            <div className={styles.kpiBarFill} style={{ background: k.color, width: `${k.perc}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <TrendingUp size={18} color="var(--accent)" />
                        <span className={styles.cardTitle}>Distribuição Financeira por Fornecedor</span>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={costData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: '4px' }}
                                    formatter={(v: number) => fmt(v)}
                                />
                                <Bar dataKey="value" fill="var(--blue-glow)" stroke="var(--blue)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <Shield size={18} color="var(--purple)" />
                        <span className={styles.cardTitle}>Status dos Ativos</span>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={assetChartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {assetChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid} style={{ marginTop: 16 }}>
                <div className={`card ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <CheckCircle size={18} color="var(--green)" />
                        <span className={styles.cardTitle}>Resumo de Conformidade</span>
                    </div>
                    <div className={styles.complianceItems}>
                        {[
                            { label: 'Disponibilidade de Ativos', value: stats ? `${((stats.assetsOk / stats.assets) * 100 || 0).toFixed(1)}%` : '0%', ok: (stats?.assetsOk ?? 0) === (stats?.assets ?? 0) },
                            { label: 'Integridade de Backups', value: stats ? `${stats.backupsFail > 0 ? 'ALERTA' : 'INTEGRO'}` : '-', ok: (stats?.backupsFail ?? 1) === 0 },
                            { label: 'Consicionamento de Licenças', value: stats?.licensesCost ? fmt(stats.licensesCost) : 'R$ 0,00', ok: true },
                            { label: 'SLA de Infraestrutura', value: stats ? `${((stats.infraOnline / stats.infra) * 100 || 0).toFixed(1)}%` : '0%', ok: (stats?.infraOnline ?? 0) === (stats?.infra ?? 0) },
                        ].map(item => (
                            <div key={item.label} className={styles.complianceRow}>
                                {item.ok ? <CheckCircle size={15} color="var(--green)" /> : <AlertTriangle size={15} color="var(--amber)" />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                <span style={{ fontWeight: 600, color: item.ok ? 'var(--accent)' : 'var(--amber)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`card ${styles.infoCard}`}>
                    <div className={styles.cardHeader}>
                        <Clock size={18} color="var(--blue)" />
                        <span className={styles.cardTitle}>Últimas Movimentações</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {logs.slice(0, 4).map(l => (
                            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{l.action} {l.table_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{l.user_email?.split('@')[0]} • {new Date(l.created_at).toLocaleTimeString('pt-BR')}</div>
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

