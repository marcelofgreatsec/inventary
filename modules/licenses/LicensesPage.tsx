'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Trash2, Shield, Loader2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_MAP: Record<string, string> = {
    'Ativa': 'badge-green', 'Expirada': 'badge-red', 'A vencer': 'badge-amber'
};

interface License {
    id: string; name: string; vendor: string; type: string;
    status: string; seats: number; monthly_cost: number; renewal_date?: string;
}

function LicenseModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ name: '', vendor: '', type: 'Anual', status: 'Ativa', seats: '1', monthly_cost: '0', renewal_date: '', key: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/licenses', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, seats: parseInt(form.seats), monthly_cost: parseFloat(form.monthly_cost), renewal_date: form.renewal_date || null })
        });
        onSave(); onClose(); setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Licença</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Software *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="Microsoft 365 Business" /></div>
                    <div className="form-group"><label>Fornecedor *</label><input className="input" value={form.vendor} onChange={f('vendor')} required placeholder="Microsoft" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="select" value={form.type} onChange={f('type')}>
                                {['Mensal', 'Anual', 'Perpétua'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                {['Ativa', 'Expirada', 'A vencer'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Licenças / Seats</label><input className="input" type="number" min="1" value={form.seats} onChange={f('seats')} /></div>
                        <div className="form-group"><label>Custo Mensal (R$)</label><input className="input" type="number" step="0.01" value={form.monthly_cost} onChange={f('monthly_cost')} /></div>
                    </div>
                    <div className="form-group"><label>Vencimento</label><input className="input" type="date" value={form.renewal_date} onChange={f('renewal_date')} /></div>
                    <div className="form-group"><label>Chave / Identificador</label><input className="input" value={form.key} onChange={f('key')} placeholder="XXXXX-XXXXX-XXXXX" /></div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar Licença'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function LicensesPage() {
    const [modal, setModal] = useState(false);
    const { data: licenses = [], isLoading } = useSWR<License[]>('/api/licenses', fetcher);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta licença?')) return;
        await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
        mutate('/api/licenses');
    };

    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const fmtCost = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const totalCost = licenses.reduce((s, l) => s + (l.monthly_cost || 0), 0);

    return (
        <div>
            {modal && <LicenseModal onClose={() => setModal(false)} onSave={() => mutate('/api/licenses')} />}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Licenças de Software</h1>
                    <p className="page-subtitle">{licenses.length} licença(s) • Custo mensal: <strong>{fmtCost(totalCost)}</strong></p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Nova Licença</button>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : licenses.length === 0 ? (
                    <div className="empty"><Shield size={40} /><p>Nenhuma licença cadastrada.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Software</th><th>Fornecedor</th><th>Tipo</th><th>Status</th><th>Seats</th><th>Custo/Mês</th><th>Vencimento</th><th></th></tr></thead>
                            <tbody>
                                {licenses.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{l.vendor}</td>
                                        <td><span className="badge badge-purple">{l.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[l.status] || 'badge-blue'}`}>{l.status}</span></td>
                                        <td style={{ textAlign: 'center' }}>{l.seats}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtCost(l.monthly_cost)}</td>
                                        <td style={{ fontSize: 13 }}>{fmtDate(l.renewal_date)}</td>
                                        <td>
                                            <button onClick={() => handleDelete(l.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button>
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
