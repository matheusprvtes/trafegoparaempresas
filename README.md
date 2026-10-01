# LP Tráfego Pago para Empresas — Agência Rei

Página estática (HTML/CSS/JS puros, sem build). Publicar o conteúdo desta pasta na URL
`https://agenciarei.com/trafego-pago-para-empresas/` (canonical já configurado).

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | A landing page (copy integral, JSON-LD, tracking, formulário) |
| `styles.css` | Design system dark (fundo preto, minimalismo B2B sobre a linguagem visual do CRM; ícones de linha via símbolos SVG no `index.html`) |
| `main.js` | Menu, FAQ, revelação, barra fixa, cookies e formulário (validação, anti-spam, tracking, webhook) |
| `obrigado.html` | Página pós-envio (`noindex`) |
| `privacidade.html` / `termos.html` | Legais — mesma razão social, CNPJ, endereço e contatos da LP principal |
| `legal-styles.css` | Estilos das páginas legais e de obrigado |
| `robots.txt` / `sitemap.xml` | SEO |
| `*.webp`, `og-image.jpg`, `*.png` | Imagens otimizadas, logo para fundo claro, ícones |

## Configurações pendentes (antes de publicar)

1. **Webhook do CRM** — `main.js` → `WEBHOOK_URL`. Está apontando para o webhook da LP principal
   (`.../webhook/5137cdf9-...`), com `funil: "lptrafegoempresas"`. Se este funil deve cair no fluxo
   da LP CRM/TikTok, trocar para `.../webhook/406f6c90-...`.
2. **Cloudflare Turnstile** — `main.js` → `TURNSTILE_SITEKEY` (vazio = só honeypot + análise comportamental).
3. **Bloqueio de e-mail público** — `main.js` → `BLOQUEAR_EMAIL_PUBLICO` (`false` por padrão; o payload
   sempre envia `email_corporativo: sim|nao` para o CRM).
4. **Google Tag Manager** — espaço reservado no `<head>` e no `<body>` do `index.html` (opcional; gtag e
   Meta Pixel já estão diretos, iguais à LP principal).
5. **URL final** — se for publicada em subdomínio (ex.: `empresas.agenciarei.com`) em vez de
   `/trafego-pago-para-empresas/`, atualizar canonical, `og:url`, `og:image`, JSON-LD, `robots.txt` e `sitemap.xml`.

## Integração no site principal (instruções do documento de copy)

- Menu → **Serviços**: inserir "Tráfego Pago para Empresas" como primeiro item.
- Menu → **Segmentos** → Empresas B2B: "Tráfego Pago para Empresas".
- Links internos para esta página em: home, página geral de serviços, LPs de e-commerce, negócios locais,
  prestadores, artigos relacionados e cases. Nas páginas segmentadas, incluir o link de retorno
  "Conheça também nossa estratégia de tráfego pago para empresas."
- **Não** redirecionar as páginas existentes; cada uma mantém canonical próprio.
- Incluir a página no sitemap principal e solicitar indexação no Search Console após publicar.

## Tracking / eventos

- `PageView` (Meta) + `gtag config AW-10936611175` no carregamento.
- No envio: `fbq('track','Lead')`, `gtag generate_lead`, e por faixa de volume de vendas:
  `LeadLQF` / `LeadMQF` / `LeadQF` (Meta custom + snippets de conversão Google Ads + `trck.qualify`).
- O payload envia `volume_vendas` (= `q1`, base da régua LQF/MQF/QF) **e** `faturamento` (= `q2`, só
  informativo — mesmas 6 faixas da LP principal). Conferir se o fluxo n8n deste funil mapeia `faturamento`.
- IDs de CTA: `cta-header`, `cta-hero-principal`, `cta-hero-secundario`, `cta-solucoes`, `cta-form-submit`,
  `cta-sticky`, `cta-whatsapp`, `cta-menu`. Formulário: `#leadForm` (`data-form="diagnostico-trafego-empresas"`).
