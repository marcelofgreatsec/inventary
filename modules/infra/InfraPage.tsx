'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Trash2, Server, Loader2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const STATUS_MAP: Record<string, string> = { 'Online': 'badge-green', 'Offline': 'badge-red', 'Manutenção': 'badge-amber' };

interface Infra {
    id: string; name: string; type: string; status: string;
    ip?: string; os?: string; cpu?: string; ram_gb?: number; disk_gb?: number; location?: string;
}

function InfraModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ name: '', type: 'Servidor', status: 'Online', ip: '', os: '', cpu: '', ram_gb: '', disk_gb: '', location: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/infrastructure', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, ram_gb: form.ram_gb ? parseInt(form.ram_gb) : null, disk_gb: form.disk_gb ? parseInt(form.disk_gb) : null })
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 580 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Novo Equipamento</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Nome *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="SRV-APP-01" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Servidor', 'Switch', 'Firewall', 'Router', 'Storage', 'VM', 'Outro'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Online', 'Offline', 'Manutenção'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
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
                    <div className="form-group"><label>Localização</label><input className="input" value={form.location} onChange={f('location')} placeholder="Rack A - Pos 12" /></div>
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

export default function InfraPage() {
    const [modal, setModal] = useState(false);
    const { data: infra = [], isLoading } = useSWR<Infra[]>('/api/infrastructure', fetcher);
    const online = infra.filter(i => i.status === 'Online').length;

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este equipamento?')) return;
        await fetch(`/api/infrastructure/${id}`, { method: 'DELETE' });
        mutate('/api/infrastructure');
    };

    return (
        <div>
            {modal && <InfraModal onClose={() => setModal(false)} onSave={() => mutate('/api/infrastructure')} />}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Infraestrutura</h1>
                    <p className="page-subtitle">{online}/{infra.length} equipamento(s) online</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Novo Equipamento</button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : infra.length === 0 ? (
                    <div className="empty"><Server size={40} /><p>Nenhum equipamento cadastrado.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Nome</th><th>Tipo</th><th>Status</th><th>IP</th><th>SO</th><th>CPU</th><th>RAM</th><th>Disco</th><th></th></tr></thead>
                            <tbody>
                                {infra.map(i => (
                                    <tr key={i.id}>
                                        <td style={{ fontWeight: 600 }}>{i.name}</td>
                                        <td><span className="badge badge-blue">{i.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[i.status] || 'badge-blue'}`}>{i.status}</span></td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{i.ip || '—'}</td>
                                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{i.os || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.cpu || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.ram_gb ? `${i.ram_gb} GB` : '—'}</td>
                                        <td style={{ fontSize: 13 }}>{i.disk_gb ? `${i.disk_gb} GB` : '—'}</td>
                                        <td><button onClick={() => handleDelete(i.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button></td>
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
