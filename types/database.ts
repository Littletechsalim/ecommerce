export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  rating: number | null
  stock: number
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product: Product
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  created_at: string
  product: Product | null
}

export interface Order {
  id: string
  user_id: string
  status: "pending" | "paid" | "fulfilled" | "cancelled"
  total: number
  created_at: string
  stripe_session_id: string | null
  order_items: OrderItem[]
}
