# Guia de Uso - Novas Funcionalidades BioBox

## 🎯 Visão Geral

Este guia explica como usar as novas funcionalidades implementadas no sistema BioBox para gerenciamento de produção de móveis.

---

## 📋 Para Vendedores

### Como Criar um Novo Pedido

1. **Acesse a página de Pedidos**
   - Clique em "Pedidos" no menu lateral

2. **Clique em "Novo Pedido"**
   - Botão verde no canto superior direito

3. **Passo 1: Selecione o Cliente**
   - Busque o cliente existente
   - Ou clique em "Novo Cliente" para cadastrar

4. **Passo 2: Adicione Produtos**
   - Selecione o produto
   - Escolha modelo, tamanho, cor e tecido
   - Defina a quantidade
   - O desconto padrão do cliente será aplicado automaticamente
   - Você pode ajustar o desconto conforme as permissões do cliente

5. **Passo 3: Finalize o Pedido**
   - Defina a prioridade (Baixa, Média, Alta, Urgente)
   - Adicione observações se necessário
   - **Nota:** Você NÃO verá o campo "Data de Produção"
   - Clique em "Criar Pedido"

6. **Status do Pedido**
   - Seu pedido será criado com status: **"Aguardando Aprovação"**
   - O administrador receberá para aprovação
   - Você NÃO acompanha o andamento da produção

### ⚠️ Limitações do Vendedor

❌ **Você NÃO pode:**
- Definir data de produção
- Aprovar pedidos
- Acessar a Agenda de Produção
- Ver etapas de produção
- Agendar entregas

✅ **Você PODE:**
- Criar pedidos
- Aplicar descontos (conforme permissões)
- Definir prioridade
- Adicionar observações
- Ver seus próprios pedidos

---

## 👨‍💼 Para Administradores

### Como Aprovar e Agendar Pedidos

#### 1. Acessar a Agenda

- Clique em **"Agenda"** no menu lateral
- Você verá:
  - Lista de pedidos pendentes à esquerda
  - Calendário mensal à direita

#### 2. Aprovar Pedidos

**Opção 1: Aprovar sem Agendar**
- Na lista de pedidos, clique em **"Aprovar"**
- O pedido muda para status "Aguardando Aprovação"
- Você pode agendá-lo depois

**Opção 2: Aprovar e Agendar Simultaneamente**
- Arraste o pedido da lista
- Solte sobre a data desejada no calendário
- O pedido é aprovado e agendado automaticamente
- Status muda para "Confirmado"

#### 3. Usar Filtros

**Filtrar por Status:**
- Todos os status
- Pendente
- Aguardando Aprovação
- Confirmado

**Filtrar por Cliente:**
- Selecione o cliente específico
- Ou "Todos os clientes"

**Buscar Pedido:**
- Digite número do pedido ou nome do cliente
- A lista filtra automaticamente

#### 4. Navegar no Calendário

- **Setas** ← → : Mudar de mês
- **Botão "Hoje"**: Voltar ao mês atual
- **Dias com pedidos**: Mostram número do pedido em verde

#### 5. Imprimir Panorama de Produção

1. Clique em **"Imprimir Panorama"**
2. Será gerado um relatório com:
   - Pedidos agrupados por data
   - Informações detalhadas de cada produto
   - Totalizadores por dia
   - Resumo geral do período
3. Uma janela de impressão será aberta
4. Configure a impressora e imprima

**Formato do Panorama:**
- Similar ao exemplo fornecido
- Colunas: OP, Produto, Tipo, Tecido, Cor, Largura, Comprimento, Qtde, Observações, Pedido, Prazo
- Cores de prioridade:
  - 🔴 Vermelho claro: Urgente
  - 🟡 Amarelo claro: Alta
  - 🔵 Azul claro: Média
  - ⚪ Cinza claro: Baixa

---

## 🏭 Para Gerenciar Produção

### Visualizar Etapas de Produção

1. **Acesse o pedido**
   - Na página de Pedidos ou Produção
   - Clique no pedido desejado

2. **Veja as 6 Etapas:**
   - ✂️ **Corte e Costura** (120 min)
   - 🪚 **Marcenaria** (180 min)
   - 🪡 **Tapeçaria** (240 min)
   - 🔧 **Montagem** (90 min)
   - 📦 **Embalagem** (30 min)
   - 🚚 **Entrega** (60 min)

3. **Status de Cada Etapa:**
   - ⚪ **Pendente**: Ainda não iniciada
   - 🔵 **Em Andamento**: Em execução (com animação)
   - ✅ **Concluída**: Finalizada

### Gerenciar Etapas

#### Iniciar uma Etapa

1. Clique em **"Iniciar"** na etapa pendente
2. Selecione o **Operador Responsável**
3. Adicione **Observações** (opcional)
4. Clique em **"Iniciar Etapa"**
5. A data/hora de início é registrada automaticamente

#### Concluir uma Etapa

1. Com a etapa em andamento, clique em **"Concluir"**
2. Revise as observações
3. Clique em **"Concluir Etapa"**
4. A data/hora de conclusão é registrada
5. A próxima etapa fica disponível

#### Pausar uma Etapa

1. Com a etapa em andamento, clique no botão da etapa
2. Clique em **"Pausar"**
3. O status volta para "Pendente"
4. Você pode reiniciar depois

#### Reabrir uma Etapa Concluída

1. Clique em **"Ver Detalhes"** na etapa concluída
2. Clique em **"Reabrir Etapa"**
3. O status volta para "Em Andamento"
4. Útil para correções ou retrabalho

### Acompanhar Progresso

- **Barra de Progresso**: Mostra % de conclusão geral
- **Contador**: "X/6 concluídas"
- **Cores**: Verde (concluído), Azul (em andamento), Cinza (pendente)

---

## 📊 Fragmentação de Pedidos

### Quando Fragmentar?

- Pedido com **múltiplos produtos diferentes**
- Produtos com **prazos de entrega distintos**
- Produção em **lotes separados**

### Como Fragmentar

1. **Acesse o pedido**
2. Clique em **"Fragmentar Pedido"**
3. **Defina os fragmentos:**
   - Quantidade de produtos por fragmento
   - Data de produção de cada fragmento
   - Valor proporcional
4. **Salve os fragmentos**

### Gerenciar Fragmentos

- Cada fragmento tem:
  - Número sequencial (Frag. 1, Frag. 2, etc.)
  - Status próprio
  - Data de produção independente
  - Operador atribuído
  - Etapas de produção individuais

- **Vantagens:**
  - Produção mais flexível
  - Entregas parciais
  - Melhor controle de estoque
  - Rastreamento detalhado

---

## 🖨️ Impressão do Panorama

### Informações Exibidas

**Por Data:**
- Cabeçalho: "SEGUNDA-FEIRA, 27 DE OUTUBRO DE 2025"
- Tabela com todos os pedidos do dia

**Colunas:**
- **OP**: Número da Ordem de Produção
- **Produto**: Nome do produto
- **Tipo**: Modelo (Premium, Blindado, Mola, etc.)
- **Tecido**: Tipo de tecido (Jacquard, Linhão, etc.)
- **Cor**: Cor do produto
- **Largura**: Medida em cm
- **Comprimento**: Medida em cm
- **Qtde**: Quantidade de peças
- **Observações**: Cliente e observações especiais
- **Pedido**: Vendedor ou número do pedido
- **Prazo**: Data de entrega ou "A vista"

**Totalizadores:**
- Total de peças por dia
- Valor total por dia
- Resumo geral do período

### Dicas de Impressão

1. **Configure a impressora:**
   - Orientação: Paisagem (recomendado)
   - Tamanho: A4 ou Carta
   - Margens: Mínimas

2. **Visualize antes:**
   - Use a pré-visualização de impressão
   - Ajuste o zoom se necessário

3. **Salve como PDF:**
   - Opção "Salvar como PDF"
   - Útil para arquivamento digital

---

## 🔐 Permissões e Acessos

### Vendedor
- ✅ Ver pedidos (próprios)
- ✅ Criar pedidos
- ✅ Aplicar descontos
- ❌ Aprovar pedidos
- ❌ Agendar produção
- ❌ Ver Agenda
- ❌ Gerenciar etapas

### Administrador
- ✅ Ver todos os pedidos
- ✅ Criar pedidos
- ✅ Aprovar pedidos
- ✅ Agendar produção
- ✅ Ver Agenda
- ✅ Gerenciar etapas
- ✅ Imprimir panorama
- ✅ Fragmentar pedidos

### Operador (Produção)
- ✅ Ver pedidos em produção
- ✅ Gerenciar etapas
- ✅ Atualizar status
- ❌ Aprovar pedidos
- ❌ Agendar produção

---

## 🆘 Solução de Problemas

### Não consigo ver a Agenda
- **Causa**: Você não tem permissão de admin
- **Solução**: Solicite ao administrador do sistema

### Não consigo arrastar pedidos no calendário
- **Causa**: Navegador não suporta drag-and-drop
- **Solução**: Use um navegador moderno (Chrome, Firefox, Edge)

### Pedido não aparece no calendário
- **Causa**: Pedido não tem data de produção definida
- **Solução**: Arraste o pedido para uma data

### Não consigo iniciar uma etapa
- **Causa**: Etapa anterior não foi concluída
- **Solução**: As etapas devem ser feitas em ordem

### Impressão do panorama está cortada
- **Causa**: Configuração de impressão incorreta
- **Solução**: Use orientação Paisagem e margens mínimas

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este guia
2. Verifique a documentação técnica (MUDANCAS_IMPLEMENTADAS.md)
3. Entre em contato com o administrador do sistema

---

**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis BioBox**

