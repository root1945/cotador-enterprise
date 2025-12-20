# Setup Guide - Cotador Enterprise

Guia rápido de configuração do ambiente de desenvolvimento.

## ✅ Checklist de Configuração

### 1. Instalar Dependências

```bash
# Na raiz do projeto
pnpm install

# Ou em cada app individualmente
cd apps/api-core && pnpm install
cd apps/mobile && pnpm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp apps/api-core/.env.example apps/api-core/.env

# Editar .env com suas credenciais
nano apps/api-core/.env
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` no Git!

### 3. Iniciar Infraestrutura (Docker)

```bash
# Iniciar PostgreSQL, RabbitMQ e Redis
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Ver logs
docker-compose logs -f
```

### 4. Configurar Banco de Dados

```bash
cd apps/api-core

# Rodar migrations
pnpm db:migrate

# (Opcional) Abrir Prisma Studio para visualizar dados
pnpm db:studio
```

### 5. Configurar Git Hooks (Husky)

```bash
# Na raiz do projeto
pnpm prepare

# Isso configura os hooks:
# - pre-commit: Valida código e detecta secrets
# - commit-msg: Valida formato de commits (Conventional Commits)
```

### 6. Iniciar Aplicação

```bash
cd apps/api-core

# Modo desenvolvimento (com hot reload)
pnpm start:dev

# A API estará disponível em:
# http://localhost:3000/api/v1
```

## 🧪 Verificar Instalação

### Testar API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Criar orçamento (exemplo)
curl -X POST http://localhost:3000/api/v1/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "items": [
      {
        "description": "Service A",
        "price": 100.00,
        "qty": 2
      }
    ]
  }'
```

### Verificar Linting

```bash
cd apps/api-core
pnpm lint
```

### Rodar Testes

```bash
cd apps/api-core
pnpm test
pnpm test:cov     # Com cobertura
```

## 🐛 Troubleshooting

### Erro: "Environment validation failed"

Verifique se todas as variáveis obrigatórias estão no `.env`:

- `DATABASE_URL`
- `RABBITMQ_URL`
- `REDIS_URL`
- `JWT_SECRET`

### Erro: "Cannot connect to database"

1. Verifique se o Docker está rodando: `docker-compose ps`
2. Verifique se o PostgreSQL está acessível: `docker-compose logs postgres`
3. Confirme que a `DATABASE_URL` está correta no `.env`

### Erro: "Husky hooks not working"

```bash
# Reinstalar hooks
pnpm prepare

# Verificar permissões
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Erro: "Port 3000 already in use"

Altere a porta no `.env`:

```bash
PORT=3001
```

## 📚 Próximos Passos

1. Leia o [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)
2. Configure seu editor (VS Code recomendado)
3. Instale extensões recomendadas:
   - ESLint
   - Prettier
   - Prisma

## 🔗 Links Úteis

- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md) - Manual completo
- [Design Document](./DESIGN_DOCUMENT.md) - Arquitetura do sistema
- [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md) - Checklist para PRs

---

**Última atualização**: 2025-01-17
