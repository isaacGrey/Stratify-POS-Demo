import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

async function bundle(path){
 const result=await build({entryPoints:[fileURLToPath(new URL(path,import.meta.url))],
  bundle:true,format:'esm',platform:'node',write:false,target:'es2022'});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64'));
}
const operations=await bundle('../src/demo-operations.ts');
const exports=await bundle('../src/demo-exports.ts');
const fixture=await bundle('../src/demo-data.ts');
test('existing demo data remains compatible with new classification fields and sample records',()=>{
 const d=fixture.initialDemoData(),e=fixture.seedExtension(d.products);
 assert.equal(d.businessType,'food');
 assert.equal(d.kitchenEnabled,true);
 assert(e.appointments.length>0);
 assert(e.attendanceRecords.length>0);
 assert(e.platformNotifications.length>0);
 assert.equal(operations.demoUnreadCount(e),3);
});
test('appointment overlap rules apply per room, branch, date and status',()=>{
 let ext=fixture.seedExtension(fixture.initialDemoData().products);
 const from='2027-02-02T09:00:00.000Z',to='2027-02-02T10:00:00.000Z';
 const make=(id,more={})=>({id,branchId:'b1',clientName:'Sam Patient',clientContact:'',
  serviceName:'Clinic service',requirements:'Needs wheelchair',resourceKey:'room-1',
  startsAt:from,endsAt:to,status:'pending',events:[],...more});
 ext=operations.saveDemoAppointment(ext,make('new-1'));
 assert(ext.appointments.some(a=>a.id==='new-1'));
 assert.throws(()=>operations.saveDemoAppointment(ext,make('new-2')),/conflicting/);
 ext=operations.saveDemoAppointment(ext,make('new-2',{resourceKey:'room-2'}));
 ext=operations.saveDemoAppointment(ext,make('new-3',{branchId:'b2'}));
 assert.throws(()=>operations.saveDemoAppointment(ext,make('new-4',{endsAt:from})));
 assert.throws(()=>operations.saveDemoAppointment(ext,make('new-4',{startsAt:'invalid'})));
 assert.throws(()=>operations.saveDemoAppointment(ext,make('new-4',{status:'cancelled',startsAt:from})));
});
test('appointment reschedule and terminal status guard preserve immutable visit history',()=>{
 let ext=fixture.seedExtension(fixture.initialDemoData().products);
 const p={id:'appt-new',branchId:'b1',clientName:'Client',clientContact:'',serviceName:'Haircut',
  requirements:'',resourceKey:'station-1',startsAt:'2027-01-10T09:00:00.000Z',
  endsAt:'2027-01-10T10:00:00.000Z',status:'pending',events:[]};
 ext=operations.saveDemoAppointment(ext,p);
 assert.throws(()=>operations.saveDemoAppointment(ext,{...p,startsAt:'2027-01-10T11:00:00.000Z',endsAt:'2027-01-10T12:00:00.000Z'}),/Rescheduled/);
 ext=operations.saveDemoAppointment(ext,{...p,startsAt:'2027-01-10T11:00:00.000Z',endsAt:'2027-01-10T12:00:00.000Z',status:'rescheduled'});
 ext=operations.saveDemoAppointment(ext,{...ext.appointments.find(x=>x.id==='appt-new'),status:'completed'});
 assert.equal(ext.appointments.find(x=>x.id==='appt-new').events.length,3);
 assert.throws(()=>operations.saveDemoAppointment(ext,{...p,status:'confirmed'}),/not allowed|final/i);
});
test('stock report includes available balances, low stock and recorded inventory movements',()=>{
 const d=fixture.initialDemoData(),ext=fixture.seedExtension(d.products);
 const sheets=operations.demoInventorySheets(d,ext,'b1');
 assert(sheets.some(s=>s.name==='Stock levels'));
 assert(sheets.some(s=>s.name==='Movement history'));
 assert(sheets[0].rows.some(r=>r.name==='Spanish Latte'&&r.available>=0));
 assert(sheets[0].rows.every(r=>typeof r.reorder==='number'));
});
test('attendance report includes completed hours, break deduction and illustrative absences',()=>{
 const d=fixture.initialDemoData(),e=fixture.seedExtension(d.products);
 const sheets=operations.demoAttendanceSheets(d,e,'b1');
 assert(sheets.some(s=>s.name==='Time cards'));
 assert(sheets.some(s=>s.name==='Methodology'));
 assert(sheets.find(s=>s.name==='Time cards').rows.some(r=>r.status==='Completed'));
 assert(sheets.find(s=>s.name==='Time cards').rows.some(r=>r.status==='Scheduled absence (demo)'));
});
test('XLSX export is an OpenXML ZIP, PDF has a valid page catalog and cross-reference',async()=>{
 const data=[{name:'Sample report',columns:[{key:'name',label:'Name'},{key:'count',label:'Count'}],
  rows:[{name:'Demo member',count:42}]}];
 const workbook=Buffer.from(await exports.createDemoExport(data,'xlsx').arrayBuffer());
 const document=Buffer.from(await exports.createDemoExport(data,'pdf').arrayBuffer());
 assert.equal(workbook.subarray(0,2).toString(),'PK');
 assert(workbook.includes('xl/workbook.xml'));
 assert(workbook.includes('xl/worksheets/sheet1.xml'));
 assert(workbook.includes('Demo member'));
 assert.equal(document.subarray(0,8).toString(),'%PDF-1.4');
 assert(document.includes('/Type /Catalog'));
 assert(document.includes('/Type /Page'));
 assert(document.includes('xref'));
 assert(document.includes('Demo member'));
 assert.throws(()=>exports.createDemoExport([], 'pdf'));
});
test('new UI navigation includes appointments, superadmin notification bell and role gates',()=>{
 const ui=readFileSync(new URL('../src/demo.tsx',import.meta.url),'utf8');
 const flow=readFileSync(new URL('../src/workflows.tsx',import.meta.url),'utf8');
 const page=readFileSync(new URL('../src/demo-new-features.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/demo.css',import.meta.url),'utf8');
 for(const token of ["id:'appointments'","id:'platform-users'","id:'platform-notifications'",
   "role==='superadmin'","data.businessType==='non_food'","Business type (simulated signup)",
   'kind="inventory"','kind="attendance"'])
  assert(ui.includes(token),'Missing '+token);
 for(const token of ['Membership status','membership-controls','statusFilter'])
  assert(flow.includes(token),'Missing membership UX '+token);
 for(const token of ['Room / resource','Calendar','List','Mark all as read','Filter','PDF','Excel'])
  assert(page.includes(token),'Missing component '+token);
 assert(css.includes('demo-appointment-calendar'));
 assert(css.includes('demo-notification-popover'));
});
