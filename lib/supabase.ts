import { createClient } from "@supabase/supabase-js"

// Environment variables dengan fallback untuk development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create Supabase client only if credentials are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Database Types
export interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  image_url: string | null
  created_at: string
}

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  customer_name: string
  type: "dine-in" | "takeaway"
  table_number?: string
  address?: string
  phone_number?: string
  items: OrderItem[]
  total: number
  status: "pending" | "completed"
  created_at: string
}

// Fallback data untuk demo
const fallbackMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Nasi Goreng Spesial",
    price: 25000,
    category: "Makanan Utama",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Ayam Bakar",
    price: 30000,
    category: "Makanan Utama",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Gado-Gado",
    price: 20000,
    category: "Makanan Utama",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Es Teh Manis",
    price: 5000,
    category: "Minuman",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Jus Jeruk",
    price: 8000,
    category: "Minuman",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: "Es Campur",
    price: 12000,
    category: "Dessert",
    image_url: "/placeholder.svg?height=200&width=200",
    created_at: new Date().toISOString(),
  },
]

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return supabase !== null && supabaseUrl && supabaseAnonKey
}

// Initialize localStorage with fallback data
const initializeLocalStorage = () => {
  if (typeof window !== "undefined") {
    const existingMenu = localStorage.getItem("restaurant_menu")
    const existingOrders = localStorage.getItem("restaurant_orders")

    if (!existingMenu) {
      localStorage.setItem("restaurant_menu", JSON.stringify(fallbackMenuItems))
    }

    if (!existingOrders) {
      localStorage.setItem("restaurant_orders", JSON.stringify([]))
    }
  }
}

// Menu Functions dengan fallback yang aman
export const getMenuItems = async (): Promise<MenuItem[]> => {
  // Initialize localStorage first
  if (typeof window !== "undefined") {
    initializeLocalStorage()
  }

  // Jika Supabase tidak dikonfigurasi, langsung pakai localStorage
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, using localStorage fallback")
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("restaurant_menu")
      return stored ? JSON.parse(stored) : fallbackMenuItems
    }
    return fallbackMenuItems
  }

  try {
    const { data, error } = await supabase!.from("menu_items").select("*").order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching menu items:", error)
      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("restaurant_menu")
        return stored ? JSON.parse(stored) : fallbackMenuItems
      }
      return fallbackMenuItems
    }

    // Save to localStorage as backup
    if (data && data.length > 0 && typeof window !== "undefined") {
      localStorage.setItem("restaurant_menu", JSON.stringify(data))
    }

    return data || fallbackMenuItems
  } catch (error) {
    console.error("Supabase connection error:", error)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("restaurant_menu")
      return stored ? JSON.parse(stored) : fallbackMenuItems
    }
    return fallbackMenuItems
  }
}

export const addMenuItem = async (item: Omit<MenuItem, "id" | "created_at">): Promise<MenuItem | null> => {
  const newItem = { ...item, id: Date.now(), created_at: new Date().toISOString() }

  // Always save to localStorage first
  if (typeof window !== "undefined") {
    const items = await getMenuItems()
    const updatedItems = [...items, newItem]
    localStorage.setItem("restaurant_menu", JSON.stringify(updatedItems))
  }

  if (!isSupabaseConfigured()) {
    return newItem
  }

  try {
    const { data, error } = await supabase!.from("menu_items").insert([item]).select().single()

    if (error) {
      console.error("Error adding menu item:", error)
      return newItem // Return localStorage version
    }

    return data || newItem
  } catch (error) {
    console.error("Supabase connection error:", error)
    return newItem
  }
}

export const updateMenuItem = async (id: number, updates: Partial<MenuItem>): Promise<boolean> => {
  // Always update localStorage first
  if (typeof window !== "undefined") {
    const items = await getMenuItems()
    const updatedItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    localStorage.setItem("restaurant_menu", JSON.stringify(updatedItems))
  }

  if (!isSupabaseConfigured()) {
    return true
  }

  try {
    const { error } = await supabase!.from("menu_items").update(updates).eq("id", id)

    if (error) {
      console.error("Error updating menu item:", error)
    }

    return true
  } catch (error) {
    console.error("Supabase connection error:", error)
    return true
  }
}

export const deleteMenuItem = async (id: number): Promise<boolean> => {
  // Always delete from localStorage first
  if (typeof window !== "undefined") {
    const items = await getMenuItems()
    const updatedItems = items.filter((item) => item.id !== id)
    localStorage.setItem("restaurant_menu", JSON.stringify(updatedItems))
  }

  if (!isSupabaseConfigured()) {
    return true
  }

  try {
    const { error } = await supabase!.from("menu_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting menu item:", error)
    }

    return true
  } catch (error) {
    console.error("Supabase connection error:", error)
    return true
  }
}

// Order Functions
export const getOrders = async (): Promise<Order[]> => {
  if (typeof window !== "undefined") {
    initializeLocalStorage()
  }

  if (!isSupabaseConfigured()) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("restaurant_orders")
      return stored ? JSON.parse(stored) : []
    }
    return []
  }

  try {
    const { data, error } = await supabase!.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("restaurant_orders")
        return stored ? JSON.parse(stored) : []
      }
      return []
    }

    // Save to localStorage as backup
    if (data && typeof window !== "undefined") {
      localStorage.setItem("restaurant_orders", JSON.stringify(data))
    }

    return data || []
  } catch (error) {
    console.error("Supabase connection error:", error)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("restaurant_orders")
      return stored ? JSON.parse(stored) : []
    }
    return []
  }
}

export const getPendingOrders = async (): Promise<Order[]> => {
  const orders = await getOrders()
  return orders.filter((order) => order.status === "pending")
}

export const addOrder = async (order: Omit<Order, "id" | "created_at" | "status">): Promise<Order | null> => {
  const newOrder: Order = {
    ...order,
    id: Date.now(),
    status: "pending",
    created_at: new Date().toISOString(),
  }

  // Always save to localStorage first
  if (typeof window !== "undefined") {
    const orders = await getOrders()
    const updatedOrders = [...orders, newOrder]
    localStorage.setItem("restaurant_orders", JSON.stringify(updatedOrders))
  }

  if (!isSupabaseConfigured()) {
    return newOrder
  }

  try {
    const { data, error } = await supabase!
      .from("orders")
      .insert([{ ...order, status: "pending" }])
      .select()
      .single()

    if (error) {
      console.error("Error adding order:", error)
      return newOrder
    }

    return data || newOrder
  } catch (error) {
    console.error("Supabase connection error:", error)
    return newOrder
  }
}

export const deleteOrder = async (id: number): Promise<boolean> => {
  // Always delete from localStorage first
  if (typeof window !== "undefined") {
    const orders = await getOrders()
    const updatedOrders = orders.filter((order) => order.id !== id)
    localStorage.setItem("restaurant_orders", JSON.stringify(updatedOrders))
  }

  if (!isSupabaseConfigured()) {
    return true
  }

  try {
    const { error } = await supabase!.from("orders").delete().eq("id", id)

    if (error) {
      console.error("Error deleting order:", error)
    }

    return true
  } catch (error) {
    console.error("Supabase connection error:", error)
    return true
  }
}

// Image Upload Function
export const uploadImage = async (file: File, bucket = "menu-images"): Promise<string | null> => {
  // Always create base64 fallback
  const createBase64 = (): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    })
  }

  if (!isSupabaseConfigured()) {
    return await createBase64()
  }

  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase!.storage.from(bucket).upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading image:", uploadError)
      return await createBase64()
    }

    const { data } = supabase!.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  } catch (error) {
    console.error("Supabase connection error:", error)
    return await createBase64()
  }
}

// Real-time subscriptions
export const subscribeToMenuItems = (callback: (payload: any) => void) => {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, real-time updates disabled")
    return { unsubscribe: () => {} }
  }

  try {
    return supabase!
      .channel("menu_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, callback)
      .subscribe()
  } catch (error) {
    console.error("Error setting up real-time subscription:", error)
    return { unsubscribe: () => {} }
  }
}

export const subscribeToOrders = (callback: (payload: any) => void) => {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, real-time updates disabled")
    return { unsubscribe: () => {} }
  }

  try {
    return supabase!
      .channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, callback)
      .subscribe()
  } catch (error) {
    console.error("Error setting up real-time subscription:", error)
    return { unsubscribe: () => {} }
  }
}

// Connection status check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const { data, error } = await supabase!.from("menu_items").select("count").limit(1)
    return !error
  } catch (error) {
    console.error("Supabase connection check failed:", error)
    return false
  }
}
