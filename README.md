# Checklist iProntoMax

Sistema de checklist diário dos técnicos da **iProntoMax** (provedor de internet). Toda manhã, antes de sair
para a rota, o técnico confere EPIs, materiais e o veículo. Se algum item obrigatório estiver com problema,
a saída é **bloqueada** e uma **pendência** é aberta automaticamente para a administração.

## Funcionalidades

**Técnico**
- Painel do dia com status de saída (liberado / bloqueado / pendente) e sequência de dias sem bloqueio
- Checklist de EPI's e materiais e checklist do veículo, uma etapa por vez (Sim / Não / N/A, quantidade, observação e até 5 fotos por item)
- Quilometragem e nível de combustível do veículo
- Revisão final e **assinatura digital** (dedo, caneta ou mouse)
- Histórico dos próprios checklists

**Administrador**
- Visão geral com indicadores, gráfico diário e alertas de técnicos sem checklist (justificar ou encaminhar)
- Lista de checklists com filtros, detalhes, fotos, assinatura, validação e exportação CSV
- Quadro de pendências (kanban com arrastar e soltar), prioridades, prazos, histórico e comentários
- Agenda/calendário com eventos e prazos de pendências
- Relatórios de conformidade por técnico, liberados x bloqueados e itens com mais problemas (CSV / impressão)
- Cadastros de usuários, veículos e itens dos checklists (obrigatório ou opcional)
- Logs de acesso e ações, notificações e modo claro/escuro

## Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · Recharts · Lucide Icons

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

**Acessos de demonstração**

| Perfil | Usuário | Senha |
| --- | --- | --- |
| Administrador | `admin` | `admin123` |
| Técnicos | `carlos`, `joao`, `marcos`, `rafael`, `lucas` | `123456` |

## Sobre os dados

Esta versão é o **front-end completo** e guarda os dados no `localStorage` do navegador (com uma base de
demonstração gerada em `src/lib/seed.ts`). Toda a lógica de dados fica em `src/lib/store.tsx`, então ligar a
um back-end real (API + banco) é questão de trocar as funções desse arquivo por chamadas HTTP. Em
**Cadastros → Restaurar demonstração** os dados de exemplo são recriados.

> As senhas de demonstração ficam em texto puro no navegador. Antes de usar em produção, é preciso um
> back-end com autenticação de verdade (senhas com hash, sessões/tokens) e armazenamento das fotos em servidor.
