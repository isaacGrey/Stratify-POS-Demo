import {newId,type DemoExtension,type DemoAppointment,type DemoAppointmentStatus,
 type DemoData,type DemoAttendanceRecord,tracksStock} from './demo-data';
import type {DemoSheet} from './demo-exports';

const validIso=(value:string)=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&
 /(?:Z|[+-]\d\d:\d\d)$/.test(value);
const reserved=(status:DemoAppointmentStatus)=>!['cancelled','completed'].includes(status);
export function saveDemoAppointment(ext:DemoExtension,patch:Omit<DemoAppointment,'events'> & {events?:DemoAppointment['events']},
 actionReason='Updated in the demo'):DemoExtension{
 if(!patch.clientName.trim()||!patch.serviceName.trim()||!patch.branchId||
   !patch.resourceKey.trim()||patch.clientName.length>160||patch.serviceName.length>160||
   patch.requirements.length>1500||!validIso(patch.startsAt)||!validIso(patch.endsAt)||
   Date.parse(patch.endsAt)<=Date.parse(patch.startsAt)||
   Date.parse(patch.endsAt)-Date.parse(patch.startsAt)>86400000)
  throw Error('Enter a client, service, branch, resource and valid appointment time (up to 24 hours).');
 const old=ext.appointments.find(p=>p.id===patch.id);
 if(!old&&!['pending','confirmed'].includes(patch.status))throw Error('New appointments must be pending or confirmed');
 const allowed:Record<DemoAppointmentStatus,DemoAppointmentStatus[]>={
  pending:['confirmed','rescheduled','cancelled'],
  confirmed:['rescheduled','completed','cancelled'],
  rescheduled:['confirmed','rescheduled','completed','cancelled'],
  completed:[],cancelled:[]};
 if(old&&(!allowed[old.status].includes(patch.status)&&old.status!==patch.status))
  throw Error('Appointment status change is not allowed.');
 if(old&&['completed','cancelled'].includes(old.status))throw Error('Completed or cancelled bookings are final.');
 if(old&&old.branchId!==patch.branchId)throw Error('Cancel and rebook when moving to a new branch.');
 const timeChanged=old&&(old.startsAt!==patch.startsAt||old.endsAt!==patch.endsAt);
 if(timeChanged&&['completed','cancelled'].includes(patch.status))throw Error('Reschedule before completing or cancelling.');
 if(timeChanged&&patch.status!=='rescheduled')throw Error('Time changes require Rescheduled status.');
 if(reserved(patch.status)&&ext.appointments.some(a=>a.id!==patch.id&&
    a.branchId===patch.branchId&&a.resourceKey.toLowerCase()===patch.resourceKey.toLowerCase()&&
    reserved(a.status)&&Date.parse(a.startsAt)<Date.parse(patch.endsAt)&&
    Date.parse(patch.startsAt)<Date.parse(a.endsAt)))
  throw Error('This resource has a conflicting appointment. Choose another time.');
 const next:DemoAppointment={...patch,
  events:[...(old?.events||[]),{at:new Date().toISOString(),kind:old?(timeChanged?'rescheduled':'updated'):'created',reason:actionReason}]};
 return {...ext,appointments:old?ext.appointments.map(a=>a.id===old.id?next:a):[...ext.appointments,next]};
}
export function demoInventorySheets(data:DemoData,ext:DemoExtension,branchId:string):DemoSheet[]{
 const rows=data.products.filter(tracksStock).map(p=>{
  const available=branchId?Number(ext.balances[branchId]?.[p.id]||0):
   data.branches.reduce((n,b)=>n+Number(ext.balances[b.id]?.[p.id]||0),0);
  return {name:p.name,type:'Physical',category:p.category,branch:branchId?data.branches.find(b=>b.id===branchId)?.name||'': 'All branches',
   available,reorder:p.reorder,status:available<=p.reorder?'Low stock':'Available',
   cost:p.cost/100,estimatedValue:Math.round(available*p.cost)/100};
 });
 const movements=ext.movements.filter(m=>!branchId||m.from===branchId||m.to===branchId).map(m=>({
  recorded:m.date,item:data.products.find(p=>p.id===m.productId)?.name||m.productId,
  from:data.branches.find(b=>b.id===m.from)?.name||'Unallocated',
  to:data.branches.find(b=>b.id===m.to)?.name||'Unallocated',delta:m.qty,
  type:m.kind,reason:m.reason}));
 return [{name:'Stock levels',columns:[
  {key:'name',label:'Stock item'},{key:'type',label:'Type'},{key:'category',label:'Category'},
  {key:'branch',label:'Location'},{key:'available',label:'Available'},{key:'reorder',label:'Reorder point'},
  {key:'status',label:'Status'},{key:'cost',label:'Unit cost PHP'},
  {key:'estimatedValue',label:'Estimated stock value PHP'}],rows},
 {name:'Movement history',columns:[
  {key:'recorded',label:'Recorded'},{key:'item',label:'Item'},{key:'from',label:'From'},
  {key:'to',label:'To'},{key:'delta',label:'Units'},{key:'type',label:'Type'},
  {key:'reason',label:'Reason'}],rows:movements}];
}
export function demoAttendanceSheets(data:DemoData,ext:DemoExtension,branchId:string):DemoSheet[]{
 const date=new Date(),localDay=new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
 const rows=ext.attendanceRecords.filter(a=>!branchId||a.branchId===branchId).map(r=>{
  const start=Date.parse(r.startsAt),end=r.endsAt?Date.parse(r.endsAt):null;
  return {name:data.staff.find(x=>x.id===r.staffId)?.name||r.staffId,
   branch:data.branches.find(x=>x.id===r.branchId)?.name||r.branchId,
   day:r.startsAt.slice(0,10),clockIn:r.startsAt,clockOut:r.endsAt||'',
   breakHours:Math.round(r.breakMinutes/60*100)/100,
   workedHours:end?Math.round(Math.max(0,(end-start)/3600000-r.breakMinutes/60)*100)/100:'',
   status:end?'Completed':'Open shift'};
 });
 const absences:typeof rows=[];
 for(const staff of data.staff.filter(s=>!branchId||s.branchId===branchId)){
  for(let d=1;d<=5;d++){
   const dt=new Date(Date.now()-d*86400000);
   if(dt.getUTCDay()===0||dt.getUTCDay()===6)continue;
   const day=dt.toISOString().slice(0,10);
   if(rows.some(r=>r.name===staff.name&&r.day===day))continue;
   absences.push({name:staff.name,branch:data.branches.find(b=>b.id===staff.branchId)?.name||staff.branchId,
    day,clockIn:'',clockOut:'',breakHours:0,workedHours:'',status:'Scheduled absence (demo)'});
  }
 }
 const all=[...rows,...absences].sort((a,b)=>a.name.localeCompare(b.name)||a.day.localeCompare(b.day));
 const summary=data.staff.filter(s=>!branchId||s.branchId===branchId).map(staff=>{
  const own=all.filter(a=>a.name===staff.name);
  return {name:staff.name,shifts:own.filter(x=>x.status==='Completed').length,
   workedHours:own.reduce((n,x)=>n+(Number(x.workedHours)||0),0),
   absences:own.filter(x=>x.status.startsWith('Scheduled absence')).length};
 });
 return [{name:'Employee summary',columns:[
  {key:'name',label:'Employee'},{key:'shifts',label:'Completed shifts'},
  {key:'workedHours',label:'Worked hours'},{key:'absences',label:'Indicative absences'}],rows:summary},
 {name:'Time cards',columns:[{key:'name',label:'Employee'},{key:'branch',label:'Branch'},
  {key:'day',label:'Day'},{key:'clockIn',label:'Time in'},{key:'clockOut',label:'Time out'},
  {key:'breakHours',label:'Break hours'},{key:'workedHours',label:'Worked hours'},
  {key:'status',label:'Status'}],rows:all},
 {name:'Methodology',columns:[{key:'note',label:'Important notes'}],rows:[
  {note:'All records are simulated and stored only in this browser.'},
  {note:'Absences are inferred using a demo weekday schedule; review holidays, leave and prior schedule changes.'},
  {note:'Use time cards as payroll references only, not as approved payroll results.'}]}];
}
export function demoUnreadCount(ext:DemoExtension){
 return ext.platformNotifications.filter(x=>!x.read).length;
}
