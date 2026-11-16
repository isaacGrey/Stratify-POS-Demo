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
