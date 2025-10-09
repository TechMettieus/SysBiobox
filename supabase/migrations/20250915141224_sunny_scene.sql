/*
  # BioBox Production Management System Database Schema

  1. New Tables
    - `users` - System users (admins, sellers, operators)
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (enum: admin, seller, operator)
      - `permissions` (jsonb array)
      - `status` (enum: active, inactive)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp)
      - `created_by` (uuid, foreign key)

    - `customers` - Customer information
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `cpf` (text, optional for individuals)
      - `cnpj` (text, optional for companies)
      - `type` (enum: individual, company)
      - `address` (jsonb object)
      - `status` (enum: active, inactive)
      - `total_orders` (integer, default 0)
      - `total_spent` (decimal, default 0)
      - `last_order_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `products` - Product catalog
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `category` (enum: bed, mattress, accessory)
      - `description` (text)
      - `base_price` (decimal)
      - `cost_price` (decimal)
      - `margin` (decimal)
      - `status` (enum: active, inactive, discontinued)
      - `models` (jsonb array)
      - `specifications` (jsonb object)
      - `images` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `orders` - Customer orders
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `customer_id` (uuid, foreign key)
      - `seller_id` (uuid, foreign key)
      - `status` (enum: pending, confirmed, in_production, quality_check, ready, delivered, cancelled)
      - `priority` (enum: low, medium, high, urgent)
      - `total_amount` (decimal)
      - `scheduled_date` (date)
      - `delivery_date` (date)
      - `completed_date` (timestamp)
      - `production_progress` (integer, default 0)
      - `assigned_operator` (text)
      - `is_fragmented` (boolean, default false)
      - `total_quantity` (integer)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_products` - Products within orders
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `product_name` (text)
      - `model` (text)
      - `size` (text)
      - `color` (text)
      - `fabric` (text)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
      - `specifications` (jsonb object)
      - `created_at` (timestamp)

    - `order_fragments` - Production fragments for large orders
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `fragment_number` (integer)
      - `quantity` (integer)
      - `scheduled_date` (date)
      - `status` (enum: pending, in_production, completed)
      - `progress` (integer, default 0)
      - `value` (decimal)
      - `assigned_operator` (text)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)

    - `production_tasks` - Individual production tasks
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `fragment_id` (uuid, foreign key, optional)
      - `task_name` (text)
      - `stage` (text)
      - `stage_order` (integer)
      - `status` (enum: pending, in_progress, completed, paused, blocked)
      - `priority` (enum: low, medium, high, urgent)
      - `assigned_operator` (text)
      - `estimated_time` (integer, minutes)
      - `actual_time` (integer, minutes)
      - `progress` (integer, default 0)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `raw_materials` - Raw material inventory
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (enum: wood, foam, fabric, hardware, other)
      - `unit` (enum: meters, pieces, liters, kg)
      - `quantity` (decimal)
      - `minimum_stock` (decimal)
      - `unit_cost` (decimal)
      - `supplier` (text)
      - `location` (text)
      - `expiration_date` (date)
      - `last_updated` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Admin users have full access
    - Sellers can manage their own orders and customers
    - Operators can view and update production tasks

  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for order searches and production tracking
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'operator');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE customer_type AS ENUM ('individual', 'company');
CREATE TYPE customer_status AS ENUM ('active', 'inactive');
CREATE TYPE product_category AS ENUM ('bed', 'mattress', 'accessory');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'discontinued');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_production', 'quality_check', 'ready', 'delivered', 'cancelled');
CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE fragment_status AS ENUM ('pending', 'in_production', 'completed');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'paused', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE material_category AS ENUM ('wood', 'foam', 'fabric', 'hardware', 'other');
CREATE TYPE material_unit AS ENUM ('meters', 'pieces', 'liters', 'kg');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  permissions jsonb DEFAULT '[]'::jsonb,
  status user_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  created_by uuid REFERENCES users(id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  cpf text,
  cnpj text,
  type customer_type NOT NULL DEFAULT 'individual',
  address jsonb DEFAULT '{}'::jsonb,
  status customer_status NOT NULL DEFAULT 'active',
  total_orders integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category product_category NOT NULL DEFAULT 'bed',
  description text,
  base_price decimal(10,2) NOT NULL,
  cost_price decimal(10,2) NOT NULL,
  margin decimal(5,2) DEFAULT 0,
  status product_status NOT NULL DEFAULT 'active',
  models jsonb DEFAULT '[]'::jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  images text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id),
  seller_id uuid NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'pending',
  priority order_priority NOT NULL DEFAULT 'medium',
  total_amount decimal(10,2) NOT NULL,
  scheduled_date date NOT NULL,
  delivery_date date,
  completed_date timestamptz,
  production_progress integer DEFAULT 0 CHECK (production_progress >= 0 AND production_progress <= 100),
  assigned_operator text,
  is_fragmented boolean DEFAULT false,
  total_quantity integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order products table
CREATE TABLE IF NOT EXISTS order_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  model text NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  fabric text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Order fragments table
CREATE TABLE IF NOT EXISTS order_fragments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fragment_number integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  scheduled_date date NOT NULL,
  status fragment_status NOT NULL DEFAULT 'pending',
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  value decimal(10,2) NOT NULL,
  assigned_operator text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, fragment_number)
);

-- Production tasks table
CREATE TABLE IF NOT EXISTS production_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fragment_id uuid REFERENCES order_fragments(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  stage text NOT NULL,
  stage_order integer NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  assigned_operator text,
  estimated_time integer, -- in minutes
  actual_time integer, -- in minutes
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Raw materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category material_category NOT NULL,
  unit material_unit NOT NULL,
  quantity decimal(10,3) NOT NULL DEFAULT 0,
  minimum_stock decimal(10,3) NOT NULL DEFAULT 0,
  unit_cost decimal(10,2) NOT NULL DEFAULT 0,
  supplier text NOT NULL,
  location text,
  expiration_date date,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for customers table
CREATE POLICY "Users can read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for products table
CREATE POLICY "Users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for orders table
CREATE POLICY "Users can read orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
    seller_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Users can update their orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin') OR
    seller_id::text = auth.uid()::text
  );

CREATE POLICY "Admins can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for order_products table
CREATE POLICY "Users can read order products"
  ON order_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON u.id::text = auth.uid()::text 
      WHERE o.id = order_id AND (u.role = 'admin' OR o.seller_id = u.id)
    )
  );

CREATE POLICY "Users can manage order products"
  ON order_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON u.id::text = auth.uid()::text 
      WHERE o.id = order_id AND (u.role = 'admin' OR o.seller_id = u.id)
    )
  );

-- RLS Policies for order_fragments table
CREATE POLICY "Users can read order fragments"
  ON order_fragments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON u.id::text = auth.uid()::text 
      WHERE o.id = order_id AND (u.role = 'admin' OR o.seller_id = u.id)
    )
  );

CREATE POLICY "Users can manage order fragments"
  ON order_fragments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON u.id::text = auth.uid()::text 
      WHERE o.id = order_id AND (u.role = 'admin' OR o.seller_id = u.id)
    )
  );

-- RLS Policies for production_tasks table
CREATE POLICY "Users can read production tasks"
  ON production_tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators and admins can update tasks"
  ON production_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'operator'))
  );

CREATE POLICY "Admins can manage production tasks"
  ON production_tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- RLS Policies for raw_materials table
CREATE POLICY "Users can read raw materials"
  ON raw_materials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage raw materials"
  ON raw_materials
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_products_order ON order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_order_products_product ON order_products(product_id);
CREATE INDEX IF NOT EXISTS idx_order_fragments_order ON order_fragments(order_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_order ON production_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_status ON production_tasks(status);
CREATE INDEX IF NOT EXISTS idx_production_tasks_operator ON production_tasks(assigned_operator);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_tasks_updated_at BEFORE UPDATE ON production_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = NEW.customer_id AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
        WHERE customer_id = NEW.customer_id AND status != 'cancelled'
      ),
      last_order_date = (
        SELECT MAX(created_at) FROM orders 
        WHERE customer_id = NEW.customer_id
      ),
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE customers SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE customer_id = OLD.customer_id AND status != 'cancelled'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
        WHERE customer_id = OLD.customer_id AND status != 'cancelled'
      ),
      last_order_date = (
        SELECT MAX(created_at) FROM orders 
        WHERE customer_id = OLD.customer_id
      ),
      updated_at = now()
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to update customer statistics
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- Insert initial admin user
INSERT INTO users (id, email, name, role, permissions, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@bioboxsys.com',
  'Administrator',
  'admin',
  '["all"]'::jsonb,
  'active',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Insert demo users
INSERT INTO users (id, email, name, role, permissions, status, created_by, created_at, updated_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'carlos@bioboxsys.com',
    'Carlos Vendedor',
    'seller',
    '["orders:create", "orders:read", "orders:update", "customers:create", "customers:read", "customers:update"]'::jsonb,
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'ana@bioboxsys.com',
    'Ana Vendedora',
    'seller',
    '["orders:create", "orders:read", "orders:update", "customers:create", "customers:read", "customers:update"]'::jsonb,
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    now(),
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Insert demo customers
INSERT INTO customers (id, name, email, phone, cpf, cnpj, type, address, status, created_at, updated_at)
VALUES 
  (
    '650e8400-e29b-41d4-a716-446655440000',
    'João Silva',
    'joao.silva@email.com',
    '(11) 99999-9999',
    '123.456.789-00',
    NULL,
    'individual',
    '{"street": "Rua das Flores", "number": "123", "complement": "Apto 45", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zipCode": "01234-567"}'::jsonb,
    'active',
    now(),
    now()
  ),
  (
    '650e8400-e29b-41d4-a716-446655440001',
    'Móveis Premium Ltda',
    'contato@moveispremium.com.br',
    '(11) 88888-8888',
    NULL,
    '12.345.678/0001-90',
    'company',
    '{"street": "Av. Paulista", "number": "1000", "neighborhood": "Bela Vista", "city": "São Paulo", "state": "SP", "zipCode": "01310-100"}'::jsonb,
    'active',
    now(),
    now()
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    'Maria Santos',
    'maria.santos@gmail.com',
    '(11) 98765-4321',
    '987.654.321-00',
    NULL,
    'individual',
    '{"street": "Rua dos Jardins", "number": "456", "neighborhood": "Vila Madalena", "city": "São Paulo", "state": "SP", "zipCode": "05435-020"}'::jsonb,
    'active',
    now(),
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Insert demo products
INSERT INTO products (id, name, sku, category, description, base_price, cost_price, margin, status, models, specifications, created_at, updated_at)
VALUES 
  (
    '750e8400-e29b-41d4-a716-446655440000',
    'Cama Luxo Premium',
    'BED-LUX-001',
    'bed',
    'Cama de alta qualidade com acabamento premium e estrutura reforçada',
    3750.00,
    1800.00,
    52.00,
    'active',
    '[
      {
        "id": "model-1",
        "name": "Luxo Standard",
        "sizes": ["Solteiro", "Casal", "Queen", "King"],
        "colors": ["Branco", "Marrom", "Preto", "Cinza"],
        "fabrics": ["Courino", "Tecido Premium", "Veludo Premium"],
        "priceModifier": 1.0,
        "stockQuantity": 15,
        "minimumStock": 5,
        "isActive": true
      },
      {
        "id": "model-2",
        "name": "Luxo Premium",
        "sizes": ["Queen", "King"],
        "colors": ["Branco", "Marrom", "Preto", "Cinza", "Azul Marinho"],
        "fabrics": ["Courino Premium", "Veludo Premium", "Couro"],
        "priceModifier": 1.5,
        "stockQuantity": 8,
        "minimumStock": 3,
        "isActive": true
      }
    ]'::jsonb,
    '{
      "Estrutura": ["MDF", "Madeira Maciça"],
      "Cabeceira": ["Lisa", "Estofada", "Capitonê"],
      "Gavetas": ["Sem gavetas", "2 gavetas", "4 gavetas"],
      "Base": ["Simples", "Box", "Com Baú"]
    }'::jsonb,
    now(),
    now()
  ),
  (
    '750e8400-e29b-41d4-a716-446655440001',
    'Cama Standard',
    'BED-STD-001',
    'bed',
    'Cama com excelente custo-benefício para o dia a dia',
    2100.00,
    1050.00,
    50.00,
    'active',
    '[
      {
        "id": "model-1",
        "name": "Standard Classic",
        "sizes": ["Solteiro", "Casal", "Queen"],
        "colors": ["Branco", "Marrom", "Cinza"],
        "fabrics": ["Courino", "Tecido"],
        "priceModifier": 1.0,
        "stockQuantity": 25,
        "minimumStock": 8,
        "isActive": true
      }
    ]'::jsonb,
    '{
      "Estrutura": ["MDF"],
      "Cabeceira": ["Lisa", "Estofada"],
      "Gavetas": ["Sem gavetas", "2 gavetas"],
      "Base": ["Simples", "Box"]
    }'::jsonb,
    now(),
    now()
  )
ON CONFLICT (sku) DO NOTHING;

-- Insert demo raw materials
INSERT INTO raw_materials (id, name, category, unit, quantity, minimum_stock, unit_cost, supplier, location, created_at)
VALUES 
  (
    '850e8400-e29b-41d4-a716-446655440000',
    'MDF 18mm',
    'wood',
    'pieces',
    50.000,
    20.000,
    45.00,
    'Madeireira São João',
    'Estoque A - Prateleira 1',
    now()
  ),
  (
    '850e8400-e29b-41d4-a716-446655440001',
    'Espuma D33',
    'foam',
    'pieces',
    25.000,
    15.000,
    35.00,
    'Espumas Brasil',
    'Estoque B - Área 2',
    now()
  ),
  (
    '850e8400-e29b-41d4-a716-446655440002',
    'Courino Branco',
    'fabric',
    'meters',
    120.000,
    50.000,
    8.50,
    'Tecidos Premium',
    'Estoque C - Prateleira 3',
    now()
  ),
  (
    '850e8400-e29b-41d4-a716-446655440003',
    'Parafusos 6x40mm',
    'hardware',
    'pieces',
    500.000,
    200.000,
    0.15,
    'Ferragens Central',
    'Estoque D - Gaveta 1',
    now()
  )
ON CONFLICT DO NOTHING;

-- Insert demo orders
INSERT INTO orders (id, order_number, customer_id, seller_id, status, priority, total_amount, scheduled_date, delivery_date, production_progress, assigned_operator, notes, created_at, updated_at)
VALUES 
  (
    '950e8400-e29b-41d4-a716-446655440000',
    'ORD-2024-001',
    '650e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'in_production',
    'medium',
    4200.00,
    '2024-12-20',
    '2024-12-25',
    65,
    'Carlos M.',
    'Cliente solicitou entrega no período da manhã',
    '2024-12-10 10:00:00',
    '2024-12-15 14:30:00'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440001',
    'ORD-2024-002',
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'confirmed',
    'high',
    12600.00,
    '2024-12-18',
    '2024-12-30',
    0,
    NULL,
    'Pedido para revenda - prioridade alta',
    '2024-12-12 09:15:00',
    '2024-12-12 09:15:00'
  ),
  (
    '950e8400-e29b-41d4-a716-446655440002',
    'ORD-2024-003',
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'ready',
    'low',
    2100.00,
    '2024-12-15',
    '2024-12-22',
    100,
    'Ana L.',
    'Primeira compra da cliente',
    '2024-12-08 16:45:00',
    '2024-12-20 11:20:00'
  )
ON CONFLICT (order_number) DO NOTHING;

-- Insert demo order products
INSERT INTO order_products (id, order_id, product_id, product_name, model, size, color, fabric, quantity, unit_price, total_price, specifications, created_at)
VALUES 
  (
    'a50e8400-e29b-41d4-a716-446655440000',
    '950e8400-e29b-41d4-a716-446655440000',
    '750e8400-e29b-41d4-a716-446655440000',
    'Cama Luxo Premium',
    'Luxo Premium',
    'Queen',
    'Marrom',
    'Veludo Premium',
    1,
    4200.00,
    4200.00,
    '{"Estrutura": "Madeira Maciça", "Cabeceira": "Capitonê", "Gavetas": "2 gavetas", "Base": "Box"}'::jsonb,
    '2024-12-10 10:00:00'
  ),
  (
    'a50e8400-e29b-41d4-a716-446655440001',
    '950e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440000',
    'Cama Luxo Premium',
    'Luxo Standard',
    'King',
    'Branco',
    'Courino',
    3,
    2800.00,
    8400.00,
    '{"Estrutura": "MDF", "Cabeceira": "Estofada", "Gavetas": "Sem gavetas", "Base": "Simples"}'::jsonb,
    '2024-12-12 09:15:00'
  ),
  (
    'a50e8400-e29b-41d4-a716-446655440002',
    '950e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440001',
    'Cama Standard',
    'Standard Classic',
    'Queen',
    'Marrom',
    'Tecido',
    2,
    2100.00,
    4200.00,
    '{"Estrutura": "MDF", "Cabeceira": "Lisa", "Gavetas": "2 gavetas", "Base": "Box"}'::jsonb,
    '2024-12-12 09:15:00'
  ),
  (
    'a50e8400-e29b-41d4-a716-446655440003',
    '950e8400-e29b-41d4-a716-446655440002',
    '750e8400-e29b-41d4-a716-446655440001',
    'Cama Standard',
    'Standard Classic',
    'Casal',
    'Cinza',
    'Tecido',
    1,
    2100.00,
    2100.00,
    '{"Estrutura": "MDF", "Cabeceira": "Estofada", "Gavetas": "Sem gavetas", "Base": "Simples"}'::jsonb,
    '2024-12-08 16:45:00'
  )
ON CONFLICT DO NOTHING;

-- Insert demo production tasks
INSERT INTO production_tasks (id, order_id, task_name, stage, stage_order, status, priority, assigned_operator, estimated_time, progress, started_at, notes, created_at, updated_at)
VALUES 
  (
    'b50e8400-e29b-41d4-a716-446655440000',
    '950e8400-e29b-41d4-a716-446655440000',
    'Acabamento Final - Cama Queen Luxo',
    'finishing',
    5,
    'in_progress',
    'medium',
    'Carlos Mendes',
    90,
    85,
    now() - interval '2 hours',
    'Aplicando verniz final na cabeceira',
    now(),
    now()
  ),
  (
    'b50e8400-e29b-41d4-a716-446655440001',
    '950e8400-e29b-41d4-a716-446655440001',
    'Corte de Materiais - Pedido Premium',
    'cutting',
    2,
    'pending',
    'high',
    NULL,
    120,
    0,
    NULL,
    'Aguardando liberação para início',
    now(),
    now()
  ),
  (
    'b50e8400-e29b-41d4-a716-446655440002',
    '950e8400-e29b-41d4-a716-446655440002',
    'Controle de Qualidade - Cama Standard',
    'quality_control',
    6,
    'completed',
    'low',
    'José Roberto',
    30,
    100,
    now() - interval '1 hour',
    'Aprovada no controle de qualidade',
    now(),
    now()
  )
ON CONFLICT DO NOTHING;