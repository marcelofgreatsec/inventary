'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Search, X, Eye, EyeOff, Copy, Check, KeyRound, Lock, ChevronRight } from 'lucide-react';

interface License {
    id: string; name: string; vendor: string; type: string;
    status: string; seats: number; monthly_cost: number; renewal_date?: string;
    login?: string; password?: string; key?: string; categoria?: string;
    notes?: string;
}

const CAT_COLOR: Record<string, string> = {
    'AI':            '#8B5CF6',
    'Office':        '#3B82F6',
    'Presentations': '#EAB308',
    'Design':        '#EC4899',
    'Video':         '#F97316',
    'Other':         '#6B7280',
};

const STATUS_COLOR: Record<string, string> = {
    'Ativa':    'var(--green)',
    'Expirada': 'var(--red)',
    'A vencer': 'var(--amber)',
};

/* ── Copy button ───────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
    const [ok, setOk] = useState(false);
    const handle = () => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 2000);
    };
    return (
        <button onClick={handle} title="Copiar" style={{
            background: ok ? 'var(--accent-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${ok ? 'var(--accent-mid)' : 'var(--border)'}`,
            color: ok ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', width: 30, height: 30,
            borderRadius: 7, flexShrink: 0, transition: 'all 0.15s',
        }}>
            {ok ? <Check size={13} /> : <Copy size={13} />}
        </button>
    );
}

/* ── Credentials drawer ────────────────────────────────── */
function CredDrawer({ license, onClose }: { license: License; onClose: () => void }) {
    const [showPass, setShowPass] = useState(false);
    const color    = CAT_COLOR[license.categoria || 'Other'] ?? CAT_COLOR['Other'];
    const initials = license.name.slice(0, 2).toUpperCase();

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: 20, padding: 28,
                    width: '100%', maxWidth: 420,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                    animation: 'fadeInUp 0.2s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 13,
                        background: `${color}20`, border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, fontWeight: 800, color, flexShrink: 0,
                        fontFamily: 'Outfit, sans-serif',
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {license.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {license.vendor}
                            <span style={{
                                padding: '2px 8px', borderRadius: 99,
                                background: `${color}18`, color,
                                fontSize: 10, fontWeight: 600,
                            }}>
                                {license.categoria || 'Other'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0,
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {license.login && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Login</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                    {license.login}
                                </span>
                                <CopyBtn text={license.login} />
                            </div>
                        </div>
                    )}

                    {license.password && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Senha</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--text-primary)', letterSpacing: showPass ? 'normal' : '0.15em', wordBreak: 'break-all' }}>
                                    {showPass ? license.password : '•'.repeat(Math.min(license.password.length, 16))}
                                </span>
                                <button
                                    onClick={() => setShowPass(p => !p)}
                                    title={showPass ? 'Ocultar' : 'Revelar senha'}
                                    style={{
                                        background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                                    }}
                                >
                                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <CopyBtn text={license.password} />
                            </div>
                        </div>
                    )}

                    {license.key && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Chave de Licença</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                                    {license.key}
                                </span>
                                <CopyBtn text={license.key} />
                            </div>
                        </div>
                    )}
                </div>

                {license.notes && (
                    <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)',
                        borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                    }}>
                        {license.notes}
                    </div>
                )}

                <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}>
                    Fechar
                </button>
            </div>
        </div>
    );
}

/* ── List row ──────────────────────────────────────────── */
function VaultRow({ license, onClick }: { license: License; onClick: () => void }) {
    const color    = CAT_COLOR[license.categoria || 'Other'] ?? CAT_COLOR['Other'];
    const initials = license.name.slice(0, 2).toUpperCase();
    const statusColor = STATUS_COLOR[license.status] ?? 'var(--text-muted)';

    return (
        <button
            onClick={onClick}
            style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background 150ms, border-color 150ms',
                width: '100%',
                boxSizing: 'border-box',
                borderBottom: '1px solid var(--border)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
            {/* Avatar */}
            <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif',
            }}>
                {initials}
            </div>

            {/* Name + vendor */}
            <div style={{ flex: '0 0 200px', minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {license.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {license.vendor}
                </div>
            </div>

            {/* Categoria */}
            <div style={{ flex: '0 0 90px' }}>
                <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                    background: `${color}15`, color, border: `1px solid ${color}30`,
                }}>
                    {license.categoria || 'Other'}
                </span>
            </div>

            {/* Login preview */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {license.login ? (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {license.login}
                    </span>
                ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                )}
            </div>

            {/* Status */}
            <div style={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: statusColor, fontWeight: 500 }}>{license.status}</span>
            </div>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                <KeyRound size={13} />
                <span style={{ fontFamily: 'Inter, sans-serif' }}>Ver</span>
                <ChevronRight size={13} />
            </div>
        </button>
    );
}

/* ── Main page ─────────────────────────────────────────── */
export default function VaultPage() {
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('Todos');
    const [selected, setSelected] = useState<License | undefined>();

    const { data: licenses, isLoading } = useRealtimeTable<License>('/api/licenses', 'licenses');

    const filtered = useMemo(() => licenses
        .filter(l => !!(l.login || l.password || l.key))
        .filter(l => {
            const q = search.toLowerCase();
            const matchSearch = !q || l.name.toLowerCase().includes(q) || l.vendor.toLowerCase().includes(q);
            const matchFilter = filter === 'Todos' || l.status === filter || (l.categoria || 'Other') === filter;
            return matchSearch && matchFilter;
        }), [licenses, search, filter]);

    const activeCount = filtered.filter(l => l.status === 'Ativa').length;

    return (
        <div>
            {selected && (
                <CredDrawer license={selected} onClose={() => setSelected(undefined)} />
            )}

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Lock size={17} color="var(--accent)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>
                            Vault
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                            {activeCount} ativas · {filtered.length} com credenciais — clique para ver acesso
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input"
                        placeholder="Buscar ferramenta..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 150 }}>
                    <option value="Todos">Todos</option>
                    <option value="Ativa">Ativas</option>
                    <option value="Expirada">Expiradas</option>
                    <option value="AI">AI</option>
                    <option value="Design">Design</option>
                    <option value="Video">Video</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* List */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
                    <div className="spinner" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    <Lock size={40} />
                    <p>{licenses.length === 0 ? 'Nenhuma ferramenta no vault.' : 'Nenhum resultado.'}</p>
                    {search && (
                        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setSearch('')}>
                            Limpar busca
                        </button>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                    }}>
                        <div style={{ flex: '0 0 38px' }} />
                        <div style={{ flex: '0 0 200px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ferramenta</div>
                        <div style={{ flex: '0 0 90px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Categoria</div>
                        <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Login</div>
                        <div style={{ flex: '0 0 80px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</div>
                        <div style={{ flex: '0 0 60px' }} />
                    </div>

                    {/* Rows */}
                    <div>
                        {filtered.map((l, i) => (
                            <div key={l.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <VaultRow license={l} onClick={() => setSelected(l)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
