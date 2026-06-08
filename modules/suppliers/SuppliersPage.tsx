'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, Building2, Loader2, X,
    Search, Filter, Edit2, Mail, Phone, Globe, User
} from 'lucide-react';

const CATEGORIAS = ['Software', 'Hardware', 'Cloud', 'Telecom', 'Consultoria', 'Segurança', 'Outros'];

const CAT_MAP: Record<string, string> = {
    'Software':    'badge-blue',
    'Hardware':    'badge-purple',
    'Cloud':       'badge-green',
    'Telecom':     'badge-amber',
    'Consultoria': 'badge-blue',
    'Segurança':   'badge-red',
    'Outros':      'badge-blue',
};

interface Supplier {
    id: string; nome: string; cnpj?: string; website?: string;
    email_principal?: string; telefone?: string;
    contato_nome?: string; contato_email?: string; contato_telefone?: string;
    categoria: string; status: string; notas?: string; created_at: string;
}

function SupplierModal({ onClose, onSave, supplier }: { onClose: () => void; onSave: () => void; supplier?: Supplier }) {
    const empty = {
        nome: '', cnpj: '', website: '', email_principal: '', telefone: '',
        contato_nome: '', contato_email: '', contato_telefone: '',
        categoria: 'Software', status: 'Ativo', notas: ''
    };
    const [form, setForm] = useState(supplier ? {
        nome: supplier.nome, cnpj: supplier.cnpj || '',
        website: supplier.website || '', email_principal: supplier.email_principal || '',
        telefone: supplier.telefone || '', contato_nome: supplier.contato_nome || '',
        contato_email: supplier.contato_email || '', contato_telefone: supplier.contato_telefone || '',
        categoria: supplier.categoria, status: supplier.status, notas: supplier.notas || '',
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
        const url    = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers';
        const method = supplier ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        if (res.ok) { onSave(); onClose(); }
        else { const err = await res.json(); setSaveError(err.error || 'Erro ao salvar.'); }
        setSaving(false);
    };

    const f = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(p => ({ ...p, [k]: e.target.value }));

    const sectionTitle = (title: string) => (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
            {title}
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 580 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="supplier-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {sectionTitle('Dados da Empresa')}
                    <div className="form-group">
                        <label>Nome *</label>
                        <input className="input" value={form.nome} onChange={f('nome')} required placeholder="Nome da empresa" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>CNPJ</label>
                            <input className="input" value={form.cnpj} onChange={f('cnpj')} placeholder="00.000.000/0000-00" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                        <div className="form-group">
                            <label>Website</label>
                            <input className="input" value={form.website} onChange={f('website')} placeholder="https://empresa.com.br" />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Email Principal</label>
                            <input className="input" type="email" value={form.email_principal} onChange={f('email_principal')} placeholder="contato@empresa.com" />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input className="input" value={form.telefone} onChange={f('telefone')} placeholder="+55 11 3000-0000" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="select" value={form.categoria} onChange={f('categoria')}>
                                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="select" value={form.status} onChange={f('status')}>
                                <option>Ativo</option>
                                <option>Inativo</option>
                            </select>
                        </div>
                    </div>

                    {sectionTitle('Contato Principal')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Nome do Contato</label>
                            <input className="input" value={form.contato_nome} onChange={f('contato_nome')} placeholder="Nome do responsável" />
                        </div>
                        <div className="form-group">
                            <label>Email do Contato</label>
                            <input className="input" type="email" value={form.contato_email} onChange={f('contato_email')} placeholder="email@empresa.com" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Telefone do Contato</label>
                        <input className="input" value={form.contato_telefone} onChange={f('contato_telefone')} placeholder="+55 11 99999-0000" style={{ fontFamily: 'JetBrains Mono' }} />
                    </div>

                    <div className="form-group">
                        <label>Notas</label>
                        <textarea className="input" style={{ minHeight: 60, resize: 'vertical' }} value={form.notas} onChange={f('notas')} placeholder="Observações, SLA, condições contratuais..." />
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
                                : supplier ? 'Atualizar' : 'Salvar Fornecedor'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SuppliersPage() {
    const [modal,           setModal]           = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
    const [search,          setSearch]          = useState('');
    const [catFilter,       setCatFilter]       = useState('Todos');
    const [statusFilter,    setStatusFilter]    = useState('Todos');

    const { data: suppliers, isLoading, refresh } = useRealtimeTable<Supplier>('/api/suppliers', 'suppliers');

    const filtered = useMemo(() => suppliers.filter(s => {
        const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase()) ||
                            (s.email_principal || '').toLowerCase().includes(search.toLowerCase()) ||
                            (s.contato_nome || '').toLowerCase().includes(search.toLowerCase());
        const matchCat    = catFilter    === 'Todos' || s.categoria === catFilter;
        const matchStatus = statusFilter === 'Todos' || s.status    === statusFilter;
        return matchSearch && matchCat && matchStatus;
    }), [suppliers, search, catFilter, statusFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este fornecedor?')) return;
        await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        refresh();
    };

    const ativos   = suppliers.filter(s => s.status === 'Ativo').length;
    const inativos = suppliers.filter(s => s.status === 'Inativo').length;

    return (
        <div>
            {modal && (
                <SupplierModal
                    onClose={() => { setModal(false); setEditingSupplier(undefined); }}
                    onSave={refresh}
                    supplier={editingSupplier}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Suppliers</h1>
                    <p className="page-subtitle">Fornecedores e contatos · {filtered.length} fornecedor(es)</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar por nome ou contato..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 240, paddingLeft: 36 }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Filter size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 150, paddingLeft: 36 }}>
                            <option value="Todos">Todas</option>
                            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 130 }}>
                        <option value="Todos">Todos status</option>
                        <option>Ativo</option>
                        <option>Inativo</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => { setEditingSupplier(undefined); setModal(true); }}>
                        <Plus size={15} /> Novo Fornecedor
                    </button>
                </div>
            </div>

            {/* Summary */}
            {!isLoading && suppliers.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                    {[
                        { label: 'Total',    value: suppliers.length, color: 'var(--accent)' },
                        { label: 'Ativos',   value: ativos,           color: 'var(--green)'  },
                        { label: 'Inativos', value: inativos,         color: 'var(--red)'    },
                    ].map(c => (
                        <div key={c.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Building2 size={18} color={c.color} />
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
                        <Building2 size={40} />
                        {suppliers.length === 0 ? (
                            <>
                                <p>Nenhum fornecedor cadastrado.</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditingSupplier(undefined); setModal(true); }}>
                                    <Plus size={15} /> Adicionar primeiro fornecedor
                                </button>
                            </>
                        ) : (
                            <>
                                <p>Nenhum resultado para os filtros.</p>
                                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setCatFilter('Todos'); setStatusFilter('Todos'); }}>Limpar filtros</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>Categoria</th>
                                    <th>Status</th>
                                    <th>Contato Principal</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>Website</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                                                    <Building2 size={15} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{s.nome}</div>
                                                    {s.cnpj && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{s.cnpj}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${CAT_MAP[s.categoria] || 'badge-blue'}`}>{s.categoria}</span></td>
                                        <td>
                                            <span className={`badge ${s.status === 'Ativo' ? 'badge-green' : 'badge-red'}`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td>
                                            {s.contato_nome
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                                                    <User size={12} style={{ opacity: 0.5 }} /> {s.contato_nome}
                                                  </div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {(s.email_principal || s.contato_email)
                                                ? <a href={`mailto:${s.email_principal || s.contato_email}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Mail size={12} /> {s.email_principal || s.contato_email}
                                                  </a>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {(s.telefone || s.contato_telefone)
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} style={{ opacity: 0.5 }} /> {s.telefone || s.contato_telefone}</div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {s.website
                                                ? <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Globe size={12} /> Link
                                                  </a>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => { setEditingSupplier(s); setModal(true); }} className="btn btn-ghost" style={{ padding: '5px 10px' }} aria-label={`Editar ${s.nome}`}><Edit2 size={13} /></button>
                                                <button onClick={() => handleDelete(s.id)} className="btn btn-danger" style={{ padding: '5px 10px' }} aria-label={`Remover ${s.nome}`}><Trash2 size={13} /></button>
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
