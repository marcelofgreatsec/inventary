'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import {
    Plus, Trash2, ShieldCheck, Loader2, X,
    Search, Mail, Phone, Building2, User, Edit2, FileText
} from 'lucide-react';

const CATEGORIAS = ['Interno', 'Externo', 'CERT', 'Fornecedor', 'Consultor'];

const CAT_MAP: Record<string, string> = {
    'Interno':    'badge-green',
    'Externo':    'badge-blue',
    'CERT':       'badge-red',
    'Fornecedor': 'badge-amber',
    'Consultor':  'badge-purple',
};

interface Contact {
    id: string; nome: string; cargo?: string; email?: string;
    telefone?: string; empresa?: string; categoria: string; notas?: string;
    created_at: string;
}

function ContactModal({ onClose, onSave, contact }: { onClose: () => void; onSave: () => void; contact?: Contact }) {
    const empty = { nome: '', cargo: '', email: '', telefone: '', empresa: '', categoria: 'Interno', notas: '' };
    const [form, setForm] = useState(contact ? {
        nome: contact.nome, cargo: contact.cargo || '',
        email: contact.email || '', telefone: contact.telefone || '',
        empresa: contact.empresa || '', categoria: contact.categoria,
        notas: contact.notas || '',
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
        const url    = contact ? `/api/infosec/${contact.id}` : '/api/infosec';
        const method = contact ? 'PATCH' : 'POST';
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

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 520 }} ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="infosec-modal-title">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                    <h2 id="infosec-modal-title" className="modal-title" style={{ marginBottom: 0 }}>
                        {contact ? 'Editar Contato' : 'Novo Contato InfoSec'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Nome *</label>
                            <input className="input" value={form.nome} onChange={f('nome')} required placeholder="Nome completo" />
                        </div>
                        <div className="form-group">
                            <label>Cargo</label>
                            <input className="input" value={form.cargo} onChange={f('cargo')} placeholder="CISO, Analista..." />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Email</label>
                            <input className="input" type="email" value={form.email} onChange={f('email')} placeholder="email@empresa.com" />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input className="input" value={form.telefone} onChange={f('telefone')} placeholder="+55 11 99999-0000" style={{ fontFamily: 'JetBrains Mono' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="form-group">
                            <label>Empresa</label>
                            <input className="input" value={form.empresa} onChange={f('empresa')} placeholder="Nome da empresa" />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="select" value={form.categoria} onChange={f('categoria')}>
                                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notas</label>
                        <textarea className="input" style={{ minHeight: 72, resize: 'vertical' }} value={form.notas} onChange={f('notas')} placeholder="Informações adicionais, área de atuação..." />
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
                                : contact ? 'Atualizar' : 'Salvar Contato'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InfosecPage() {
    const [modal,          setModal]          = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | undefined>();
    const [search,         setSearch]         = useState('');
    const [catFilter,      setCatFilter]      = useState('Todos');

    const { data: contacts, isLoading, refresh } = useRealtimeTable<Contact>('/api/infosec', 'infosec_contacts');

    const filtered = useMemo(() => contacts.filter(c => {
        const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
                            (c.empresa || '').toLowerCase().includes(search.toLowerCase()) ||
                            (c.email || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'Todos' || c.categoria === catFilter;
        return matchSearch && matchCat;
    }), [contacts, search, catFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este contato?')) return;
        await fetch(`/api/infosec/${id}`, { method: 'DELETE' });
        refresh();
    };

    const summaryCards = [
        { label: 'Total de Contatos', value: contacts.length, color: 'var(--accent)' },
        { label: 'Internos',          value: contacts.filter(c => c.categoria === 'Interno').length,    color: 'var(--green)'  },
        { label: 'Externos / CERT',   value: contacts.filter(c => ['Externo','CERT'].includes(c.categoria)).length, color: 'var(--blue)' },
        { label: 'Fornecedores',      value: contacts.filter(c => c.categoria === 'Fornecedor').length, color: 'var(--amber)' },
    ];

    return (
        <div>
            {modal && (
                <ContactModal
                    onClose={() => { setModal(false); setEditingContact(undefined); }}
                    onSave={refresh}
                    contact={editingContact}
                />
            )}

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">InfoSec</h1>
                    <p className="page-subtitle">Segurança da Informação · {filtered.length} contato(s)</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            className="input"
                            placeholder="Buscar por nome ou empresa..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 240, paddingLeft: 36 }}
                        />
                    </div>
                    <select className="select" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 150 }}>
                        <option value="Todos">Todas</option>
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => { setEditingContact(undefined); setModal(true); }}>
                        <Plus size={15} /> Novo Contato
                    </button>
                </div>
            </div>

            {/* Summary */}
            {!isLoading && contacts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                    {summaryCards.map(c => (
                        <div key={c.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${c.color} 25%, transparent)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ShieldCheck size={18} color={c.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: c.color, lineHeight: 1 }}>{c.value}</div>
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
                        <ShieldCheck size={40} />
                        {contacts.length === 0 ? (
                            <>
                                <p>Nenhum contato de segurança cadastrado.</p>
                                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setEditingContact(undefined); setModal(true); }}>
                                    <Plus size={15} /> Adicionar primeiro contato
                                </button>
                            </>
                        ) : (
                            <>
                                <p>Nenhum resultado para os filtros.</p>
                                <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => { setSearch(''); setCatFilter('Todos'); }}>Limpar filtros</button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Cargo</th>
                                    <th>Empresa</th>
                                    <th>Categoria</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>Notas</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                                                    <User size={14} />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{c.nome}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.cargo || '—'}</td>
                                        <td>
                                            {c.empresa
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                                    <Building2 size={12} style={{ opacity: 0.5 }} /> {c.empresa}
                                                  </div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td><span className={`badge ${CAT_MAP[c.categoria] || 'badge-blue'}`}>{c.categoria}</span></td>
                                        <td>
                                            {c.email
                                                ? <a href={`mailto:${c.email}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Mail size={12} /> {c.email}
                                                  </a>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                                            {c.telefone
                                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} style={{ opacity: 0.5 }} /> {c.telefone}</div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ maxWidth: 160 }}>
                                            {c.notas
                                                ? <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <FileText size={11} style={{ opacity: 0.5, flexShrink: 0 }} /> {c.notas}
                                                  </div>
                                                : <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => { setEditingContact(c); setModal(true); }}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '5px 10px' }}
                                                    aria-label={`Editar ${c.nome}`}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '5px 10px' }}
                                                    aria-label={`Remover ${c.nome}`}
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
