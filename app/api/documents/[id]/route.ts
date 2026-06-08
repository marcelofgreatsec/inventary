import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const update: Record<string, unknown> = {};
    if ('folder_id'   in body) update.folder_id   = body.folder_id   ?? null;
    if ('title'       in body) update.title        = body.title;
    if ('category'    in body) update.category     = body.category;
    if ('content'     in body) update.content      = body.content;
    if ('responsavel' in body) update.responsavel  = body.responsavel ?? null;
    if ('data_revisao' in body) update.data_revisao = body.data_revisao ?? null;

    const { error } = await supabase.from('documents').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'UPDATE', table_name: 'documents', record_id: id,
        changes: update,
    });

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'DELETE', table_name: 'documents', record_id: id,
    });

    return NextResponse.json({ ok: true });
}
