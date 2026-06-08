'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, Package, Loader2, X,
    Search, Filter, Copy, Check, Edit2,
    Monitor, MapPin, Hash, Activity, Eye,
    User, Building2, Cpu, Calendar, DollarSign
} from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
    'Ativo': 'badge-green', 'Manutenção': 'badge-amber', 'Desativado': 'badge-red'
};

const ASSET_TYPES = [
    'Notebook', 'Desktop', 'Monitor', 'Servidor', 'Switch',
    'Roteador', 'Telefone', 'Celular', 'Impressora', 'Storage', 'Outros'
];

const DEPARTMENTS = ['TI', 'Marketing', 'RH', 'Financeiro', 'Operações', 'Comercial', 'Diretoria', 'Outros'];

interface Asset {
    id: string; name: string; type: string; status: string;
    ip?: string; location?: string; serial?: string;
    brand?: string; model?: string; patrimonio?: string;
    acquisition_date?: string; acquisition_value?: number;
    warranty_date?: string; responsible_user?: string; department?: string;
    notes?: string;
}

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
    const empty = {
        name: '', type: 'Notebook', status: 'Ativo',
        ip: '', location: '', serial: '',
        brand: '', model: '', patrimonio: '',
        acquisition_date: '', acquisition_value: '',
        warranty_date: '', responsible_user: '', department: 'TI',
        notes: ''
    };

    const [form, setForm] = useState(asset ? {
        name: asset.name, type: asset.type, status: asset.status,
        ip: asset.ip || '', location: asset.location || '', serial: asset.serial || '',
        brand: asset.brand || '', model: asset.model || '', patrimonio: asset.patrimonio || '',
        acquisition_date: asset.acquisition_date || '',
        acquisition_value: asset.acquisition_value?.toString() || '',
        warranty_date: asset.warranty_date || '',
        responsible_user: asset.responsible_user || '',
        department: asset.department || 'TI',
        notes: asset.notes || '',
    } : empty);

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
            body: JSON.stringify({
                ...form,
                acquisition_value: form.acquisition_value ? parseFloat(form.acquisition_value) : null,
                acquisition_date: form.acquisition_date || null,
                warranty_date: form.warranty_date || null,
            })
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 620 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="asset-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {asset ? 'Editar Ativo' : 'Novo Ativo'}
                    </h2>
                    <button onClick={onClose} aria-label="Fechar modal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Identificação */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                        Identificação
                    </div>
                    <div className="form-group">
                        <label>Nome do Ativo *</label>
                        <input className="input" value={form.name} onChange={f('name')} required placeholder="NB-MKT-001" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Ativo', 'Manutenção', 'Desativado'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nº Patrimônio</label>
                            <input className="input" value={form.patrimonio} onChange={f('patrimonio')} placeholder="PAT-0042" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Marca</label>
                            <input className="input" value={form.brand} onChange={f('brand')} placeholder="Dell, Apple, HP..." />
                        </div>
                        <div className="form-group">
                            <label>Modelo</label>
                            <input className="input" value={form.model} onChange={f('model')} placeholder="XPS 15 9520" />
                        </div>
                    </div>

                    {/* Localização e rede */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                        Localização &amp; Rede
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Endereço IP</label>
                            <input className="input" value={form.ip} onChange={f('ip')} placeholder="192.168.1.10" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                        <div className="form-group">
                            <label>Localização</label>
                            <input className="input" value={form.location} onChange={f('location')} placeholder="Datacenter A / Rack 04" />
                        </div>
                        <div className="form-group">
                            <label>Série / Service Tag</label>
                            <input className="input" value={form.serial} onChange={f('serial')} placeholder="SN12345" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                    </div>

                    {/* Responsável */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                        Responsável
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Usuário Responsável</label>
                            <input className="input" value={form.responsible_user} onChange={f('responsible_user')} placeholder="João Silva" />
                        </div>
                        <div className="form-group">
                            <label>Departamento</label>
                            <select className="select" value={form.department} onChange={f('department')}>
                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                        Financeiro &amp; Garantia
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Data de Aquisição</label>
                            <input className="input" type="date" value={form.acquisition_date} onChange={f('acquisition_date')} />
                        </div>
                        <div className="form-group">
                            <label>Valor de Aquisição (R$)</label>
                            <input className="input" type="number" min="0" step="0.01" value={form.acquisition_value} onChange={f('acquisition_value')} placeholder="0,00" />
                        </div>
                        <div className="form-group">
                            <label>Garantia até</label>
                            <input className="input" type="date" value={form.warranty_date} onChange={f('warranty_date')} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observações</label>
                        <textarea className="input" style={{ minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={f('notes')} placeholder="Informações adicionais..." />
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

function AssetDetailModal({ asset, onClose, onEdit }: { asset: Asset; onClose: () => void; onEdit: () => void }) {
    const fmtDate  = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const fmtMoney = (n?: number) => n != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n) : '—';

    const row = (label: string, value: React.ReactNode) => (
        <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.07em', minWidth: 130, paddingTop: 1 }}>
                {label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{value || '—'}</span>
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 540 }} role="dialog" aria-modal="true">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                            <Monitor size={18} />
                        </div>
                        <div>
                            <h2 className="modal-title" style={{ marginBottom: 0, fontSize: 16 }}>{asset.name}</h2>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <span className="badge badge-blue" style={{ fontSize: 9 }}>{asset.type}</span>
                                <span className={`badge ${STATUS_MAP[asset.status] || 'badge-blue'}`} style={{ fontSize: 9 }}>{asset.status}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 20 }}>
                    {row('Marca / Modelo', asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model)}
                    {row('Nº Patrimônio', asset.patrimonio)}
                    {row('Série / Tag', <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{asset.serial}</span>)}
                    {row('Endereço IP', <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{asset.ip}</span>)}
                    {row('Localização', asset.location)}
                    {row('Responsável', asset.responsible_user)}
                    {row('Departamento', asset.department)}
                    {row('Data de Aquisição', fmtDate(asset.acquisition_date))}
                    {row('Valor de Aquisição', fmtMoney(asset.acquisition_value))}
                    {row('Garantia até', fmtDate(asset.warranty_date))}
                    {asset.notes && row('Observações', asset.notes)}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
                    <button className="btn btn-primary" onClick={onEdit}>
                        <Edit2 size={14} /> Editar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AssetsPage() {
    const [modal,           setModal]           = useState(false);
    const [detailModal,     setDetailModal]     = useState(false);
    const [editingAsset,    setEditingAsset]    = useState<Asset | undefined>();
    const [viewingAsset,    setViewingAsset]    = useState<Asset | undefined>();
    const [confirmDelete,   setConfirmDelete]   = useState<Asset | undefined>();
    const [search,          setSearch]          = useState('');
    const [statusFilter,    setStatusFilter]    = useState('Todos');
    const [typeFilter,      setTypeFilter]      = useState('Todos');

    const { data: assets, isLoading, refresh } = useRealtimeTable<Asset>('/api/assets', 'assets');

    const filtered = useMemo(() => assets.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                            (a.ip || '').includes(search) ||
                            (a.serial || '').toLowerCase().includes(search.toLowerCase()) ||
                            (a.responsible_user || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
        const matchType   = typeFilter   === 'Todos' || a.type   === typeFilter;
        return matchSearch && matchStatus && matchType;
    }), [assets, search, statusFilter, typeFilter]);

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

    const openEdit = (a: Asset) => {
        setViewingAsset(undefined);
        setDetailModal(false);
        setEditingAsset(a);
        setModal(true);
    };

    const statusCards = [
        { label: 'Ativos',     value: active,        icon: Monitor,   color: 'var(--green)', badge: 'badge-green' },
        { label: 'Manutenção', value: maint,          icon: Activity,  color: 'var(--amber)', badge: 'badge-amber' },
        { label: 'Offline',    value: offline,        icon: Trash2,    color: 'var(--red)',   badge: 'badge-red'   },
        { label: 'Total',      value: assets.length,  icon: Package,   color: 'var(--blue)',  badge: 'badge-blue'  },
    ];

    return (
        <div>
            {confirmDelete && (
                <ConfirmModal
                    message={`Deseja remover o ativo "${confirmDelete.name}"? Esta ação é permanente.`}
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
            {detailModal && viewingAsset && (
                <AssetDetailModal
                    asset={viewingAsset}
                    onClose={() => { setDetailModal(false); setViewingAsset(undefined); }}
                    onEdit={() => openEdit(viewingAsset)}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventário de TI</h1>
                    <p className="page-subtitle">{active} ativo(s) operacionais de {assets.length} totais</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar ativo, IP, serial ou usuário..."
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
                    <select
                        className="select"
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        style={{ width: 140 }}
                    >
                        <option value="Todos">Todos tipos</option>
                        {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
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
                                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setStatusFilter('Todos'); setTypeFilter('Todos'); }}>
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
                                    <th>Marca / Modelo</th>
                                    <th>Responsável</th>
                                    <th>Depto</th>
                                    <th>Endereço IP</th>
                                    <th>Série / Tag</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                    <Cpu size={14} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                                                    {a.patrimonio && (
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{a.patrimonio}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-blue">{a.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[a.status] || 'badge-blue'}`}>{a.status}</span></td>
                                        <td>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {a.brand || a.model
                                                    ? <span>{[a.brand, a.model].filter(Boolean).join(' ')}</span>
                                                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                }
                                            </div>
                                        </td>
                                        <td>
                                            {a.responsible_user
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                                                    <User size={12} style={{ opacity: 0.5 }} />
                                                    {a.responsible_user}
                                                  </div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {a.department
                                                ? <span className="badge badge-blue" style={{ fontSize: 9 }}>{a.department}</span>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                                                {a.ip || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                {a.ip && <CopyBtn text={a.ip} />}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
                                                <Hash size={12} style={{ opacity: 0.5 }} />
                                                {a.serial || '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => { setViewingAsset(a); setDetailModal(true); }}
                                                    className="btn btn-ghost"
                                                    aria-label={`Ver detalhes de ${a.name}`}
                                                    style={{ padding: '5px 10px' }}
                                                    title="Ver detalhes"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    onClick={() => openEdit(a)}
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
