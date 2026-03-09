'use client';

import { useState } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Plus, Trash2, Package, Loader2, X } from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
    'Ativo': 'badge-green', 'Manutenção': 'badge-amber', 'Desativado': 'badge-red'
};

interface Asset {
    id: string; name: string; type: string; status: string;
    ip?: string; location?: string; serial?: string;
}

function AssetModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ name: '', type: 'Servidor', status: 'Ativo', ip: '', location: '', serial: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        onSave();
        onClose();
        setSaving(false);
    };

    const field = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [f]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Novo Ativo</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome *</label><input className="input" value={form.name} onChange={field('name')} required placeholder="SRV-PRINCIPAL-01" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo *</label>
                            <select className="select" value={form.type} onChange={field('type')}>
                                {['Servidor', 'Desktop', 'Notebook', 'Rede', 'Storage', 'Impressora', 'Outro'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={field('status')}>
                                {['Ativo', 'Manutenção', 'Desativado'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>IP</label><input className="input" value={form.ip} onChange={field('ip')} placeholder="192.168.1.10" /></div>
                        <div className="form-group"><label>Localização</label><input className="input" value={form.location} onChange={field('location')} placeholder="Datacenter A" /></div>
                    </div>
                    <div className="form-group"><label>Serial</label><input className="input" value={form.serial} onChange={field('serial')} placeholder="SN123456" /></div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar Ativo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AssetsPage() {
    const [modal, setModal] = useState(false);
    const { data: assets, isLoading, refresh } = useRealtimeTable<Asset>('/api/assets', 'assets');

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este ativo?')) return;
        await fetch(`/api/assets/${id}`, { method: 'DELETE' });
        refresh();
    };

    return (
        <div>
            {modal && <AssetModal onClose={() => setModal(false)} onSave={() => refresh()} />}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventário de Ativos</h1>
                    <p className="page-subtitle">{assets.length} ativo(s) cadastrado(s)</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                    <Plus size={16} /> Novo Ativo
                </button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : assets.length === 0 ? (
                    <div className="empty"><Package size={40} /><p>Nenhum ativo cadastrado.</p><p style={{ fontSize: 13, marginTop: 6 }}>Clique em "Novo Ativo" para começar.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr><th>Nome</th><th>Tipo</th><th>Status</th><th>IP</th><th>Localização</th><th>Serial</th><th></th></tr>
                            </thead>
                            <tbody>
                                {assets.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                                        <td><span className="badge badge-blue">{a.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[a.status] || 'badge-blue'}`}>{a.status}</span></td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{a.ip || '—'}</td>
                                        <td>{a.location || '—'}</td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>{a.serial || '—'}</td>
                                        <td>
                                            <button onClick={() => handleDelete(a.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}>
                                                <Trash2 size={14} />
                                            </button>
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
