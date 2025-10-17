# 📋 Fluxo de Etapas de Produção - Sistema BioBox

## 🎯 Onde Entram as Etapas de Produção?

### 1. **Criação do Pedido (Vendedor)**
- Vendedor cria o pedido **SEM** data de produção
- Vendedor **NÃO** vê nem define data de entrega
- Pedido fica com status: `awaiting_approval`
- **Etapas de produção NÃO são visíveis ainda**

### 2. **Aprovação e Agendamento (Admin)**
- Admin acessa a página **Agenda** (`/agenda`)
- Vê todos os pedidos com status `awaiting_approval`
- **Arrasta o pedido** para uma data no calendário
- Pedido muda para status: `confirmed`
- **Etapas de produção são CRIADAS automaticamente**

### 3. **Visualização das Etapas (Admin/Operador)**
- Acesse a página **Pedidos** (`/orders`)
- Clique em **"Ver Detalhes"** de um pedido confirmado
- Role até a seção **"Etapas de Produção"**
- Você verá as 6 etapas:
  1. ✂️ Corte e Costura
  2. 🪚 Marcenaria
  3. 🪡 Tapeçaria
  4. 🔧 Montagem
  5. 📦 Embalagem
  6. 🚚 Entrega

### 4. **Gerenciamento das Etapas**
- Clique em **"Iniciar"** na primeira etapa pendente
- Selecione o **operador responsável**
- Adicione **observações** (opcional)
- Clique em **"Concluir"** quando terminar
- A próxima etapa fica disponível automaticamente

---

## 🔧 Correção do Problema de Salvamento

O problema é que as etapas não estão sendo salvas no banco de dados. Vou corrigir isso agora.

### Causa do Problema:
O campo `production_stages` pode não estar sendo enviado corretamente para o Firebase/Supabase.

### Solução:
1. Verificar se o campo `production_stages` existe na tabela `orders`
2. Garantir que o tipo do campo é `JSONB` ou `JSON`
3. Atualizar a função `updateOrder` para salvar corretamente

---

## 📊 Estrutura das Etapas

Cada etapa tem a seguinte estrutura:

```json
{
  "stage": "cutting_sewing",
  "status": "in_progress",
  "started_at": "2025-10-17T14:30:00Z",
  "completed_at": null,
  "assigned_operator": "João Silva",
  "notes": "Tecido azul/preto conforme pedido"
}
```

### Status Possíveis:
- `pending` - Pendente (ainda não iniciada)
- `in_progress` - Em andamento
- `completed` - Concluída

---

## 🗄️ Configuração do Banco de Dados

### Firebase/Firestore:
```javascript
{
  id: "pedido123",
  order_number: "OP-001",
  status: "confirmed",
  production_stages: [
    {
      stage: "cutting_sewing",
      status: "completed",
      started_at: "2025-10-17T08:00:00Z",
      completed_at: "2025-10-17T10:00:00Z",
      assigned_operator: "João Silva",
      notes: "Concluído sem problemas"
    },
    {
      stage: "carpentry",
      status: "in_progress",
      started_at: "2025-10-17T10:15:00Z",
      assigned_operator: "Maria Santos",
      notes: ""
    }
    // ... outras etapas
  ]
}
```

### Supabase/PostgreSQL:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS production_stages JSONB DEFAULT '[]';
```

---

## ✅ Checklist de Verificação

### Para o Admin:
- [ ] Consigo acessar a página Agenda?
- [ ] Consigo arrastar pedidos para datas?
- [ ] O status muda para "Confirmado"?
- [ ] Consigo ver as etapas em "Ver Detalhes"?

### Para as Etapas:
- [ ] Consigo iniciar uma etapa?
- [ ] Consigo selecionar operador?
- [ ] Consigo concluir uma etapa?
- [ ] A etapa fica marcada como concluída?
- [ ] Ao recarregar a página, a etapa continua concluída?

---

## 🐛 Problemas Comuns

### 1. "Etapas não aparecem"
**Causa:** Pedido não está confirmado  
**Solução:** Agende o pedido na Agenda primeiro

### 2. "Etapas não salvam"
**Causa:** Campo `production_stages` não existe no banco  
**Solução:** Adicionar o campo (veja seção acima)

### 3. "Não consigo iniciar etapa"
**Causa:** Etapa anterior não foi concluída  
**Solução:** As etapas devem ser feitas em ordem

### 4. "Dados perdidos ao recarregar"
**Causa:** Problema no `updateOrder`  
**Solução:** Verificar console do navegador (F12) para erros

---

## 🔍 Como Debugar

### 1. Abra o Console do Navegador (F12)
- Vá para a aba "Console"
- Procure por erros em vermelho

### 2. Verifique a Rede (Network)
- Aba "Network" → "Fetch/XHR"
- Ao salvar uma etapa, veja a requisição
- Verifique se `production_stages` está sendo enviado

### 3. Verifique o Banco de Dados
- Acesse o Firebase Console ou Supabase
- Abra a tabela `orders`
- Veja se o campo `production_stages` tem dados

---

## 📞 Próximos Passos

1. ✅ Verificar se o campo existe no banco
2. ✅ Testar salvamento de uma etapa
3. ✅ Verificar console para erros
4. ✅ Confirmar que dados persistem após reload

---

**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis BioBox**

