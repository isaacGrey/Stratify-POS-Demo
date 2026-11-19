import React,{useMemo,useState} from 'react';
import {CalendarDays,ClipboardList,Bell,Download,Plus,RefreshCw,FileText,FileSpreadsheet} from 'lucide-react';
import type {DemoData,DemoExtension,DemoAppointment,DemoAppointmentStatus} from './demo-data';
import {newId} from './demo-data';
import {saveDemoAppointment,demoInventorySheets,demoAttendanceSheets,demoUnreadCount} from './demo-operations';
import {downloadDemoExport} from './demo-exports';

type Update=(f:(old:DemoExtension)=>DemoExtension)=>void;
type Common={data:DemoData;ext:DemoExtension;update:Update;notify:(s:string)=>void};
const day=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
const local=(v:string)=>{const d=new Date(v);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';};
const humanTime=(v:string)=>new Date(v).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});
const statuses=['pending','confirmed','rescheduled','completed','cancelled'] as const;
const init=(branch:string):DemoAppointment=>({id:'',branchId:branch,clientName:'',clientContact:'',serviceName:'',
 requirements:'',resourceKey:'default',startsAt:day()+'T09:00',endsAt:day()+'T10:00',status:'pending',events:[]});
export function DemoAppointments({data,ext,update,notify}:Common){
 const [display,setDisplay]=useState<'calendar'|'list'>('calendar');
 const [date,setDate]=useState(day());
 const [branch,setBranch]=useState('all');
 const [filter,setFilter]=useState('all');
 const [q,setQ]=useState('');
 const [draft,setDraft]=useState<DemoAppointment|null>(null);
 const [error,setError]=useState('');
 const [history,setHistory]=useState<DemoAppointment|null>(null);
 const show=ext.appointments.filter(a=>(branch==='all'||a.branchId===branch)&&
  (filter==='all'||a.status===filter)&&[a.clientName,a.serviceName,a.requirements,a.resourceKey].join(' ').toLowerCase().includes(q.toLowerCase()));
 const week=useMemo(()=>Array.from({length:7},(_,i)=>{
  const start=new Date(date+'T12:00:00');start.setDate(start.getDate()-start.getDay()+1+i);
  return start.toISOString().slice(0,10);
 }),[date]);
 const open=(a?:DemoAppointment)=>{setError('');setDraft(a?{...a,startsAt:local(a.startsAt),endsAt:local(a.endsAt)}:init(branch==='all'?'b1':branch));};
 function save(e:React.FormEvent){
  e.preventDefault();if(!draft)return;
  try{
   if(!data.branches.some(b=>b.id===draft.branchId))throw Error('Select a valid branch');
   const value={...draft,id:draft.id||newId(),startsAt:new Date(draft.startsAt).toISOString(),
    endsAt:new Date(draft.endsAt).toISOString()};
   update(old=>saveDemoAppointment(old,value));
   setDraft(null);setError('');notify('Demo appointment saved.');
  }catch(err){setError((err as Error).message);}
 }
 const edit=(key:keyof DemoAppointment,value:string)=>setDraft(old=>old?{...old,[key]:value,
   ...(key==='startsAt'||key==='endsAt'?{status:old.id?'rescheduled' as DemoAppointmentStatus:old.status}:{})}:old);
 return <div className="demo-ops-page">
  <div className="demo-heading"><div><div className="demo-eyebrow">CLIENT OPERATIONS</div>
   <h1>Appointment Scheduling</h1><p>Book, reschedule, track requirements and prevent resource conflicts in this browser-only demo.</p></div>
   <button className="demo-btn primary" onClick={()=>open()}><Plus size={15}/> New booking</button>
  </div>
  <div className="demo-workflow-metrics">{statuses.slice(0,4).map(status=><div className="demo-workflow-stat" key={status}>
   <small className="capitalize">{status}</small><strong>{ext.appointments.filter(a=>a.status===status).length}</strong></div>)}</div>
  <section className="demo-card demo-workflow-section">
   <div className="demo-card-title"><h2>Appointments</h2><div className="demo-inline-form">
    <button className={'demo-btn secondary '+(display==='calendar'?'selected':'')} onClick={()=>setDisplay('calendar')}>Calendar</button>
    <button className={'demo-btn secondary '+(display==='list'?'selected':'')} onClick={()=>setDisplay('list')}>List</button>
   </div></div>
   <div className="demo-appointment-filters">
    <label>Week of <input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label>Branch <select value={branch} onChange={e=>setBranch(e.target.value)}><option value="all">All branches</option>
     {data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
    <label>Status <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>
     {statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label>Search <input value={q} placeholder="Client, service, resource" onChange={e=>setQ(e.target.value)}/></label>
   </div>
   {display==='calendar'?<div className="demo-appointment-calendar">
    {week.map(d=><div className="demo-appointment-day" key={d}><b>{new Date(d+'T12:00:00').toLocaleDateString('en-PH',{weekday:'short',day:'numeric',month:'short'})}</b>
     {show.filter(a=>a.startsAt.slice(0,10)===d).map(a=><button key={a.id} className="demo-appointment-tile" onClick={()=>open(a)}>
      <b>{new Date(a.startsAt).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'})}</b>
      {a.clientName}<small>{a.serviceName}</small><small className="capitalize">{a.status}</small>
     </button>)}</div>)}
   </div>:<div className="demo-table-scroll"><table className="demo-table"><thead><tr>
    {['Client','Service','Branch','Start','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
    <tbody>{show.map(a=><tr key={a.id}><td>{a.clientName}</td><td>{a.serviceName}</td>
     <td>{data.branches.find(b=>b.id===a.branchId)?.name}</td><td>{humanTime(a.startsAt)}</td><td className="capitalize">{a.status}</td>
     <td><button className="demo-btn secondary" onClick={()=>open(a)}>Edit</button>
      <button className="demo-btn secondary" onClick={()=>setHistory(a)}>History</button></td></tr>)}</tbody></table></div>}
  </section>
  {draft&&<div className="demo-modal-backdrop"><form className="demo-modal demo-appointment-modal" onSubmit={save}>
   <h2>{draft.id?'Edit appointment':'New appointment'}</h2>
   <div className="demo-appointment-form">
    <label>Branch<select value={draft.branchId} disabled={!!draft.id} onChange={e=>edit('branchId',e.target.value)}>
     {data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
    <label>Customer<select value={draft.customerId||''} onChange={e=>{
     const c=ext.customers.find(x=>x.id===e.target.value);
     setDraft(v=>v?{...v,customerId:e.target.value||undefined,clientName:c?.name||v.clientName,clientContact:c?.phone||v.clientContact}:v);
    }}><option value="">Walk-in / new</option>{ext.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Client name<input required maxLength={160} value={draft.clientName} onChange={e=>edit('clientName',e.target.value)}/></label>
    <label>Contact<input maxLength={160} value={draft.clientContact} onChange={e=>edit('clientContact',e.target.value)}/></label>
    <label>Service<input required maxLength={160} value={draft.serviceName} onChange={e=>edit('serviceName',e.target.value)}/></label>
    <label>Room / resource<input required maxLength={80} value={draft.resourceKey} onChange={e=>edit('resourceKey',e.target.value)}/></label>
    <label>Starts<input type="datetime-local" required value={draft.startsAt} onChange={e=>edit('startsAt',e.target.value)}/></label>
    <label>Ends<input type="datetime-local" required value={draft.endsAt} onChange={e=>edit('endsAt',e.target.value)}/></label>
    <label>Status<select value={draft.status} onChange={e=>edit('status',e.target.value)}>
     {statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label className="wide">Requirements / notes<textarea value={draft.requirements} maxLength={1500} onChange={e=>edit('requirements',e.target.value)}/></label>
   </div>
   {error&&<p role="alert" className="demo-error">{error}</p>}
   <p className="demo-ops-hint">Conflicting appointments for the same room at the same branch cannot be saved.</p>
   <div className="demo-actions"><button type="button" className="demo-btn secondary" onClick={()=>setDraft(null)}>Cancel</button>
    <button className="demo-btn primary">Save appointment</button></div>
  </form></div>}
  {history&&<div className="demo-modal-backdrop"><div className="demo-modal">
   <h2>Booking history · {history.clientName}</h2>
   {history.events.map((e,i)=><p key={i}>{humanTime(e.at)} · {e.kind} · {e.reason}</p>)}
   <button className="demo-btn secondary" onClick={()=>setHistory(null)}>Close</button></div></div>}
 </div>;
}

export function DemoReportsPanel({data,ext,kind}:Common&{kind:'inventory'|'attendance'}){
 const [branch,setBranch]=useState('all'),[error,setError]=useState('');
 const sheets=kind==='inventory'?demoInventorySheets(data,ext,branch==='all'?'':branch):
  demoAttendanceSheets(data,ext,branch==='all'?'':branch);
 const download=(format:'xlsx'|'pdf')=>{
  try{downloadDemoExport(sheets,format,'stratify-demo-'+kind+'-report');setError('');}
  catch(err){setError((err as Error).message);}
 };
 return <section className="demo-card demo-workflow-section">
  <div className="demo-card-title"><h2>{kind==='inventory'?'Inventory Reports':'Attendance Reports & Time Cards'}</h2>
   <div className="demo-inline-form">
    <button className="demo-btn secondary" onClick={()=>download('xlsx')}><FileSpreadsheet size={15}/> Excel</button>
    <button className="demo-btn secondary" onClick={()=>download('pdf')}><FileText size={15}/> PDF</button>
   </div>
  </div>
  <div className="demo-appointment-filters"><label>Branch <select value={branch} onChange={e=>setBranch(e.target.value)}>
   <option value="all">All branches</option>{data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}
  </select></label></div>
  {error&&<p role="alert" className="demo-error">{error}</p>}
  <p className="demo-ops-hint">{kind==='inventory'?'Includes available stock, low-stock alerts, reorder levels and movement history.':
   'Includes simulated employee clock-in/out, breaks, worked hours and illustrative weekday absence indicators. For payroll reference only.'}</p>
  <div className="demo-table-scroll"><table className="demo-table"><thead><tr>{sheets[0].columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead>
   <tbody>{sheets[0].rows.map((row,i)=><tr key={i}>{sheets[0].columns.map(c=><td key={c.key}>{row[c.key]??'—'}</td>)}</tr>)}</tbody>
  </table></div>
 </section>;
}

const platformUsers=[
 {name:'Alex Rivera',email:'owner@demo.stratifypos.app',business:'Stratify Demo Business',role:'Owner'},
 {name:'Sam Reyes',email:'manager@demo.stratifypos.app',business:'Stratify Demo Business',role:'Manager'},
 {name:'Jamie Cruz',email:'cashier@demo.stratifypos.app',business:'Stratify Demo Business',role:'Cashier'},
 {name:'Lara Santos',email:'lara@sample-clinic.invalid',business:'Sample Clinic',role:'Owner'},
 {name:'Marco Tan',email:'marco@sample-retail.invalid',business:'Sample Retail Co.',role:'Owner'},
 {name:'Ella Ramos',email:'ella@sample-cafe.invalid',business:'Sample Coffee House',role:'Owner'}
];
export function DemoPlatformUsers({ext,update,notify}:Pick<Common,'ext'|'update'|'notify'>){
 const [business,setBusiness]=useState('all'),[search,setSearch]=useState('');
 const businesses=['Stratify Demo Business','Sample Clinic','Sample Retail Co.','Sample Coffee House'];
 const items=platformUsers.filter(p=>(business==='all'||p.business===business)&&
  [p.name,p.email,p.business].join(' ').toLowerCase().includes(search.toLowerCase()));
 function simulate(){
  update(old=>({...old,platformNotifications:[{id:newId(),title:'New free trial',detail:'Example New Gym has registered',
    kind:'trial',at:new Date().toISOString(),read:false},...old.platformNotifications]}));
  notify('Simulated signup notification created.');
 }
 return <><div className="demo-heading"><div><div className="demo-eyebrow">PLATFORM ADMIN</div>
  <h1>Platform users</h1><p>Filter users by their registered business. All data is fictional.</p></div>
  <button className="demo-btn secondary" onClick={simulate}><Plus size={15}/> Simulate trial signup</button></div>
  <section className="demo-card demo-workflow-section">
   <div className="demo-appointment-filters">
    <label>Business<select value={business} onChange={e=>setBusiness(e.target.value)}>
     <option value="all">All registered businesses</option>
     {businesses.map(b=><option key={b} value={b}>{b}</option>)}</select></label>
    <label>Search users<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or email"/></label>
   </div>
   <div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Name</th><th>Email</th><th>Business</th><th>Role</th></tr></thead>
   <tbody>{items.map(u=><tr key={u.email}><td>{u.name}</td><td>{u.email}</td><td>{u.business}</td><td>{u.role}</td></tr>)}</tbody></table></div>
  </section></>;
}

export function DemoNotifications({ext,update,compact=false}:Pick<Common,'ext'|'update'>&{compact?:boolean}){
 const [open,setOpen]=useState(!compact);
 const unread=demoUnreadCount(ext);
 function read(id:string){update(old=>({...old,platformNotifications:old.platformNotifications.map(n=>n.id===id?{...n,read:true}:n)}));}
 const list=<div className="demo-notification-list">
  {ext.platformNotifications.map(n=><div className={'demo-notification '+(!n.read?'unread':'')} key={n.id}>
   <div><strong>{n.title}</strong><p>{n.detail}</p><small>{humanTime(n.at)}</small></div>
   {!n.read&&<button className="demo-btn secondary" onClick={()=>read(n.id)}>Mark read</button>}
  </div>)}
  {!ext.platformNotifications.length&&<p>No platform notifications.</p>}
 </div>;
 if(compact)return <div className="demo-notification-bell">
  <button className="demo-notification-trigger" aria-label={'Platform notifications: '+unread+' unread'}
   onClick={()=>setOpen(v=>!v)}><Bell size={19}/>{unread>0&&<span>{unread}</span>}</button>
  {open&&<div className="demo-notification-popover"><div className="demo-card-title"><h2>Notifications</h2>
   <button className="demo-btn secondary" onClick={()=>setOpen(false)}>Close</button></div>{list}
   <button className="demo-btn secondary" onClick={()=>update(old=>({...old,
    platformNotifications:old.platformNotifications.map(n=>({...n,read:true}))}))}>Mark all read</button>
  </div>}
 </div>;
 return <div className="demo-ops-page"><div className="demo-heading"><div>
  <div className="demo-eyebrow">PLATFORM ADMIN</div><h1>Platform notifications</h1>
  <p>Simulated signups, pending approvals, trials and subscription events.</p></div>
  <div className="demo-workflow-stat"><small>Unread</small><strong>{unread}</strong></div></div>
  <section className="demo-card demo-workflow-section">{list}
   <div className="demo-actions"><button className="demo-btn secondary" onClick={()=>update(old=>({...old,
    platformNotifications:old.platformNotifications.map(n=>({...n,read:true}))}))}>Mark all as read</button></div>
  </section></div>;
}
