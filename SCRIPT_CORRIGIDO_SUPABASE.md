# 🔧 Script Corrigido para Supabase

## 🚨 **PROBLEMA IDENTIFICADO**
Já existe uma tabela `customers` no seu banco com estrutura diferente. Vou corrigir isso!

## 📋 **SCRIPT CORRIGIDO - Cole no SQL Editor:**

```sql
-- ✅ SCRIPT CORRIGIDO PARA TRABALHAR COM ESTRUTURA EXISTENTE

-- 1. Primeiro, vamos ver qual é a estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Vamos ver quais valores são aceitos no enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'customer_type'
);

-- 3. Habilitar RLS se não estiver habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir tudo para customers" ON customers;
DROP POLICY IF EXISTS "Usuários podem ler clientes" ON customers;
DROP POLICY IF EXISTS "Usuários podem inserir clientes" ON customers;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes" ON customers;
DROP POLICY IF EXISTS "Usuários podem excluir clientes" ON customers;

-- 5. Criar política permissiva para desenvolvimento
CREATE POLICY "Acesso completo customers" ON customers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Verificar dados existentes
SELECT COUNT(*) as total_clientes_existentes FROM customers;

-- 7. Inserir um cliente de teste (usando valores que funcionam)
INSERT INTO customers (name, email, phone) VALUES
('Cliente Teste Supabase', 'teste.supabase@biobox.com', '(11) 91234-5678')
ON CONFLICT (email) DO NOTHING;

-- 8. Verificar se o insert funcionou
SELECT COUNT(*) as total_clientes_apos_insert FROM customers;
SELECT * FROM customers WHERE email = 'teste.supabase@biobox.com';
```

## 🎯 **Execute Este Script Primeiro**

Este script vai:
1. ✅ **Mostrar a estrutura** da tabela existente
2. ✅ **Mostrar os valores** aceitos no enum
3. ✅ **Configurar permissões** adequadas
4. ✅ **Testar inserção** de um cliente

## 📊 **Após Executar, Me Envie:**

1. **Os resultados** que aparecerem no painel
2. **Especialmente** a parte que mostra:
   - Estrutura da tabela (colunas e tipos)
   - Valores aceitos no enum
   - Se o insert do cliente teste funcionou

## 🔄 **Próximo Passo:**

Com essas informações, vou criar um script final que:
- ✅ **Usa a estrutura correta** da sua tabela
- ✅ **Insere dados** com os valores aceitos
- ✅ **Garante** que a aplicação funcione 100%

**Execute o script acima e me mande os resultados!** 🚀
