# 🐛 Análise de Bugs e Problemas de Persistência

**Data:** 20/10/2025  
**Repositório:** TechMettieus/SysBiobox

---

## 🔍 Problemas Encontrados

### 1. ⚠️ **BUG CRÍTICO: Paginação Global na Produção**

**Arquivo:** `client/pages/Production.tsx`  
**Linha:** 45

**Problema:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
```

A paginação está usando um **estado global** para todas as abas. Quando você:
1. Está na aba "Corte e Costura" na página 2
2. Troca para aba "Marcenaria"
3. A página continua sendo 2, mas pode não haver pedidos suficientes

**Impacto:**
- Usuário pode ver página vazia ao trocar de aba
- Navegação confusa
- UX ruim

**Solução:**
Usar um estado de paginação **por aba**:
```typescript
const [currentPages, setCurrentPages] = useState<Record<string, number>>({
  cutting_sewing: 1,
  carpentry: 1,
  upholstery: 1,
  assembly: 1,
  packaging: 1,
  delivery: 1,
});
```

---

### 2. ⚠️ **Problema de Persistência: production_stages**

**Arquivo:** `client/hooks/useFirebase.ts`  
**Função:** `updateOrder`

**Problema:**
O campo `production_stages` é um array de objetos complexos. Ao salvar no Firestore, pode haver problemas com:
- Valores `undefined` sendo convertidos para `""`
- Timestamps não sendo salvos corretamente
- Estrutura do array sendo alterada

**Código atual:**
```typescript
await updateDoc(
  doc(db, "orders", orderId),
  sanitizeForFirestore({ ...updates, updated_at: serverTimestamp() }) as any,
);
```

**Problema:** `sanitizeForFirestore` converte `undefined` e `null` para `""`, o que pode quebrar a lógica das etapas.

**Exemplo:**
```typescript
// Antes
production_stages: [
  { stage: "cutting_sewing", status: "in_progress", started_at: "2025-10-20T10:00:00Z" }
]

// Depois do sanitize (se algum campo for undefined)
production_stages: [
  { stage: "cutting_sewing", status: "in_progress", started_at: "2025-10-20T10:00:00Z", assigned_operator: "" }
]
```

**Solução:**
Criar função específica para sanitizar production_stages:
```typescript
function sanitizeProductionStages(stages: any[]) {
  return stages.map(stage => ({
    stage: stage.stage,
    status: stage.status,
    started_at: stage.started_at || null,
    completed_at: stage.completed_at || null,
    notes: stage.notes || null,
  })).filter(s => s.stage && s.status);
}
```

---

### 3. ⚠️ **localStorage não sincroniza com Firestore**

**Problema:**
Quando o Firestore está offline, os dados vão para localStorage. Mas quando volta online, **não há sincronização automática**.

**Cenário:**
1. Usuário cria pedido offline → Salvo no localStorage
2. Internet volta
3. Pedido **não** é enviado para Firestore automaticamente
4. Outro dispositivo não vê o pedido

**Solução:**
Implementar fila de sincronização:
```typescript
const syncQueue = JSON.parse(localStorage.getItem('biobox_sync_queue') || '[]');

// Ao criar offline
syncQueue.push({ action: 'create', collection: 'orders', data: orderData });
localStorage.setItem('biobox_sync_queue', JSON.stringify(syncQueue));

// Ao voltar online
useEffect(() => {
  if (isConnected) {
    processSyncQueue();
  }
}, [isConnected]);
```

---

### 4. ⚠️ **Race Condition ao atualizar etapas**

**Arquivo:** `client/pages/Orders.tsx`  
**Função:** `handleTransition`

**Problema:**
Ao iniciar produção, o código:
1. Lê `order.production_stages`
2. Modifica localmente
3. Salva no banco

Se dois usuários clicarem ao mesmo tempo, um sobrescreve o outro.

**Solução:**
Usar transações do Firestore:
```typescript
import { runTransaction } from "firebase/firestore";

await runTransaction(db, async (transaction) => {
  const orderRef = doc(db, "orders", orderId);
  const orderDoc = await transaction.get(orderRef);
  const currentStages = orderDoc.data()?.production_stages || [];
  
  // Modificar stages
  const updatedStages = [...currentStages, newStage];
  
  transaction.update(orderRef, { production_stages: updatedStages });
});
```

---

### 5. ⚠️ **Desconto não validado no backend**

**Arquivo:** `client/components/NewOrderForm.tsx`

**Problema:**
O desconto é validado apenas no frontend:
```typescript
<Input
  type="number"
  min="0"
  max="100"
/>
```

Usuário malicioso pode enviar desconto de 200% via DevTools.

**Solução:**
Validar no servidor (Firebase Functions ou backend):
```typescript
if (discount_percentage < 0 || discount_percentage > 100) {
  throw new Error("Desconto inválido");
}
```

---

### 6. ⚠️ **Cálculo de desconto pode ter erro de arredondamento**

**Arquivo:** `client/components/NewOrderForm.tsx`

**Problema:**
```typescript
const calculateDiscountAmount = () => {
  const subtotal = calculateSubtotal();
  return (subtotal * (orderDetails.discount_percentage || 0)) / 100;
};
```

JavaScript usa ponto flutuante, pode gerar:
- `1000 * 0.1 = 99.99999999999999`

**Solução:**
Arredondar para 2 casas decimais:
```typescript
const calculateDiscountAmount = () => {
  const subtotal = calculateSubtotal();
  const discount = (subtotal * (orderDetails.discount_percentage || 0)) / 100;
  return Math.round(discount * 100) / 100;
};
```

---

### 7. ⚠️ **Memória vazando em listeners**

**Problema:**
Vários componentes usam `useEffect` sem cleanup.

**Exemplo:**
```typescript
useEffect(() => {
  loadOrders();
}, []);
```

Se o componente desmontar durante `loadOrders()`, pode causar:
- Memory leak
- Erro: "Can't perform a React state update on an unmounted component"

**Solução:**
```typescript
useEffect(() => {
  let isMounted = true;
  
  const load = async () => {
    const data = await loadOrders();
    if (isMounted) {
      setOrders(data);
    }
  };
  
  load();
  
  return () => {
    isMounted = false;
  };
}, []);
```

---

### 8. ⚠️ **Falta tratamento de erro em várias funções**

**Exemplos:**
```typescript
// client/pages/Customers.tsx
const loadCustomers = async () => {
  const data = await getCustomers(); // E se falhar?
  setCustomers(data);
};
```

**Solução:**
```typescript
const loadCustomers = async () => {
  try {
    const data = await getCustomers();
    setCustomers(data);
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os clientes",
      variant: "destructive",
    });
  }
};
```

---

### 9. ℹ️ **Otimização: Muitas chamadas ao banco**

**Problema:**
Cada componente chama `getOrders()` independentemente:
- Dashboard
- Orders
- Production
- Agenda

**Solução:**
Usar Context API ou React Query para cache:
```typescript
const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
      }
    );
    
    return unsubscribe;
  }, []);
  
  return (
    <OrdersContext.Provider value={{ orders }}>
      {children}
    </OrdersContext.Provider>
  );
}
```

---

### 10. ℹ️ **Falta validação de permissões no backend**

**Problema:**
Permissões são validadas apenas no frontend:
```typescript
if (!checkPermission("orders", "approve")) {
  return;
}
```

Usuário pode burlar via API direta.

**Solução:**
Implementar Firebase Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'seller');
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 📊 Resumo

| Prioridade | Problema | Impacto | Dificuldade |
|------------|----------|---------|-------------|
| 🔴 Alta | Paginação global | Alto | Baixa |
| 🔴 Alta | production_stages sanitize | Alto | Média |
| 🟠 Média | localStorage não sincroniza | Médio | Alta |
| 🟠 Média | Race condition etapas | Médio | Média |
| 🟠 Média | Desconto sem validação | Médio | Baixa |
| 🟡 Baixa | Arredondamento desconto | Baixo | Baixa |
| 🟡 Baixa | Memory leak listeners | Baixo | Baixa |
| 🟡 Baixa | Falta try-catch | Baixo | Baixa |
| 🔵 Info | Muitas chamadas ao banco | Baixo | Alta |
| 🔵 Info | Permissões no backend | Baixo | Alta |

---

## ✅ Próximos Passos

1. **Corrigir paginação** (15 min)
2. **Melhorar sanitize de production_stages** (30 min)
3. **Adicionar try-catch** (1 hora)
4. **Implementar validação de desconto** (30 min)
5. **Corrigir arredondamento** (15 min)
6. **Adicionar cleanup em useEffect** (1 hora)
7. **Implementar sincronização offline** (4 horas)
8. **Adicionar transações** (2 horas)
9. **Implementar Context API** (3 horas)
10. **Configurar Security Rules** (2 horas)

**Total estimado:** ~14 horas de desenvolvimento

---

**Análise realizada por:** Manus AI  
**Revisão recomendada:** Mensal

