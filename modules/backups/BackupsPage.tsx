'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Trash2, HardDrive, Loader2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_MAP: Record<string, string> = {
    'Sucesso': 'badge-green', 'Falha': 'badge-red', 'Rodando': 'badge-blue', 'Pendente': 'badge-amber'
};

interface Backup {
    id: string; name: string; server: string; status: string;
    type: string; size_gb?: number; last_run?: string; next_run?: string;
}

function BackupModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ name: '', server: '', type: 'Completo', status: 'Pendente', size_gb: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, size_gb: form.size_gb ? parseFloat(form.size_gb) : null }) });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Rotina de Backup</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="Backup Diário BD" /></div>
                    <div className="form-group"><label>Servidor *</label><input className="input" value={form.server} onChange={f('server')} required placeholder="SRV-DB-01" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Completo', 'Incremental', 'Diferencial'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Sucesso', 'Falha', 'Rodando', 'Pendente'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label>Tamanho (GB)</label><input className="input" type="number" step="0.1" value={form.size_gb} onChange={f('size_gb')} placeholder="45.2" /></div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function BackupsPage() {
    const [modal, setModal] = useState(false);
    const { data: backups = [], isLoading } = useSWR<Backup[]>('/api/backups', fetcher);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta rotina?')) return;
        await fetch(`/api/backups/${id}`, { method: 'DELETE' });
        mutate('/api/backups');
    };

    const fmt = (d?: string) => d ? new Date(d).toLocaleString('pt-BR') : '—';

    return (
        <div>
            {modal && <BackupModal onClose={() => setModal(false)} onSave={() => mutate('/api/backups')} />}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestão de Backups</h1>
                    <p className="page-subtitle">{backups.length} rotina(s) cadastrada(s)</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Nova Rotina</button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : backups.length === 0 ? (
                    <div className="empty"><HardDrive size={40} /><p>Nenhuma rotina cadastrada.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Nome</th><th>Servidor</th><th>Tipo</th><th>Status</th><th>Tamanho</th><th>Última Execução</th><th></th></tr></thead>
                            <tbody>
                                {backups.map(b => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{b.server}</td>
                                        <td><span className="badge badge-purple">{b.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[b.status] || 'badge-blue'}`}>{b.status}</span></td>
                                        <td>{b.size_gb ? `${b.size_gb} GB` : '—'}</td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(b.last_run)}</td>
                                        <td>
                                            <button onClick={() => handleDelete(b.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button>
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
