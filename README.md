# Cotador Enterprise

Plataforma SaaS de alta escala para gestão e precificação de serviços.

## 📚 Documentação

- **[Development Guidelines](./DEVELOPMENT_GUIDELINES.md)** - Manual completo de desenvolvimento (OBRIGATÓRIO ler antes de começar)
- **[Design Document](./DESIGN_DOCUMENT.md)** - Arquitetura e design técnico do sistema
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Plano de implementação de mensageria e workers
- **[Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)** - Checklist para revisão de código

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 15+
- RabbitMQ 3+

### Setup Local

```bash
# Clone o repositório
git clone <repo-url>
cd cotador-enterprise

# Instale dependências
npm install

# Inicie a infraestrutura (PostgreSQL, RabbitMQ, Redis)
docker-compose up -d

# Configure variáveis de ambiente
cp apps/api-core/.env.example apps/api-core/.env
# Edite .env com suas credenciais

# Execute migrations
cd apps/api-core
npm run db:migrate

# Inicie a API
npm run start:dev
```

## 📁 Estrutura do Projeto

```
cotador-enterprise/
├── apps/
│   ├── api-core/          # API Core (NestJS)
│   ├── micro-pdf/         # Worker de geração de PDFs
│   └── mobile/            # App React Native
├── packages/
│   └── shared/            # Código compartilhado (contratos, tipos)
├── docker-compose.yml     # Infraestrutura local
└── DESIGN_DOCUMENT.md    # Documentação de arquitetura
```

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia todos os serviços em modo dev
npm run test             # Roda testes
npm run test:cov         # Testes com cobertura
npm run lint             # Verifica código
npm run format           # Formata código

# Docker
docker-compose up -d     # Inicia infraestrutura
docker-compose down      # Para infraestrutura
docker-compose logs -f   # Ver logs
```

## 📋 Regras de Ouro

Antes de começar a desenvolver, leia o [Development Guidelines](./DEVELOPMENT_GUIDELINES.md). As regras principais são:

1. ✅ TypeScript strict mode obrigatório
2. ✅ Nenhum `any` permitido
3. ✅ Clean Architecture (Domain não importa Infra)
4. ✅ Testes obrigatórios (>80% cobertura)
5. ✅ Conventional Commits
6. ✅ Code review obrigatório

## 🔒 Segurança

- ❌ **NUNCA** commite credenciais no código
- ✅ Use variáveis de ambiente para secrets
- ✅ Valide todas as entradas de dados
- ✅ Não logue dados sensíveis

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nome-da-feature`
2. Faça suas alterações seguindo as guidelines
3. Commit com Conventional Commits: `feat(api-core): add feature`
4. Abra um Pull Request
5. Aguarde aprovação do code review

## 📞 Contato

Para dúvidas sobre desenvolvimento, consulte:

- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)
- Tech Lead ou Staff Engineer

---

**Última atualização**: 2025-01-17
