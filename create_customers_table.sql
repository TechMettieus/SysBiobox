-- Criar tabela customers no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela customers
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de clientes
CREATE POLICY "Usuários podem ler clientes" ON customers
    FOR SELECT
    USING (true);

-- Política para permitir inserção de clientes
CREATE POLICY "Usuários podem inserir clientes" ON customers
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir atualização de clientes
CREATE POLICY "Usuários podem atualizar clientes" ON customers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para permitir exclusão de clientes
CREATE POLICY "Usuários podem excluir clientes" ON customers
    FOR DELETE
    USING (true);

-- Inserir alguns dados de exemplo
INSERT INTO customers (name, email, phone, cpf, type, address, status, total_orders, total_spent) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-1234', '123.456.789-00', 'individual', 
 '{"street": "Rua das Flores", "number": "123", "city": "São Paulo", "state": "SP"}', 
 'active', 3, 12500.00),
('Móveis Premium Ltda', 'contato@moveispremium.com.br', '(11) 3456-7890', '', 'business',
 '{"street": "Av. Paulista", "number": "1000", "city": "São Paulo", "state": "SP"}',
 'active', 8, 45200.00),
('Maria Santos', 'maria.santos@gmail.com', '(11) 98765-4321', '987.654.321-00', 'individual',
 '{"street": "Rua das Palmeiras", "number": "456", "city": "São Paulo", "state": "SP"}',
 'active', 1, 3800.00),
('Pedro Costa', 'pedro.costa@outlook.com', '(11) 97777-8888', '456.789.123-00', 'individual',
 '{"street": "Rua dos Pinheiros", "number": "789", "city": "São Paulo", "state": "SP"}',
 'inactive', 2, 7600.00),
('Casa & Decoração S.A.', 'vendas@casadecoração.com.br', '(11) 2222-3333', '', 'business',
 '{"street": "Rua Augusta", "number": "2000", "city": "São Paulo", "state": "SP"}',
 'active', 12, 78900.00)
ON CONFLICT (email) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;
