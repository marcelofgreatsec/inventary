'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Search, X, Eye, EyeOff, Copy, Check, KeyRound, Lock } from 'lucide-react';

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
    const color = CAT_COLOR[license.categoria || 'Other'] ?? CAT_COLOR['Other'];
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
                    borderRadius: 20,
                    padding: 28,
                    width: '100%', maxWidth: 420,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                    animation: 'fadeInUp 0.2s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: `${color}20`, border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color, flexShrink: 0,
                        fontFamily: 'Outfit, sans-serif',
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {license.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                            {license.vendor}
                            <span style={{
                                marginLeft: 8, padding: '2px 8px', borderRadius: 99,
                                background: `${color}18`, color,
                                fontSize: 11, fontWeight: 600,
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

                {/* Credential fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {license.login && (
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 12, padding: '14px 16px',
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Login
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    flex: 1, fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all',
                                }}>
                                    {license.login}
                                </span>
                                <CopyBtn text={license.login} />
                            </div>
                        </div>
                    )}

                    {license.password && (
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 12, padding: '14px 16px',
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Senha
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    flex: 1, fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all',
                                    letterSpacing: showPass ? 'normal' : '0.15em',
                                }}>
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
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <CopyBtn text={license.password} />
                            </div>
                        </div>
                    )}

                    {license.key && (
                        <div style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 12, padding: '14px 16px',
                        }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Chave de Licença
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    flex: 1, fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all',
                                }}>
                                    {license.key}
                                </span>
                                <CopyBtn text={license.key} />
                            </div>
                        </div>
                    )}

                    {!license.login && !license.password && !license.key && (
                        <div style={{
                            padding: '24px 16px', textAlign: 'center',
                            color: 'var(--text-muted)', fontSize: 13,
                        }}>
                            Nenhuma credencial cadastrada.
                        </div>
                    )}
                </div>

                {license.notes && (
                    <div style={{
                        marginTop: 14, padding: '10px 14px',
                        background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)',
                        borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                    }}>
                        {license.notes}
                    </div>
                )}

                <button
                    className="btn btn-ghost"
                    onClick={onClose}
                    style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}
                >
                    Fechar
                </button>
            </div>
        </div>
    );
}

/* ── Tool card ─────────────────────────────────────────── */
function ToolCard({ license, onClick }: { license: License; onClick: () => void }) {
    const color    = CAT_COLOR[license.categoria || 'Other'] ?? CAT_COLOR['Other'];
    const initials = license.name.slice(0, 2).toUpperCase();
    const hasAccess = !!(license.login || license.password || license.key);

    return (
        <button
            onClick={onClick}
            style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '18px 18px 16px',
                cursor: 'pointer',
                transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                position: 'relative',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
                (e.currentTarget as HTMLElement).style.borderColor = `${color}50`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
                (e.currentTarget as HTMLElement).style.borderColor = '';
            }}
        >
            {/* Status dot */}
            <div style={{
                position: 'absolute', top: 14, right: 14,
                width: 8, height: 8, borderRadius: '50%',
                background: STATUS_COLOR[license.status] ?? 'var(--text-muted)',
                boxShadow: license.status === 'Ativa' ? `0 0 0 3px ${STATUS_COLOR['Ativa']}25` : 'none',
            }} title={license.status} />

            {/* Avatar */}
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color,
                fontFamily: 'Outfit, sans-serif', flexShrink: 0,
            }}>
                {initials}
            </div>

            {/* Name + vendor */}
            <div>
                <div style={{
                    fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif',
                    color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 3,
                }}>
                    {license.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {license.vendor}
                </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                    background: `${color}15`, color, border: `1px solid ${color}30`,
                }}>
                    {license.categoria || 'Other'}
                </span>
                {hasAccess && (
                    <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif',
                    }}>
                        <KeyRound size={10} />
                        ver acesso
                    </span>
                )}
            </div>
        </button>
    );
}

/* ── Main page ─────────────────────────────────────────── */
export default function VaultPage() {
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('Todos');
    const [selected,   setSelected]   = useState<License | undefined>();

    const { data: licenses, isLoading } = useRealtimeTable<License>('/api/licenses', 'licenses');

    const filtered = useMemo(() => licenses.filter(l => {
        const q = search.toLowerCase();
        const matchSearch = !q || l.name.toLowerCase().includes(q) || l.vendor.toLowerCase().includes(q);
        const matchFilter = filter === 'Todos' || l.status === filter || (l.categoria || 'Other') === filter;
        return matchSearch && matchFilter;
    }), [licenses, search, filter]);

    const activeCount = licenses.filter(l => l.status === 'Ativa').length;

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
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                            {activeCount} ativas · {licenses.length} no total — clique para ver as credenciais
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
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
                <select
                    className="select"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ width: 150 }}
                >
                    <option value="Todos">Todos</option>
                    <option value="Ativa">Ativas</option>
                    <option value="Expirada">Expiradas</option>
                    <option value="AI">AI</option>
                    <option value="Design">Design</option>
                    <option value="Video">Video</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Grid */}
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
                    gap: 12,
                }}>
                    {filtered.map(l => (
                        <ToolCard key={l.id} license={l} onClick={() => setSelected(l)} />
                    ))}
                </div>
            )}
        </div>
    );
}
