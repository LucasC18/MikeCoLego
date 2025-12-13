export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  inStock: boolean;
}

export type Category = 
  | "Star Wars"
  | "Harry Potter"
  | "Marvel"
  | "DC Comics"
  | "Technic"
  | "City"
  | "Creator"
  | "Ideas";

export interface CartItem extends Product {
  quantity: number;
}
