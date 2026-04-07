import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { error } = await supabase.from('folders').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'DELETE', table_name: 'folders', record_id: params.id,
    });

    return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase.from('folders')
        .update({
            name: body.name,
            password: body.password || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'UPDATE', table_name: 'folders', record_id: params.id,
    });

    return NextResponse.json(data);
}
