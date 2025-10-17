# 📋 Fluxo de Produção - Sistema BioBox

## 🎯 Visão Geral

Este documento explica **onde e como** as etapas de produção aparecem no sistema BioBox.

---

## 🔄 Fluxo Completo do Pedido

### 1️⃣ **Vendedor Cria o Pedido**
- **Página**: Pedidos → Novo Pedido
- **O que o vendedor faz**:
  - Seleciona o cliente
  - Adiciona produtos
  - Aplica descontos
  - Define prioridade
  - Adiciona observações
- **O que o vendedor NÃO vê**:
  - ❌ Data de Produção
  - ❌ Data de Entrega
  - ❌ Etapas de Produção
- **Status inicial**: `awaiting_approval` (Aguardando Aprovação)

---

### 2️⃣ **Admin Aprova e Agenda**
- **Página**: Agenda
- **O que o admin faz**:
  1. Vê a lista de pedidos pendentes de aprovação
  2. Clica em "Aprovar" OU arrasta o pedido para uma data no calendário
  3. Define quando o pedido será produzido
- **Status após aprovação**: `confirmed` (Confirmado)
- **Resultado**: Pedido agendado para produção

---

### 3️⃣ **Etapas de Produção Aparecem**

#### 📍 **Onde ver as etapas de produção:**

**Opção 1: Página de Pedidos**
1. Acesse: **Pedidos** (menu lateral)
2. Encontre o pedido confirmado
3. Clique em **"Ver Detalhes"** (ícone de olho)
4. Role para baixo até a seção **"Etapas de Produção"**

**Opção 2: Página de Produção**
1. Acesse: **Produção** (menu lateral)
2. Veja o dashboard de produção
3. Clique em um pedido em produção
4. As etapas aparecem nos detalhes

---

### 4️⃣ **Gerenciar Etapas de Produção**

#### 🎯 **As 6 Etapas Fixas:**

| Ordem | Etapa | Tempo Estimado | Ícone |
|-------|-------|----------------|-------|
| 1 | **Corte e Costura** | 120 min | ✂️ |
| 2 | **Marcenaria** | 180 min | 🪚 |
| 3 | **Tapeçaria** | 240 min | 🪡 |
| 4 | **Montagem** | 90 min | 🔧 |
| 5 | **Embalagem** | 30 min | 📦 |
| 6 | **Entrega** | 60 min | 🚚 |

#### ✅ **Como Iniciar uma Etapa:**

1. Na seção "Etapas de Produção", clique em **"Iniciar"** na etapa desejada
2. Um dialog abre com:
   - **Operador Responsável**: Selecione quem vai executar
   - **Observações**: Adicione notas se necessário
3. Clique em **"Iniciar Etapa"**
4. A etapa muda para status **"Em Andamento"** (azul pulsante)
5. Data/hora de início é registrada automaticamente

#### ⏸️ **Como Pausar uma Etapa:**

1. Clique na etapa que está **"Em Andamento"**
2. Clique em **"Pausar"**
3. Status volta para **"Pendente"**

#### ✅ **Como Concluir uma Etapa:**

1. Clique em **"Concluir"** na etapa em andamento
2. Revise as observações
3. Clique em **"Concluir Etapa"**
4. A etapa muda para status **"Concluída"** (verde com ✓)
5. Data/hora de conclusão é registrada
6. A **próxima etapa** fica disponível automaticamente

#### 🔄 **Como Reabrir uma Etapa:**

1. Clique em **"Ver Detalhes"** na etapa concluída
2. Clique em **"Reabrir Etapa"**
3. Status volta para **"Em Andamento"**
4. Útil para correções ou retrabalho

---

### 5️⃣ **Acompanhamento do Progresso**

#### 📊 **Indicadores Visuais:**

**Barra de Progresso:**
- Mostra % de conclusão geral
- Verde quando completo
- Atualiza automaticamente

**Contador:**
- "X/6 concluídas"
- Exemplo: "3/6 concluídas" = 50%

**Cores por Status:**
- ⚪ **Cinza**: Pendente
- 🔵 **Azul** (pulsante): Em Andamento
- ✅ **Verde**: Concluída

**Informações de Cada Etapa:**
- Nome da etapa
- Status atual
- Operador responsável (se atribuído)
- Data/hora de início (se iniciada)
- Data/hora de conclusão (se concluída)
- Observações (se houver)

---

## 🔐 Permissões

### Quem pode fazer o quê:

| Ação | Vendedor | Admin | Operador |
|------|----------|-------|----------|
| Ver etapas | ❌ | ✅ | ✅ |
| Iniciar etapa | ❌ | ✅ | ✅ |
| Pausar etapa | ❌ | ✅ | ✅ |
| Concluir etapa | ❌ | ✅ | ✅ |
| Reabrir etapa | ❌ | ✅ | ✅ |
| Atribuir operador | ❌ | ✅ | ✅ |

---

## 📝 Regras Importantes

### ⚠️ **Ordem das Etapas:**
- As etapas devem ser feitas **em ordem sequencial**
- Não é possível pular etapas
- Para iniciar a etapa 2, a etapa 1 deve estar concluída

### 💾 **Salvamento Automático:**
- Todas as mudanças são salvas **imediatamente** no banco de dados
- Não é necessário clicar em "Salvar"
- Os dados persistem mesmo após recarregar a página

### 🔄 **Atualização em Tempo Real:**
- Após concluir uma etapa, a lista de pedidos é atualizada
- O progresso é recalculado automaticamente
- Outros usuários veem as mudanças ao recarregar

---

## 🎯 Exemplo Prático

### Cenário: Pedido #311250 (do exemplo fornecido)

**Passo a Passo:**

1. **Vendedor cria pedido**:
   - Cliente: São Paulo
   - Produto: Baú Premium Jacquard Bordado Azul/Preto
   - Quantidade: 6 peças
   - Status: Aguardando Aprovação

2. **Admin aprova na Agenda**:
   - Arrasta pedido para 27/10/2025
   - Status: Confirmado
   - Data de produção: 27/10/2025

3. **Operador inicia produção**:
   - Acessa: Pedidos → Ver Detalhes do #311250
   - Etapa 1: **Corte e Costura**
     - Clica "Iniciar"
     - Seleciona operador: "João Silva"
     - Observação: "Material já separado"
     - Status: Em Andamento (🔵)
   
4. **Operador conclui Corte e Costura**:
   - Clica "Concluir"
   - Status: Concluída (✅)
   - Progresso: 1/6 (17%)

5. **Operador inicia Marcenaria**:
   - Etapa 2 agora está disponível
   - Clica "Iniciar"
   - Seleciona operador: "Pedro Costa"
   - Status: Em Andamento (🔵)

6. **E assim por diante** até completar todas as 6 etapas

7. **Quando todas concluídas**:
   - Progresso: 6/6 (100%)
   - Pedido pode mudar para status "Pronto"
   - Admin pode agendar entrega

---

## 🐛 Solução de Problemas

### ❓ **Não consigo ver as etapas de produção**
**Causa**: Pedido ainda não foi aprovado
**Solução**: Peça ao admin para aprovar o pedido na Agenda

### ❓ **Não consigo iniciar a etapa 2**
**Causa**: Etapa 1 ainda não foi concluída
**Solução**: Complete a etapa anterior primeiro

### ❓ **As etapas não estão salvando**
**Causa**: Problema de conexão com o banco de dados
**Solução**: 
1. Verifique sua conexão com a internet
2. Recarregue a página (F5)
3. Tente novamente
4. Se persistir, entre em contato com o suporte

### ❓ **Não vejo o botão "Iniciar"**
**Causa**: Você não tem permissão
**Solução**: Peça ao admin para conceder permissão de produção

---

## 📞 Suporte

Para dúvidas sobre o fluxo de produção:
1. Consulte este documento
2. Verifique o GUIA_NOVAS_FUNCIONALIDADES.md
3. Entre em contato com o administrador do sistema

---

**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis BioBox**

