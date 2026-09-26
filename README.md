# Meu Tratamento

**Seu tratamento, no seu ritmo.**

App de acompanhamento de medicamentos e rotina de tratamento — React Native (Expo) + TypeScript + Supabase.

> Este projeto está sendo construído em **10 fases**. Este documento reflete o estado ao final da **FASE 10 — Segurança, testes e preparação para publicação — a última fase**.

---

## ✅ O que já funciona (Fases 1 a 10 — projeto completo)

### Novidades da Fase 10

- **Exclusão de conta real**: nova rota `backend/api/delete-account.ts` exclui o usuário no Supabase Auth (com a service role); todos os dados caem em cascata por causa do `ON DELETE CASCADE` definido desde a Fase 2. Em modo mock, a mesma ação limpa tudo localmente. Botão disponível em Configurações, com dupla confirmação.
- **`eas.json`** com perfis de build `development`, `preview` e `production`.
- **`docs/SECURITY_CHECKLIST.md`**: revisão do que está implementado e o que ainda depende de decisões antes de um lançamento real (rate limiting, confirmação de e-mail, CORS restrito, revisão jurídica dos termos).
- **`docs/PLAY_STORE_CHECKLIST.md`**: o que falta fora do código para publicar (ícones finais, política de privacidade pública, formulário de segurança de dados da Play Store, capturas de tela).

### Das fases anteriores

- **Tela "Seu Plano"**: mostra o plano atual (Free/Premium, vindo de `profiles.plan`) e a lista dos 12 recursos Premium previstos, todos marcados como liberados enquanto `EXPO_PUBLIC_PREMIUM_FREE_FOR_ALL=true`. Tem um botão para **simular** a troca de plano (sem cobrança) — útil para testar a estrutura antes de a cobrança existir de verdade.
- **Toggle de IA na tela de Configurações agora é real**: liga/desliga `profiles.ai_enabled`, e a Home passa a esconder o cartão do Assistente quando desligado — fechando a pendência que ficou aberta na Fase 8.
- `hasFeature()` (criado na Fase 1) continua sendo o único ponto de código que vai precisar mudar quando a cobrança for implementada — nada nas telas precisa ser tocado.

### Das fases anteriores

- **Backend separado** em `backend/` (deploy próprio na Vercel — ver `backend/README.md`): a única rota `api/assistant.ts` valida o token de sessão do usuário, busca os dados dele no Supabase com a service role (nunca de outro usuário) e chama a **Gemini API de verdade**, com um prompt que proíbe explicitamente diagnóstico, prescrição ou alteração de dose.
- **Tela do Assistente com chat real**: sugestões de pergunta, histórico da conversa na tela, e aviso permanente de que o assistente organiza/consulta dados — nunca diagnostica.
- O app envia ao backend apenas a pergunta e o **token de autenticação** — nunca dados médicos brutos; quem busca os dados é o backend, a partir do usuário validado por esse token.
- Sem `EXPO_PUBLIC_AI_BACKEND_URL` configurado, o assistente continua em modo mock (resposta de desenvolvimento, sem chamar nada).

### Das fases anteriores

- **Convite de cuidador por e-mail**: o titular convida alguém; a pessoa convidada vê o convite pendente ao entrar no app com aquele e-mail e pode aceitar.
- **Permissões granulares de verdade** (seção 13): "Avisar dose não confirmada", "Avisar estoque acabando", "Ver consultas" e "Ver histórico completo" (marcada com ⚠️ por ser a mais sensível) — todas desligadas por padrão, o titular decide o que liga.
- **RLS reforçado no banco** (`supabase/policies/0005_caregiver_data_access_rls.sql`): o cuidador só consegue *ler* (nunca editar) exatamente as tabelas cobertas pelas permissões que o titular ligou — medições de saúde e dados de perfil **nunca** são liberados a um cuidador, em nenhuma configuração, seguindo o princípio de menor acesso possível.
- Seção "Sou cuidador(a) de" mostrando os titulares que a pessoa está acompanhando.

### Das fases anteriores

- **Consultas completas**: cadastrar, editar, excluir, com lembrete real agendado (notificação local no horário da consulta). A Home agora mostra a **próxima consulta de verdade** (não mais mock).
- **Medições de saúde**: pressão arterial, glicemia, peso, temperatura, frequência cardíaca, saturação e registros personalizados — com aviso claro de que são apenas registros do usuário, sem qualquer interpretação, diagnóstico ou recomendação de dose (seção 11 / Regra 4).
- **Relatórios visuais**: adesão ao tratamento no período (semana/mês/90 dias), doses por status com barras visuais, contagem de medicamentos ativos, medições e consultas no período.
- **Estrutura preparada para exportação em PDF** (botão "Exportar PDF" já existe na tela de Relatórios, mas ainda não gera o arquivo — isso é Premium e fica para uma fase futura, conforme pedido).

### Das fases anteriores

- **Histórico completo**: filtros por medicamento, status (tomado/pendente/adiado/pulado/não confirmado) e por período — visualização diária, semanal e mensal, tudo consultando dados reais.
- **Calendário visual**: mês navegável com um ponto colorido em cada dia que tem dose programada (verde = tudo tomado, laranja = pendente, vermelho = algo pulado); tocar em um dia mostra os medicamentos programados para aquela data. O calendário gera automaticamente as doses de todo o mês visível (não só hoje).
- **Tela de Estoque dedicada**: lista todos os medicamentos com controle de estoque, ordenados por urgência, com **estimativa de dias restantes** (baseada na soma das doses diárias cadastradas) e o aviso "ACABANDO" quando o estoque está no limite configurado ou abaixo dele.
- Atalho "Estoque" da Home e o menu "Mais" agora levam a essas telas reais.

### Das fases anteriores

- **Camada de serviços real** (`src/services/medications/`, `src/services/doses/`): todo o CRUD de medicamentos e horários, e a geração de doses do dia a partir dos horários cadastrados, gravando no **Supabase de verdade** quando configurado — e, quando não está, num **armazenamento local persistente** (AsyncStorage) que funciona como um banco de dados de desenvolvimento de verdade, não um mock que "finge" salvar.
- **Tela "Meus Medicamentos" completa**: lista real, pull-to-refresh, botão "+" para cadastrar.
- **Formulário completo de medicamento**: nome, princípio ativo, apresentação, dose/unidade, motivo, observações, frequência (uma/duas/três vezes ao dia ou horários personalizados), horários (adicionar/remover), data de início/fim, estoque inicial e limite de alerta — cria e edita de verdade.
- **Tela de Detalhe do Medicamento**: todas as informações, horários, estoque, e os botões **Editar / Pausar-Reativar / Excluir funcionando de verdade**.
- **Geração real de doses do dia** (`ensureDosesForDate`): a cada abertura da Home, o sistema garante que existe uma dose para cada horário de cada medicamento ativo daquele dia, sem duplicar.
- **Notificações locais reais** (`expo-notifications`): a Home agenda um lembrete de verdade no aparelho para cada dose pendente, com os botões **Tomei / Adiar 15 min / Pular na própria notificação** — responder a eles atualiza a dose no banco mesmo que o app esteja em segundo plano.
- **A Home agora consome dados reais**: "Próxima Dose" e "Resumo de Hoje" vêm das tabelas `doses`/`medications` (ou do armazenamento local em modo dev) — os mocks da Fase 3 saíram de cena, exceto a Próxima Consulta (só chega na Fase 6).
- **Baixa de estoque automática**: confirmar "Tomei" desconta a quantidade da dose do estoque do medicamento.

### Das fases anteriores

- **Tela Início completa**, seguindo a estrutura da referência visual: cabeçalho (logo, nome, slogan, sino, avatar), saudação com nome e data do dia, cartão de **Próxima Dose** com os três botões **funcionais** (Tomei / Adiar / Pular — atualizam o estado na hora e mostram "✓ Dose registrada"), o **Adiar** abre um seletor com 10/15/30/60 min, atalhos para Medicamentos/Calendário/Histórico/Estoque, **Resumo de Hoje** (reativo às ações acima), cartão do **Assistente de IA** (roxo, conforme paleta) e **Próxima Consulta**.
- Nesta fase os dados da Home vêm de **mocks explícitos** (`src/mocks/mockHomeData.ts`) — os botões funcionam de verdade sobre esses dados em memória; a gravação real em `doses`/`medications` no Supabase é o objetivo da **Fase 4**.
- **Componentes de interface reutilizáveis**: `Card`, `Button`, `TextField` (fase 2) e os componentes de Home (`HomeHeader`, `NextDoseCard`, `ShortcutsGrid`, `SummaryCard`, `AIAssistantCard`, `NextAppointmentCard`).
- **Navegação inferior com ícones definitivos** (Ionicons, grandes, tema-aware), substituindo os emojis provisórios da Fase 1.

### Novidades da Fase 2

- **Schema completo do banco** em `supabase/migrations/` (5 arquivos, em ordem): `profiles`, `medications`, `medication_schedules`, `doses`, `appointments`, `measurements`, `notifications`, `caregiver_links`, `caregiver_permissions`, `user_settings`.
- **Row Level Security (RLS) completo** em `supabase/policies/`: todo dado sensível só pode ser lido/escrito pelo próprio dono (`auth.uid()`); veja `supabase/README.md` para a ordem de execução e como testar o isolamento com 2 contas.
- Trigger que **cria o `profile` automaticamente** quando alguém se cadastra (`handle_new_user`), separando dados de conta de dados de tratamento (seção 15).
- **Telas de Login, Cadastro e Recuperação de senha reais**, com validação de formulário e chamadas de verdade a `supabase.auth` (em modo mock, sem `.env`, qualquer e-mail/senha entra, para você testar a navegação).
- **Tela de Configurações funcional**: troca de tema (claro/escuro/seguir aparelho) persistida, e **logout real**.
- Tipos TypeScript completos do banco em `src/types/database.ts`, usados pelo cliente Supabase tipado.

### Da Fase 1 (continuam válidas)

- Projeto Expo + TypeScript rodando (`npm start`), com alias de import `@/`.
- Estrutura de pastas completa e modular (telas, componentes, serviços, navegação, tema, config, tipos).
- **Sistema de tema real** claro / escuro / "seguir aparelho", com tokens de cor, espaçamento, tipografia e sombra, persistido em disco (`ThemeContext`).
- **Navegação completa e funcional**: pilha de autenticação, abas inferiores (Início, Medicamentos, Calendário, Relatórios, Mais) e sub-pilhas de cada área, com troca automática entre "logado" e "não logado".
- **Cliente Supabase configurado** via variáveis de ambiente (nenhuma chave no código), com **modo mock automático**: se o `.env` não estiver preenchido, o app não quebra — ele roda com um usuário fictício para você navegar e testar a estrutura.
- **`AuthContext` funcional**: já chama de verdade `supabase.auth` (login, cadastro, logout, recuperação de senha) assim que você configurar o Supabase; em modo mock, simula essas ações.
- **Sistema de feature flags FREE/PREMIUM** (`hasFeature`): hoje libera tudo para teste, com o único ponto de código que precisará mudar quando a cobrança existir.
- Camada de IA e de notificações **com a arquitetura de segurança já definida** (o app nunca guarda chave de IA; chama sempre um backend), prontas para receber a implementação real nas fases 4 e 8.
- Todas as telas de todas as áreas existem como componentes React reais e navegáveis (você consegue abrir cada uma pelo app), mas com conteúdo placeholder — ver seção abaixo.

## 🚧 O que ainda não está implementado (honestamente, ao final das 10 fases)

Nada abaixo foi "fingido" como pronto — são lacunas reais, deixadas de propósito fora do escopo original ou dependentes de decisões de negócio/design que não cabem ao código:

- **Cobrança real do Premium**: a arquitetura inteira está pronta (`hasFeature`, tela de Plano, coluna `plan` no banco), mas a integração com um provedor de pagamento (Stripe, Google Play Billing etc.) não foi feita — por pedido explícito do projeto (seção 18).
- **Reconhecimento de medicamento por foto** e outros "recursos inteligentes" citados como Premium futuros (seção 18) — apenas listados na tela de Plano, sem implementação.
- **Geração real do PDF de relatórios** — o botão existe (Fase 6), a geração do arquivo em si não.
- **Ícones e splash finais, política de privacidade pública** — dependem de design gráfico e texto jurídico, fora do escopo de código (ver `docs/PLAY_STORE_CHECKLIST.md`).
- **Login social (Google/Apple/telefone)** — a arquitetura do Supabase Auth permite adicionar depois, mas não foi implementado (estava marcado como preparação futura na seção 17).
- Itens técnicos menores documentados ao longo deste arquivo (ex: geração de doses do calendário dia a dia, distinção fina de permissões de cuidador) — funcionam, mas têm uma nota de possível otimização futura.

## ⚙️ O que depende de configuração externa

1. **Supabase** — criar projeto, preencher `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no `.env`, e rodar os arquivos de `supabase/migrations/` e `supabase/policies/` (veja `supabase/README.md`). Sem isso, o app roda em modo mock.
2. **Gemini API** e **exclusão de conta** — chaves e rotas ficam só no backend (`backend/`), nunca no app; veja `backend/README.md`.
3. **Vercel** — hospeda as funções de backend (`/api/assistant`, `/api/delete-account`).
4. **EAS / conta Expo** — necessário para gerar o `.apk`/`.aab` do Android e publicar na Play Store (`eas.json` já está pronto).
5. **GitHub** — repositório remoto (opcional para rodar localmente, recomendado para versionar).
6. **Conta de desenvolvedor Google Play + assets de loja** — ver `docs/PLAY_STORE_CHECKLIST.md` para a lista completa do que falta fora do código.

---

## 📁 Estrutura de pastas

```
meu-tratamento/
├── App.tsx                     # ponto de entrada: providers + navegação
├── app.json                    # config do Expo (nome, ícone, splash, Android/iOS)
├── package.json
├── tsconfig.json
├── babel.config.js
├── .env.example                # copie para .env e preencha
├── src/
│   ├── screens/                # uma pasta por área (Home, Medications, Calendar, ...)
│   ├── components/
│   │   ├── common/              # componentes genéricos (ex: ScreenPlaceholder)
│   │   ├── medication/          # componentes específicos de medicamento (fase 4)
│   │   └── dose/                # componentes de dose/lembrete (fase 4)
│   ├── navigation/               # RootNavigator, AuthNavigator, MainTabNavigator, tipos
│   ├── theme/                     # colors.ts, tokens.ts, ThemeContext.tsx
│   ├── context/                   # AuthContext (mais contextos nas próximas fases)
│   ├── services/
│   │   ├── supabase/              # client.ts (cliente configurado)
│   │   ├── notifications/         # lembretes locais (fase 4)
│   │   ├── ai/                    # aiClient.ts (fala com o backend, nunca com a IA direto)
│   │   └── premium/                # regras de assinatura (fase 9)
│   ├── config/                     # featureFlags.ts (FREE/PREMIUM)
│   ├── types/                      # database.ts (tipos do Supabase — cresce na fase 2)
│   ├── mocks/                       # dados fictícios para dev sem Supabase configurado
│   └── utils/
├── supabase/
│   ├── migrations/                  # SQL das tabelas (fase 2)
│   └── policies/                    # SQL das políticas RLS (fase 2)
└── docs/                              # documentação adicional por fase
```

---

## 🚀 Como rodar localmente

Pré-requisitos: Node.js 18+, npm, o app **Expo Go** no celular (ou emulador Android/iOS configurado).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env — sem o Supabase configurado, o app roda em MODO MOCK

# 3. Iniciar o servidor de desenvolvimento
npm start

# 4. Abrir no celular
# escaneie o QR Code com o app Expo Go (Android) ou a Câmera (iOS)
```

Em modo mock (sem `.env` preenchido), o app abre direto na área logada com um usuário fictício "Carlos", para você navegar pela estrutura.

## ☁️ Configurar o Supabase (preparação — schema chega na Fase 2)

1. Crie uma conta e um projeto em https://supabase.com.
2. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
3. Cole em `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no seu `.env`.
4. Na Fase 2, você vai rodar os arquivos de `supabase/migrations/` (SQL) no **SQL Editor** do Supabase para criar as tabelas, e os de `supabase/policies/` para ativar o RLS.
5. **Nunca** compartilhe a **service_role key** — ela não deve ir para o `.env` do app mobile.

## ▲ Configurar a Vercel (backend da IA)

1. Crie uma conta em https://vercel.com.
2. Importe este repositório, mas configure o **Root Directory** do projeto Vercel como `backend/` (é um projeto Node separado do app Expo).
3. Em **Project Settings → Environment Variables**, defina `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `GEMINI_API_KEY` (nunca no `.env` do app mobile).
4. Faça o deploy e copie a URL gerada (ex: `https://seu-projeto.vercel.app/api/assistant`) para `EXPO_PUBLIC_AI_BACKEND_URL` no `.env` do app.

Detalhes completos em `backend/README.md`.

## 🐙 Configurar o GitHub

```bash
git init
git add .
git commit -m "Fase 1: arquitetura e estrutura do projeto"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

O `.gitignore` já está configurado para nunca versionar `.env`, chaves ou builds nativos.

## 📱 Gerar o app Android (visão geral — detalhado na Fase 10)

Usaremos o **EAS Build** da Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # gera um .apk para testar
eas build --platform android --profile production # gera .aab para a Play Store
```

Isso será revisado e detalhado por completo na **Fase 10** (segurança, testes e preparação para publicação), incluindo ícones finais, assinatura do app e checklist da Play Store.

---

## 🔒 Segurança — resumo (detalhado nas fases 2 e 10)

- Nenhuma senha, chave ou token está no código-fonte — tudo vem de variáveis de ambiente.
- A chave pública do Supabase é segura por design; a proteção real dos dados vem das políticas de **Row Level Security**, criadas na Fase 2, garantindo que um usuário **nunca** acesse dados de outro.
- A chave da IA (Gemini) só existirá no backend, nunca no app.
- Dados de família/cuidador terão permissões granulares (Fase 7) — um cuidador não recebe acesso total ao histórico médico por padrão.

## 🩺 Aviso importante

O "Meu Tratamento" é uma ferramenta de **organização e lembrete**. Ele registra apenas informações fornecidas pelo próprio usuário. Ele **não** diagnostica condições, **não** prescreve ou altera doses, e **não** substitui orientação médica profissional — inclusive o futuro Assistente de IA seguirá essa mesma regra.

---

## ✅ Projeto completo — as 10 fases foram entregues

Este README documentou o projeto fase a fase; agora que a Fase 10 fechou, aqui está o resumo do que entregar significa na prática:

1. **Estrutura completa** do projeto (Fase 1).
2. **Todos os arquivos necessários**: app Expo (`/`), backend (`/backend`), banco (`/supabase`).
3. **Código** organizado por domínio (`src/services`, `src/screens`, `src/components`, `src/navigation`, `src/theme`).
4. **Banco de dados** com schema completo e RLS (`/supabase`).
5. **Configurações**: `.env.example` no app e no backend, `app.json`, `eas.json`.
6. **Instruções de instalação e execução**: seção "Como rodar localmente" acima.
7. **Instruções de publicação**: `docs/PLAY_STORE_CHECKLIST.md` e a seção "Gerar o app Android" acima.
8. **O que já funciona**: todas as seções "Novidades da Fase X" ao longo deste arquivo.
9. **O que ainda depende de configuração externa**: seção logo acima.
10. Todos os arquivos deste projeto foram entregues como ZIP a cada fase, prontos para rodar com `npm install && npm start`.

## ⚠️ Observação técnica sobre o Calendário

Para exibir o mês inteiro, a tela de Calendário chama `ensureDosesForDateRange`, que gera as doses dia a dia (uma chamada por dia). Isso é aceitável no volume de um mês nesta fase; se o app crescer muito, vale trocar por uma função de banco (RPC) que gere tudo em uma única operação no servidor.

## ⚠️ Observação técnica sobre notificações

O agendamento usa `expo-notifications` com trigger baseado em segundos a partir de agora (`{ seconds }`), a forma mais estável entre versões do SDK do Expo. Se você atualizar a versão do `expo-notifications` no `package.json`, vale conferir na documentação oficial se a assinatura do `trigger` mudou.
