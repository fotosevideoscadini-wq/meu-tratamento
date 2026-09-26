# Checklist para publicar na Google Play — Meu Tratamento

## O que já está pronto no projeto
- [x] `app.json` com `android.package` (`br.com.meutratamento.app`) definido.
- [x] `eas.json` com perfis de build `development`, `preview` e `production`.
- [x] Permissões Android declaradas (`NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`).

## O que falta providenciar antes de enviar (fora do código)
- [ ] **Ícone final do app** (1024×1024) e **ícone adaptável Android** — hoje `assets/icons/` está vazio; o design deve seguir a identidade visual definida nas Fases 1–3.
- [ ] **Splash screen final** em `assets/images/splash.png`.
- [ ] **Conta de desenvolvedor Google Play** (taxa única de registro).
- [ ] **Política de Privacidade publicada** (URL pública) — obrigatória para apps que lidam com dados de saúde. Deve descrever exatamente os dados coletados (ver seção 15/16 do projeto) e como excluir a conta.
- [ ] **Formulário de segurança de dados** da Play Store (Data Safety) preenchido, refletindo o que está em `docs/SECURITY_CHECKLIST.md`.
- [ ] **Capturas de tela** do app (telas Início, Medicamentos, Calendário, Relatórios) em pelo menos um tamanho de celular.
- [ ] **Texto da ficha da loja**: descrição curta, descrição completa, categoria (Saúde e fitness), classificação de conteúdo (questionário da Play Store).
- [ ] Testar o build de produção (`eas build --platform android --profile production`) em pelo menos um aparelho físico antes de enviar.

## Comandos de build e envio

```bash
npm install -g eas-cli
eas login
eas build:configure         # gera/atualiza o eas.json e vincula ao projeto Expo
eas build --platform android --profile preview     # gera um .apk para teste interno
eas build --platform android --profile production  # gera o .aab para a Play Store
eas submit --platform android                        # envia o .aab para a Play Store (após configurar a service account)
```

Para `eas submit`, é necessário gerar uma **service account key** no Google
Cloud Console vinculada ao Play Console — ver
https://docs.expo.dev/submit/android/ para o passo a passo (fora do escopo
deste código, pois depende da sua conta Google).

## Observação sobre dados de saúde na Play Store

Como o app lida com informações relacionadas à saúde (mesmo sendo apenas
registros do próprio usuário, sem diagnóstico), o formulário de segurança de
dados da Play Store deve declarar isso explicitamente. Revise a política da
Google para apps de saúde antes de enviar:
https://support.google.com/googleplay/android-developer/answer/10787469
