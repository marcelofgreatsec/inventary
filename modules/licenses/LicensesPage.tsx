'use client';

import { useState, useMemo } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Plus, Trash2, Shield, Loader2, X, BarChart3, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_MAP: Record<string, string> = {
    'Ativa': 'badge-green', 'Expirada': 'badge-red', 'A vencer': 'badge-amber'
};

interface License {
    id: string; name: string; vendor: string; type: string;
    status: string; seats: number; monthly_cost: number; renewal_date?: string;
}

function LicenseModal({ onClose, onSave, license }: { onClose: () => void; onSave: () => void; license?: License }) {
    const [form, setForm] = useState(license ? {
        name: license.name,
        vendor: license.vendor,
        type: license.type,
        status: license.status,
        seats: license.seats.toString(),
        monthly_cost: license.monthly_cost.toString(),
        renewal_date: license.renewal_date || '',
        key: (license as any).key || ''
    } : { name: '', vendor: '', type: 'Anual', status: 'Ativa', seats: '1', monthly_cost: '0', renewal_date: '', key: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        const url = license ? `/api/licenses/${license.id}` : '/api/licenses';
        const method = license ? 'PATCH' : 'POST';
        let cleanCost = form.monthly_cost.trim();
        if (cleanCost.includes(',') && cleanCost.includes('.')) {
            // pt-BR: 1.500,00 -> 1500.00
            cleanCost = cleanCost.replace(/\./g, '').replace(',', '.');
        } else if (cleanCost.includes(',')) {
            // pt-BR: 1500,00 -> 1500.00
            cleanCost = cleanCost.replace(',', '.');
        } else if (cleanCost.includes('.') && cleanCost.split('.').pop()?.length === 3) {
            // Probable thousands separator: 1.500 -> 1500
            // But we must be careful not to break decimals like 1.500 (which is 1.5)
            // However, in a currency context, 3 digits after a dot usually means thousands in BR
            // For now, let's just remove all dots if there's no comma, as per user's 1k report
            cleanCost = cleanCost.replace(/\./g, '');
        }
        
        const res = await fetch(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                ...form, 
                seats: parseInt(form.seats), 
                monthly_cost: parseFloat(cleanCost) || 0, 
                renewal_date: form.renewal_date || null 
            }) 
        });

        if (res.ok) {
            onSave();
            onClose();
        } else {
            const err = await res.json();
            alert(`Erro ao salvar: ${err.error || 'Erro desconhecido'}`);
        }
        setSaving(false);
    };

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>{license ? 'Editar Licença' : 'Nova Licença'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Software *</label><input className="input" value={form.name} onChange={f('name')} required placeholder="Microsoft 365 Business" /></div>
                    <div className="form-group"><label>Fornecedor *</label><input className="input" value={form.vendor} onChange={f('vendor')} required placeholder="Microsoft" /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Tipo</label><select className="select" value={form.type} onChange={f('type')}>{['Mensal', 'Anual', 'Perpétua'].map(t => <option key={t}>{t}</option>)}</select></div>
                        <div className="form-group"><label>Status</label><select className="select" value={form.status} onChange={f('status')}>{['Ativa', 'Expirada', 'A vencer'].map(s => <option key={s}>{s}</option>)}</select></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group"><label>Seats</label><input className="input" type="number" min="1" value={form.seats} onChange={f('seats')} /></div>
                        <div className="form-group"><label>Custo Mensal (R$)</label><input className="input" type="text" placeholder="Ex: 1.500,00" value={form.monthly_cost} onChange={f('monthly_cost')} /></div>
                    </div>
                    <div className="form-group"><label>Vencimento</label><input className="input" type="date" value={form.renewal_date} onChange={f('renewal_date')} /></div>
                    <div className="form-group"><label>Chave</label><input className="input" value={form.key} onChange={f('key')} placeholder="XXXXX-XXXXX-XXXXX" /></div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : (license ? 'Atualizar Licença' : 'Salvar Licença')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function LicensesPage() {
    const [modal, setModal] = useState(false);
    const [editingLicense, setEditingLicense] = useState<License | undefined>();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    
    const { data: licenses, isLoading, refresh } = useRealtimeTable<License>('/api/licenses', 'licenses');

    const chartData = useMemo(() => {
        const vendors: Record<string, number> = {};
        licenses.forEach(l => {
            vendors[l.vendor] = (vendors[l.vendor] || 0) + (l.monthly_cost || 0);
        });
        return Object.entries(vendors)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [licenses]);

    const COLORS = ['#00f5ff', '#7000ff', '#ff007a', '#00ff9f', '#ffea00'];

    const filteredLicenses = licenses.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                             l.vendor.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const fmtCost = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    const totalCost = licenses.reduce((s, l) => s + (l.monthly_cost || 0), 0);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta licença?')) return;
        await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
        refresh();
    };

    return (
        <div>
            {modal && (
                <LicenseModal 
                    onClose={() => { setModal(false); setEditingLicense(undefined); }} 
                    onSave={() => refresh()} 
                    license={editingLicense}
                />
            )}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Licenças de Software</h1>
                    <p className="page-subtitle">{filteredLicenses.length} licença(s) • Custo mensal: <strong>{fmtCost(totalCost)}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            className="input" 
                            placeholder="Buscar software..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ minWidth: 220, paddingLeft: 36 }}
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
                            <option>Ativa</option>
                            <option>Expirada</option>
                            <option>A vencer</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingLicense(undefined); setModal(true); }}>
                        <Plus size={16} /> Nova Licença
                    </button>
                </div>
            </div>

            {!isLoading && licenses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div className="card" style={{ padding: 20, height: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <BarChart3 size={18} className="text-cyan" />
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Custo Mensal por Fornecedor</h3>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#00f5ff' }}
                                    labelStyle={{ color: 'white', marginBottom: 4 }}
                                    formatter={(value: number) => [fmtCost(value), 'Custo']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ padding: 20, borderRadius: '50%', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0, 245, 255, 0.1)', marginBottom: 16 }}>
                            <Shield size={32} className="text-cyan" />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Status Geral</h4>
                        <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                            {licenses.filter(l => l.status === 'Ativa').length} / {licenses.length}
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Licenças Ativas</p>
                    </div>
                </div>
            )}
            <div className="card">
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : filteredLicenses.length === 0 ? (
                    <div className="empty"><Shield size={40} /><p>Nenhuma licença encontrada.</p></div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Software</th><th>Fornecedor</th><th>Tipo</th><th>Status</th><th>Seats</th><th>Custo/Mês</th><th>Vencimento</th><th></th></tr></thead>
                            <tbody>
                                {filteredLicenses.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: 600 }}>{l.name}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{l.vendor}</td>
                                        <td><span className="badge badge-purple">{l.type}</span></td>
                                        <td><span className={`badge ${STATUS_MAP[l.status] || 'badge-blue'}`}>{l.status}</span></td>
                                        <td style={{ textAlign: 'center' }}>{l.seats}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtCost(l.monthly_cost)}</td>
                                        <td style={{ fontSize: 13 }}>{fmtDate(l.renewal_date)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button 
                                                    onClick={() => { setEditingLicense(l); setModal(true); }} 
                                                    className="btn btn-ghost" 
                                                    style={{ padding: '5px 10px' }}
                                                >
                                                    Editar
                                                </button>
                                                <button onClick={() => handleDelete(l.id)} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button>
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
