# Mudanças Implementadas no Sistema BioBox

## Data: 17/10/2025

### Resumo das Implementações

Este documento descreve todas as mudanças implementadas no sistema BioBox para atender ao novo fluxo de trabalho de produção.

---

## 1. Nova Página "Agenda" (Admin)

### Arquivo: `client/pages/Agenda.tsx`

**Funcionalidades:**
- Calendário interativo mensal com navegação
- Visualização de pedidos pendentes de aprovação
- Sistema de **drag-and-drop** para agendar pedidos em datas específicas
- Filtros por:
  - Status do pedido
  - Cliente
  - Termo de busca
- Botão para impressão do panorama de produção
- Aprovação de pedidos diretamente da interface

**Fluxo:**
1. Admin visualiza pedidos com status "awaiting_approval"
2. Admin pode aprovar pedidos (muda status para "awaiting_approval")
3. Admin arrasta pedidos para datas no calendário
4. Ao soltar, o pedido é agendado e status muda para "confirmed"

**Permissões:**
- Requer permissão: `orders.approve`
- Apenas administradores têm acesso

---

## 2. Sistema de Status de Pedidos Atualizado

### Arquivos Modificados:
- `client/hooks/useFirebase.ts`
- `client/pages/Orders.tsx`
- `client/components/NewOrderForm.tsx`

**Novo Status Adicionado:**
- `awaiting_approval` - Aguardando Aprovação

**Fluxo de Status:**
```
pending → awaiting_approval → confirmed → in_production → quality_check → ready → delivered
                    ↓
                cancelled
```

**Regras:**
- **Vendedores**: Pedidos criados com status `awaiting_approval`
- **Administradores**: Pedidos criados com status `pending` (opcional)
- Apenas admin pode mudar de `awaiting_approval` para `confirmed`

---

## 3. Restrições de Permissões para Vendedores

### Arquivo: `client/components/NewOrderForm.tsx`

**Mudanças:**
- Campo "Data de Produção" **removido** para vendedores
- Campo visível apenas para usuários com permissão `orders.approve`
- Data de produção agora é **opcional** - será definida na Agenda
- Validação de data de produção removida

**Antes:**
```tsx
<Label htmlFor="scheduledDate">Data de Produção *</Label>
<Input id="scheduledDate" type="date" required />
```

**Depois:**
```tsx
{checkPermission("orders", "approve") && (
  <div>
    <Label htmlFor="scheduledDate">Data de Produção</Label>
    <Input id="scheduledDate" type="date" />
    <p className="text-xs text-muted-foreground mt-1">
      Deixe em branco para agendar depois na Agenda
    </p>
  </div>
)}
```

---

## 4. Etapas de Produção Fixas

### Arquivo: `client/types/production.ts`

**6 Etapas Implementadas:**

| Ordem | ID | Nome | Tempo Estimado |
|-------|-----|------|----------------|
| 1 | `cutting_sewing` | Corte e Costura | 120 min |
| 2 | `carpentry` | Marcenaria | 180 min |
| 3 | `upholstery` | Tapeçaria | 240 min |
| 4 | `assembly` | Montagem | 90 min |
| 5 | `packaging` | Embalagem | 30 min |
| 6 | `delivery` | Entrega | 60 min |

**Estrutura de Dados:**
```typescript
interface ProductionStage {
  stage: string;
  status: "pending" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  assigned_operator?: string;
  notes?: string;
}
```

**Adicionado ao Order:**
```typescript
production_stages?: ProductionStage[];
```

---

## 5. Componente de Rastreamento de Etapas

### Arquivo: `client/components/ProductionStagesTracker.tsx`

**Funcionalidades:**
- Visualização de todas as 6 etapas de produção
- Barra de progresso geral
- Status individual por etapa:
  - ⚪ Pendente
  - 🔵 Em Andamento (com animação)
  - ✅ Concluído
- Ações por etapa:
  - Iniciar etapa
  - Pausar etapa
  - Concluir etapa
  - Reabrir etapa
- Atribuição de operador responsável
- Observações por etapa
- Registro de data/hora de início e conclusão

**Uso:**
```tsx
<ProductionStagesTracker
  orderId={order.id}
  orderNumber={order.order_number}
  stages={order.production_stages || []}
  onUpdateStage={handleUpdateStage}
  operators={operators}
/>
```

---

## 6. Componente de Impressão do Panorama

### Arquivo: `client/components/ProductionPanorama.tsx`

**Funcionalidades:**
- Visualização agrupada por data
- Formato similar ao exemplo fornecido (exemplopedido.jpeg)
- Informações exibidas:
  - OP (Número do Pedido)
  - Produto, Tipo, Tecido, Cor
  - Largura, Comprimento
  - Quantidade
  - Observações
  - Pedido (Cliente)
  - Prazo (Data de Entrega)
- Totalizadores por dia
- Resumo geral do período
- Cores de prioridade:
  - 🔴 Urgente (fundo vermelho claro)
  - 🟠 Alta (fundo amarelo claro)
  - 🔵 Média (fundo azul claro)
  - ⚪ Baixa (fundo cinza claro)
- Função de impressão otimizada

**Uso:**
```tsx
<ProductionPanorama
  orders={filteredOrders}
  startDate={startDate}
  endDate={endDate}
/>
```

---

## 7. Navegação Atualizada

### Arquivo: `client/components/DashboardLayout.tsx`

**Mudanças:**
- Adicionado ícone `CalendarCheck` para a Agenda
- Novo item de menu: "Agenda"
- Rota: `/agenda`
- Permissão condicional: Visível apenas para usuários com `orders.approve`

### Arquivo: `client/App.tsx`

**Nova Rota:**
```tsx
<Route path="/agenda" element={
  <ProtectedRoute module="orders" action="approve">
    <DashboardLayout>
      <AgendaPage />
    </DashboardLayout>
  </ProtectedRoute>
} />
```

---

## 8. Fragmentação de Pedidos (Melhorada)

**Funcionalidade Existente Mantida:**
- Sistema de fragmentação já existente no código
- Permite dividir pedidos por produto
- Cada fragmento pode ter:
  - Data de produção independente
  - Status próprio
  - Operador atribuído
  - Progresso individual

**Compatibilidade:**
- As etapas de produção podem ser aplicadas tanto ao pedido completo quanto aos fragmentos
- Componente `ProductionStagesTracker` pode ser usado em ambos os contextos

---

## 9. Permissões e Roles

### Permissões Necessárias:

| Ação | Permissão | Quem Tem |
|------|-----------|----------|
| Ver pedidos | `orders.view` | Todos |
| Criar pedidos | `orders.create` | Vendedores, Admin |
| Aprovar pedidos | `orders.approve` | **Apenas Admin** |
| Agendar produção | `orders.approve` | **Apenas Admin** |
| Ver Agenda | `orders.approve` | **Apenas Admin** |
| Gerenciar etapas | `production.manage` | Admin, Operadores |

---

## 10. Fluxo Completo do Sistema

### Para Vendedores:
1. ✅ Fazer login
2. ✅ Criar novo pedido
3. ✅ Selecionar cliente (com desconto padrão)
4. ✅ Adicionar produtos
5. ✅ Aplicar descontos (conforme permissões do cliente)
6. ✅ Definir prioridade
7. ✅ Salvar pedido (status: `awaiting_approval`)
8. ❌ **NÃO** pode ver data de produção
9. ❌ **NÃO** pode agendar produção
10. ❌ **NÃO** acompanha andamento

### Para Administradores:
1. ✅ Ver todos os pedidos
2. ✅ Acessar página "Agenda"
3. ✅ Aprovar pedidos pendentes
4. ✅ Arrastar pedidos para datas no calendário
5. ✅ Definir data de produção
6. ✅ Imprimir panorama de produção
7. ✅ Gerenciar etapas de produção
8. ✅ Atribuir operadores

### Para Produção:
1. ✅ Ver lista de pedidos agendados por dia
2. ✅ Visualizar etapas de produção
3. ✅ Iniciar/pausar/concluir etapas
4. ✅ Adicionar observações
5. ✅ Registrar progresso

---

## Arquivos Criados

1. ✅ `client/pages/Agenda.tsx` - Página de agendamento
2. ✅ `client/components/ProductionStagesTracker.tsx` - Rastreamento de etapas
3. ✅ `client/components/ProductionPanorama.tsx` - Impressão do panorama
4. ✅ `MUDANCAS_IMPLEMENTADAS.md` - Este documento

---

## Arquivos Modificados

1. ✅ `client/hooks/useFirebase.ts` - Adicionado status `awaiting_approval` e `production_stages`
2. ✅ `client/pages/Orders.tsx` - Atualizado labels e cores de status
3. ✅ `client/components/NewOrderForm.tsx` - Removido campo de data para vendedores
4. ✅ `client/components/DashboardLayout.tsx` - Adicionado menu Agenda
5. ✅ `client/App.tsx` - Adicionada rota `/agenda`
6. ✅ `client/types/production.ts` - Atualizadas etapas de produção

---

## Próximos Passos Recomendados

### Backend (Supabase/Firebase):
1. Criar/atualizar tabela `orders` com campos:
   - `production_stages` (JSONB)
   - Garantir que `status` aceita `awaiting_approval`

2. Criar políticas RLS (Row Level Security):
   - Vendedores só veem seus próprios pedidos
   - Admin vê todos os pedidos
   - Operadores veem apenas pedidos em produção

3. Criar índices:
   - `scheduled_date` para performance na Agenda
   - `status` para filtros rápidos

### Testes:
1. Testar criação de pedido como vendedor
2. Testar aprovação e agendamento como admin
3. Testar drag-and-drop no calendário
4. Testar impressão do panorama
5. Testar rastreamento de etapas
6. Testar fragmentação de pedidos

### Melhorias Futuras:
1. Notificações quando pedido é aprovado
2. Dashboard com métricas de produção por etapa
3. Relatórios de eficiência por operador
4. Integração com sistema de estoque
5. Alertas de atraso na produção
6. Histórico de alterações de status

---

## Observações Importantes

⚠️ **Atenção:**
- O sistema já possui integração com Firebase/Supabase
- As mudanças são compatíveis com a estrutura existente
- Permissões são verificadas em tempo real
- Modo offline (localStorage) continua funcionando

✅ **Compatibilidade:**
- Todas as mudanças são **retrocompatíveis**
- Pedidos antigos continuam funcionando
- Sistema de fragmentação existente foi mantido
- Não há breaking changes

🎨 **UI/UX:**
- Interface responsiva (mobile e desktop)
- Cores e estilos seguem o padrão BioBox
- Componentes Shadcn/UI mantidos
- Tailwind CSS para estilização

---

## Contato e Suporte

Para dúvidas sobre as implementações, consulte:
- Código-fonte nos arquivos mencionados
- Comentários inline no código
- Este documento de referência

**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis BioBox**

