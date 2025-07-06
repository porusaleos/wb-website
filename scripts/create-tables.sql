-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dine-in', 'takeaway')),
  table_number TEXT,
  address TEXT,
  phone_number TEXT,
  items JSONB NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample menu items
INSERT INTO menu_items (name, price, category, image_url) VALUES
('Nasi Goreng Spesial', 25000, 'Makanan Utama', '/placeholder.svg?height=200&width=200'),
('Ayam Bakar', 30000, 'Makanan Utama', '/placeholder.svg?height=200&width=200'),
('Gado-Gado', 20000, 'Makanan Utama', '/placeholder.svg?height=200&width=200'),
('Es Teh Manis', 5000, 'Minuman', '/placeholder.svg?height=200&width=200'),
('Jus Jeruk', 8000, 'Minuman', '/placeholder.svg?height=200&width=200'),
('Es Campur', 12000, 'Dessert', '/placeholder.svg?height=200&width=200');

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on menu_items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on menu_items" ON menu_items FOR DELETE USING (true);

CREATE POLICY "Allow public read access on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on orders" ON orders FOR DELETE USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create policy for storage bucket
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images');
CREATE POLICY "Allow public access" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Allow public updates" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images');
CREATE POLICY "Allow public deletes" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images');
