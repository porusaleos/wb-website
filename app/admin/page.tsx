"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Check, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getMenuItems,
  getPendingOrders,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  deleteOrder,
  uploadImage,
  subscribeToMenuItems,
  subscribeToOrders,
  type MenuItem,
  type Order,
} from "@/lib/supabase"

export default function AdminPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form states
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "",
    image: null as File | null,
    imagePreview: "",
  })

  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn")
    const loginTime = localStorage.getItem("adminLoginTime")

    if (!isLoggedIn || !loginTime || Date.now() - Number.parseInt(loginTime) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem("adminLoggedIn")
      localStorage.removeItem("adminLoginTime")
      router.push("/admin/login")
      return
    }

    loadData()

    // Subscribe to real-time changes
    const menuSubscription = subscribeToMenuItems((payload) => {
      console.log("Menu updated:", payload)
      loadMenuItems()
    })

    const ordersSubscription = subscribeToOrders((payload) => {
      console.log("Orders updated:", payload)
      loadOrders()
    })

    return () => {
      menuSubscription.unsubscribe()
      ordersSubscription.unsubscribe()
    }
  }, [router])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadMenuItems(), loadOrders()])
    setLoading(false)
  }

  const loadMenuItems = async () => {
    const items = await getMenuItems()
    setMenuItems(items)
  }

  const loadOrders = async () => {
    const orders = await getPendingOrders()
    setOrders(orders)
  }

  const handleAddMenu = async () => {
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      alert("Nama, harga, dan kategori harus diisi!")
      return
    }

    setLoading(true)

    try {
      let imageUrl = null
      if (menuForm.image) {
        imageUrl = await uploadImage(menuForm.image)
      }

      const result = await addMenuItem({
        name: menuForm.name,
        price: Number.parseInt(menuForm.price),
        category: menuForm.category,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      })

      if (result) {
        setMenuForm({ name: "", price: "", category: "", image: null, imagePreview: "" })
        setIsAddMenuOpen(false)
        await loadMenuItems()
      } else {
        alert("Gagal menambah menu!")
      }
    } catch (error) {
      console.error("Error adding menu:", error)
      alert("Terjadi kesalahan!")
    } finally {
      setLoading(false)
    }
  }

  const handleEditMenu = async () => {
    if (!menuForm.name || !menuForm.price || !menuForm.category || !editingItem) {
      alert("Nama, harga, dan kategori harus diisi!")
      return
    }

    setLoading(true)

    try {
      let imageUrl = editingItem.image_url
      if (menuForm.image) {
        const newImageUrl = await uploadImage(menuForm.image)
        if (newImageUrl) imageUrl = newImageUrl
      }

      const success = await updateMenuItem(editingItem.id, {
        name: menuForm.name,
        price: Number.parseInt(menuForm.price),
        category: menuForm.category,
        image_url: imageUrl,
      })

      if (success) {
        setEditingItem(null)
        setMenuForm({ name: "", price: "", category: "", image: null, imagePreview: "" })
        await loadMenuItems()
      } else {
        alert("Gagal mengupdate menu!")
      }
    } catch (error) {
      console.error("Error updating menu:", error)
      alert("Terjadi kesalahan!")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenu = async (id: number) => {
    if (confirm("Yakin ingin menghapus menu ini?")) {
      setLoading(true)
      const success = await deleteMenuItem(id)
      if (success) {
        await loadMenuItems()
      } else {
        alert("Gagal menghapus menu!")
      }
      setLoading(false)
    }
  }

  const handleCompleteOrderClick = (order: Order) => {
    setOrderToComplete(order)
    setShowCompleteDialog(true)
  }

  const handleCompleteOrderConfirm = async () => {
    if (orderToComplete) {
      setLoading(true)
      const success = await deleteOrder(orderToComplete.id)
      if (success) {
        setShowCompleteDialog(false)
        setOrderToComplete(null)
        await loadOrders()
        alert(`Pesanan ${orderToComplete.customer_name} telah diselesaikan!`)
      } else {
        alert("Gagal menyelesaikan pesanan!")
      }
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn")
    localStorage.removeItem("adminLoginTime")
    router.push("/admin/login")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMenuForm({ ...menuForm, image: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setMenuForm((prev) => ({ ...prev, imagePreview: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item)
    setMenuForm({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      image: null,
      imagePreview: item.image_url || "",
    })
  }

  if (loading && menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 w-full">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Kembali</span>
                </Button>
              </Link>
              <h1 className="text-sm sm:text-base lg:text-xl font-semibold ml-2 sm:ml-4 truncate">
                Admin - Waroeng Bakar
              </h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="text-xs sm:text-sm lg:text-base">
              Pesanan ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="menu" className="text-xs sm:text-sm lg:text-base">
              Kelola Menu
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg lg:text-xl">Daftar Pesanan</CardTitle>
                <CardDescription>Kelola pesanan masuk dari pelanggan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 w-full">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Tidak ada pesanan yang menunggu</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="p-3 sm:p-4 w-full">
                        <div className="flex flex-col gap-4 w-full">
                          <div className="space-y-2 flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm sm:text-base">{order.customer_name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Menunggu
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {order.type === "dine-in" ? `Meja ${order.table_number}` : "Takeaway"}
                              </Badge>
                            </div>

                            {order.type === "takeaway" && (
                              <div className="text-xs sm:text-sm text-gray-600">
                                <p className="truncate">Alamat: {order.address}</p>
                                <p>Telepon: {order.phone_number}</p>
                              </div>
                            )}

                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="text-xs sm:text-sm">
                                  {item.quantity}x {item.name} - Rp{" "}
                                  {(item.price * item.quantity).toLocaleString("id-ID")}
                                </div>
                              ))}
                            </div>

                            <div className="font-semibold text-sm sm:text-base">
                              Total: Rp {order.total.toLocaleString("id-ID")}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleCompleteOrderClick(order)}
                            size="sm"
                            className="w-full sm:w-auto sm:self-end"
                            disabled={loading}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Selesai
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col gap-4 w-full">
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl">Kelola Menu</CardTitle>
                    <CardDescription>Tambah, edit, atau hapus item menu</CardDescription>
                  </div>
                  <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Menu
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Tambah Menu Baru</DialogTitle>
                        <DialogDescription>Isi form di bawah untuk menambah menu baru</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 w-full">
                        <div>
                          <Label htmlFor="name">Nama Menu</Label>
                          <Input
                            id="name"
                            value={menuForm.name}
                            onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                            placeholder="Contoh: Nasi Gudeg"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Harga</Label>
                          <Input
                            id="price"
                            type="number"
                            value={menuForm.price}
                            onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                            placeholder="Contoh: 25000"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Kategori</Label>
                          <Select
                            value={menuForm.category}
                            onValueChange={(value) => setMenuForm({ ...menuForm, category: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                              <SelectItem value="Minuman">Minuman</SelectItem>
                              <SelectItem value="Dessert">Dessert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="image">Foto Menu (Opsional)</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="cursor-pointer w-full"
                          />
                          {menuForm.imagePreview && (
                            <div className="mt-2">
                              <img
                                src={menuForm.imagePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddMenu} disabled={loading} className="w-full">
                          {loading ? "Menambah..." : "Tambah Menu"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
                  {menuItems.map((item) => (
                    <Card key={item.id} className="w-full">
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
                        <div className="flex items-center justify-between mb-3 w-full">
                          <span className="text-sm sm:text-base lg:text-lg font-semibold text-green-600 truncate">
                            Rp {item.price.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(item)}
                                className="flex-1 w-full"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Menu</DialogTitle>
                                <DialogDescription>Edit informasi menu</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 w-full">
                                <div>
                                  <Label htmlFor="edit-name">Nama Menu</Label>
                                  <Input
                                    id="edit-name"
                                    value={menuForm.name}
                                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-price">Harga</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={menuForm.price}
                                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Kategori</Label>
                                  <Select
                                    value={menuForm.category}
                                    onValueChange={(value) => setMenuForm({ ...menuForm, category: value })}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Makanan Utama">Makanan Utama</SelectItem>
                                      <SelectItem value="Minuman">Minuman</SelectItem>
                                      <SelectItem value="Dessert">Dessert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="edit-image">Foto Menu (Opsional)</Label>
                                  <Input
                                    id="edit-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="cursor-pointer w-full"
                                  />
                                  {menuForm.imagePreview && (
                                    <div className="mt-2">
                                      <img
                                        src={menuForm.imagePreview || "/placeholder.svg"}
                                        alt="Preview"
                                        className="w-20 h-20 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={handleEditMenu} disabled={loading} className="w-full">
                                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMenu(item.id)}
                            className="flex-1 w-full"
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 sm:ml-2 text-xs sm:text-sm">Hapus</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialog for Completing Orders */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent className="w-full max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan Pesanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menyelesaikan pesanan dari <strong>{orderToComplete?.customer_name}</strong>?
              <br />
              <br />
              ⚠️ <strong>Pesanan akan dihapus permanen</strong> dari daftar dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCompleteDialog(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteOrderConfirm} disabled={loading}>
              {loading ? "Memproses..." : "Ya, Selesaikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
