'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, Archive, Loader2, X,
    Search, Filter, Edit2, User, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface ArchivedUser {
    id: string; nome: string; email?: string; departamento?: string; cargo?: string;
    data_entrada?: string; data_saida?: string; motivo_saida?: string;
    equipamentos_devolvidos: boolean; acessos_revogados: boolean; notas?: string;
    created_at: string;
}

function statusOf(u: ArchivedUser) {
    return u.equipamentos_devolvidos && u.acessos_revogados ? 'Completo' : 'Pendente';
}

function CheckToggle({ checked, label }: { checked: boolean; label: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            {checked
                ? <CheckCircle size={14} color="var(--green)" />
                : <XCircle size={14} color="var(--red)" style={{ opacity: 0.7 }} />
            }
            <span style={{ color: checked ? 'var(--green)' : 'var(--text-muted)' }}>{label}</span>
        </div>
    );
}

function ArchiveModal({ onClose, onSave, user: archivedUser }: { onClose: () => void; onSave: () => void; user?: ArchivedUser }) {
    const empty = {
        nome: '', email: '', departamento: '', cargo: '',
        data_entrada: '', data_saida: '', motivo_saida: '',
        equipamentos_devolvidos: false, acessos_revogados: false, notas: ''
    };
    const [form, setForm] = useState(archivedUser ? {
        nome: archivedUser.nome, email: archivedUser.email || '',
        departamento: archivedUser.departamento || '', cargo: archivedUser.cargo || '',
        data_entrada: archivedUser.data_entrada || '', data_saida: archivedUser.data_saida || '',
        motivo_saida: archivedUser.motivo_saida || '',
        equipamentos_devolvidos: archivedUser.equipamentos_devolvidos,
        acessos_revogados: archivedUser.acessos_revogados,
        notas: archivedUser.notas || '',
    } : empty);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const focusable = Array.from(
            modalRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) || []
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
        const url    = archivedUser ? `/api/archive/${archivedUser.id}` : '/api/archive';
        const method = archivedUser ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                data_entrada: form.data_entrada || null,
                data_saida: form.data_saida || null,
            })
        });
        if (res.ok) { onSave(); onClose(); }
        else { const err = await res.json(); setSaveError(err.error || 'Erro ao salvar.'); }
        setSaving(false);
    };

    const f = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(p => ({ ...p, [k]: e.target.value }));

    const toggle = (k: 'equipamentos_devolvidos' | 'acessos_revogados') =>
        setForm(p => ({ ...p, [k]: !p[k] }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 560 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="archive-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="archive-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {archivedUser ? 'Editar Registro' : 'Arquivar Usuário'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Nome *</label>
                            <input className="input" value={form.nome} onChange={f('nome')} required placeholder="Nome completo" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="email@empresa.com" />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Departamento</label>
                            <input className="input" value={form.departamento} onChange={f('departamento')} placeholder="TI, Marketing..." />
                        </div>
                        <div className="form-group">
                            <label>Cargo</label>
                            <input className="input" value={form.cargo} onChange={f('cargo')} placeholder="Analista, Gerente..." />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Data de Entrada</label>
                            <input className="input" type="date" value={form.data_entrada} onChange={f('data_entrada')} />
                        </div>
                        <div className="form-group">
                            <label>Data de Saída</label>
                            <input className="input" type="date" value={form.data_saida} onChange={f('data_saida')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Motivo da Saída</label>
                        <input className="input" value={form.motivo_saida} onChange={f('motivo_saida')} placeholder="Demissão, Pedido de demissão, Aposentadoria..." />
                    </div>

                    {/* Checkboxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {[
                            { k: 'equipamentos_devolvidos' as const, label: 'Equipamentos Devolvidos' },
                            { k: 'acessos_revogados' as const,       label: 'Acessos Revogados' },
                        ].map(({ k, label }) => (
                            <label
                                key={k}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                    padding: '10px 14px', borderRadius: 'var(--radius)',
                                    border: `1px solid ${form[k] ? 'rgba(34,214,105,0.3)' : 'var(--border-mid)'}`,
                                    background: form[k] ? 'var(--green-mid)' : 'transparent',
                                    transition: 'all 0.2s',
                                    textTransform: 'none', letterSpacing: 0, fontSize: 13, fontFamily: 'inherit',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={form[k]}
                                    onChange={() => toggle(k)}
                                    style={{ accentColor: 'var(--green)', width: 15, height: 15 }}
                                />
                                {form[k]
                                    ? <CheckCircle size={15} color="var(--green)" />
                                    : <XCircle size={15} color="var(--text-muted)" />
                                }
                                {label}
                            </label>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>Notas</label>
                        <textarea className="input" style={{ minHeight: 64, resize: 'vertical' }} value={form.notas} onChange={f('notas')} placeholder="Informações adicionais..." />
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
                                : archivedUser ? 'Atualizar' : 'Arquivar'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ArchivePage() {
    const [modal,       setModal]       = useState(false);
    const [editingUser, setEditingUser] = useState<ArchivedUser | undefined>();
    const [search,      setSearch]      = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const { data: users, isLoading, refresh } = useRealtimeTable<ArchivedUser>('/api/archive', 'archived_users');

    const fmtDate = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

    const filtered = useMemo(() => users.filter(u => {
        const matchSearch = u.nome.toLowerCase().includes(search.toLowerCase()) ||
                            (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                            (u.departamento || '').toLowerCase().includes(search.toLowerCase());
        const status = statusOf(u);
        const matchStatus = statusFilter === 'Todos' || status === statusFilter;
        return matchSearch && matchStatus;
    }), [users, search, statusFilter]);

    const completo  = users.filter(u => statusOf(u) === 'Completo').length;
    const pendente  = users.filter(u => statusOf(u) === 'Pendente').length;

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este registro de arquivo?')) return;
        await fetch(`/api/archive/${id}`, { method: 'DELETE' });
        refresh();
    };

    return (
        <div>
            {modal && (
                <ArchiveModal
                    onClose={() => { setModal(false); setEditingUser(undefined); }}
                    onSave={refresh}
                    user={editingUser}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Archive</h1>
                    <p className="page-subtitle">Usuários desligados/inativos · {users.length} registro(s)</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 240, paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 150, paddingLeft: 36 }}>
                            <option>Todos</option>
                            <option>Completo</option>
                            <option>Pendente</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingUser(undefined); setModal(true); }}>
                        <Plus size={15} /> Arquivar Usuário
                    </button>
                </div>
            </div>

            {/* Summary */}
            {!isLoading && users.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                    {[
                        { label: 'Total Arquivados', value: users.length, color: 'var(--blue)',  icon: Archive },
                        { label: 'Completos',        value: completo,     color: 'var(--green)', icon: CheckCircle },
                        { label: 'Pendentes',        value: pendente,     color: 'var(--amber)', icon: Clock },
                    ].map(c => (
                        <div key={c.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <c.icon size={18} color={c.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Outfit', color: c.color, lineHeight: 1 }}>{c.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 3 }}>{c.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty">
                        <Archive size={40} />
                        {users.length === 0 ? (
                            <>
                                <p>Nenhum usuário arquivado.</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditingUser(undefined); setModal(true); }}>
                                    <Plus size={15} /> Arquivar primeiro usuário
                                </button>
                            </>
                        ) : (
                            <>
                                <p>Nenhum resultado para os filtros.</p>
                                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setStatusFilter('Todos'); }}>Limpar filtros</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Departamento</th>
                                    <th>Cargo</th>
                                    <th>Data Saída</th>
                                    <th>Motivo</th>
                                    <th>Equipamentos</th>
                                    <th>Acessos</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => {
                                    const status = statusOf(u);
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{u.nome}</div>
                                                        {u.email && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{u.email}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.departamento || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.cargo || '—'}</td>
                                            <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(u.data_saida)}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {u.motivo_saida || '—'}
                                            </td>
                                            <td><CheckToggle checked={u.equipamentos_devolvidos} label={u.equipamentos_devolvidos ? 'Sim' : 'Não'} /></td>
                                            <td><CheckToggle checked={u.acessos_revogados}       label={u.acessos_revogados       ? 'Sim' : 'Não'} /></td>
                                            <td>
                                                <span className={`badge ${status === 'Completo' ? 'badge-green' : 'badge-amber'}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => { setEditingUser(u); setModal(true); }} className="btn btn-ghost" style={{ padding: '5px 10px' }} aria-label={`Editar ${u.nome}`}><Edit2 size={13} /></button>
                                                    <button onClick={() => handleDelete(u.id)} className="btn btn-danger" style={{ padding: '5px 10px' }} aria-label={`Remover ${u.nome}`}><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
