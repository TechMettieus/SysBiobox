# 🏭 Tela de Acompanhamento de Produção

## 📍 Como Acessar

Menu lateral → **Produção** (ícone de engrenagem)

---

## 🎯 O que você vê

A tela de **Acompanhamento de Produção** mostra todos os pedidos organizados por **etapa de produção**.

### 📊 Layout da Tela

```
┌─────────────────────────────────────────────────────────────┐
│  Acompanhamento de Produção                    [12 pedidos] │
├─────────────────────────────────────────────────────────────┤
│  [Corte e Costura] [Marcenaria] [Tapeçaria] [Montagem] ... │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✂️ Corte e Costura                          5       │   │
│  │  Tempo estimado: 120 min                  Pedidos    │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60%         │   │
│  │                                                       │   │
│  │  [Pedido 1]  [Pedido 2]  [Pedido 3]  [Pedido 4] ... │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📑 Abas (Etapas)

### 1️⃣ **Corte e Costura** ✂️
- **Tempo estimado**: 120 minutos
- **Ícone**: Tesoura
- Mostra pedidos que estão nesta etapa

### 2️⃣ **Marcenaria** 🪚
- **Tempo estimado**: 180 minutos
- **Ícone**: Martelo
- Pedidos na fase de marcenaria

### 3️⃣ **Tapeçaria** 🪡
- **Tempo estimado**: 240 minutos
- **Ícone**: Sofá
- Pedidos na fase de estofamento

### 4️⃣ **Montagem** 🔧
- **Tempo estimado**: 90 minutos
- **Ícone**: Chave inglesa
- Pedidos na fase de montagem

### 5️⃣ **Embalagem** 📦
- **Tempo estimado**: 30 minutos
- **Ícone**: Caixa
- Pedidos sendo embalados

### 6️⃣ **Entrega** 🚚
- **Tempo estimado**: 60 minutos
- **Ícone**: Caminhão
- Pedidos prontos para entrega

---

## 🎴 Cards de Pedidos

Cada pedido aparece como um **card** com as seguintes informações:

### 📋 Informações Visíveis:

```
┌─────────────────────────────────┐
│ 🔴 ORD-2025-1234    [Em Andamento] │
│ Cliente: São Paulo                │
│                                   │
│ 👤 João Silva                     │
│ 🕐 Iniciado: 17/10 14:30          │
│ 📅 Produção: 27/10/2025           │
└─────────────────────────────────┘
```

### 🎨 Indicadores Visuais:

**Bolinha de Prioridade:**
- 🔴 **Vermelho**: Urgente
- 🟠 **Laranja**: Alta
- 🔵 **Azul**: Média
- ⚪ **Cinza**: Baixa

**Badge de Status:**
- **Verde**: Concluído
- **Azul**: Em Andamento
- **Cinza**: Pendente

---

## 🖱️ Interações

### Clicar em um Pedido:
1. Abre um **dialog (janela)** com todas as etapas
2. Mostra o componente **ProductionStagesTracker**
3. Você pode:
   - ▶️ Iniciar etapa
   - ⏸️ Pausar etapa
   - ✅ Concluir etapa
   - 👤 Atribuir operador
   - 📝 Adicionar observações

---

## 📊 Barra de Progresso

Cada aba mostra uma **barra de progresso geral**:

```
Progresso Geral ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60%
```

**Cálculo:**
- Total de pedidos na etapa: 5
- Pedidos concluídos: 3
- Progresso: 3/5 = 60%

---

## 🔄 Fluxo de Trabalho

### Exemplo Prático:

**Pedido #311250 - Baú Premium**

1. **Admin aprova na Agenda**
   - Status: Confirmado
   - Aparece na aba **Corte e Costura**

2. **Operador acessa Produção**
   - Clica na aba **Corte e Costura**
   - Vê o card do pedido #311250
   - Status: **Pendente**

3. **Operador clica no card**
   - Abre dialog com todas as 6 etapas
   - Clica em **"Iniciar"** na etapa Corte e Costura
   - Seleciona operador: "João Silva"
   - Status muda para: **Em Andamento** (azul)

4. **Durante a execução**
   - Card mostra:
     - Badge azul: "Em Andamento"
     - Operador: João Silva
     - Hora de início: 17/10 14:30

5. **Operador conclui**
   - Clica em **"Concluir"**
   - Status: **Concluído** (verde)
   - Pedido **some** da aba Corte e Costura
   - Pedido **aparece** na aba Marcenaria

6. **Próxima etapa**
   - Operador da Marcenaria vê o pedido
   - Inicia a etapa de Marcenaria
   - E assim por diante...

---

## 🎯 Vantagens desta Organização

### ✅ **Visão por Setor**
- Cada operador vê apenas os pedidos da sua área
- Operador de Corte e Costura → Aba Corte e Costura
- Operador de Marcenaria → Aba Marcenaria

### ✅ **Progresso Visual**
- Barra de progresso mostra % de conclusão
- Contador de pedidos em cada aba
- Cores indicam prioridade

### ✅ **Gestão Simplificada**
- Clique no pedido para ver todas as etapas
- Não precisa procurar em listas longas
- Tudo organizado por fase

### ✅ **Rastreabilidade**
- Vê quem está trabalhando em cada pedido
- Quando foi iniciado
- Data de produção agendada

---

## 🔐 Permissões

### Quem pode acessar:

| Usuário | Pode Ver | Pode Gerenciar |
|---------|----------|----------------|
| **Vendedor** | ❌ Não | ❌ Não |
| **Admin** | ✅ Sim | ✅ Sim |
| **Operador** | ✅ Sim | ✅ Sim |

---

## 🐛 Solução de Problemas

### ❓ **Não vejo nenhum pedido na produção**
**Causa**: Nenhum pedido foi aprovado ainda
**Solução**: 
1. Vá para **Agenda**
2. Aprove pedidos pendentes
3. Eles aparecerão automaticamente na Produção

### ❓ **Pedido não aparece após concluir etapa**
**Causa**: Pedido mudou de aba
**Solução**: 
- Ao concluir uma etapa, o pedido move para a próxima aba
- Exemplo: Concluiu Corte → Vai para Marcenaria

### ❓ **Não consigo iniciar etapa**
**Causa**: Etapa anterior não foi concluída
**Solução**: 
- As etapas devem ser feitas em ordem
- Complete a etapa anterior primeiro

### ❓ **Pedido confirmado não aparece**
**Causa**: Bug corrigido! Estava salvando com status errado
**Solução**: 
1. Faça `git pull origin main`
2. Recarregue a página
3. Aprove o pedido novamente

---

## 📝 Resumo

### Como usar a Tela de Produção:

1. **Acesse**: Menu → Produção
2. **Escolha a aba**: Clique na etapa que você trabalha
3. **Veja os pedidos**: Cards organizados por prioridade
4. **Clique no pedido**: Abre todas as etapas
5. **Gerencie**: Inicie, pause ou conclua etapas
6. **Acompanhe**: Veja o progresso em tempo real

---

## 🎨 Atalhos Visuais

| Ícone | Significado |
|-------|-------------|
| ✂️ | Corte e Costura |
| 🪚 | Marcenaria |
| 🪡 | Tapeçaria |
| 🔧 | Montagem |
| 📦 | Embalagem |
| 🚚 | Entrega |
| 👤 | Operador |
| 🕐 | Horário |
| 📅 | Data |
| 🔴 | Urgente |
| 🟠 | Alta prioridade |
| 🔵 | Média prioridade |
| ⚪ | Baixa prioridade |

---

**Desenvolvido para otimizar o fluxo de produção da BioBox** 🚀

