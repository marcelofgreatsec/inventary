import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('infosec_contacts')
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
    const { nome, cargo, email, telefone, empresa, categoria, notas } = body;

    const { data, error } = await supabase
        .from('infosec_contacts')
        .insert({ nome, cargo, email, telefone, empresa, categoria, notas })
        .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
        user_id: user.id, user_email: user.email,
        action: 'CREATE', table_name: 'infosec_contacts', record_id: data.id,
    });

    return NextResponse.json(data);
}
