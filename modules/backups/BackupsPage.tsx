import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, HardDrive, Loader2, X,
    Search, Filter, Activity, Server,
    CheckCircle2, AlertCircle, Clock, Edit2, Calendar
} from 'lucide-react';

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const focusable = Array.from(
            ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
        );
        focusable[0]?.focus();
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onCancel(); return; }
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

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }} ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-mid)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={20} color="var(--red)" />
                    </div>
                    <h2 id="confirm-title" className="modal-title" style={{ marginBottom: 0 }}>Confirmar remoção</h2>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        <Trash2 size={14} /> Remover
                    </button>
                </div>
            </div>
        </div>
    );
}

const STATUS_MAP: Record<string, string> = {
    'Sucesso': 'badge-green', 'Falha': 'badge-red', 'Rodando': 'badge-blue', 'Pendente': 'badge-amber'
};

interface Backup {
    id: string; name: string; server: string; status: string;
    type: string; size_gb?: number; last_run?: string;
}

function BackupModal({ onClose, onSave, backup }: { onClose: () => void; onSave: () => void; backup?: Backup }) {
    const [form, setForm] = useState(backup ? {
        name: backup.name, server: backup.server, type: backup.type, status: backup.status,
        size_gb: backup.size_gb?.toString() || ''
    } : { name: '', server: '', type: 'Completo', status: 'Pendente', size_gb: '' });

    const [saving, setSaving] = useState(false);
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
        e.preventDefault(); setSaving(true);
        const val    = { ...form, size_gb: form.size_gb ? parseFloat(form.size_gb) : null };
        const url    = backup ? `/api/backups/${backup.id}` : '/api/backups';
        const method = backup ? 'PATCH' : 'POST';

        await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(val)
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 540 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="backup-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="backup-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {backup ? 'Editar Rotina' : 'Nova Rotina de Backup'}
                    </h2>
                    <button onClick={onClose} aria-label="Fechar modal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome da Rotina *</label>
                        <input className="input" value={form.name} onChange={f('name')} required placeholder="Backup Diário BD" />
                    </div>
                    <div className="form-group">
                        <label>Servidor / Alvo *</label>
                        <input className="input" value={form.server} onChange={f('server')} required placeholder="SRV-DB-01" style={{ fontFamily: 'JetBrains Mono' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo de Backup</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Completo', 'Incremental', 'Diferencial'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status Atual</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Sucesso', 'Falha', 'Rodando', 'Pendente'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Espaço Utilizado (GB)</label>
                        <input className="input" type="number" step="0.1" value={form.size_gb} onChange={f('size_gb')} placeholder="45.2" />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving
                                ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                                : backup ? 'Atualizar Rotina' : 'Criar Rotina'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function BackupsPage() {
    const [modal,           setModal]           = useState(false);
    const [editingBackup,   setEditingBackup]   = useState<Backup | undefined>();
    const [confirmDelete,   setConfirmDelete]   = useState<Backup | undefined>();
    const [search,          setSearch]          = useState('');
    const [statusFilter,    setStatusFilter]    = useState('Todos');

    const { data: backups, isLoading, refresh } = useRealtimeTable<Backup>('/api/backups', 'backups');

    const fmt = (d?: string) => d ? new Date(d).toLocaleString('pt-BR') : '—';

    const filtered = useMemo(() => backups.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                            b.server.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Todos' || b.status === statusFilter;
        return matchSearch && matchStatus;
    }), [backups, search, statusFilter]);

    const success = backups.filter(b => b.status === 'Sucesso').length;
    const failed  = backups.filter(b => b.status === 'Falha').length;
    const running = backups.filter(b => b.status === 'Rodando').length;

    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;
        await fetch(`/api/backups/${confirmDelete.id}`, { method: 'DELETE' });
        setConfirmDelete(undefined);
        refresh();
    };

    const statusCards = [
        { label: 'Sucesso',     value: success,  icon: CheckCircle2, color: 'var(--green)' },
        { label: 'Falhas',      value: failed,   icon: AlertCircle,  color: 'var(--red)'   },
        { label: 'Em execução', value: running, icon: Clock,        color: 'var(--blue)'  },
        { label: 'Total',       value: backups.length, icon: HardDrive,   color: 'var(--purple-mid)' },
    ];

    return (
        <div>
            {confirmDelete && (
                <ConfirmModal
                    message={`Deseja remover a rotina de backup "${confirmDelete.name}"? Esta ação removerá o histórico e as configurações de monitoramento.`}
                    onConfirm={confirmDeleteAction}
                    onCancel={() => setConfirmDelete(undefined)}
                />
            )}
            {modal && (
                <BackupModal
                    onClose={() => { setModal(false); setEditingBackup(undefined); }}
                    onSave={() => refresh()}
                    backup={editingBackup}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Backups</h1>
                    <p className="page-subtitle">{success} rotina(s) em conformidade de {backups.length} totais</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar backup ou servidor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 260, paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select
                            className="select"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ width: 140, paddingLeft: 36 }}
                        >
                            <option>Todos</option>
                            <option>Sucesso</option>
                            <option>Falha</option>
                            <option>Rodando</option>
                            <option>Pendente</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingBackup(undefined); setModal(true); }}>
                        <Plus size={15} /> Nova Rotina
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {!isLoading && backups.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                    {statusCards.map(c => (
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
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: c.color, lineHeight: 1 }}>
                                    {c.value}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 3 }}>
                                    {c.label}
                                </div>
                            </div>
                        </div>
                    ))}
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
                        <HardDrive size={40} />
                        <p>{backups.length === 0 ? 'Nenhuma rotina cadastrada.' : 'Nenhum backup encontrado.'}</p>
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rotina</th>
                                    <th>Servidor</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Tamanho</th>
                                    <th>Última Execução</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
                                                    <Activity size={14} />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{b.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                                                <Server size={12} style={{ opacity: 0.5 }} />
                                                {b.server}
                                            </div>
                                        </td>
                                        <td><span className="badge badge-purple" style={{ fontSize: 11 }}>{b.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[b.status] || 'badge-blue'}`}>{b.status}</span></td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {b.size_gb ? `${b.size_gb.toFixed(1)} GB` : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                                                <Calendar size={12} style={{ opacity: 0.5 }} />
                                                {fmt(b.last_run)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => { setEditingBackup(b); setModal(true); }}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '5px 10px' }}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(b)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '5px 10px' }}
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
