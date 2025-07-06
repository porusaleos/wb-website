// Utility functions for managing localStorage data

export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  image: string
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  customerName: string
  type: "dine-in" | "takeaway"
  tableNumber?: string
  address?: string
  phoneNumber?: string
  items: OrderItem[]
  total: number
  status: "pending" | "completed"
  createdAt: string
}

// Default data
const defaultMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Nasi Goreng Spesial",
    price: 25000,
    category: "Makanan Utama",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "Ayam Bakar",
    price: 30000,
    category: "Makanan Utama",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "Gado-Gado",
    price: 20000,
    category: "Makanan Utama",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 4,
    name: "Es Teh Manis",
    price: 5000,
    category: "Minuman",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 5,
    name: "Jus Jeruk",
    price: 8000,
    category: "Minuman",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 6,
    name: "Es Campur",
    price: 12000,
    category: "Dessert",
    image: "/placeholder.svg?height=200&width=200",
  },
]

// Menu Items Management
export const getMenuItems = (): MenuItem[] => {
  if (typeof window === "undefined") return defaultMenuItems
  const stored = localStorage.getItem("restaurant_menu")
  return stored ? JSON.parse(stored) : defaultMenuItems
}

export const saveMenuItems = (items: MenuItem[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("restaurant_menu", JSON.stringify(items))
  }
}

export const addMenuItem = (item: Omit<MenuItem, "id">): MenuItem => {
  const items = getMenuItems()
  const newItem = { ...item, id: Date.now() }
  const updatedItems = [...items, newItem]
  saveMenuItems(updatedItems)
  return newItem
}

export const updateMenuItem = (id: number, updates: Partial<MenuItem>): void => {
  const items = getMenuItems()
  const updatedItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item))
  saveMenuItems(updatedItems)
}

export const deleteMenuItem = (id: number): void => {
  const items = getMenuItems()
  const updatedItems = items.filter((item) => item.id !== id)
  saveMenuItems(updatedItems)
}

// Orders Management
export const getOrders = (): Order[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("restaurant_orders")
  return stored ? JSON.parse(stored) : []
}

export const saveOrders = (orders: Order[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("restaurant_orders", JSON.stringify(orders))
  }
}

export const addOrder = (order: Omit<Order, "id" | "createdAt" | "status">): Order => {
  const orders = getOrders()
  const newOrder: Order = {
    ...order,
    id: Date.now(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  const updatedOrders = [...orders, newOrder]
  saveOrders(updatedOrders)
  return newOrder
}

export const deleteOrder = (id: number): void => {
  const orders = getOrders()
  const updatedOrders = orders.filter((order) => order.id !== id)
  saveOrders(updatedOrders)
}

export const getPendingOrders = (): Order[] => {
  return getOrders().filter((order) => order.status === "pending")
}
