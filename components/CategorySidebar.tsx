'use client';

import Link from 'next/link';
import { 
  Briefcase, 
  Gift, 
  Smartphone, 
  Heart, 
  Gamepad2, 
  Watch, 
  Car, 
  ShoppingBag, 
  Backpack, 
  Laptop, 
  CookingPot, 
  Wrench, 
  BookOpen,
  Shirt,
  Baby,
  Eye,
  Sparkles
} from 'lucide-react';

interface Category {
  name: string;
  icon: React.ReactNode;
  href: string;
}

const categories: Category[] = [
  { name: 'Shoes', icon: <Shirt className="w-5 h-5" />, href: '/products?category=shoes' },
  { name: 'Bag', icon: <ShoppingBag className="w-5 h-5" />, href: '/products?category=bag' },
  { name: 'Jewelry', icon: <Sparkles className="w-5 h-5" />, href: '/products?category=jewelry' },
  { name: 'Beauty And Personal Care', icon: <Sparkles className="w-5 h-5" />, href: '/products?category=beauty' },
  { name: "Men's Clothing", icon: <Shirt className="w-5 h-5" />, href: '/products?category=men' },
  { name: "Women's Clothing", icon: <Shirt className="w-5 h-5" />, href: '/products?category=womens' },
  { name: 'Baby Items', icon: <Baby className="w-5 h-5" />, href: '/products?category=baby' },
  { name: 'Eyewear', icon: <Eye className="w-5 h-5" />, href: '/products?category=eyewear' },
  { name: 'Office Supplies', icon: <Briefcase className="w-5 h-5" />, href: '/products?category=office' },
  { name: 'Seasonal Products', icon: <Gift className="w-5 h-5" />, href: '/products?category=seasonal' },
  { name: 'Phone Accessories', icon: <Smartphone className="w-5 h-5" />, href: '/products?category=phone' },
  { name: 'Sports And Fitness', icon: <Heart className="w-5 h-5" />, href: '/products?category=sports' },
  { name: 'Entertainment Items', icon: <Gamepad2 className="w-5 h-5" />, href: '/products?category=entertainment' },
  { name: 'Watches', icon: <Watch className="w-5 h-5" />, href: '/products?category=watches' },
  { name: 'Automobile Items', icon: <Car className="w-5 h-5" />, href: '/products?category=automobile' },
  { name: 'Groceries And Pets', icon: <ShoppingBag className="w-5 h-5" />, href: '/products?category=groceries' },
  { name: 'Outdoor And Travelling', icon: <Backpack className="w-5 h-5" />, href: '/products?category=outdoor' },
  { name: 'Electronics And Gadgets', icon: <Laptop className="w-5 h-5" />, href: '/products?category=electronics' },
  { name: 'Kitchen Gadgets', icon: <CookingPot className="w-5 h-5" />, href: '/products?category=kitchen' },
  { name: 'Tools And Home Improvement', icon: <Wrench className="w-5 h-5" />, href: '/products?category=tools' },
  { name: 'School Supplies', icon: <BookOpen className="w-5 h-5" />, href: '/products?category=school' },
];

export function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-0 self-start h-screen overflow-y-auto scrollbar-hide" style={{ paddingTop: '80px' }}>
      <div className="p-4">
        <h2 className="text-lg font-bold text-red-600 mb-4 uppercase">Category</h2>
        <nav className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-black hover:bg-gray-100 rounded transition-colors"
            >
              <span className="text-gray-600 flex-shrink-0">{category.icon}</span>
              <span className="truncate">{category.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

