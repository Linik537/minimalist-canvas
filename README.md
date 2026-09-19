# Braza Veículos

Site em pt-BR para a Braza Veículos, Uberlândia/MG. Front-end Vite + React 18 + TypeScript strict + Tailwind CSS. Dados e autenticação usam Supabase; não há backend próprio.

## Rodar localmente

1. `npm install`
2. Copie `.env.example` para `.env` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. `npm run dev`

`.env` está ignorado pelo Git. Só a chave **publishable** pode ser usada no navegador. Não coloque uma secret key nem service_role em variáveis `VITE_`.

`VITE_SHOW_DEMO=true` exibe 12 veículos de demonstração apenas quando o banco estiver vazio. O painel administrativo nunca mostra os dados demo.

## Projeto Supabase

Projeto usado: **For the Future** (`elvolxdmgpjxekfdtlfo`). As migrations aplicadas estão em `supabase/migrations/0001_init.sql` e `0002_function_hardening.sql`.

O schema possui `vehicles`, `vehicle_photos`, `sell_requests`, `sell_request_photos`, `financing_requests` e `user_roles`, todos com RLS. Visitantes podem ler veículos e enviar solicitações; alterações no estoque e leitura/gestão das solicitações exigem role `admin`. Os buckets são `vehicle-photos` (público para leitura, escrita admin) e `sell-requests` (privado, upload público limitado a imagens em `public/`, leitura admin). A função `has_role` fica no schema não exposto `app_private`.

O client usa os tipos gerados do schema real em `src/types/database.ts`.

## Imagens e dados da loja

Troque os placeholders locais em `public/images/`: `hero.svg`, `banner.svg`, `categoria-carros.svg`, `categoria-motos.svg`, `categoria-financie.svg`, `categoria-venda.svg`. A logo transparente do header e footer está em `public/images/logo-braza.png`; o favicon original enviado está em `public/favicon.png`. Os arquivos SVG cumprem o papel dos placeholders de hero, banner e categorias, sem download ou hotlink de imagens externas. Se mudar os nomes ou extensões, ajuste as referências em `src/pages/Home.tsx`, `src/lib/vehicles.ts` e nos cards.

Nome, contatos, endereço, WhatsApp, horário e taxa de simulação ficam em `src/config/site.ts`. O texto e os números da página Sobre ficam em `src/content/about.ts`.

## Verificações

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

Os testes Vitest cobrem slug, moeda, quilometragem, link de WhatsApp e horário em America/Sao_Paulo.

## Implantação

Na Vercel, em **Project Settings → Environment Variables**, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para Production e Preview, e faça um novo deploy. O cliente também tem como fallback a URL e a chave publishable públicas deste projeto, para o site funcionar se as variáveis estiverem ausentes. Se o projeto ou a chave mudar, atualize as variáveis na Vercel. Direcione todas as rotas da SPA para `index.html` (já incluído em `vercel.json` e `public/_redirects`). Atualize o domínio em `public/robots.txt` e `public/sitemap.xml` antes de publicar.

Como o site é uma SPA, metadados de veículos renderizados só no cliente podem não ser lidos por todos os bots sociais; pré-renderização ou SSR é uma evolução recomendada.

## Configuração pendente no painel Supabase

Em **Authentication → Providers → Email**, desative cadastro público de usuários. Em **Authentication → Settings → Password Security**, habilite **Leaked Password Protection**; o advisor ainda aponta esse aviso, e a conexão disponível não expõe essas configurações de Auth. O acesso ao admin já exige role no banco. Revise também a política de privacidade antes de publicar.
