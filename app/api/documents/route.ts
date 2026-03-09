import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase.from('documents')
        .insert({
            title: body.title,
            content: body.content,
            category: body.category,
            file_url: body.file_url,
            file_name: body.file_name,
            file_size: body.file_size,
            author_id: user.id,
            author_name: user.email
        })
        .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'CREATE', table_name: 'documents', record_id: data.id,
    });

    return NextResponse.json(data);
}
