-- =============================================
-- SEED: Licenças FGREAT Studio
-- Importado de: FGREAT LINKS 2030
-- USO INTERNO — Não compartilhar externamente
-- =============================================
-- Como rodar: cole no Supabase SQL Editor e execute.
-- Para limpar antes de inserir, descomente a linha abaixo:
-- DELETE FROM public.licenses;
-- =============================================

INSERT INTO public.licenses
  (name, vendor, login, password, status, type, seats, monthly_cost, renewal_date, categoria, notes)
VALUES

-- ── AI Tools ──────────────────────────────────────────────────────────

(
  'ChatGPT Plus',
  'OpenAI',
  'galves@fgreatstudio.com',
  '!Fgreat203000',
  'Ativa', 'Mensal', 6, 200.00, NULL, 'AI',
  '$30/user × 6 users = $200/month. Team plan.'
),
(
  'Eleven Labs',
  'Eleven Labs',
  'galves@fgreatstudio.com',
  '!FG203000',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'Create audio voices / clonagem de voz.'
),
(
  'Adobe Firefly',
  'Adobe',
  'galves@fgreatstudio.com',
  NULL,
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'Incluído no Adobe Creative Cloud.'
),
(
  'Kling.AI',
  'Kling',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'Conta principal: galves@fgreatstudio.com.'
),
(
  'Kling.AI (Backup)',
  'Kling',
  'notsodumbai@gmail.com',
  '!Fg202500',
  'Expirada', 'Mensal', 1, 0.00, NULL, 'AI',
  'Conta backup: notsodumbai@gmail.com. Cancelada.'
),
(
  'Highsfield',
  'Highsfield',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  NULL
),
(
  'Topaz Labs',
  'Topaz',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Anual', 1, 0.00, NULL, 'AI',
  NULL
),
(
  'Freepik AI',
  'Freepik',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Anual', 1, 0.00, NULL, 'AI',
  'Ferramentas de geração de imagem IA do Freepik.'
),
(
  'Luma Dream Machine',
  'Luma',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'Login via conta Google.'
),
(
  'Sjinn.ai',
  'Sjinn',
  'galves@fgreatstudio.com',
  NULL,
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'SEEDANCE 2. Login via conta Google.'
),
(
  'Meshy.ai',
  'Meshy',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'AI para 3D Models. https://www.meshy.ai'
),
(
  'Tripo3D',
  'Tripo3D',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Mensal', 1, 0.00, NULL, 'AI',
  'AI para 3D Models. https://studio.tripo3d.ai'
),
(
  'AI Videolab',
  'Hotmart',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Anual', 1, 0.00, '2025-07-15', 'AI',
  'Treinamento de workflow IA (imagem e vídeo). PAGO. Renovação: 15/07/2025.'
),
(
  'Comfy UI Course',
  'Hotmart',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Anual', 1, 0.00, '2025-07-15', 'AI',
  'Curso Comfy UI via Hotmart. PAGO. Renovação: 15/07/2025.'
),
(
  'IA Maker Workshop',
  'Hotmart',
  'maisa@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Perpétua', 1, 0.00, '2026-02-27', 'AI',
  'Workshop animação IA - 2 dias. Compra única. Conta: maisa@fgreatstudio.com. Acesso até 27/02/2026.'
),
(
  'Story-boards.ai',
  'story-boards.ai',
  'galves@fgreatstudio.com',
  '!Fgreat203000',
  'Expirada', 'Mensal', 1, 35.00, NULL, 'AI',
  'Ótimo para storyboards. $35/mês. Não assinado atualmente. https://app.story-boards.ai/'
),
(
  'Magnific AI',
  'Magnific',
  'galves@fgreatstudio.com',
  'Invite Via Email',
  'Expirada', 'Mensal', 1, 25.00, '2025-05-23', 'AI',
  'Upscaler / Retexture. Login via convite por email. $25/mês. Cancelado em 23/05/2025.'
),
(
  'Pika',
  'Pika',
  'galves@fgreatstudio.com',
  '!FG202500',
  'Expirada', 'Mensal', 1, 0.00, NULL, 'AI',
  'Login via Discord. Cancelado.'
),
(
  'Runway ML',
  'Runway',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Expirada', 'Mensal', 1, 0.00, NULL, 'AI',
  'Cancelado.'
),
(
  'Electric Visual',
  'Electric Visual',
  'galves@fgreatstudio.com',
  NULL,
  'Expirada', 'Mensal', 1, 0.00, NULL, 'AI',
  'Cancelado.'
),
(
  'Pollo.ai',
  'Pollo',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Expirada', 'Mensal', 1, 0.00, NULL, 'AI',
  'Geração de vídeo (Seedense). Cancelado.'
),

-- ── Design & Images ───────────────────────────────────────────────────

(
  'Freepik',
  'Freepik',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Ativa', 'Anual', 1, 8.75, '2025-12-06', 'Design',
  'Bom para imagens. £105/ano. Renovação: 06/12/2025.'
),
(
  'Envato Elements',
  'Envato',
  'fgreatstudio',
  '!Fg203000',
  'Ativa', 'Anual', 1, 16.50, '2025-09-28', 'Design',
  'Login: username "fgreatstudio" (não é email). $198/ano. Imagens, footage e templates. Renovação: 28/09/2025.'
),
(
  'Getty Images',
  'Getty',
  'galves@fgreatstudio.com',
  '!Fgreat202000',
  'Expirada', 'Anual', 1, 0.00, NULL, 'Design',
  'Bom para footage e imagens — deal limitado. EXPIRADO.'
),

-- ── Audio & Voices ────────────────────────────────────────────────────

(
  'AudioNetwork',
  'AudioNetwork',
  'galves@fgreatstudio.com',
  '!Fgreat2020',
  'Expirada', 'Anual', 1, 0.00, NULL, 'Other',
  'Bom para trilhas musicais. EXPIRADO.'
),
(
  'Epidemic Sound',
  'Epidemic Sound',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Expirada', 'Anual', 1, 0.00, '2025-04-23', 'Other',
  'Bom para trilhas musicais. R$948/ano. EXPIRADO em 23/04/2025.'
),
(
  'VoiceBooking',
  'VoiceBooking',
  'maisa@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Anual', 1, 0.00, '2025-05-22', 'Other',
  'Bom para locução (voiceover guide). Renovado em 22/05/2025. Conta: maisa@fgreatstudio.com.'
),

-- ── 3D Models Marketplaces ────────────────────────────────────────────

(
  'TurboSquid',
  'TurboSquid',
  'galves@fgreatstudio.com',
  '!Fgreat2020',
  'Expirada', 'Anual', 1, 0.00, NULL, 'Other',
  'Marketplace de 3D Models. Sem assinatura ativa.'
),
(
  'CG Trader',
  'CG Trader',
  'galves@fgreatstudio.com',
  '!Fg203000',
  'Expirada', 'Anual', 1, 0.00, NULL, 'Other',
  'Marketplace de 3D Models. Sem assinatura ativa.'
),

-- ── Plugins & Scripts ─────────────────────────────────────────────────

(
  'AeScripts',
  'AeScripts',
  'galves@fgreatstudio.com',
  '!Fg202500',
  'Ativa', 'Anual', 1, 0.00, NULL, 'Other',
  'Scripts, plugins e extensões para software de criação visual. https://aescripts.com'
),

-- ── Comunicação ───────────────────────────────────────────────────────

(
  'Discord',
  'Discord',
  'galves@fgreatstudio.com',
  '!FG202500',
  'Ativa', 'Anual', 1, 0.00, NULL, 'Other',
  NULL
);
