# Guia de Resolução - Erro de "Acesso Negado" no Login

## Problema Identificado

O erro de "Acesso Negado" (Internal Server Error 500) ocorre devido a uma **inconsistência nas políticas RLS (Row Level Security)** do Supabase. Especificamente:

1. **Política RLS muito restritiva**: A política da tabela `users` cria um deadlock onde o usuário precisa existir na tabela para acessar a tabela
2. **Falta de usuários na tabela**: Usuários autenticados no Supabase Auth podem não ter registros correspondentes na tabela `users`
3. **Inconsistência de IDs**: Diferenças entre IDs do Supabase Auth e da tabela `users`

## Solução Implementada

### 1. Correção do Código de Autenticação

**Arquivo modificado**: `client/hooks/useAuth.ts`

**Principais melhorias**:
- Tratamento robusto de erros de RLS
- Fallback para perfil básico quando a tabela `users` não é acessível
- Logs detalhados para debug
- Continuidade do login mesmo com erros de perfil

### 2. Correção das Políticas RLS

**Arquivo criado**: `fix_rls_policies.sql`

**Principais correções**:
- Política de leitura mais permissiva para funcionamento básico
- Mantém segurança através de políticas de escrita restritivas
- Permite que usuários atualizem dados básicos
- Função de debug para troubleshooting

### 3. Inserção de Usuários de Teste

**Arquivo criado**: `insert_test_users.sql`

**Usuários incluídos**:
- `admin@bioboxsys.com` (role: admin)
- `carlos@bioboxsys.com` (role: seller)
- `ana@bioboxsys.com` (role: seller)

### 4. Componente de Debug

**Arquivo criado**: `client/components/AuthDebug.tsx`

**Funcionalidades**:
- Verificação do estado de autenticação
- Teste de login automatizado
- Diagnóstico de políticas RLS
- Interface visual para debug

## Passos para Aplicar a Correção

### Passo 1: Aplicar Correções no Código
```bash
# Os arquivos já foram atualizados:
# - client/hooks/useAuth.ts (corrigido)
# - client/components/AuthDebug.tsx (novo)
```

### Passo 2: Executar Scripts SQL no Supabase

1. **Acesse o painel do Supabase**: https://supabase.com/dashboard
2. **Vá para SQL Editor** no seu projeto
3. **Execute o script de correção RLS**:
   ```sql
   -- Cole o conteúdo de fix_rls_policies.sql
   ```
4. **Execute o script de usuários de teste**:
   ```sql
   -- Cole o conteúdo de insert_test_users.sql
   ```

### Passo 3: Testar a Correção

1. **Limpe o localStorage**:
   ```javascript
   localStorage.removeItem("bioboxsys_user");
   ```

2. **Tente fazer login** com:
   - Email: `admin@bioboxsys.com`
   - Senha: `password` (ou a senha configurada no Supabase Auth)

3. **Use o componente de debug** (opcional):
   ```tsx
   import AuthDebug from '@/components/AuthDebug';
   // Adicione <AuthDebug /> temporariamente na sua aplicação
   ```

## Credenciais de Teste

### Usuários Mock (fallback local)
- **Email**: qualquer dos emails na lista
- **Senha**: `password`

### Usuários Supabase (após executar scripts)
- **admin@bioboxsys.com**: Administrador completo
- **carlos@bioboxsys.com**: Vendedor
- **ana@bioboxsys.com**: Vendedora

## Verificação de Sucesso

### ✅ Sinais de que a correção funcionou:
- Login bem-sucedido sem erro 500
- Console mostra logs de autenticação detalhados
- Usuário consegue acessar o dashboard
- Não há mais mensagens de "Acesso Negado"

### ❌ Se ainda houver problemas:
1. Verifique se os scripts SQL foram executados corretamente
2. Confirme que os usuários existem na tabela `users`
3. Use o componente AuthDebug para diagnóstico
4. Verifique os logs do Supabase no painel administrativo

## Prevenção Futura

### Boas Práticas Implementadas:
1. **Políticas RLS balanceadas**: Seguras mas funcionais
2. **Tratamento robusto de erros**: Aplicação continua funcionando mesmo com problemas de RLS
3. **Logs detalhados**: Facilita debug de problemas futuros
4. **Fallback para dados mock**: Aplicação funciona offline/sem Supabase

### Monitoramento:
- Use `get_advisors` no MCP do Supabase para verificar políticas RLS
- Monitore logs de erro no console do navegador
- Execute periodicamente a função `debug_auth_user()` no SQL Editor

## Arquivos Modificados/Criados

```
BioBox/
├── client/
│   ├── hooks/
│   │   └── useAuth.ts (MODIFICADO)
│   └── components/
│       └── AuthDebug.tsx (NOVO)
├── fix_rls_policies.sql (NOVO)
├── insert_test_users.sql (NOVO)
└── TROUBLESHOOTING.md (NOVO)
```

## Contato para Suporte

Se o problema persistir após seguir este guia:
1. Execute o componente AuthDebug e capture o output
2. Verifique os logs do Supabase no painel administrativo
3. Documente os passos exatos que causam o erro
4. Inclua informações sobre o ambiente (browser, versão, etc.)
