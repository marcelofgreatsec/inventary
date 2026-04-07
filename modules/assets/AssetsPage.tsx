'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, Package, Loader2, X,
    Search, Filter, Copy, Check, Edit2,
    Monitor, MapPin, Hash, Activity
} from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
    'Ativo': 'badge-green', 'Manutenção': 'badge-amber', 'Desativado': 'badge-red'
};

interface Asset {
    id: string; name: string; type: string; status: string;
    ip?: string; location?: string; serial?: string;
}

/* ── Copy button ── */
function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            title="Copiar"
            style={{ background: 'none', border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s', marginLeft: 6 }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}

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

function AssetModal({ onClose, onSave, asset }: { onClose: () => void; onSave: () => void; asset?: Asset }) {
    const [form, setForm] = useState(asset ? {
        name: asset.name, type: asset.type, status: asset.status,
        ip: asset.ip || '', location: asset.location || '', serial: asset.serial || ''
    } : { name: '', type: 'Servidor', status: 'Ativo', ip: '', location: '', serial: '' });

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
        const url    = asset ? `/api/assets/${asset.id}` : '/api/assets';
        const method = asset ? 'PATCH' : 'POST';
        await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 540 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="asset-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {asset ? 'Editar Ativo' : 'Novo Ativo'}
                    </h2>
                    <button onClick={onClose} aria-label="Fechar modal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome do Ativo *</label>
                        <input className="input" value={form.name} onChange={f('name')} required placeholder="SRV-PRINCIPAL-01" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Servidor', 'Desktop', 'Notebook', 'Rede', 'Storage', 'Impressora', 'Outro'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Ativo', 'Manutenção', 'Desativado'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Endereço IP</label>
                            <input className="input" value={form.ip} onChange={f('ip')} placeholder="192.168.1.10" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                        <div className="form-group">
                            <label>Localização</label>
                            <input className="input" value={form.location} onChange={f('location')} placeholder="Datacenter A / Rack 04" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Número de Série / Service Tag</label>
                        <input className="input" value={form.serial} onChange={f('serial')} placeholder="SN12345678" style={{ fontFamily: 'JetBrains Mono' }} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving
                                ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                                : asset ? 'Atualizar Ativo' : 'Salvar Ativo'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AssetsPage() {
    const [modal,           setModal]           = useState(false);
    const [editingAsset,    setEditingAsset]    = useState<Asset | undefined>();
    const [confirmDelete,   setConfirmDelete]   = useState<Asset | undefined>();
    const [search,          setSearch]          = useState('');
    const [statusFilter,    setStatusFilter]    = useState('Todos');

    const { data: assets, isLoading, refresh } = useRealtimeTable<Asset>('/api/assets', 'assets');

    const filtered = useMemo(() => assets.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                            (a.ip || '').includes(search) ||
                            (a.serial || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
        return matchSearch && matchStatus;
    }), [assets, search, statusFilter]);

    const active   = assets.filter(a => a.status === 'Ativo').length;
    const maint    = assets.filter(a => a.status === 'Manutenção').length;
    const offline  = assets.filter(a => a.status === 'Desativado').length;

    const handleDelete = (item: Asset) => setConfirmDelete(item);
    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;
        await fetch(`/api/assets/${confirmDelete.id}`, { method: 'DELETE' });
        setConfirmDelete(undefined);
        refresh();
    };

    const statusCards = [
        { label: 'Ativos',      value: active,  icon: Monitor,  color: 'var(--green)', badge: 'badge-green' },
        { label: 'Manutenção',  value: maint,   icon: Activity, color: 'var(--amber)', badge: 'badge-amber' },
        { label: 'Offline',     value: offline, icon: Trash2,   color: 'var(--red)',   badge: 'badge-red'   },
        { label: 'Total',       value: assets.length, icon: Package, color: 'var(--blue)',  badge: 'badge-blue'  },
    ];

    return (
        <div>
            {confirmDelete && (
                <ConfirmModal
                    message={`Deseja remover o ativo "${confirmDelete.name}"? Esta ação removerá permanentemente o item do inventário.`}
                    onConfirm={confirmDeleteAction}
                    onCancel={() => setConfirmDelete(undefined)}
                />
            )}
            {modal && (
                <AssetModal
                    onClose={() => { setModal(false); setEditingAsset(undefined); }}
                    onSave={() => refresh()}
                    asset={editingAsset}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventário de TI</h1>
                    <p className="page-subtitle">{active} ativo(s) operacionais de {assets.length} totais</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar ativo, IP ou serial..."
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
                            <option>Ativo</option>
                            <option>Manutenção</option>
                            <option>Desativado</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingAsset(undefined); setModal(true); }}>
                        <Plus size={15} /> Novo Ativo
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {!isLoading && assets.length > 0 && (
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
                        <Package size={40} />
                        {assets.length === 0 ? (
                            <>
                                <p>Nenhum ativo cadastrado.</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditingAsset(undefined); setModal(true); }}>
                                    <Plus size={15} /> Adicionar primeiro ativo
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
                                    <th>Ativo</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Endereço IP</th>
                                    <th>Localização</th>
                                    <th>Série / Tag</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                    <Monitor size={14} />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{a.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-blue">{a.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[a.status] || 'badge-blue'}`}>{a.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                                                {a.ip || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                {a.ip && <CopyBtn text={a.ip} />}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                <MapPin size={12} style={{ opacity: 0.5 }} />
                                                {a.location || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
                                                <Hash size={12} style={{ opacity: 0.5 }} />
                                                {a.serial || '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => { setEditingAsset(a); setModal(true); }}
                                                    className="btn btn-ghost"
                                                    aria-label={`Editar ${a.name}`}
                                                    style={{ padding: '5px 10px' }}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(a)}
                                                    className="btn btn-danger"
                                                    aria-label={`Remover ${a.name}`}
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
