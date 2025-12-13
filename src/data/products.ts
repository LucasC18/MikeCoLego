import { Product, Category } from "@/types/product";

export const categories: Category[] = [
  "Star Wars",
  "Harry Potter",
  "Marvel",
  "DC Comics",
  "Technic",
  "City",
  "Creator",
  "Ideas",
];

export const products: Product[] = [
  {
    id: "1",
    name: "Millennium Falcon",
    category: "Star Wars",
    image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "2",
    name: "Hogwarts Castle",
    category: "Harry Potter",
    image: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "3",
    name: "Death Star",
    category: "Star Wars",
    image: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&h=400&fit=crop",
    inStock: false,
  },
  {
    id: "4",
    name: "Iron Man Helmet",
    category: "Marvel",
    image: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "5",
    name: "Batmobile Tumbler",
    category: "DC Comics",
    image: "https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "6",
    name: "Porsche 911 GT3 RS",
    category: "Technic",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop",
    inStock: false,
  },
  {
    id: "7",
    name: "Police Station",
    category: "City",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "8",
    name: "Diagon Alley",
    category: "Harry Potter",
    image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "9",
    name: "X-Wing Starfighter",
    category: "Star Wars",
    image: "https://images.unsplash.com/photo-1608889175250-c3b0c1667d3a?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "10",
    name: "Spider-Man Daily Bugle",
    category: "Marvel",
    image: "https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=400&h=400&fit=crop",
    inStock: false,
  },
  {
    id: "11",
    name: "Medieval Castle",
    category: "Creator",
    image: "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "12",
    name: "NASA Apollo Saturn V",
    category: "Ideas",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop",
    inStock: true,
  },
];
