'use client';

import { useState, useRef } from 'react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Plus, Trash2, FileText, Loader2, X, Paperclip, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const CAT_MAP: Record<string, string> = {
    'Procedimento': 'badge-blue', 'Política': 'badge-purple',
    'Manual': 'badge-green', 'Relatório': 'badge-amber', 'Outro': 'badge-blue'
};

interface Doc {
    id: string; title: string; category: string; author_name?: string; created_at: string; content?: string;
    file_url?: string; file_name?: string; file_size?: number;
}

function DocModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [form, setForm] = useState({ title: '', category: 'Procedimento', content: '' });
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);

        let fileData = {};
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `docs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) {
                alert('Erro ao subir arquivo: ' + uploadError.message);
                setSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            fileData = {
                file_url: publicUrl,
                file_name: file.name,
                file_size: file.size
            };
        }

        await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, ...fileData })
        });
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
                    <div className="form-group"><label>Categoria</label><select className="select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{['Procedimento', 'Política', 'Manual', 'Relatório', 'Outro'].map(c => <option key={c}>{c}</option>)}</select></div>
                    <div className="form-group"><label>Conteúdo</label><textarea className="input" style={{ minHeight: 120, resize: 'vertical' }} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Descreva o procedimento..." /></div>

                    <div className="form-group">
                        <label>Anexo (Opcional)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '1px dashed var(--border-mid)',
                                borderRadius: 'var(--radius)',
                                padding: '12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'var(--bg-overlay)',
                                color: file ? 'var(--accent)' : 'var(--text-secondary)',
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                        >
                            <Paperclip size={16} />
                            {file ? file.name : 'Clique para selecionar um arquivo'}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: 12 }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Salvar Documento'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DocsPage() {
    const [modal, setModal] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const { data: docs, isLoading, refresh } = useRealtimeTable<Doc>('/api/documents', 'documents');

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este documento?')) return;
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        refresh();
    };

    return (
        <div>
            {modal && <DocModal onClose={() => setModal(false)} onSave={() => refresh()} />}
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
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>Por {d.author_name || 'Sistema'} • {new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <span className={`badge ${CAT_MAP[d.category] || 'badge-blue'}`}>{d.category}</span>
                                    {d.file_url && <span className="badge badge-purple" title={d.file_name}><Paperclip size={10} /> PDF/Doc</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {d.file_url && (
                                        <a
                                            href={d.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="btn btn-ghost"
                                            style={{ padding: '5px 10px' }}
                                        >
                                            <Download size={14} />
                                        </a>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); handleDelete(d.id); }} className="btn btn-danger" style={{ padding: '5px 10px' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {expanded === d.id && (
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}>
                                    {d.content || <em style={{ color: 'var(--text-muted)' }}>Sem descrição adicional.</em>}
                                    {d.file_url && (
                                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-overlay)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border-mid)' }}>
                                            <Paperclip size={16} color="var(--accent)" />
                                            <div style={{ fontSize: 12, flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.file_name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{((d.file_size || 0) / 1024 / 1024).toFixed(2)} MB</div>
                                            </div>
                                            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 11 }}>Ver Arquivo</a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
