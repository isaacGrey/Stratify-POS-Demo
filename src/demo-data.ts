/** Synthetic, browser-local fixtures for the public portfolio demonstration.
 * This is NOT the production data model, authentication service, or API.
 */
export type DemoRole = 'owner' | 'manager' | 'cashier';
export type DemoPayment = 'cash' | 'gcash' | 'maya' | 'card';
export type DemoOrderType = 'takeout' | 'dine_in' | 'delivery';

export interface DemoProduct {
  id: string; name: string; category: string; price: number; cost: number;
  stock: number; reorder: number; emoji: string; active: boolean;
}
export interface DemoBranch { id: string; name: string; location: string; active: boolean; }
export interface DemoSaleLine { productId: string; name: string; price: number; qty: number; }
export interface DemoSale {
  id: string; date: string; branchId: string; cashier: string; type: DemoOrderType;
  payment: DemoPayment; lines: DemoSaleLine[]; subtotal: number;
  discount: number; tax: number; service: number; total: number; tender: number;
}
export interface DemoStaff { id: string; name: string; role: DemoRole; branchId: string; shiftStart: string | null; }
export interface DemoData {
  version: 1; products: DemoProduct[]; branches: DemoBranch[];
  orders: DemoSale[]; staff: DemoStaff[];
  taxRate: number; serviceRate: number; footer: string; promotionActive: boolean;
}
export const DEMO_STORAGE_KEY = 'stratify-portfolio-demo-v1';
export const DEMO_SESSION_KEY = 'stratify-portfolio-demo-user-v1';
export const DEMO_PASSWORD = 'demo1234';
export const demoAccounts = [
  { email: 'owner@demo.stratifypos.app', name: 'Alex Rivera', role: 'owner' as DemoRole, description: 'Full business overview and management' },
  { email: 'manager@demo.stratifypos.app', name: 'Sam Reyes', role: 'manager' as DemoRole, description: 'Inventory, menu, reports, and sales' },
  { email: 'cashier@demo.stratifypos.app', name: 'Jamie Cruz', role: 'cashier' as DemoRole, description: 'Checkout, sales history, and attendance' }
];
const daysAgo = (offset: number, hours = 12) => {
  const value = new Date();
  value.setDate(value.getDate() - offset);
  value.setHours(hours, 10, 0, 0);
  return value.toISOString();
};
const seedProducts: DemoProduct[] = [
  { id:'p1',name:'Spanish Latte',category:'Coffee',price:17500,cost:6900,stock:42,reorder:10,emoji:'☕',active:true },
  { id:'p2',name:'Iced Americano',category:'Coffee',price:13500,cost:4400,stock:48,reorder:10,emoji:'🧊',active:true },
  { id:'p3',name:'Caramel Macchiato',category:'Coffee',price:19500,cost:7600,stock:28,reorder:10,emoji:'🥤',active:true },
  { id:'p4',name:'Matcha Latte',category:'Tea & Matcha',price:18500,cost:8200,stock:22,reorder:8,emoji:'🍵',active:true },
  { id:'p5',name:'Strawberry Matcha',category:'Tea & Matcha',price:21000,cost:9000,stock:8,reorder:10,emoji:'🍓',active:true },
  { id:'p6',name:'Butter Croissant',category:'Pastries',price:11500,cost:5700,stock:17,reorder:6,emoji:'🥐',active:true },
  { id:'p7',name:'Blueberry Cheesecake',category:'Pastries',price:21500,cost:10500,stock:5,reorder:7,emoji:'🍰',active:true },
  { id:'p8',name:'Chocolate Cookie',category:'Pastries',price:9500,cost:3500,stock:36,reorder:8,emoji:'🍪',active:true },
  { id:'p9',name:'Vanilla Cold Brew',category:'Coffee',price:18500,cost:7200,stock:13,reorder:8,emoji:'🥛',active:true },
  { id:'p10',name:'Ham & Cheese Sandwich',category:'Food',price:22500,cost:10200,stock:12,reorder:5,emoji:'🥪',active:true },
  { id:'p11',name:'Classic Hot Chocolate',category:'Tea & Matcha',price:15500,cost:6200,stock:24,reorder:8,emoji:'🍫',active:true },
  { id:'p12',name:'Chicken Pesto Panini',category:'Food',price:26500,cost:13300,stock:6,reorder:6,emoji:'🥙',active:true }
];
const seedBranches: DemoBranch[] = [
  {id:'b1',name:'BGC Flagship',location:'Bonifacio Global City, Taguig',active:true},
  {id:'b2',name:'Makati Branch',location:'Legazpi Village, Makati',active:true}
];
function seedSale(index: number, day: number, hour: number, branchId: string, payment: DemoPayment, picks: [number,number][]): DemoSale {
  const lines = picks.map(([position,qty]) => ({productId:seedProducts[position].id,name:seedProducts[position].name,price:seedProducts[position].price,qty}));
  const subtotal = lines.reduce((total,line)=>total+line.price*line.qty,0);
  return {id:'POS-'+String(1025+index),date:daysAgo(day,hour),branchId,cashier:index%2?'Sam Reyes':'Jamie Cruz',
    type:index%3===0?'dine_in':'takeout',payment,lines,subtotal,discount:0,tax:0,service:0,total:subtotal,tender:subtotal};
}
export function initialDemoData(): DemoData {
  return {
    version:1,
    products:seedProducts.map(product=>({...product})),
    branches:seedBranches.map(branch=>({...branch})),
    orders:[
      seedSale(0,0,9,'b1','cash',[[0,2],[5,1]]),
      seedSale(1,0,10,'b1','gcash',[[3,1],[7,2]]),
      seedSale(2,0,11,'b2','card',[[2,1],[6,1]]),
      seedSale(3,0,13,'b1','cash',[[1,3],[9,1]]),
      seedSale(4,0,15,'b2','maya',[[4,2],[5,1]]),
      seedSale(5,1,12,'b1','card',[[0,2],[8,1]]),
      seedSale(6,1,16,'b2','cash',[[3,1],[10,2]]),
      seedSale(7,2,11,'b1','cash',[[2,3],[6,1]]),
      seedSale(8,2,14,'b2','gcash',[[0,1],[9,2]]),
      seedSale(9,3,10,'b1','cash',[[4,1],[7,3]]),
      seedSale(10,4,14,'b1','maya',[[8,2],[11,1]]),
      seedSale(11,5,13,'b2','card',[[1,2],[5,2]]),
      seedSale(12,6,11,'b1','cash',[[2,2],[6,1]])
    ],
    staff:[
      {id:'s1',name:'Alex Rivera',role:'owner',branchId:'b1',shiftStart:null},
      {id:'s2',name:'Sam Reyes',role:'manager',branchId:'b2',shiftStart:null},
      {id:'s3',name:'Jamie Cruz',role:'cashier',branchId:'b1',shiftStart:null}
    ],
    taxRate:0,serviceRate:0,footer:'Thank you for visiting Stratify Café!',
    promotionActive:true
  };
}
export function readDemoData(): DemoData {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const value: DemoData = JSON.parse(stored);
      if (value.version===1 && Array.isArray(value.products) && Array.isArray(value.orders) && Array.isArray(value.branches) && Array.isArray(value.staff)) return value;
    }
  } catch { /* Storage may be disabled by the visitor. */ }
  return initialDemoData();
}
export function writeDemoData(value: DemoData): void {
  try { localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify(value)); } catch { /* in-memory session still works */ }
}
