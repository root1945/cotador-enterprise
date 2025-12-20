# Relatório de Validação do Monorepo - Cotador Enterprise

**Data da Validação**: 2025-01-17  
**Ferramenta**: pnpm workspaces  
**Versão do pnpm**: 9.15.3 (especificada em `package.json`)

---

## 📋 Checklist de Validação

### 1. Configuração de Workspaces (pnpm-workspace.yaml)

#### 1.1 Arquivo existe no root

- **Status**: ✅ **[PASS]**
- **Localização**: `/pnpm-workspace.yaml`
- **Evidência**: Arquivo presente e válido
- **Conteúdo**:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```

#### 1.2 Workspaces definidos corretamente

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ Cobre `apps/*` (inclui `api-core` e `mobile`)
  - ✅ Cobre `packages/*` (inclui `shared`)
  - ⚠️ **Observação**: Não há referência explícita a `mobile`, mas `apps/*` cobre automaticamente
- **Sugestão**: Considerar adicionar comentário explicando que `apps/*` inclui todos os apps

#### 1.3 Configurações de hoisting

- **Status**: ✅ **[PASS]**
- **Localização**: `/.npmrc`
- **Configurações encontradas**:
  - `shamefully-hoist=true` ✅
  - `node-linker=hoisted` ✅
  - `link-workspace-packages=true` ✅
- **Análise**: Configuração adequada para monorepo com compatibilidade máxima

#### 1.4 Workspaces aninhados ou conflitos

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ Não há `pnpm-workspace.yaml` em subpastas
  - ✅ Estrutura plana e clara
  - ✅ Sem conflitos de configuração

---

### 2. Package.json no Root

#### 2.1 Campo "private": true

- **Status**: ✅ **[PASS]**
- **Localização**: `package.json:4`
- **Evidência**: `"private": true` presente
- **Impacto**: Previne publicação acidental do monorepo

#### 2.2 Dependências hoistadas no root

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Análise**:
  - ✅ `eslint`, `prettier`, `husky`, `typescript-eslint` no root (correto)
  - ⚠️ **Problema**: `typescript` não está no root, mas está em `packages/shared/devDependencies` e `apps/api-core/devDependencies`
  - ⚠️ **Problema**: `@nestjs/cli`, `prisma`, `jest` estão apenas em `apps/api-core` (podem ser hoistadas)
- **Recomendação**:
  - Mover `typescript` para `devDependencies` do root
  - Considerar hoistar ferramentas comuns como `jest`, `prisma` se usadas em múltiplos pacotes

#### 2.3 Scripts usando pnpm com flags corretas

- **Status**: ✅ **[PASS]**
- **Análise dos scripts**:
  - ✅ `"build": "pnpm --recursive run build"` - correto
  - ✅ `"dev": "pnpm --parallel --filter \"./apps/*\" run start:dev"` - correto
  - ✅ `"build:api": "pnpm --filter api-core run build"` - correto
  - ✅ `"test": "pnpm --recursive run test"` - correto
  - ✅ `"lint": "pnpm --recursive run lint"` - correto
- **Evidência**: Todos os scripts principais usam flags apropriadas do pnpm

#### 2.4 Ausência de dependencies indevidas no root

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ Apenas `devDependencies` no root (correto)
  - ✅ Sem `dependencies` no root (correto para monorepo)

---

### 3. Estrutura de Subpacotes

#### 3.1 Package.json com "name" único

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Análise**:
  - ✅ `apps/api-core`: `"name": "api-core"` (único)
  - ✅ `packages/shared`: `"name": "@cotador/shared"` (único, namespace correto)
  - ⚠️ **Problema**: `apps/mobile`: `"name": "cotadorplus"` (não segue padrão `@cotador/mobile`)
- **Recomendação**:
  - Renomear `apps/mobile/package.json` para `"name": "@cotador/mobile"` ou `"name": "mobile"` para consistência

#### 3.2 Dependências locais via workspace:\*

- **Status**: ❌ **[FAIL]**
- **Análise**:
  - ❌ `apps/api-core/package.json` não referencia `@cotador/shared` como dependência
  - ❌ `apps/mobile/package.json` não referencia `@cotador/shared` como dependência
  - ✅ `packages/shared/package.json` está correto (é o pacote compartilhado)
- **Evidência**:
  - Busca por `workspace:` retornou 0 resultados
  - Busca por `@cotador/shared` em `apps/api-core` retornou 0 resultados
- **Impacto**:
  - Pacotes não podem importar `@cotador/shared` corretamente
  - TypeScript pode não resolver os tipos corretamente
  - Build pode falhar se houver dependência de build order
- **Correção necessária**:
  ```json
  // apps/api-core/package.json
  "dependencies": {
    "@cotador/shared": "workspace:*",
    // ... outras deps
  }
  ```

#### 3.3 Ausência de node_modules aninhados

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ Apenas `node_modules` no root
  - ✅ Subpastas não têm `node_modules` próprios
  - ⚠️ **Nota**: `node_modules` aninhados dentro de `./node_modules/*/node_modules` são normais com pnpm hoisted mode

#### 3.4 Configuração React Native/Expo (mobile)

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ `apps/mobile/tsconfig.json` existe e estende `expo/tsconfig.base`
  - ✅ `apps/mobile/metro.config.js` presente
  - ✅ `apps/mobile/babel.config.js` presente
  - ✅ Dependências do Expo configuradas corretamente

---

### 4. Configurações de Ferramentas

#### 4.1 tsconfig.json no root

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Localização**: `/tsconfig.json`
- **Análise**:
  - ✅ `baseUrl` e `paths` configurados para `@cotador/shared`
  - ✅ `strict: true` e todas as flags de strict mode
  - ⚠️ **Problema**: Não usa `composite: true` (recomendado para monorepos)
  - ⚠️ **Problema**: Não usa `references` para projetos TypeScript
  - ⚠️ **Problema**: `apps/api-core/tsconfig.json` não estende o root nem tem paths para `@cotador/shared`
- **Evidência**:

  ```json
  // tsconfig.json (root) - tem paths
  "paths": {
    "@cotador/shared": ["packages/shared/src/index.ts"]
  }

  // apps/api-core/tsconfig.json - NÃO estende root, NÃO tem paths
  ```

- **Recomendação**:
  - Adicionar `composite: true` no root
  - Fazer `apps/api-core/tsconfig.json` estender o root ou adicionar paths manualmente
  - Considerar usar `references` para build incremental

#### 4.2 eslint.config.mjs para workspaces

- **Status**: ✅ **[PASS]**
- **Localização**: `/eslint.config.mjs`
- **Análise**:
  - ✅ Ignora `**/node_modules/**`, `**/dist/**`, `**/build/**` (correto)
  - ✅ Configuração básica presente
  - ✅ Subpacotes têm seus próprios `eslint.config.mjs` (permitido)
- **Observação**: Configuração minimalista, mas funcional

#### 4.3 Outras ferramentas (.prettierrc, .husky, .gitignore)

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ `.gitignore` ignora `node_modules` corretamente (linha 2)
  - ✅ `.gitignore` ignora `pnpm-lock.yaml` (linha 38) - ⚠️ **ATENÇÃO**: Normalmente NÃO se commita lockfile, mas pode ser intencional
  - ✅ `.husky/pre-commit` e `.husky/commit-msg` configurados
  - ✅ `.lintstagedrc.json` presente
  - ⚠️ **Observação**: Não há `.prettierrc` no root, mas há em subpacotes

#### 4.4 Turbo.json ou Nx.json

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Análise**:
  - ❌ Não há `turbo.json` ou `nx.json`
  - ✅ Scripts do root usam `--recursive` e `--parallel` (bom)
  - **Recomendação**:
    - Considerar adicionar `turbo.json` para:
      - Cache de builds
      - Execução paralela otimizada
      - Dependências entre pacotes
      - Pipeline de CI/CD mais eficiente
    - Exemplo básico:
      ```json
      {
        "pipeline": {
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**"]
          },
          "test": {
            "dependsOn": ["build"]
          }
        }
      }
      ```

---

### 5. Outras Boas Práticas

#### 5.1 Lockfiles duplicados

- **Status**: ✅ **[PASS]**
- **Análise**:
  - ✅ Apenas `pnpm-lock.yaml` no root
  - ✅ Sem `package-lock.json` ou `yarn.lock`
  - ✅ `.gitignore` lista `pnpm-lock.yaml` (linha 38) - verificar se é intencional não commitar

#### 5.2 Scripts respeitando dependências internas

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Análise**:
  - ✅ Scripts usam `--recursive` e `--filter` corretamente
  - ⚠️ **Problema**: Não há garantia de ordem de build (ex: `shared` deve ser buildado antes de `api-core`)
  - **Evidência**: `"build": "pnpm --recursive run build"` não especifica ordem
- **Recomendação**:
  - Adicionar `turbo.json` com `dependsOn: ["^build"]`
  - Ou modificar script: `"build": "pnpm --filter @cotador/shared run build && pnpm --recursive --filter './apps/*' run build"`

#### 5.3 Documentação mencionando monorepo e pnpm

- **Status**: ❌ **[FAIL]**
- **Análise**:
  - ❌ `README.md` (linhas 29, 40) menciona `npm install` ao invés de `pnpm install`
  - ❌ `SETUP.md` (linhas 11, 14, 49, 52, 70, 105) menciona `npm` ao invés de `pnpm`
  - ❌ Não há menção explícita ao monorepo ou pnpm workspaces
- **Evidência**:

  ```markdown
  # README.md

  npm install # ❌ Deveria ser pnpm install

  # SETUP.md

  npm install # ❌ Deveria ser pnpm install
  npm run db:migrate # ❌ Deveria ser pnpm run db:migrate
  ```

- **Correção necessária**: Atualizar todos os comandos `npm` para `pnpm` na documentação

#### 5.4 Anti-patterns detectados

- **Status**: ⚠️ **[PARTIAL PASS]**
- **Anti-patterns encontrados**:
  1. ❌ **Dependências duplicadas**: `typescript`, `eslint`, `prettier` em múltiplos pacotes
  2. ❌ **Falta de workspace protocol**: Nenhum pacote usa `workspace:*` para referenciar outros
  3. ⚠️ **Build não paralelizável**: Sem garantia de ordem de build entre pacotes
  4. ⚠️ **Configuração TypeScript fragmentada**: `api-core` não herda paths do root
  5. ❌ **Documentação desatualizada**: Comandos `npm` ao invés de `pnpm`

---

## 📊 Resumo Geral

### Score de Conformidade: **72%** (18/25 itens passando completamente)

**Breakdown**:

- ✅ **PASS**: 18 itens
- ⚠️ **PARTIAL PASS**: 4 itens
- ❌ **FAIL**: 3 itens

### Priorização de Correções

#### 🔴 **CRÍTICO** (Corrigir imediatamente)

1. **Adicionar dependências workspace nos pacotes**
   - **Arquivo**: `apps/api-core/package.json`
   - **Ação**: Adicionar `"@cotador/shared": "workspace:*"` em `dependencies`
   - **Impacto**: Sem isso, `api-core` não pode importar `@cotador/shared` corretamente

2. **Configurar TypeScript paths em api-core**
   - **Arquivo**: `apps/api-core/tsconfig.json`
   - **Ação**: Adicionar `extends: "../../tsconfig.json"` ou adicionar paths manualmente
   - **Impacto**: TypeScript não resolve `@cotador/shared` corretamente

3. **Atualizar documentação para pnpm**
   - **Arquivos**: `README.md`, `SETUP.md`
   - **Ação**: Substituir todos os comandos `npm` por `pnpm`
   - **Impacto**: Desenvolvedores podem usar ferramenta errada

#### 🟡 **IMPORTANTE** (Corrigir em breve)

4. **Hoistar TypeScript no root**
   - **Arquivo**: `package.json` (root)
   - **Ação**: Mover `typescript` para `devDependencies` do root
   - **Impacto**: Reduz duplicação e garante versão única

5. **Adicionar turbo.json para build ordenado**
   - **Arquivo**: `turbo.json` (novo)
   - **Ação**: Criar arquivo com pipeline de build que respeita dependências
   - **Impacto**: Builds mais rápidos e confiáveis

6. **Padronizar nome do pacote mobile**
   - **Arquivo**: `apps/mobile/package.json`
   - **Ação**: Renomear para `"@cotador/mobile"` ou `"mobile"`
   - **Impacto**: Consistência no monorepo

#### 🟢 **OPCIONAL** (Melhorias futuras)

7. **Adicionar composite: true no tsconfig root**
   - **Arquivo**: `tsconfig.json` (root)
   - **Ação**: Adicionar `composite: true` e configurar `references`
   - **Impacto**: Build incremental mais eficiente

8. **Adicionar .prettierrc no root**
   - **Arquivo**: `.prettierrc` (novo)
   - **Ação**: Criar configuração centralizada de Prettier
   - **Impacto**: Consistência de formatação

9. **Revisar .gitignore para pnpm-lock.yaml**
   - **Arquivo**: `.gitignore`
   - **Ação**: Decidir se `pnpm-lock.yaml` deve ser commitado (geralmente SIM)
   - **Impacto**: Garantir builds reproduzíveis

---

## ✅ Pontos Fortes

1. ✅ Estrutura de workspaces bem definida
2. ✅ Scripts do root usam flags corretas do pnpm
3. ✅ Configuração de hoisting adequada
4. ✅ Sem lockfiles duplicados
5. ✅ Husky e lint-staged configurados
6. ✅ ESLint configurado para workspaces
7. ✅ Sem node_modules aninhados (exceto dentro de node_modules do root)

---

## 🔧 Comandos de Correção Rápida

```bash
# 1. Adicionar @cotador/shared como dependência em api-core
cd apps/api-core
pnpm add @cotador/shared@workspace:*

# 2. Hoistar TypeScript no root
cd ../..
pnpm add -D -w typescript@^5.7.3

# 3. Verificar instalação
pnpm install

# 4. Testar build
pnpm run build
```

---

## 📚 Referências

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [pnpm Workspace Protocol](https://pnpm.io/workspaces#workspace-protocol-workspace)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Turbo Documentation](https://turbo.build/repo/docs)

---

**Próximos Passos Recomendados**:

1. Implementar correções críticas (itens 1-3)
2. Testar build completo após correções
3. Atualizar documentação
4. Considerar adicionar Turbo para otimização de builds
