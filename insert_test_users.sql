-- Script para inserir usuários de teste no Supabase
-- Execute este script após corrigir as políticas RLS

-- Inserir usuários de teste (se não existirem)
INSERT INTO users (id, email, name, role, permissions, status, created_at, updated_at, created_by)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@bioboxsys.com',
    'Administrator',
    'admin',
    '["all"]'::jsonb,
    'active',
    NOW(),
    NOW(),
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'carlos@bioboxsys.com',
    'Carlos Vendedor',
    'seller',
    '["orders:create", "orders:read", "customers:create", "customers:read"]'::jsonb,
    'active',
    NOW(),
    NOW(),
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'ana@bioboxsys.com',
    'Ana Vendedora',
    'seller',
    '["orders:create", "orders:read", "customers:create", "customers:read"]'::jsonb,
    'active',
    NOW(),
    NOW(),
    '550e8400-e29b-41d4-a716-446655440000'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Verificar se os usuários foram inseridos
SELECT id, email, name, role, status FROM users ORDER BY created_at;
