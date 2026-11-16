import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';

// Compile only the pure fixture/state functions; test runtime logic without a browser
// or a production database. UI integration is separately checked by the Vite build.
const source=readFileSync(new URL('../src/demo-data.ts',import.meta.url),'utf8');
const js=transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
const demo=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('fixtures include multiple locations, physical catalog, services and plans',()=>{
 const d=demo.initialDemoData();
 assert.equal(d.branches.length>=2,true);
 assert(d.products.find(p=>p.kind==='service'));
 assert(d.products.find(p=>p.kind==='physical'));
 const e=demo.seedExtension(d.products);
 for(const p of d.products)assert.equal(
  d.branches.reduce((n,b)=>n+(e.balances[b.id]?.[p.id]||0),0),p.stock);
 assert.equal(e.plans.length>=2,true);
});
test('cross-branch stock transfer preserves totals and writes a movement',()=>{
 const e=demo.seedExtension();
 const start=e.balances.b1.p1+e.balances.b2.p1;
 const result=demo.transferDemoStock(e,'p1','b1','b2',4,'Restocking');
 assert.equal(result.balances.b1.p1,e.balances.b1.p1-4);
 assert.equal(result.balances.b2.p1,e.balances.b2.p1+4);
 assert.equal(result.balances.b1.p1+result.balances.b2.p1,start);
 assert.equal(result.movements[0].kind,'transfer');
 assert.equal(e.movements.length,0,'original state must remain immutable');
});
test('rejects invalid, duplicate and overdrawn stock transfers',()=>{
 const e=demo.seedExtension();
 for(const qty of [0,-1,1.5,e.balances.b1.p1+1])assert.throws(
  ()=>demo.transferDemoStock(e,'p1','b1','b2',qty,'Invalid'));
 assert.throws(()=>demo.transferDemoStock(e,'p1','b1','b1',1,'Same location'));
});
test('membership presets clamp months at month ends and support no expiry',()=>{
 assert.equal(demo.calendarExpiry('2026-01-31','months',1),'2026-02-28');
 assert.equal(demo.calendarExpiry('2024-01-31','months',1),'2024-02-29');
 assert.equal(demo.calendarExpiry('2026-11-16','months',2),'2027-01-16');
 assert.equal(demo.calendarExpiry('2026-11-16','months',12),'2027-11-16');
 assert.equal(demo.calendarExpiry('2026-11-16','days',30),'2026-12-16');
 assert.equal(demo.calendarExpiry('2026-11-16','none',null),null);
 assert.throws(()=>demo.calendarExpiry('2026-02-30','months',1));
 assert.throws(()=>demo.calendarExpiry('2026-11-16','months',0));
});
test('refunds never exceed balance and cannot simulate provider reversals',()=>{
 const d=demo.initialDemoData();
 const sale=d.orders.find(s=>s.payment==='cash');
 let state=demo.seedExtension();
 state=demo.refundDemoSale(state,sale,100,'Cash refund');
 state=demo.refundDemoSale(state,sale,200,'Additional refund');
 assert.equal(state.refunds.length,2);
 assert.throws(()=>demo.refundDemoSale(state,sale,sale.total,'Excess refund'));
 const cashless=d.orders.find(s=>s.payment==='card');
 assert.throws(()=>demo.refundDemoSale(state,cashless,100,'External refund'));
});
test('demo UI has navigation and linked workflow modules',()=>{
 const ui=readFileSync(new URL('../src/demo.tsx',import.meta.url),'utf8');
 const flow=readFileSync(new URL('../src/workflows.tsx',import.meta.url),'utf8');
 for(const title of ['warehouse','purchasing','memberships','register','qr','kitchen','refunds'])
  assert(ui.includes("id:'"+title+"'"),'Missing navigation route '+title);
 for(const step of ['transferDemoStock','refundDemoSale','calendarExpiry','Issue membership','Purchase order receiving','Kitchen display system'])
  assert(flow.includes(step),'Missing workflow '+step);
 assert(ui.includes('DEMO — SIMULATED DATA ONLY'));
});

test('food and beverage checkout routing remains item-type-specific',async()=>{
 const source=readFileSync(new URL('../src/sale-flow.ts',import.meta.url),'utf8');
 const js=transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
 const {isFoodOrBeverage,usesFoodFulfillment,saleOrderType,needsKitchenTicket}=
   await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const food={kind:'food_beverage',category:'Coffee'};
 const retail={kind:'physical',category:'Retail'};
 const gym={kind:'service',category:'Fitness Services'};
 const dental={kind:'service',category:'Clinical Services'};
 const nonStock={kind:'non_stock',category:'Other'};
 assert.equal(isFoodOrBeverage(food),true);
 assert.equal(isFoodOrBeverage(retail),false);
 assert.equal(isFoodOrBeverage(gym),false);
 assert.equal(isFoodOrBeverage({kind:'service',category:'Food'}),false,
   'Explicit service type overrides misleading category');
 assert.equal(isFoodOrBeverage({kind:'physical',category:'Coffee'}),false,
   'Physical product type overrides misleading category');
 assert.equal(isFoodOrBeverage({category:'Coffee'}),true,
   'Legacy untyped food catalog remains compatible');
 assert.equal(usesFoodFulfillment([]),false);
 assert.equal(usesFoodFulfillment([retail,gym,dental,nonStock]),false);
 assert.equal(usesFoodFulfillment([retail,food]),true);
 for(const picked of ['dine_in','delivery','takeout']){
   assert.equal(saleOrderType([retail,gym],picked),'standard',
     'Non-food sale must never retain restaurant mode');
   assert.equal(saleOrderType([retail,food],picked),picked,
     'Mixed cart applies food fulfillment only when food is present');
 }
 assert.equal(saleOrderType([food],'standard'),'takeout');
 assert.equal(needsKitchenTicket([retail,gym]),false);
 assert.equal(needsKitchenTicket([retail,food]),true);
});

test('generic checkout UI hides dine-in, takeout and delivery for non-food carts',()=>{
 const source=readFileSync(new URL('../src/demo.tsx',import.meta.url),'utf8');
 assert(source.includes('hasFoodItems&&<div className="demo-fulfillment-options">'));
 assert(source.includes("type:saleOrderType(lines.map(x=>x.product),type)"));
 assert(source.includes('needsKitchenTicket(lines.map(x=>x.product))'));
 assert(source.includes('Category (any industry)'));
 assert(source.includes("kind:'physical' as DemoKind"));
});

test('new multi-industry catalog includes grocery, retail, clinic, gym, salon and repairs',()=>{
 const data=demo.initialDemoData();
 for(const category of ['Grocery','Apparel','Motorcycle Parts','Clinical Services','Fitness Services','Salon Services','Repair Services'])
   assert(data.products.some(p=>p.category===category),'Missing '+category+' sample');
 assert(data.products.some(p=>p.kind==='physical'));
 assert(data.products.some(p=>p.kind==='service'));
 assert(data.products.some(p=>p.kind==='food_beverage'));
 assert(!data.footer.includes('Café'),'Default receipt must be industry-neutral');
});

test('saved demo state upgrades catalog and stocks without discarding user changes',()=>{
 const seed=demo.initialDemoData();
 const saved={...seed,products:[...seed.products.filter(p=>p.id==='p1'),{
    id:'personalized',name:'Custom hardware',category:'Hardware',price:5000,cost:2000,
    stock:3,reorder:1,emoji:'🔩',active:true
 }]};
 const extension=demo.seedExtension(saved.products);
 extension.balances.b1.p1=3;
 const memory=new Map([[demo.DEMO_STORAGE_KEY,JSON.stringify(saved)],
                       [demo.EXTENSION_KEY,JSON.stringify(extension)]]);
 const originalStorage=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 try{
   const upgraded=demo.readDemoData();
   assert(upgraded.products.some(p=>p.id==='personalized'));
   assert(upgraded.products.some(p=>p.id==='r2'));
   assert(upgraded.products.some(p=>p.id==='svc5'));
   assert.equal(upgraded.products.find(p=>p.id==='personalized').kind,'physical');
   const inventory=demo.readExtension(upgraded.products);
   assert.equal(inventory.balances.b1.p1,3,'existing customer stock must be preserved');
   assert(inventory.balances.b1.r2>0,'new sample item needs initial stock');
   assert.equal(inventory.balances.b1.svc5,0,'new service must not have physical stock');
 }finally{globalThis.localStorage=originalStorage;}
});

test('kitchen queue never exposes a saved gym membership ticket',async()=>{
 const raw=readFileSync(new URL('../src/sale-flow.ts',import.meta.url),'utf8');
 const transformed=transformSync(raw,{loader:'ts',format:'esm',target:'es2022'}).code;
 const {kitchenLineItems,kitchenTicketView}=await import('data:text/javascript;base64,'+Buffer.from(transformed).toString('base64'));
 const products=demo.initialDemoData().products;
 const sale={id:'POS-1038',lines:[{productId:'svc1',name:'Gym Monthly Membership',qty:1}]};
 const ticket={id:'legacy-1',orderId:sale.id,status:'pending'};
 assert.deepEqual(kitchenLineItems(sale.lines,products),[]);
 assert.deepEqual(kitchenTicketView([ticket],[sale],products),[]);
});

test('mixed carts show only food items to kitchen, not gym services or retail',async()=>{
 const raw=readFileSync(new URL('../src/sale-flow.ts',import.meta.url),'utf8');
 const transformed=transformSync(raw,{loader:'ts',format:'esm',target:'es2022'}).code;
 const {kitchenTicketView}=await import('data:text/javascript;base64,'+Buffer.from(transformed).toString('base64'));
 const products=demo.initialDemoData().products;
 const order={id:'POS-1039',lines:[
   {productId:'p1',name:'Spanish Latte',qty:2},
   {productId:'svc1',name:'Gym Monthly Membership',qty:1},
   {productId:'r1',name:'Motorcycle Engine Oil',qty:3}
 ]};
 const visible=kitchenTicketView([{id:'food-ticket',orderId:order.id}],[order],products);
 assert.equal(visible.length,1);
 assert.deepEqual(visible[0].lines.map(line=>line.productId),['p1']);
 assert.deepEqual(kitchenTicketView([{id:'orphan',orderId:'missing'}],[order],products),[]);
});

test('reloading historic demo kitchen tickets removes only the invalid ones',()=>{
 const seed=demo.initialDemoData();
 const saved={...seed,orders:[
   ...seed.orders,{...seed.orders[0],id:'POS-1038',type:'standard',
       lines:[{productId:'svc1',name:'Gym Monthly Membership',price:149900,qty:1}]}]};
 const ext=demo.seedExtension(saved.products);
 ext.tickets=[
   {id:'invalid-gym',orderId:'POS-1038',branchId:'b1',status:'pending',updatedAt:new Date().toISOString()},
   {id:'valid-food',orderId:seed.orders[0].id,branchId:'b1',status:'pending',updatedAt:new Date().toISOString()},
   {id:'missing-sale',orderId:'orphan',branchId:'b1',status:'pending',updatedAt:new Date().toISOString()}
 ];
 const memory=new Map([
   [demo.DEMO_STORAGE_KEY,JSON.stringify(saved)],
   [demo.EXTENSION_KEY,JSON.stringify(ext)]
 ]);
 const previousStorage=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>memory.get(key)||null,
   setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 try{
   const freshData=demo.readDemoData();
   const fresh=demo.readExtension(freshData.products);
   assert.deepEqual(fresh.tickets.map(t=>t.id),['valid-food']);
   assert.equal(freshData.orders.find(o=>o.id==='POS-1038').lines[0].name,'Gym Monthly Membership');
   assert.equal(freshData.orders.length,saved.orders.length);
 }finally{globalThis.localStorage=previousStorage;}
});

test('QR confirmation uses shared food routing rather than unconditional kitchen tickets',()=>{
 const workflow=readFileSync(new URL('../src/workflows.tsx',import.meta.url),'utf8');
 assert(workflow.includes('kitchenTicketView(ext.tickets,data.orders,data.products)'));
 assert(workflow.includes("tickets:needsKitchenTicket(foodProducts)&&foodLines.length"));
 assert(workflow.includes("type:saleOrderType(foodProducts,'dine_in')"));
 assert(workflow.includes("data.products.filter(p=>p.active&&needsKitchenTicket([p]))"));
});
