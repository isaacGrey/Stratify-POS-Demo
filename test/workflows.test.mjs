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

test('catalog consistently exposes type, class, category and inventory tracking',()=>{
 const data=demo.initialDemoData();
 const gym=data.products.find(p=>p.id==='svc1');
 const latte=data.products.find(p=>p.id==='p1');
 const dental=data.products.find(p=>p.id==='svc3');
 const oil=data.products.find(p=>p.id==='r1');
 assert.equal(demo.productType(gym),'membership');
 assert.equal(demo.productClass(gym),'membership_plan');
 assert.equal(demo.tracksStock(gym),false);
 assert.equal(demo.productType(latte),'physical');
 assert.equal(demo.productClass(latte),'food_beverage');
 assert.equal(demo.tracksStock(latte),true);
 assert.equal(demo.productType(dental),'service');
 assert.equal(demo.productClass(dental),'general_service');
 assert.equal(demo.tracksStock(dental),false);
 assert.equal(demo.productClass(oil),'general_merchandise');
 assert.equal(demo.tracksStock(oil),true);
 assert.equal(demo.tracksStock(demo.normalizeProduct({id:'custom',kind:'non_stock',category:'Retail',name:'Gift card',stock:0,reorder:0})),false);
});
test('paid membership POS sale grants, links and renews exactly once',()=>{
 const data=demo.initialDemoData();
 let ext=demo.seedExtension(data.products);
 const sale={id:'POS-MEM-1',date:'2026-11-16T03:00:00.000Z',branchId:'b1',customerId:'cus1',cashier:'Jamie Cruz',type:'standard',payment:'cash',
  lines:[{productId:'svc1',name:'Gym Monthly Membership',qty:1,price:149900}],
  subtotal:149900,discount:0,tax:0,service:0,total:149900,tender:149900};
 ext=demo.fulfillMembershipSale(ext,sale,data.products);
 assert.equal(ext.entitlements.length,1);
 const first=ext.entitlements[0];
 assert.equal(first.customerId,'cus1');
 assert.equal(first.planId,'plan1');
 assert.equal(first.events[0].saleId,sale.id);
 assert.equal(first.expiresOn,'2026-12-16');
 ext=demo.fulfillMembershipSale(ext,sale,data.products);
 assert.equal(ext.entitlements.length,1,'retry must not create a second membership');
 assert.equal(ext.entitlements[0].events.length,1,'retry must not double-renew');
 const renewed={...sale,id:'POS-MEM-2',date:'2026-11-17T03:00:00.000Z'};
 ext=demo.fulfillMembershipSale(ext,renewed,data.products);
 assert.equal(ext.entitlements.length,1,'renew existing plan');
 assert.equal(ext.entitlements[0].expiresOn,'2027-01-16');
 assert.equal(ext.entitlements[0].events[1].kind,'renew');
 assert.equal(ext.entitlements[0].events[1].saleId,renewed.id);
});
test('membership checkout rejects missing customer, disabled plan and invalid quantity',()=>{
 const data=demo.initialDemoData(),ext=demo.seedExtension(data.products);
 const sale={id:'POS-MEM',date:'2026-11-16T03:00:00.000Z',branchId:'b1',customerId:'cus1',
 lines:[{productId:'svc1',name:'Gym Monthly Membership',qty:1}]};
 assert.throws(()=>demo.fulfillMembershipSale(ext,{...sale,customerId:undefined},data.products),/customer/i);
 assert.throws(()=>demo.fulfillMembershipSale(ext,{...sale,lines:[{...sale.lines[0],qty:2}]},data.products),/one membership/i);
 assert.throws(()=>demo.fulfillMembershipSale({...ext,plans:ext.plans.map(p=>({...p,sellThroughPos:false}))},sale,data.products),/not available/i);
 assert.equal(ext.entitlements.length,0,'failed sale must not change state');
});
test('POS UI links membership checkout and mobile sidebar scrolls',()=>{
 const ui=readFileSync(new URL('../src/demo.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/demo.css',import.meta.url),'utf8');
 const workflows=readFileSync(new URL('../src/workflows.tsx',import.meta.url),'utf8');
 for(const key of ['productClass','productType','tracksStock','fulfillMembershipSale','customerId','New membership customer name','Product class','Membership / subscription'])
  assert(ui.includes(key),'Missing '+key);
 assert(workflows.includes('Sell through POS'));
 assert(workflows.includes('Membership plan created and linked to POS.'));
 assert(css.includes('.demo-sidebar nav{flex:1 1 auto;min-height:0;overflow-y:auto'));
 assert(css.includes('touch-action:pan-y'));
});

test('full cash refund reverses paid membership grants while partial refund is refused',()=>{
 const data=demo.initialDemoData();
 const sale={id:'POS-RF-1',date:'2026-11-16T01:00:00Z',branchId:'b1',customerId:'cus1',cashier:'Cashier',
 type:'standard',payment:'cash',lines:[{productId:'svc1',name:'Gym Monthly Membership',qty:1,price:149900}],
 subtotal:149900,discount:0,tax:0,service:0,total:149900,tender:149900};
 const ext=demo.fulfillMembershipSale(demo.seedExtension(data.products),sale,data.products);
 assert.throws(()=>demo.refundDemoSale(ext,sale,100,'Partial adjustment'),/full refund/i);
 const refunded=demo.refundDemoSale(ext,sale,sale.total,'Customer cancellation');
 assert.equal(refunded.refunds.length,1);
 assert.equal(refunded.entitlements[0].status,'cancelled');
 assert.equal(refunded.entitlements[0].events.at(-1).saleId,sale.id);
 assert.equal(ext.entitlements[0].status,'active','the original snapshot remains immutable');
});
test('full refund of renewal restores previous expiry and rejects reversing older renewals',()=>{
 const data=demo.initialDemoData();
 const base={date:'2026-11-16T01:00:00Z',branchId:'b1',customerId:'cus1',cashier:'Cashier',
 type:'standard',payment:'cash',lines:[{productId:'svc1',name:'Gym Monthly Membership',qty:1,price:149900}],
 subtotal:149900,discount:0,tax:0,service:0,total:149900,tender:149900};
 const first={...base,id:'POS-RF-2'};
 const second={...base,id:'POS-RF-3',date:'2026-11-17T01:00:00Z'};
 let ext=demo.fulfillMembershipSale(demo.seedExtension(data.products),first,data.products);
 const before=ext.entitlements[0].expiresOn;
 ext=demo.fulfillMembershipSale(ext,second,data.products);
 assert.notEqual(ext.entitlements[0].expiresOn,before);
 assert.throws(()=>demo.refundDemoSale(ext,first,first.total,'Invalid chronology'),/later membership changes/i);
 ext=demo.refundDemoSale(ext,second,second.total,'Reverse renewal');
 assert.equal(ext.entitlements[0].expiresOn,before);
 assert.equal(ext.entitlements[0].status,'active');
});
