"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCart, Plus, Minus, RefreshCw, CheckCircle, Wifi, WifiOff } from "lucide-react"
import Link from "next/link"
import { getMenuItems, subscribeToMenuItems, checkSupabaseConnection, type MenuItem } from "@/lib/supabase"

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ [key: number]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [loading, setLoading] = useState(true)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null)
  const [showConnectionAlert, setShowConnectionAlert] = useState(true)

  const categories = ["Semua", "Makanan Utama", "Minuman", "Dessert"]

  useEffect(() => {
    loadMenuItems()
    checkConnection()

    // Load cart from localStorage
    const savedCart = localStorage.getItem("restaurant_cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    // Subscribe to real-time changes
    const subscription = subscribeToMenuItems((payload) => {
      console.log("Menu updated:", payload)
      loadMenuItems()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Auto-hide connection alert after success
  useEffect(() => {
    if (isSupabaseConnected === true) {
      const timer = setTimeout(() => {
        setShowConnectionAlert(false)
      }, 2000) // Hide after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [isSupabaseConnected])

  const checkConnection = async () => {
    const connected = await checkSupabaseConnection()
    setIsSupabaseConnected(connected)
  }

  const loadMenuItems = async () => {
    setLoading(true)
    try {
      const items = await getMenuItems()
      setMenuItems(items)
    } catch (error) {
      console.error("Error loading menu items:", error)
      // Fallback akan dihandle di getMenuItems
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = {
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1,
      }
      localStorage.setItem("restaurant_cart", JSON.stringify(newCart))
      return newCart
    })
  }

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId]--
      } else {
        delete newCart[itemId]
      }
      localStorage.setItem("restaurant_cart", JSON.stringify(newCart))
      return newCart
    })
  }

  const filteredItems =
    selectedCategory === "Semua" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  const cartItemsCount = Object.values(cart).reduce((sum, count) => sum + count, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16 w-full">
            <div className="flex items-center min-w-0 flex-1">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Waroeng Bakar</h1>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link href="/checkout">
                <Button variant="outline" size="sm" className="relative bg-transparent text-xs sm:text-sm px-2 sm:px-4">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Keranjang</span>
                  <span className="sm:hidden">Cart</span>
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Connection Status - Auto hide after success */}
        {showConnectionAlert && isSupabaseConnected !== null && (
          <Alert
            className={`mb-4 transition-all duration-500 ${
              isSupabaseConnected === true
                ? "border-green-200 bg-green-50"
                : isSupabaseConnected === false
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-center">
              {isSupabaseConnected === true ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : isSupabaseConnected === false ? (
                <WifiOff className="h-4 w-4 text-yellow-600" />
              ) : (
                <Wifi className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className="ml-2">
                {isSupabaseConnected === true
                  ? "✅ Terhubung ke database cloud - Data tersinkronisasi real-time"
                  : isSupabaseConnected === false
                    ? "⚠️ Mode offline - Data tersimpan lokal di browser"
                    : "🔄 Mengecek koneksi database..."}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8 w-full">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4">Kategori Menu</h2>
          <div className="flex flex-wrap gap-2 w-full">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden w-full">
              <div className="aspect-square bg-gray-200 w-full">
                <img
                  src={item.image_url || "/placeholder.svg?height=200&width=200"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{item.name}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base lg:text-xl font-bold text-green-600 truncate">
                    Rp {item.price.toLocaleString("id-ID")}
                  </span>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {cart[item.id] > 0 && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="font-semibold text-xs sm:text-sm lg:text-base min-w-[16px] sm:min-w-[20px] text-center">
                          {cart[item.id]}
                        </span>
                      </>
                    )}
                    <Button size="sm" onClick={() => addToCart(item.id)}>
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada menu dalam kategori ini</p>
          </div>
        )}
      </main>
    </div>
  )
}
