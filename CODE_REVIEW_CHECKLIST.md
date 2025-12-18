# Code Review Checklist

## Cotador Enterprise

Use este checklist ao revisar Pull Requests. Marque cada item antes de aprovar.

---

## 🔒 Segurança

- [ ] Não há credenciais hardcoded (senhas, tokens, API keys)
- [ ] Validação de entrada adequada (SQL injection, XSS prevenidos)
- [ ] Autorização verificada (usuário pode acessar recurso?)
- [ ] Dados sensíveis não são logados (senhas, tokens, PII)
- [ ] Variáveis de ambiente usadas para secrets
- [ ] Headers de segurança configurados (CORS, CSP se aplicável)

---

## ⚡ Performance

- [ ] Queries de banco otimizadas (índices, N+1 queries evitadas)
- [ ] Operações assíncronas usadas corretamente (async/await)
- [ ] Cache utilizado quando apropriado
- [ ] Não há loops aninhados desnecessários
- [ ] Paginação implementada para listagens grandes
- [ ] Timeouts configurados para chamadas externas

---

## 🧪 Testes

- [ ] Novas funcionalidades têm testes unitários
- [ ] Casos de erro são testados
- [ ] Cobertura de testes mantida (>80%)
- [ ] Testes de integração para endpoints críticos
- [ ] Mocks usados corretamente (não mockar entidades de domínio)
- [ ] Testes são determinísticos (não dependem de ordem ou timing)

---

## 📖 Legibilidade

- [ ] Código segue padrões de nomenclatura (kebab-case, PascalCase, camelCase)
- [ ] Funções pequenas e com responsabilidade única
- [ ] Comentários explicam "por quê", não "o quê"
- [ ] Magic numbers substituídos por constantes
- [ ] Código não duplicado (DRY)
- [ ] Nomes de variáveis/funções são descritivos

---

## 🏗️ Arquitetura

- [ ] Regra de dependência respeitada (Domain não importa Infra ou Application)
- [ ] Use Cases não têm lógica de infraestrutura
- [ ] DTOs validados com class-validator
- [ ] Injeção de dependência usada corretamente (não `new Service()`)
- [ ] Interfaces usadas para contratos (IBudgetRepository)
- [ ] Separação de responsabilidades clara

---

## 📝 TypeScript

- [ ] Nenhum `any` usado
- [ ] Tipos explícitos quando necessário
- [ ] Interfaces vs Types usados corretamente
- [ ] Strict mode habilitado
- [ ] Type guards usados para `unknown`

---

## 🚨 Tratamento de Erros

- [ ] Exceções customizadas de domínio usadas
- [ ] Erros são logados com contexto adequado
- [ ] Stack traces não são expostos em produção
- [ ] Mensagens de erro são amigáveis ao usuário
- [ ] Exception filter global configurado

---

## 📋 Logging

- [ ] Logger usado (não `console.log`)
- [ ] Logs estruturados com contexto
- [ ] Níveis de log apropriados (log, warn, error)
- [ ] Dados sensíveis não são logados

---

## 🔄 Git & Commits

- [ ] Commits seguem Conventional Commits
- [ ] Mensagens de commit são descritivas
- [ ] Branch name segue padrão (feature/_, bugfix/_)
- [ ] PR tem descrição clara do que foi feito e por quê

---

## ✅ Aprovação

- [ ] Todos os itens acima foram verificados
- [ ] CI/CD passando
- [ ] Código está pronto para merge

**Revisor**: **\*\*\*\***\_**\*\*\*\***  
**Data**: **\*\*\*\***\_**\*\*\*\***  
**Status**: [ ] Aprovado [ ] Requer alterações

---

**Notas adicionais:**
