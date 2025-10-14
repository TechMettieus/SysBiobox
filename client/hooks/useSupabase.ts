import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useAuth } from "./useAuth";
import { logActivity } from "@/lib/activityLogger";
import { sanitizeForFirestore } from "@/lib/firestore";

// Tipos para o banco de dados
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "seller" | "operator";
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "individual" | "company";
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  name: string;
  sku?: string;
  model?: string;
  base_price?: number;
  basePrice?: number;
  cost_price?: number;
  costPrice?: number;
  margin?: number;
  sizes?: string[];
  colors?: string[];
  fabrics?: string[];
  models?: any[];
  specifications?: any[];
  images?: string[];
  description?: string;
  category?: string;
  status?: string;
  active?: boolean;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  seller_id: string;
  status:
    | "pending"
    | "confirmed"
    | "in_production"
    | "quality_check"
    | "ready"
    | "delivered"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  total_amount: number;
  scheduled_date: string;
  delivery_date?: string;
  completed_date?: string;
  production_progress: number;
  assigned_operator?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos calculados
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  seller_name?: string;
  products?: OrderProduct[];
  is_fragmented?: boolean;
  fragments?: OrderFragment[];
  total_quantity?: number;
}

export interface OrderFragment {
  id: string;
  order_id: string;
  fragment_number: number;
  quantity: number;
  scheduled_date: string;
  status: "pending" | "in_production" | "completed";
  progress: number;
  value: number;
  assigned_operator?: string;
  started_at?: string;
  completed_at?: string;
}

export interface OrderProduct {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  model: string;
  size: string;
  color: string;
  fabric: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specifications?: Record<string, any>;
  created_at: string;
}

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setIsConnected(isFirebaseConfigured && Boolean(db));
    setLoading(false);
  }, []);

  // Dados mock para fallback
  const mockUsers: User[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@bioboxsys.com",
      name: "Administrator",
      role: "admin",
      permissions: ["all"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const toIsoString = (value: any, fallback: string) => {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value?.toDate === "function") {
      try {
        return value.toDate().toISOString();
      } catch {
        return fallback;
      }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
  };

  const parseNumber = (value: any, fallback = 0) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  };

  const normalizeProductRecord = (raw: any, id: string): DbProduct => {
    const defaultIso = new Date().toISOString();
    const createdIso = toIsoString(
      raw?.createdAt ?? raw?.created_at,
      defaultIso,
    );
    const updatedIso = toIsoString(
      raw?.updatedAt ?? raw?.updated_at,
      createdIso,
    );
    const basePriceValue = parseNumber(raw?.basePrice ?? raw?.base_price);
    const costPriceValue = parseNumber(raw?.costPrice ?? raw?.cost_price);

    return {
      id,
      name: raw?.name || "Produto",
      sku: raw?.sku || raw?.SKU || "",
      model: raw?.model,
      base_price: basePriceValue,
      basePrice: basePriceValue,
      cost_price: costPriceValue,
      costPrice: costPriceValue,
      margin: parseNumber(raw?.margin),
      sizes: Array.isArray(raw?.sizes) ? raw.sizes : undefined,
      colors: Array.isArray(raw?.colors) ? raw.colors : undefined,
      fabrics: Array.isArray(raw?.fabrics) ? raw.fabrics : undefined,
      models: Array.isArray(raw?.models) ? raw.models : [],
      specifications: Array.isArray(raw?.specifications)
        ? raw.specifications
        : [],
      images: Array.isArray(raw?.images) ? raw.images : [],
      description: raw?.description,
      category: raw?.category,
      status: raw?.status,
      active:
        typeof raw?.active === "boolean"
          ? raw.active
          : (raw?.status || "").toLowerCase() !== "inactive",
      barcode: raw?.barcode,
      created_at: createdIso,
      updated_at: updatedIso,
      createdAt: createdIso,
      updatedAt: updatedIso,
    };
  };

  const getUsers = async (): Promise<User[]> => {
    if (isConnected && db) {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }
    const stored = localStorage.getItem("biobox_users");
    return stored ? JSON.parse(stored) : mockUsers;
  };

  const getCustomers = async (): Promise<Customer[]> => {
    if (isConnected && db) {
      const snap = await getDocs(collection(db, "customers"));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    }
    const stored = localStorage.getItem("biobox_customers");
    return stored ? JSON.parse(stored) : [];
  };

  const getProducts = async (): Promise<DbProduct[]> => {
    if (isConnected && db) {
      const snap = await getDocs(collection(db, "products"));
      return snap.docs.map((d) => normalizeProductRecord(d.data(), d.id));
    }

    const stored = localStorage.getItem("biobox_products");
    if (!stored) {
      return [];
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item: any, index: number) =>
        normalizeProductRecord(item, item?.id ?? `product-${index}`),
      );
    } catch {
      return [];
    }
  };

  const getOrders = async (): Promise<Order[]> => {
    // Prefer Firestore when configured, but be resilient
    if (isConnected && db) {
      try {
        const base = collection(db, "orders");
        const shouldFetchAll = !user || user.role === "admin";
        const q = shouldFetchAll
          ? query(base, orderBy("created_at", "desc"))
          : query(
              base,
              where("seller_id", "==", user.id),
              orderBy("created_at", "desc"),
            );

        const snap = await getDocs(q);

        if (snap.empty) {
          const stored = localStorage.getItem("biobox_orders");
          return stored ? JSON.parse(stored) : [];
        }

        return snap.docs.map((d) => {
          const data = d.data() as any;
          const created = (data.created_at?.toDate?.() as Date) || new Date();
          const updated = (data.updated_at?.toDate?.() as Date) || created;
          const { id: _ignored, ...dataWithoutId } = data;
          return {
            ...dataWithoutId,
            id: d.id,
            created_at: created.toISOString(),
            updated_at: updated.toISOString(),
          } as Order;
        });
      } catch (err) {
        console.warn("getOrders fallback to localStorage due to error:", err);
        const stored = localStorage.getItem("biobox_orders");
        return stored ? JSON.parse(stored) : [];
      }
    }

    const stored = localStorage.getItem("biobox_orders");
    return stored ? JSON.parse(stored) : [];
  };

  const createOrder = async (
    orderData: Partial<Order>,
  ): Promise<Order | null> => {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
    const dataToSave = {
      order_number: orderNumber,
      customer_id: orderData.customer_id!,
      seller_id: user?.id || "unknown",
      status: orderData.status || "pending",
      priority: orderData.priority || "medium",
      total_amount: orderData.total_amount || 0,
      scheduled_date:
        orderData.scheduled_date || new Date().toISOString().slice(0, 10),
      delivery_date: orderData.delivery_date,
      completed_date: orderData.completed_date,
      production_progress: orderData.production_progress ?? 0,
      assigned_operator: orderData.assigned_operator,
      notes: orderData.notes,
      customer_name: orderData.customer_name,
      seller_name: user?.name,
      products: orderData.products || [],
    };

    // Try Firestore first, but robustly fallback to localStorage on any failure
    if (isConnected && db) {
      try {
        const ref = await addDoc(
          collection(db, "orders"),
          sanitizeForFirestore({
            ...dataToSave,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          }),
        );
        const saved: Order = {
          ...dataToSave,
          id: ref.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Order;
        // notify other components that orders changed
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("orders:changed", { detail: { id: saved.id } }));
          }
        } catch {}
        await logActivity({
          userId: user?.id,
          userName: user?.name || "",
          actionType: "create",
          entityType: "order",
          entityId: saved.id,
          entityName: saved.order_number,
          description: `Pedido ${saved.order_number} criado por ${user?.name}`,
          metadata: { seller_id: saved.seller_id },
        });
        return saved;
      } catch (err) {
        console.warn(
          "createOrder: Firestore unavailable, falling back to localStorage:",
          err,
        );
      }
    }

    const orders = await getOrders();
    const saved = {
      ...dataToSave,
      id: `order-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Order;
    localStorage.setItem("biobox_orders", JSON.stringify([saved, ...orders]));
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("orders:changed", { detail: { id: saved.id } }));
      }
    } catch {}
    await logActivity({
      userId: user?.id,
      userName: user?.name || "",
      actionType: "create",
      entityType: "order",
      entityId: saved.id,
      entityName: saved.order_number,
      description: `Pedido ${saved.order_number} criado por ${user?.name}`,
      metadata: { seller_id: saved.seller_id },
    });
    return saved;
  };

  const updateOrder = async (
    orderId: string,
    updates: Partial<Order>,
  ): Promise<Order | null> => {
    const now = new Date().toISOString();
    if (isConnected && db) {
      try {
        await updateDoc(
          doc(db, "orders", orderId),
          sanitizeForFirestore({
            ...updates,
            updated_at: serverTimestamp(),
          }) as any,
        );
        const snap = await getDoc(doc(db, "orders", orderId));
        const data = snap.data() as any;
        const created = (data.created_at?.toDate?.() as Date) || new Date();
        const updated = (data.updated_at?.toDate?.() as Date) || new Date();
        return {
          id: snap.id,
          ...data,
          created_at: created.toISOString(),
          updated_at: updated.toISOString(),
        } as Order;
      } catch (err) {
        console.warn(
          "updateOrder: Firestore unavailable, falling back to localStorage:",
          err,
        );
      }
    }

    const orders = await getOrders();
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, ...updates, updated_at: now } : o,
    );
    localStorage.setItem("biobox_orders", JSON.stringify(updatedOrders));
    return updatedOrders.find((o) => o.id === orderId) || null;
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      console.log("🗑️ Deletando pedido:", orderId);

      if (isConnected && db) {
        try {
          await deleteDoc(doc(db, "orders", orderId));
          console.log("✅ Pedido deletado do Firebase");

          await logActivity({
            userId: user?.id,
            userName: user?.name || "",
            actionType: "delete",
            entityType: "order",
            entityId: orderId,
            entityName: orderId,
            description: `Pedido ${orderId} excluído por ${user?.name}`,
            metadata: {},
          });

          return true;
        } catch (err) {
          console.warn(
            "deleteOrder: Firestore unavailable, falling back to localStorage:",
            err,
          );
        }
      }

      const orders = await getOrders();
      const filtered = orders.filter((o) => o.id !== orderId);
      localStorage.setItem("biobox_orders", JSON.stringify(filtered));
      console.log("✅ Pedido removido do localStorage");
      return true;
    } catch (error) {
      console.error("❌ Erro ao deletar pedido:", error);
      return false;
    }
  };

  const createProduct = async (
    productData: Partial<DbProduct>,
  ): Promise<DbProduct | null> => {
    const nowIso = new Date().toISOString();
    const basePriceValue = parseNumber(
      productData.basePrice ?? productData.base_price,
    );
    const costPriceValue = parseNumber(
      productData.costPrice ?? productData.cost_price,
    );
    const marginValue = parseNumber(productData.margin);

    const base: DbProduct = {
      id: "",
      name: productData.name || "Produto",
      sku: productData.sku || "",
      model: productData.model,
      base_price: basePriceValue,
      basePrice: basePriceValue,
      cost_price: costPriceValue,
      costPrice: costPriceValue,
      margin: marginValue,
      sizes: Array.isArray(productData.sizes) ? productData.sizes : undefined,
      colors: Array.isArray(productData.colors)
        ? productData.colors
        : undefined,
      fabrics: Array.isArray(productData.fabrics)
        ? productData.fabrics
        : undefined,
      models: Array.isArray(productData.models) ? productData.models : [],
      specifications: Array.isArray(productData.specifications)
        ? productData.specifications
        : [],
      images: Array.isArray(productData.images) ? productData.images : [],
      description: productData.description,
      category: productData.category,
      status: productData.status || "active",
      active:
        typeof productData.active === "boolean"
          ? productData.active
          : (productData.status || "active") !== "inactive",
      barcode: productData.barcode,
      created_at: nowIso,
      updated_at: nowIso,
      createdAt:
        typeof productData.createdAt === "string"
          ? productData.createdAt
          : productData.createdAt instanceof Date
            ? productData.createdAt.toISOString()
            : nowIso,
      updatedAt:
        typeof productData.updatedAt === "string"
          ? productData.updatedAt
          : productData.updatedAt instanceof Date
            ? productData.updatedAt.toISOString()
            : nowIso,
    };

    if (isConnected && db) {
      const ref = await addDoc(
        collection(db, "products"),
        sanitizeForFirestore({
          ...base,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        }),
      );
      return normalizeProductRecord(base, ref.id);
    }

    const products = await getProducts();
    const saved = normalizeProductRecord(base, `product-${Date.now()}`);
    localStorage.setItem(
      "biobox_products",
      JSON.stringify([saved, ...products]),
    );
    return saved;
  };

  const updateProduct = async (
    productId: string,
    updates: Partial<DbProduct>,
  ): Promise<DbProduct | null> => {
    const nowIso = new Date().toISOString();

    if (isConnected && db) {
      await updateDoc(
        doc(db, "products", productId),
        sanitizeForFirestore({
          ...updates,
          updated_at: serverTimestamp(),
        }) as any,
      );
      const snap = await getDoc(doc(db, "products", productId));
      const data = snap.data();
      if (!data) {
        return null;
      }
      return normalizeProductRecord(data, snap.id);
    }

    const products = await getProducts();
    const updatedProducts = products.map((p) =>
      p.id === productId
        ? normalizeProductRecord(
            {
              ...p,
              ...updates,
              updated_at: nowIso,
              updatedAt: nowIso,
            },
            productId,
          )
        : p,
    );
    localStorage.setItem("biobox_products", JSON.stringify(updatedProducts));
    return updatedProducts.find((p) => p.id === productId) || null;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (isConnected && db) {
      await deleteDoc(doc(db, "products", productId));
      return true;
    }
    const products = await getProducts();
    const filtered = products.filter((p) => p.id !== productId);
    localStorage.setItem("biobox_products", JSON.stringify(filtered));
    return true;
  };

  const createCustomer = async (
    customerData: Partial<Customer>,
  ): Promise<Customer | null> => {
    const base: Customer = {
      id: "",
      name: customerData.name || "Cliente",
      email: customerData.email || "",
      phone: customerData.phone || "",
      type: customerData.type || "individual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      zip_code: customerData.zip_code,
    } as Customer;

    if (isConnected && db) {
      const ref = await addDoc(
        collection(db, "customers"),
        sanitizeForFirestore({
          ...base,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        }),
      );
      return { ...base, id: ref.id } as Customer;
    }
    const customers = await getCustomers();
    const saved = { ...base, id: `customer-${Date.now()}` };
    localStorage.setItem(
      "biobox_customers",
      JSON.stringify([saved, ...customers]),
    );
    return saved;
  };

  const updateCustomer = async (
    customerId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | null> => {
    const now = new Date().toISOString();
    if (isConnected && db) {
      await updateDoc(
        doc(db, "customers", customerId),
        sanitizeForFirestore({
          ...updates,
          updated_at: serverTimestamp(),
        }) as any,
      );
      const snap = await getDoc(doc(db, "customers", customerId));
      const data = snap.data() as any;
      const created = (data.created_at?.toDate?.() as Date) || new Date();
      const updated = (data.updated_at?.toDate?.() as Date) || new Date();
      return {
        id: snap.id,
        ...data,
        created_at: created.toISOString(),
        updated_at: updated.toISOString(),
      } as Customer;
    }
    const customers = await getCustomers();
    const updated = customers.map((c) =>
      c.id === customerId ? { ...c, ...updates, updated_at: now } : c,
    );
    localStorage.setItem("biobox_customers", JSON.stringify(updated));
    return updated.find((c) => c.id === customerId) || null;
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    if (isConnected && db) {
      await deleteDoc(doc(db, "customers", customerId));
      return true;
    }
    const customers = await getCustomers();
    const filtered = customers.filter((c) => c.id !== customerId);
    localStorage.setItem("biobox_customers", JSON.stringify(filtered));
    return true;
  };

  return {
    isConnected,
    loading,
    getUsers,
    getCustomers,
    getProducts,
    getOrders,
    createOrder,
    updateOrder,
    deleteOrder, // ← FUNÇÃO ADICIONADA NA EXPORTAÇÃO
    createProduct,
    updateProduct,
    deleteProduct,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    checkConnection: async () => {},
  };
}
