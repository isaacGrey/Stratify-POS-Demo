/** Synthetic, browser-local fixtures for the public portfolio demonstration.
 * This is NOT the production data model, authentication service, or API.
 */
export type DemoRole = 'owner' | 'manager' | 'cashier';
export type DemoPayment = 'cash' | 'gcash' | 'maya' | 'card';
export type DemoOrderType = 'standard' | 'takeout' | 'dine_in' | 'delivery';

export interface DemoProduct {
  id: string; name: string; category: string; price: number; cost: number;
  stock: number; reorder: number; emoji: string; active: boolean; kind?:DemoKind; itemType?:DemoItemType; itemClass?:DemoItemClass; trackInventory?:boolean; sku?:string; barcode?:string;
}
export interface DemoBranch { id: string; name: string; location: string; active: boolean; }
export interface DemoSaleLine { productId: string; name: string; price: number; qty: number; }
export interface DemoSale {
  id: string; date: string; branchId: string; cashier: string; type: DemoOrderType;
  payment: DemoPayment; lines: DemoSaleLine[]; subtotal: number;
  discount: number; tax: number; service: number; total: number; tender: number; customerId?:string;
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
  { id:'p12',name:'Chicken Pesto Panini',category:'Food',price:26500,cost:13300,stock:6,reorder:6,emoji:'🥙',active:true },
  { id:'svc1',name:'Gym Monthly Membership',category:'Gym Memberships',price:149900,cost:0,stock:0,reorder:0,emoji:'🏋️',active:true,kind:'service',itemType:'membership',itemClass:'membership_plan' },
  { id:'svc2',name:'Dental Care Plan',category:'Dental Memberships',price:299900,cost:0,stock:0,reorder:0,emoji:'🦷',active:true,kind:'service',itemType:'membership',itemClass:'membership_plan' },
  { id:'r1',name:'Motorcycle Engine Oil',category:'Retail',price:45000,cost:26000,stock:45,reorder:12,emoji:'🛢️',active:true,kind:'physical' },
  { id:'r2',name:'Premium Rice 5kg',category:'Grocery',price:32500,cost:24000,stock:70,reorder:15,emoji:'🍚',active:true,kind:'physical' },
  { id:'r3',name:'Cotton T-Shirt',category:'Apparel',price:49900,cost:22000,stock:32,reorder:10,emoji:'👕',active:true,kind:'physical' },
  { id:'r4',name:'Motorcycle Brake Pads',category:'Motorcycle Parts',price:65000,cost:36500,stock:18,reorder:6,emoji:'🏍️',active:true,kind:'physical' },
  { id:'r5',name:'Shampoo 250ml',category:'Retail',price:18500,cost:11000,stock:46,reorder:12,emoji:'🧴',active:true,kind:'physical' },
  { id:'r6',name:'Notebook A5',category:'Office Supplies',price:8500,cost:3900,stock:60,reorder:12,emoji:'📓',active:true,kind:'physical' },
  { id:'svc3',name:'Dental Cleaning',category:'Clinical Services',price:180000,cost:0,stock:0,reorder:0,emoji:'🦷',active:true,kind:'service' },
  { id:'svc4',name:'Gym Day Pass',category:'Fitness Services',price:25000,cost:0,stock:0,reorder:0,emoji:'🏋️',active:true,kind:'service' },
  { id:'svc5',name:'Haircut Service',category:'Salon Services',price:35000,cost:0,stock:0,reorder:0,emoji:'💇',active:true,kind:'service' },
  { id:'svc6',name:'Motorcycle Maintenance',category:'Repair Services',price:120000,cost:0,stock:0,reorder:0,emoji:'🔧',active:true,kind:'service' }
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
    products:seedProducts.map(normalizeProduct),
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
    taxRate:0,serviceRate:0,footer:'Thank you for your purchase at StratifyPOS Demo!',
    promotionActive:true
  };
}
export function readDemoData(): DemoData {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) {
      const value: DemoData = JSON.parse(stored);
      if (value.version===1 && Array.isArray(value.products) && Array.isArray(value.orders) && Array.isArray(value.branches) && Array.isArray(value.staff)) {
        // Retain all visitor edits while adding the multi-industry sample catalog.
        const known = new Set(value.products.map(p=>p.id));
        const added=seedProducts.filter(p=>!known.has(p.id)).map(normalizeProduct);
        const products=value.products.map(normalizeProduct);
        return {...value,products:[...products,...added]};
      }
    }
  } catch { /* Storage may be disabled by the visitor. */ }
  return initialDemoData();
}
export function writeDemoData(value: DemoData): void {
  try { localStorage.setItem(DEMO_STORAGE_KEY,JSON.stringify(value)); } catch { /* in-memory session still works */ }
}

// V2 extension keeps the original demo independently deployable while adding
// branch-aware stock and commercial workflows. The records below are PUBLIC fixtures.
export type DemoKind='food_beverage'|'physical'|'service'|'bundle'|'non_stock';
export type DemoItemType='physical'|'service'|'membership';
export type DemoItemClass='food_beverage'|'general_merchandise'|'general_service'|'membership_plan';
const foodCategories=new Set(['coffee','tea & matcha','pastries','food','beverages','drinks']);
/** Product type drives commercial workflow; class controls specialized fulfillment. */
export function productType(p:DemoProduct):DemoItemType {
 if(p.itemType)return p.itemType;
 if(p.id==='svc1'||p.id==='svc2')return 'membership'; // migrate old sample plans
 return p.kind==='service'?'service':'physical';
}
export function productClass(p:DemoProduct):DemoItemClass {
 if(p.itemClass)return p.itemClass;
 const type=productType(p);
 if(type==='membership')return 'membership_plan';
 if(p.kind==='food_beverage'||(!p.kind&&foodCategories.has((p.category||'').trim().toLowerCase())))return 'food_beverage';
 return type==='service'?'general_service':'general_merchandise';
}
export function tracksStock(p:DemoProduct):boolean {
 return productType(p)==='physical'&&(p.trackInventory??p.kind!=='non_stock');
}
export function normalizeProduct(p:DemoProduct):DemoProduct {
 const itemType=productType(p),itemClass=productClass(p),trackInventory=tracksStock(p);
 return {...p,itemType,itemClass,trackInventory,
   kind:itemClass==='food_beverage'?'food_beverage':itemType==='physical'?(trackInventory?'physical':'non_stock'):'service',
   stock:trackInventory?p.stock:0,reorder:trackInventory?p.reorder:0};
}

export interface DemoMovement {id:string;date:string;productId:string;from:string|null;to:string|null;qty:number;kind:'transfer'|'adjustment'|'sale'|'receive'|'refund';reason:string}
export interface DemoSupplier {id:string;name:string;contact:string}
export interface DemoPurchase {id:string;date:string;branchId:string;supplierId:string;productId:string;ordered:number;received:number;cost:number}
export interface DemoRegister {id:string;cashier:string;branchId:string;opening:number;movements:number;status:'open'|'closed';counted?:number;openedAt:string;closedAt?:string}
export interface DemoRefund {id:string;orderId:string;date:string;amount:number;reason:string}
export interface DemoHold {id:string;branchId:string;cashier:string;createdAt:string;items:{productId:string;qty:number}[]}
export interface DemoServicePlan {id:string;productId:string;name:string;durationKind:'none'|'months'|'days';durationValue:number|null;active:boolean;sellThroughPos?:boolean}
export interface DemoCustomer {id:string;name:string;email:string;phone:string;reference:string}
export interface DemoEntitlement {id:string;customerId:string;planId:string;branchId:string;startsOn:string;expiresOn:string|null;status:'active'|'cancelled';events:{id:string;at:string;kind:'grant'|'renew'|'cancel';reason:string;expiresOn:string|null;saleId?:string}[]}
export interface DemoQrRequest {id:string;branchId:string;table:string;items:{productId:string;qty:number}[];payment:DemoPayment;status:'awaiting_payment'|'confirmed'|'cancelled';createdAt:string;orderId?:string}
export interface DemoKitchenTicket {id:string;orderId:string;branchId:string;status:'pending'|'preparing'|'ready'|'completed';updatedAt:string}
export interface DemoExtension {
 version:2;
 balances:Record<string,Record<string,number>>;
 movements:DemoMovement[];suppliers:DemoSupplier[];purchases:DemoPurchase[];
 registers:DemoRegister[];refunds:DemoRefund[];holds:DemoHold[];
 plans:DemoServicePlan[];customers:DemoCustomer[];entitlements:DemoEntitlement[];
 requests:DemoQrRequest[];tickets:DemoKitchenTicket[];
}
export const EXTENSION_KEY='stratify-demo-workflows-v2';
export const newId=()=>globalThis.crypto?.randomUUID?.()||'D-'+Date.now()+'-'+Math.random().toString(36).slice(2);
export function seedExtension(products:DemoProduct[]=seedProducts):DemoExtension {
 const balances:Record<string,Record<string,number>>={b1:{},b2:{}};
 for(const p of products){balances.b1[p.id]=Math.ceil(p.stock*.65);balances.b2[p.id]=p.stock-balances.b1[p.id];}
 return {version:2,balances,movements:[],
  suppliers:[{id:'sup1',name:'Demo Supply Co.',contact:'supplier@example.invalid'}],
  purchases:[],registers:[],refunds:[],holds:[],
  plans:[{id:'plan1',productId:'svc1',name:'Gym Monthly Membership',durationKind:'months',durationValue:1,active:true,sellThroughPos:true},
         {id:'plan2',productId:'svc2',name:'Dental Care Package',durationKind:'none',durationValue:null,active:true,sellThroughPos:true}],
  customers:[{id:'cus1',name:'Taylor Santos',email:'taylor@example.invalid',phone:'',reference:'MEM-001'}],
  entitlements:[],requests:[],tickets:[]};
}
export function readExtension(products:DemoProduct[]=seedProducts):DemoExtension {
 try {
  const value=JSON.parse(localStorage.getItem(EXTENSION_KEY)||'null');
  if(value?.version===2&&value.balances&&Array.isArray(value.entitlements)&&Array.isArray(value.movements)) {
    const balances:Record<string,Record<string,number>>={
      ...value.balances,b1:{...(value.balances.b1||{})},b2:{...(value.balances.b2||{})}
    };
    for(const item of products) {
      // Only initialize new catalog IDs; do not change existing customer stock.
      if(balances.b1[item.id]===undefined&&balances.b2[item.id]===undefined) {
        const first=Math.ceil(item.stock*.65);
        balances.b1[item.id]=first;
        balances.b2[item.id]=item.stock-first;
      }
    }
    // Historic demo builds created kitchen tasks for all sale types.
    // Keep sales, inventory, membership and other business data intact while
    // migrating only invalid kitchen tickets out of the persisted queue.
    const productById=new Map(products.map(p=>[p.id,p]));
    const persistedSales=(()=>{
      try {
        const oldData=JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)||'null');
        return Array.isArray(oldData?.orders)?oldData.orders:initialDemoData().orders;
      }catch{return initialDemoData().orders;}
    })() as DemoSale[];
    const orderById=new Map(persistedSales.map(order=>[order.id,order]));
    const legacyKitchenFoodCategories=new Set(['coffee','tea & matcha','pastries','food','beverages','drinks']);
    const tickets=(Array.isArray(value.tickets)?value.tickets:[]).filter((ticket:DemoKitchenTicket)=>{
      const sale=orderById.get(ticket.orderId);
      if(!sale)return false;
      return sale.lines.some(line=>{
        const p=productById.get(line.productId);
        return p && (p.itemClass==='food_beverage' || p.kind==='food_beverage' ||
          (!p.kind&&legacyKitchenFoodCategories.has(p.category.trim().toLowerCase())));
      });
    });
    return {...value,balances,tickets,plans:(value.plans||[]).map((p:DemoServicePlan)=>({...p,sellThroughPos:p.sellThroughPos??(p.id==='plan1'||p.id==='plan2')}))};
  }
 }catch{}
 return seedExtension(products);
}
export function writeExtension(value:DemoExtension):void {
 try{localStorage.setItem(EXTENSION_KEY,JSON.stringify(value));}catch{}
}
export function calendarExpiry(start:string,kind:DemoServicePlan['durationKind'],amount:number|null):string|null {
 if(kind==='none')return null;
 const d=new Date(start+'T00:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==start)throw Error('Invalid start date');
 if(!Number.isInteger(amount)||!amount||amount<1)throw Error('Invalid duration');
 if(kind==='days')d.setUTCDate(d.getUTCDate()+amount);
 else {const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+amount);
 const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
 d.setUTCDate(Math.min(day,last));}
 return d.toISOString().slice(0,10);
}
export function transferDemoStock(state:DemoExtension,productId:string,from:string,to:string,qty:number,reason:string):DemoExtension {
 if(!productId||!from||!to||from===to||!Number.isInteger(qty)||qty<=0)throw Error('Choose distinct locations and a positive whole-unit quantity');
 const available=state.balances[from]?.[productId]??0;
 if(available<qty)throw Error('Insufficient source-branch stock');
 return {...state,balances:{...state.balances,
  [from]:{...state.balances[from],[productId]:available-qty},
  [to]:{...state.balances[to],[productId]:(state.balances[to]?.[productId]||0)+qty}},
  movements:[{id:newId(),date:new Date().toISOString(),productId,from,to,qty,kind:'transfer',reason},...state.movements]};
}
export function refundDemoSale(ext:DemoExtension,sale:DemoSale,amount:number,reason:string):DemoExtension {
 const prior=ext.refunds.filter(r=>r.orderId===sale.id).reduce((n,r)=>n+r.amount,0);
 if(!Number.isInteger(amount)||amount<=0||amount>sale.total-prior)throw Error('Refund exceeds remaining paid amount');
 if(!reason.trim())throw Error('Provide a refund reason');
 if(sale.payment!=='cash')throw Error('Only cash refunds are simulated; external gateway refunds are unavailable');
 return {...ext,refunds:[{id:newId(),orderId:sale.id,date:new Date().toISOString(),amount,reason},...ext.refunds]};
}

/**
 * Apply a simulated paid POS membership transaction once per sale + plan.
 * All validation precedes mutation, so unknown/hidden plans cannot silently
 * take money without creating a membership. No actual payments are processed.
 */
export function fulfillMembershipSale(ext:DemoExtension,sale:DemoSale,products:readonly DemoProduct[]):DemoExtension {
 const productById=new Map(products.map(p=>[p.id,p]));
 const membershipLines=sale.lines.filter(l=>{
   const p=productById.get(l.productId);
   return p&&productType(p)==='membership';
 });
 if(!membershipLines.length)return ext;
 if(!sale.customerId||!ext.customers.some(c=>c.id===sale.customerId))throw Error('Choose a valid customer for membership checkout');
 const planIds=new Set<string>();
 const matched=membershipLines.map(line=>{
   const plan=ext.plans.find(p=>p.productId===line.productId);
   const item=productById.get(line.productId);
   if(!item?.active||!plan?.active||!plan.sellThroughPos)throw Error('Membership plan is not available for POS checkout');
   if(line.qty!==1)throw Error('Only one membership per plan may be sold per checkout');
   if(planIds.has(plan.id))throw Error('Duplicate membership plan in checkout');
   planIds.add(plan.id);
   // Also validates a plan's duration before the simulated checkout is saved.
   calendarExpiry('2026-01-01',plan.durationKind,plan.durationValue);
   return plan;
 });
 let entitlements=[...ext.entitlements];
 const at=sale.date,day=new Date(new Date(at).getTime()-new Date(at).getTimezoneOffset()*60000).toISOString().slice(0,10);
 for(const plan of matched){
   if(entitlements.some(e=>e.planId===plan.id&&e.events.some(v=>v.saleId===sale.id)))continue;
   const index=entitlements.findIndex(e=>e.customerId===sale.customerId&&e.planId===plan.id&&e.status==='active');
   if(index<0){
     const end=calendarExpiry(day,plan.durationKind,plan.durationValue);
     entitlements.unshift({id:newId(),customerId:sale.customerId!,planId:plan.id,branchId:sale.branchId,
       startsOn:day,expiresOn:end,status:'active',
       events:[{id:newId(),at,kind:'grant',reason:'Paid POS checkout '+sale.id,expiresOn:end,saleId:sale.id}]});
   }else{
     const previous=entitlements[index];
     const start=previous.expiresOn&&previous.expiresOn>day?previous.expiresOn:day;
     const end=previous.expiresOn===null?null:calendarExpiry(start,plan.durationKind,plan.durationValue);
     entitlements[index]={...previous,expiresOn:end,
       events:[...previous.events,{id:newId(),at,kind:'renew',reason:'Paid POS renewal '+sale.id,expiresOn:end,saleId:sale.id}]};
   }
 }
 return {...ext,entitlements};
}
