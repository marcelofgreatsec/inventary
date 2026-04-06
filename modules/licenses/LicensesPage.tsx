'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, Shield, Loader2, X,
    BarChart3, Search, Filter, Eye, EyeOff,
    Copy, Check, TrendingUp, DollarSign
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const STATUS_MAP: Record<string, string> = {
    'Ativa': 'badge-green', 'Expirada': 'badge-red', 'A vencer': 'badge-amber'
};

const CHART_COLORS = ['#00d4aa', '#4a8fff', '#a78bfa', '#22d669', '#f59e0b'];

interface License {
    id: string; name: string; vendor: string; type: string;
    status: string; seats: number; monthly_cost: number; renewal_date?: string;
    login?: string; password?: string;
}

/* ── Copy button ── */
function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handle = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handle}
            title="Copiar"
            style={{
                background: 'none', border: 'none',
                color: copied ? 'var(--green)' : 'var(--text-muted)',
                cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', marginLeft: 6,
                transition: 'color 0.2s',
            }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}

/* ── Modal ── */
function LicenseModal({
    onClose, onSave, license
}: {
    onClose: () => void; onSave: () => void; license?: License
}) {
    const [form, setForm] = useState(license ? {
        name: license.name, vendor: license.vendor, type: license.type,
        status: license.status, seats: license.seats.toString(),
        monthly_cost: license.monthly_cost.toString(),
        renewal_date: license.renewal_date || '',
        key: (license as any).key || '',
        login: license.login || '', password: license.password || ''
    } : { name: '', vendor: '', type: 'Anual', status: 'Ativa', seats: '1', monthly_cost: '0', renewal_date: '', key: '', login: '', password: '' });

    const [saving, setSaving]         = useState(false);
    const [showPassword, setShowPass] = useState(false);
    const [saveError, setSaveError]   = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const focusable = Array.from(
            modalRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
        );
        focusable[0]?.focus();
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key !== 'Tab' || !focusable.length) return;
            if (e.shiftKey && document.activeElement === focusable[0]) {
                e.preventDefault(); focusable[focusable.length - 1]?.focus();
            } else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
                e.preventDefault(); focusable[0]?.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setSaveError('');
        const url    = license ? `/api/licenses/${license.id}` : '/api/licenses';
        const method = license ? 'PATCH' : 'POST';

        let clean = form.monthly_cost.trim().replace(/[^\d.,]/g, '');
        const lastSep = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','));
        if (lastSep > -1) {
            const after = clean.length - 1 - lastSep;
            if (after === 3 && !clean.includes(',')) clean = clean.replace(/[.,]/g, '');
            else if (after === 3 && !clean.includes('.')) clean = clean.replace(/[.,]/g, '');
            else {
                const dec = clean.substring(lastSep + 1);
                const int = clean.substring(0, lastSep).replace(/[.,]/g, '');
                clean = `${int}.${dec}`;
            }
        }
        const finalCost = parseFloat(clean) || 0;

        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, seats: parseInt(form.seats), monthly_cost: finalCost, renewal_date: form.renewal_date || null })
        });

        if (res.ok) { onSave(); onClose(); }
        else {
            const err = await res.json();
            setSaveError(err.error || 'Erro desconhecido ao salvar.');
        }
        setSaving(false);
    };

    const f = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="license-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="license-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {license ? 'Editar Licença' : 'Nova Licença'}
                    </h2>
                    <button onClick={onClose} aria-label="Fechar modal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Software *</label>
                        <input className="input" value={form.name} onChange={f('name')} required placeholder="Microsoft 365 Business" />
                    </div>
                    <div className="form-group">
                        <label>Fornecedor *</label>
                        <input className="input" value={form.vendor} onChange={f('vendor')} required placeholder="Microsoft" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Mensal', 'Anual', 'Perpétua'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Ativa', 'Expirada', 'A vencer'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Usuários</label>
                            <input className="input" type="number" min="1" value={form.seats} onChange={f('seats')} />
                        </div>
                        <div className="form-group">
                            <label>Custo Mensal (R$)</label>
                            <input className="input" type="text" placeholder="1.500,00" value={form.monthly_cost} onChange={f('monthly_cost')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Vencimento</label>
                        <input className="input" type="date" value={form.renewal_date} onChange={f('renewal_date')} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Login</label>
                            <input className="input" value={form.login} onChange={f('login')} placeholder="usuário ou email" />
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={f('password')}
                                    placeholder="••••••••"
                                    autoComplete="off"
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPassword)}
                                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Chave de Licença</label>
                        <input className="input" value={form.key} onChange={f('key')} placeholder="XXXXX-XXXXX-XXXXX" />
                    </div>

                    {saveError && (
                        <div style={{ padding: '10px 14px', background: 'var(--red-mid)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 8, fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
                            {saveError}
                        </div>
                    )}
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving
                                ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                                : license ? 'Atualizar Licença' : 'Salvar Licença'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function LicensesPage() {
    const [modal,           setModal]           = useState(false);
    const [editingLicense,  setEditingLicense]  = useState<License | undefined>();
    const [search,          setSearch]          = useState('');
    const [statusFilter,    setStatusFilter]    = useState('Todos');

    const { data: licenses, isLoading, refresh } = useRealtimeTable<License>('/api/licenses', 'licenses');

    const fmtCost = (n: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    const totalCost   = licenses.reduce((s, l) => s + (l.monthly_cost || 0), 0);
    const activeCount = licenses.filter(l => l.status === 'Ativa').length;

    const chartData = useMemo(() => {
        const vendors: Record<string, number> = {};
        licenses.forEach(l => { vendors[l.vendor] = (vendors[l.vendor] || 0) + (l.monthly_cost || 0); });
        return Object.entries(vendors)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [licenses]);

    const filtered = useMemo(() => licenses.filter(l => {
        const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                            l.vendor.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Todos' || l.status === statusFilter;
        return matchSearch && matchStatus;
    }), [licenses, search, statusFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta licença? Esta ação não pode ser desfeita.')) return;
        await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
        refresh();
    };

    /* ── Summary cards ── */
    const summaryCards = [
        { label: 'Total de Licenças', value: licenses.length, icon: Shield,      color: 'var(--accent)' },
        { label: 'Licenças Ativas',   value: activeCount,     icon: TrendingUp,  color: 'var(--green)'  },
        { label: 'Custo Mensal',      value: fmtCost(totalCost), icon: DollarSign, color: 'var(--amber)' },
    ];

    return (
        <div>
            {modal && (
                <LicenseModal
                    onClose={() => { setModal(false); setEditingLicense(undefined); }}
                    onSave={() => refresh()}
                    license={editingLicense}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Licenças de Software</h1>
                    <p className="page-subtitle">
                        {filtered.length} licença(s) · Custo mensal: <strong style={{ color: 'var(--accent)' }}>{fmtCost(totalCost)}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar software ou fornecedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 240, paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select
                            className="select"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ width: 150, paddingLeft: 36 }}
                        >
                            <option>Todos</option>
                            <option>Ativa</option>
                            <option>Expirada</option>
                            <option>A vencer</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingLicense(undefined); setModal(true); }}>
                        <Plus size={15} /> Nova Licença
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            {!isLoading && licenses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                    {summaryCards.map(c => (
                        <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <c.icon size={20} color={c.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: c.color }}>
                                    {c.value}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                                    {c.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            {!isLoading && licenses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div className="card" style={{ padding: 20, height: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                            <BarChart3 size={17} color="var(--accent)" />
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Custo por Fornecedor
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="82%">
                            <BarChart data={chartData} margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `R$${v}`} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, boxShadow: 'var(--shadow)' }}
                                    formatter={(v: number) => [fmtCost(v), 'Custo']}
                                    labelStyle={{ color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'JetBrains Mono' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                                    {chartData.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Status summary */}
                    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={28} color="var(--accent)" />
                        </div>
                        <div>
                            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Outfit', background: 'linear-gradient(135deg, var(--text-primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {activeCount}<span style={{ fontSize: 20, opacity: 0.5 }}>/{licenses.length}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                                Licenças Ativas
                            </div>
                        </div>
                        <span className={`badge ${activeCount === licenses.length ? 'badge-green' : 'badge-amber'}`}>
                            {activeCount === licenses.length ? 'Tudo OK' : 'Atenção'}
                        </span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                        <div className="spinner" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty">
                        <Shield size={40} />
                        {licenses.length === 0 ? (
                            <>
                                <p>Nenhuma licença cadastrada.</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditingLicense(undefined); setModal(true); }}>
                                    <Plus size={15} /> Adicionar primeira licença
                                </button>
                            </>
                        ) : (
                            <>
                                <p>Nenhum resultado para os filtros aplicados.</p>
                                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setStatusFilter('Todos'); }}>
                                    Limpar filtros
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Software</th>
                                    <th>Fornecedor</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Login</th>
                                    <th>Usuários</th>
                                    <th>Custo/Mês</th>
                                    <th>Vencimento</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{l.vendor}</td>
                                        <td><span className="badge badge-purple">{l.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[l.status] || 'badge-blue'}`}>{l.status}</span></td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {l.login ? (
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontFamily: 'JetBrains Mono' }}>
                                                        {l.login.slice(0, 3)}{'•'.repeat(Math.max(0, l.login.length - 3))}
                                                    </span>
                                                    <CopyBtn text={l.login} />
                                                </div>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>{l.seats}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                                                {fmtCost(l.monthly_cost)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
                                            {fmtDate(l.renewal_date)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => { setEditingLicense(l); setModal(true); }}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '5px 12px', fontSize: 12 }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(l.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '5px 10px' }}
                                                    aria-label={`Remover ${l.name}`}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
