'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Trash2, FileText, Loader2, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CAT_MAP: Record<string, string> = {
    'Procedimento': 'badge-blue', 'Política': 'badge-purple',
    'Manual': 'badge-green', 'Relatório': 'badge-amber', 'Outro': 'badge-blue'
};

interface Doc {
    id: string; title: string; category: string; author_name?: string; created_at: string; content?: string;
}

function DocModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ title: '', category: 'Procedimento', content: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        onSave(); onClose(); setSaving(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 640 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 className="modal-title" style={{ marginBottom: 0 }}>Nova Documentação</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Título *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Procedimento de Backup Mensal" /></div>
                    <div className="form-group">
                        <label>Categoria</label>
                        <select className="select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                            {['Procedimento', 'Política', 'Manual', 'Relatório', 'Outro'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Conteúdo</label>
                        <textarea
                            className="input"
                            style={{ minHeight: 160, resize: 'vertical' }}
                            value={form.content}
                            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                            placeholder="Descreva o procedimento ou documentação..."
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar Documento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DocsPage() {
    const [modal, setModal] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const { data: docs = [], isLoading } = useSWR<Doc[]>('/api/documents', fetcher);

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este documento?')) return;
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        mutate('/api/documents');
    };

    return (
        <div>
            {modal && <DocModal onClose={() => setModal(false)} onSave={() => mutate('/api/documents')} />}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documentações</h1>
                    <p className="page-subtitle">{docs.length} documento(s) na base de conhecimento</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Nova Doc</button>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : docs.length === 0 ? (
                <div className="card empty"><FileText size={40} /><p>Nenhum documento cadastrado.</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {docs.map(d => (
                        <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <FileText size={18} color="var(--accent)" />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{d.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Por {d.author_name || 'Sistema'} • {new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <span className={`badge ${CAT_MAP[d.category] || 'badge-blue'}`}>{d.category}</span>
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDelete(d.id); }} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button>
                            </div>
                            {expanded === d.id && d.content && (
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {d.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
