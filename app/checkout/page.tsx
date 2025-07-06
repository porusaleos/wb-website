"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMenuItems, addOrder, type MenuItem } from "@/lib/supabase"

export default function CheckoutPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ [key: number]: number }>({})
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in")
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const items = await getMenuItems()
    setMenuItems(items)

    const savedCart = localStorage.getItem("restaurant_cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const updateCartItem = (itemId: number, change: number) => {
    setCart((prev) => {
      const newCart = { ...prev }
      const currentCount = newCart[itemId] || 0
      const newCount = currentCount + change

      if (newCount <= 0) {
        delete newCart[itemId]
      } else {
        newCart[itemId] = newCount
      }
      localStorage.setItem("restaurant_cart", JSON.stringify(newCart))
      return newCart
    })
  }

  const cartItems = Object.entries(cart)
    .map(([itemId, quantity]) => {
      const item = menuItems.find((m) => m.id === Number.parseInt(itemId))
      return item ? { ...item, quantity } : null
    })
    .filter(Boolean)

  const totalPrice = cartItems.reduce((sum, item) => sum + item!.price * item!.quantity, 0)

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert("Nama pemesan harus diisi!")
      return
    }

    if (orderType === "dine-in" && !tableNumber.trim()) {
      alert("Nomor meja harus diisi!")
      return
    }

    if (orderType === "takeaway" && (!address.trim() || !phoneNumber.trim())) {
      alert("Alamat dan nomor telepon harus diisi!")
      return
    }

    if (cartItems.length === 0) {
      alert("Keranjang masih kosong!")
      return
    }

    setLoading(true)

    try {
      const orderData = {
        customer_name: customerName.trim(),
        type: orderType,
        ...(orderType === "dine-in"
          ? { table_number: tableNumber.trim() }
          : {
              address: address.trim(),
              phone_number: phoneNumber.trim(),
            }),
        items: cartItems.map((item) => ({
          name: item!.name,
          quantity: item!.quantity,
          price: item!.price,
        })),
        total: totalPrice,
      }

      const result = await addOrder(orderData)

      if (result) {
        localStorage.removeItem("restaurant_cart")
        alert("Pesanan berhasil dibuat!")
        router.push("/")
      } else {
        alert("Gagal membuat pesanan. Silakan coba lagi.")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-14 sm:h-16 w-full">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold ml-4 truncate">Checkout - Waroeng Bakar</h1>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 w-full">
          {/* Order Summary */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg lg:text-xl">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item!.id} className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{item!.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Rp {item!.price.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => updateCartItem(item!.id, -1)}>
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-4 sm:w-6 lg:w-8 text-center text-xs sm:text-sm lg:text-base">
                        {item!.quantity}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => updateCartItem(item!.id, 1)}>
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <div className="ml-1 sm:ml-2 font-semibold text-xs sm:text-sm lg:text-base flex-shrink-0">
                      Rp {(item!.price * item!.quantity).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))
              )}
              {cartItems.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm sm:text-base lg:text-lg font-bold">
                    <span>Total:</span>
                    <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg lg:text-xl">Detail Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Order Type */}
              <div>
                <Label className="text-sm sm:text-base font-medium">Tipe Pesanan</Label>
                <RadioGroup
                  value={orderType}
                  onValueChange={(value: "dine-in" | "takeaway") => setOrderType(value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dine-in" id="dine-in" />
                    <Label htmlFor="dine-in" className="text-sm sm:text-base">
                      Makan di Tempat
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="takeaway" id="takeaway" />
                    <Label htmlFor="takeaway" className="text-sm sm:text-base">
                      Takeaway
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Customer Name */}
              <div>
                <Label htmlFor="customerName" className="text-sm sm:text-base">
                  Nama Pemesan *
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama pemesan"
                  className="mt-1 w-full"
                />
              </div>

              {/* Conditional Fields */}
              {orderType === "dine-in" ? (
                <div>
                  <Label htmlFor="tableNumber" className="text-sm sm:text-base">
                    Nomor Meja *
                  </Label>
                  <Input
                    id="tableNumber"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Contoh: 5"
                    type="number"
                    className="mt-1 w-full"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="address" className="text-sm sm:text-base">
                      Alamat *
                    </Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                      className="mt-1 w-full resize-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm sm:text-base">
                      Nomor Telepon *
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      type="tel"
                      className="mt-1 w-full"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleSubmitOrder}
                className="w-full"
                size="lg"
                disabled={cartItems.length === 0 || loading}
              >
                {loading ? "Memproses..." : "Buat Pesanan"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
