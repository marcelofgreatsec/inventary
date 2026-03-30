'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Plus, Trash2, Server, Loader2, X, Search, Filter, Copy, Check, Edit2 } from 'lucide-react';

const STATUS_MAP: Record<string, string> = { 'Online': 'badge-green', 'Offline': 'badge-red', 'Manutenção': 'badge-amber' };

interface Infra {
    id: string; name: string; type: string; status: string;
    ip?: string; os?: string; cpu?: string; ram_gb?: number; disk_gb?: number;
    location?: string;
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
                <h2 id="confirm-title" className="modal-title">Confirmar remoção</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{message}</p>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Remover</button>
                </div>
            </div>
        </div>
    );
}

function InfraModal({ onClose, onSave, infra }: { onClose: () => void; onSave: () => void; infra?: Infra }) {
    const [form, setForm] = useState(infra ? {
        name: infra.name,
        type: infra.type,
        status: infra.status,
        ip: infra.ip || '',
        os: infra.os || '',
        cpu: infra.cpu || '',
        ram_gb: infra.ram_gb?.toString() || '',
        disk_gb: infra.disk_gb?.toString() || '',
        location: infra.location || ''
    } : { name: '', type: 'Servidor', status: 'Online', ip: '', os: '', cpu: '', ram_gb: '', disk_gb: '', location: '' });
    
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
        const url = infra ? `/api/infrastructure/${infra.id}` : '/api/infrastructure';
        const method = infra ? 'PATCH' : 'POST';
        
        await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...form, 
                ram_gb: form.ram_gb ? parseInt(form.ram_gb) : null, 
                disk_gb: form.disk_gb ? parseInt(form.disk_gb) : null 
            }) 
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 580 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="infra-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 id="infra-modal-title" className="modal-title" style={{ marginBottom: 0 }}>{infra ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
                    <button onClick={onClose} aria-label="Fechar modal" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="SRV-APP-01" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Tipo</label><select className="select" value={form.type} onChange={f('type')}>{['Servidor', 'Switch', 'Firewall', 'Router', 'Storage', 'VM', 'Outro'].map(t => <option key={t}>{t}</option>)}</select></div>
                        <div className="form-group"><label>Status</label><select className="select" value={form.status} onChange={f('status')}>{['Online', 'Offline', 'Manutenção'].map(s => <option key={s}>{s}</option>)}</select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>IP</label><input className="input" value={form.ip} onChange={f('ip')} placeholder="10.0.0.1" /></div>
                        <div className="form-group"><label>Sistema Operacional</label><input className="input" value={form.os} onChange={f('os')} placeholder="Ubuntu 22.04" /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>CPU</label><input className="input" value={form.cpu} onChange={f('cpu')} placeholder="8 vCPUs" /></div>
                        <div className="form-group"><label>RAM (GB)</label><input className="input" type="number" value={form.ram_gb} onChange={f('ram_gb')} placeholder="32" /></div>
                        <div className="form-group"><label>Disco (GB)</label><input className="input" type="number" value={form.disk_gb} onChange={f('disk_gb')} placeholder="500" /></div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : (infra ? 'Atualizar' : 'Salvar')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}

export default function InfraPage() {
    const [modal, setModal] = useState(false);
    const [editingInfra, setEditingInfra] = useState<Infra | undefined>();
    const [confirmDelete, setConfirmDelete] = useState<Infra | undefined>();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 250);
        return () => clearTimeout(t);
    }, [search]);

    const { data: infra, isLoading, refresh } = useRealtimeTable<Infra>('/api/infrastructure', 'infrastructure');

    const filteredInfra = useMemo(() => {
        return infra.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                                 (i.ip || '').includes(debouncedSearch);
            const matchesStatus = statusFilter === 'Todos' || i.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [infra, debouncedSearch, statusFilter]);

    const online = infra.filter(i => i.status === 'Online').length;

    const handleDelete = (item: Infra) => setConfirmDelete(item);

    const confirmDeleteAction = async () => {
        if (!confirmDelete) return;
        await fetch(`/api/infrastructure/${confirmDelete.id}`, { method: 'DELETE' });
        setConfirmDelete(undefined);
        refresh();
    };

    return (
        <div>
            {confirmDelete && (
                <ConfirmModal
                    message={`Tem certeza que deseja remover "${confirmDelete.name}"? Esta ação não pode ser desfeita.`}
                    onConfirm={confirmDeleteAction}
                    onCancel={() => setConfirmDelete(undefined)}
                />
            )}
            {modal && (
                <InfraModal
                    onClose={() => { setModal(false); setEditingInfra(undefined); }}
                    onSave={() => refresh()}
                    infra={editingInfra}
                />
            )}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Infraestrutura</h1>
                    <p className="page-subtitle">{online}/{infra.length} equipamento(s) online</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            className="input" 
                            placeholder="Buscar equipamento ou IP..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: 240, paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <select 
                            className="select" 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: 140, paddingLeft: 36 }}
                        >
                            <option>Todos</option>
                            <option>Online</option>
                            <option>Offline</option>
                            <option>Manutenção</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingInfra(undefined); setModal(true); }}>
                        <Plus size={16} /> Novo Equipamento
                    </button>
                </div>
            </div>
            {(statusFilter !== 'Todos' || debouncedSearch) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filtros ativos:</span>
                    {statusFilter !== 'Todos' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: 'color-mix(in srgb, var(--blue) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--blue) 30%, transparent)', borderRadius: 20, fontSize: 12, color: 'var(--blue)' }}>
                            {statusFilter}
                            <button onClick={() => setStatusFilter('Todos')} aria-label="Remover filtro de status" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, marginLeft: 2, fontSize: 14 }}>×</button>
                        </span>
                    )}
                    {debouncedSearch && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: 'color-mix(in srgb, var(--blue) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--blue) 30%, transparent)', borderRadius: 20, fontSize: 12, color: 'var(--blue)' }}>
                            "{debouncedSearch}"
                            <button onClick={() => setSearch('')} aria-label="Limpar busca" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, marginLeft: 2, fontSize: 14 }}>×</button>
                        </span>
                    )}
                </div>
            )}
            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : filteredInfra.length === 0 ? (
                    <div className="empty">
                        <Server size={40} />
                        {infra.length === 0 ? (
                            <>
                                <p>Nenhum equipamento cadastrado.</p>
                                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setEditingInfra(undefined); setModal(true); }}>Adicionar primeiro equipamento</button>
                            </>
                        ) : (
                            <>
                                <p>Nenhum resultado para os filtros aplicados.</p>
                                <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { setSearch(''); setStatusFilter('Todos'); }}>Limpar filtros</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th>IP</th><th>SO</th><th>CPU</th><th>RAM</th><th>Disco</th><th></th></tr></thead>
                            <tbody>
                                {filteredInfra.map(i => (
                                    <tr key={i.id}>
                                        <td style={{ fontWeight: 600 }}>{i.name}</td>
                                        <td><span className="badge badge-blue">{i.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[i.status] || 'badge-blue'}`}>{i.status}</span></td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {i.ip || '—'}
                                                {i.ip && <CopyBtn text={i.ip} />}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{i.os || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.cpu || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.ram_gb ? `${i.ram_gb} GB` : '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.disk_gb ? `${i.disk_gb} GB` : '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => { setEditingInfra(i); setModal(true); }}
                                                    className="btn btn-ghost"
                                                    aria-label={`Editar ${i.name}`}
                                                    style={{ padding: '5px 10px' }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(i)} className="btn btn-danger" aria-label={`Remover ${i.name}`} style={{ padding: '5px 10px' }}>
                                                    <Trash2 size={14} />
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
