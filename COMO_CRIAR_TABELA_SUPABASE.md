# 🚀 Como Criar a Tabela no Supabase - Passo a Passo

## 📋 Instruções Simples

### **Passo 1: Acesse o Painel do Supabase**
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **BioBox**

### **Passo 2: Abra o SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"** (Nova Consulta)

### **Passo 3: Cole e Execute o Script**
Copie e cole o código abaixo no editor SQL:

```sql
-- ✅ SCRIPT COMPLETO PARA CRIAR TABELA CUSTOMERS
-- Copie e cole este código inteiro no SQL Editor do Supabase

-- 1. Criar tabela customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    cpf VARCHAR(20),
    cnpj VARCHAR(30),
    type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'business')),
    address JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas permissivas (para desenvolvimento)
CREATE POLICY "Permitir tudo para customers" ON customers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Inserir dados de exemplo
INSERT INTO customers (name, email, phone, cpf, cnpj, type, address, status, total_orders, total_spent) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-1234', '123.456.789-00', '', 'individual', 
 '{"street": "Rua das Flores", "number": "123", "city": "São Paulo", "state": "SP"}', 
 'active', 3, 12500.00),
('Móveis Premium Ltda', 'contato@moveispremium.com.br', '(11) 3456-7890', '', '12.345.678/0001-90', 'business',
 '{"street": "Av. Paulista", "number": "1000", "city": "São Paulo", "state": "SP"}',
 'active', 8, 45200.00),
('Maria Santos', 'maria.santos@gmail.com', '(11) 98765-4321', '987.654.321-00', '', 'individual',
 '{"street": "Rua das Palmeiras", "number": "456", "city": "São Paulo", "state": "SP"}',
 'active', 1, 3800.00),
('Pedro Costa', 'pedro.costa@outlook.com', '(11) 97777-8888', '456.789.123-00', '', 'individual',
 '{"street": "Rua dos Pinheiros", "number": "789", "city": "São Paulo", "state": "SP"}',
 'inactive', 2, 7600.00),
('Casa & Decoração S.A.', 'vendas@casadecoração.com.br', '(11) 2222-3333', '', '98.765.432/0001-10', 'business',
 '{"street": "Rua Augusta", "number": "2000", "city": "São Paulo", "state": "SP"}',
 'active', 12, 78900.00)
ON CONFLICT (email) DO NOTHING;

-- 6. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Criar trigger para updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificar se tudo foi criado corretamente
SELECT 'Tabela customers criada com sucesso!' as status;
SELECT COUNT(*) as total_clientes FROM customers;
```

### **Passo 4: Executar o Script**
1. Clique no botão **"Run"** (Executar) ou pressione **Ctrl+Enter**
2. Aguarde a execução (deve levar alguns segundos)
3. Você deve ver mensagens de sucesso no painel inferior

### **Passo 5: Verificar se Funcionou**
Você deve ver:
- ✅ "Tabela customers criada com sucesso!"
- ✅ "total_clientes: 5" (dados de exemplo inseridos)

## 🎯 Após Executar o Script

### **Teste a Aplicação:**
1. Volte para sua aplicação BioBox
2. Recarregue a página (F5)
3. Tente cadastrar um novo cliente
4. Recarregue novamente para ver se o cliente persiste

### **Resultado Esperado:**
- ✅ Clientes salvos permanentemente
- ✅ Dados persistem após reload
- ✅ Contadores atualizados corretamente

## 🆘 Se Algo Der Errado

### **Erro de Permissão:**
Se aparecer erro de permissão, execute apenas:
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para customers" ON customers FOR ALL USING (true) WITH CHECK (true);
```

### **Tabela Já Existe:**
Se a tabela já existir, execute apenas a parte dos dados:
```sql
INSERT INTO customers (name, email, phone, cpf, type, status, total_orders, total_spent) VALUES
('Teste Supabase', 'teste@biobox.com', '(11) 91234-5678', '999.888.777-66', 'individual', 'active', 0, 0.00)
ON CONFLICT (email) DO NOTHING;
```

## 📞 Precisa de Ajuda?

Se tiver qualquer problema:
1. Copie a mensagem de erro
2. Me envie a mensagem
3. Vou te ajudar a resolver!

**🎉 Após executar este script, sua aplicação BioBox estará 100% funcional com persistência no banco de dados!**
