# Braza Veículos

Site em pt-BR para a Braza Veículos, Uberlândia/MG. Front-end Vite + React 18 + TypeScript strict + Tailwind CSS. Dados e autenticação usam Supabase; não há backend próprio.

## Rodar localmente

1. `npm install`
2. Copie `.env.example` para `.env` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. `npm run dev`

`.env` está ignorado pelo Git. Só a chave **publishable** pode ser usada no navegador. Não coloque uma secret key nem service_role em variáveis `VITE_`.

`VITE_SHOW_DEMO=true` exibe 12 veículos de demonstração apenas quando o banco estiver vazio. O painel administrativo nunca mostra os dados demo.

## Projeto Supabase

Projeto usado: **For the Future** (`elvolxdmgpjxekfdtlfo`). As migrations aplicadas estão em `supabase/migrations/0001_init.sql`, `0002_function_hardening.sql` e `0003_sell_photo_path_guard.sql`.

O schema possui `vehicles`, `vehicle_photos`, `sell_requests`, `sell_request_photos`, `financing_requests` e `user_roles`, todos com RLS. Visitantes podem ler veículos e enviar solicitações; alterações no estoque e leitura/gestão das solicitações exigem role `admin`. Os buckets são `vehicle-photos` (público para leitura, escrita admin) e `sell-requests` (privado, upload público limitado a imagens em `public/`, leitura admin). A função `has_role` fica no schema não exposto `app_private`.

O client usa os tipos gerados do schema real em `src/types/database.ts`.

A terceira migration exige que o caminho de cada foto de solicitação de venda siga `public/<id da solicitação>/...`, impedindo que um pedido associe metadados de fotos de outro pedido.

## Painel administrativo

Acesse `/admin/login` com um usuário do Supabase Auth que tenha a role `admin` em `user_roles`. Não existe cadastro público pelo site. O painel permite trocar a própria senha em **Senha**, gerenciar veículos e fotos (até 20 por veículo, com reordenação e compressão) e tratar solicitações de venda e financiamento.

Para criar outro admin, crie o usuário em **Authentication → Users → Add user** no projeto correto, com o e-mail confirmado. Depois, no SQL Editor do mesmo projeto, associe a role:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'EMAIL_DO_NOVO_ADMIN'
on conflict do nothing;
```

Para redefinir uma senha, use **Authentication → Users → usuário → Send password recovery** ou peça ao admin autenticado para usar **Senha** no painel. Nunca coloque senhas no repositório.

## Imagens e dados da loja

O hero usa `public/images/hero-braza.jpg`, uma versão aprimorada da foto da fachada enviada para este projeto. Troque os outros placeholders locais em `public/images/`: `banner.svg`, `categoria-carros.svg`, `categoria-motos.svg`, `categoria-financie.svg`, `categoria-venda.svg`. A logo transparente do header e footer está em `public/images/logo-braza.png`; o favicon original enviado está em `public/favicon.png`. Se mudar os nomes ou extensões, ajuste as referências em `src/styles.css`, `src/pages/Home.tsx`, `src/components/SEO.tsx`, `src/lib/vehicles.ts` e nos cards.

Nome, contatos, endereço, WhatsApp, horário e taxa de simulação ficam em `src/config/site.ts`. O texto e os números da página Sobre ficam em `src/content/about.ts`.

## Verificações

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`

Os testes Vitest cobrem slug, moeda, quilometragem, link de WhatsApp e horário em America/Sao_Paulo.

## Implantação

Na Vercel, em **Project Settings → Environment Variables**, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para Production e Preview, e faça um novo deploy. Na Netlify, configure as mesmas variáveis em **Site configuration → Environment variables**. O cliente também tem como fallback a URL e a chave publishable públicas deste projeto, para o site funcionar se as variáveis estiverem ausentes. Se o projeto ou a chave mudar, atualize as variáveis no provedor. Direcione todas as rotas da SPA para `index.html` (já incluído em `vercel.json` e `public/_redirects`). Atualize o domínio em `public/robots.txt` e `public/sitemap.xml` antes de publicar.

Como o site é uma SPA, metadados de veículos renderizados só no cliente podem não ser lidos por todos os bots sociais; pré-renderização ou SSR é uma evolução recomendada.

## Configuração pendente no painel Supabase

Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**. Em **Authentication → Settings → Password Security**, habilite **Leaked Password Protection**; o advisor ainda aponta esse aviso, e a conexão disponível não expõe essas configurações de Auth. O acesso ao admin já exige role no banco. Revise também a política de privacidade antes de publicar.

Checklist manual:

- [ ] Desativar cadastro público no Supabase Auth e habilitar proteção contra senhas vazadas.
- [ ] Configurar as duas variáveis `VITE_SUPABASE_*` no provedor e publicar novamente.
- [ ] Trocar placeholders, conferir contatos e revisar a política de privacidade.
- [ ] Substituir `brazaveiculos.com.br` em `robots.txt` e `sitemap.xml` pelo domínio definitivo.
- [ ] Entrar em `/admin/login` e testar um cadastro de veículo com foto real; a sessão Auth existente é necessária para validar o upload físico ao Storage.
