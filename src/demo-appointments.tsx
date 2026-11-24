import React,{useState} from 'react';
import {CalendarDays,Plus} from 'lucide-react';
import {type DemoData,type DemoExtension,type DemoAppointment,newId,validateDemoAppointment} from './demo-data';

type Props={data:DemoData;ext:DemoExtension;update:(fn:(state:DemoExtension)=>DemoExtension)=>void;notify:(s:string)=>void};
const localValue=(v:string)=>{const d=new Date(v);return Number.isFinite(d.getTime())?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):''};
const newDraft=(data:DemoData):DemoAppointment=>({id:'',branchId:data.branches[0]?.id||'',customerId:null,
 customerName:'',serviceName:'',contact:'',resourceName:'General',requirements:'',notes:'',
 start:localValue(new Date(Date.now()+3600000).toISOString()),
 end:localValue(new Date(Date.now()+5400000).toISOString()),status:'pending'});
const statusOptions=['pending','confirmed','rescheduled','completed','cancelled'] as const;
export function DemoAppointments({data,ext,update,notify,membershipAllowed}:Props & {membershipAllowed:boolean}){
 const [draft,setDraft]=useState<DemoAppointment|null>(null),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[status,setStatus]=useState('all'),[branch,setBranch]=useState('all');
 const [view,setView]=useState<'list'|'calendar'>('list'),[date,setDate]=useState('all');
 const available=ext.appointments.filter(a=>(branch==='all'||a.branchId===branch)&&
  (status==='all'||a.status===status)&&(date==='all'||a.start.slice(0,10)===date)&&
  (a.customerName+' '+a.serviceName+' '+a.resourceName).toLowerCase().includes(query.toLowerCase()))
  .sort((a,b)=>a.start.localeCompare(b.start));
 const dates=[...new Set(available.map(x=>new Date(x.start).toLocaleDateString('en-CA')))].sort();
 function open(row?:DemoAppointment){setError('');setDraft(row?{...row,start:localValue(row.start),end:localValue(row.end)}:newDraft(data));}
 function save(event:React.FormEvent){event.preventDefault();if(!draft)return;
  try{
   const start=new Date(draft.start),end=new Date(draft.end);
   if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))throw Error('Choose valid appointment dates');
   const item={...draft,id:draft.id||newId(),start:start.toISOString(),end:end.toISOString()};
   const existing=ext.appointments.find(x=>x.id===draft.id);
   if(existing?.status==='cancelled'&&item.status!=='cancelled')throw Error('Cancelled appointments cannot be reopened');
   validateDemoAppointment(ext.appointments,item);
   update(previous=>({...previous,appointments:existing?
    previous.appointments.map(a=>a.id===item.id?item:a):[...previous.appointments,item]}));
   notify(existing?'Appointment updated (demo)':'Appointment created (demo)');
   setDraft(null);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Could not save appointment');}
 }
 function set<K extends keyof DemoAppointment>(key:K,value:DemoAppointment[K]){setDraft(x=>x?{...x,[key]:value}:x);}
 function action(row:DemoAppointment,status:DemoAppointment['status']){
  try{const item={...row,status};validateDemoAppointment(ext.appointments,item);
   update(old=>({...old,appointments:old.appointments.map(x=>x.id===row.id?item:x)}));
   notify('Appointment marked '+status);
  }catch(e){setError(e instanceof Error?e.message:'Invalid appointment');}
 }
 return <div className="demo-appointments">
  <div className="demo-heading"><div><div className="demo-eyebrow">CLIENT BOOKINGS</div><h1>Appointment scheduling</h1>
   <p>Create, reschedule and manage appointments. Conflicting room/resource times are blocked in this demo.</p></div>
   <div className="demo-heading-actions"><button className="demo-btn primary" onClick={()=>open()}><Plus size={15}/> Book appointment</button></div></div>
  {error&&<p className="demo-error" role="alert">{error}</p>}
  <div className="demo-card demo-appt-filters"><div className="demo-toolbar">
   <input aria-label="Find appointments" className="demo-input" placeholder="Client, service or resource" value={query} onChange={e=>setQuery(e.target.value)}/>
   <select aria-label="Filter appointment status" className="demo-input" value={status} onChange={e=>setStatus(e.target.value)}>
    <option value="all">All statuses</option>{statusOptions.map(s=><option value={s} key={s}>{s}</option>)}
   </select>
   <select aria-label="Filter appointment branch" className="demo-input" value={branch} onChange={e=>setBranch(e.target.value)}>
    <option value="all">All branches</option>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
   </select>
   <input aria-label="Appointment date filter" type="date" className="demo-input" value={date==='all'?'':date} onChange={e=>setDate(e.target.value||'all')}/>
   <div className="demo-inline-actions"><button className="demo-btn secondary" onClick={()=>setView(view==='list'?'calendar':'list')}><CalendarDays size={14}/>{view==='list'?'Calendar':'List'} view</button></div>
  </div></div>
  {view==='list'?<div className="demo-card"><div className="demo-card-title"><h2>Appointments ({available.length})</h2></div>
   <div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Start</th><th>Client</th><th>Service</th><th>Branch / resource</th><th>Status</th><th>Manage</th></tr></thead>
    <tbody>{available.map(a=><tr key={a.id}><td>{new Date(a.start).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'})}</td>
     <td><b>{a.customerName}</b></td><td>{a.serviceName}</td><td>{data.branches.find(b=>b.id===a.branchId)?.name} / {a.resourceName}</td>
     <td><span className="demo-pill">{a.status}</span></td><td><button className="demo-link" onClick={()=>open(a)}>Details / Edit</button>
     {a.status==='pending'&&<button className="demo-link" onClick={()=>action(a,'confirmed')}>Confirm</button>}</td></tr>)}</tbody></table>
    {!available.length&&<p className="demo-muted" style={{padding:20}}>No matching appointments.</p>}</div>
  </div>:<div className="demo-appt-grid">{dates.map(day=><div className="demo-card" key={day}><div className="demo-card-title"><h2>{day}</h2></div>
   <div className="demo-appt-day">{available.filter(a=>new Date(a.start).toLocaleDateString('en-CA')===day).map(a=><button key={a.id} className="demo-appt-slot" onClick={()=>open(a)}>
    <strong>{new Date(a.start).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'})}</strong><span>{a.customerName} — {a.serviceName}</span>
    <small>{a.resourceName} · {a.status}</small></button>)}</div></div>)}</div>}
  {draft&&<div className="demo-modal-backdrop" onMouseDown={()=>setDraft(null)}><div className="demo-modal demo-appt-modal" role="dialog" aria-modal="true" aria-label="Appointment" onMouseDown={e=>e.stopPropagation()}>
   <h2>{draft.id?'Manage appointment':'Book appointment'}</h2><form onSubmit={save}><div className="demo-form-grid">
    <label className="demo-label">Client name<input required maxLength={160} value={draft.customerName} onChange={e=>set('customerName',e.target.value)}/></label>
    {membershipAllowed&&<label className="demo-label">Known customer<select value={draft.customerId||''} onChange={e=>{const person=ext.customers.find(x=>x.id===e.target.value);setDraft(d=>d?{...d,customerId:person?.id||null,customerName:person?.name||d.customerName}:d)}}>
     <option value="">Walk-in / unlinked</option>{ext.customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>}
    <label className="demo-label">Service<input required maxLength={160} value={draft.serviceName} onChange={e=>set('serviceName',e.target.value)}/></label>
    <label className="demo-label">Contact<input maxLength={180} value={draft.contact} onChange={e=>set('contact',e.target.value)}/></label>
    <label className="demo-label">Branch<select required value={draft.branchId} onChange={e=>set('branchId',e.target.value)}>
     {data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label className="demo-label">Staff / room / resource<input required maxLength={120} value={draft.resourceName} onChange={e=>set('resourceName',e.target.value)}/></label>
    <label className="demo-label">Start<input required type="datetime-local" value={draft.start} onChange={e=>set('start',e.target.value)}/></label>
    <label className="demo-label">End<input required type="datetime-local" value={draft.end} onChange={e=>set('end',e.target.value)}/></label>
    <label className="demo-label">Status<select value={draft.status} onChange={e=>set('status',e.target.value as DemoAppointment['status'])}>
      {statusOptions.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
    <label className="demo-label wide">Requirements<textarea value={draft.requirements} onChange={e=>set('requirements',e.target.value)}/></label>
    <label className="demo-label wide">Internal notes<textarea value={draft.notes} onChange={e=>set('notes',e.target.value)}/></label>
   </div>{error&&<p className="demo-error" role="alert">{error}</p>}
   <div className="demo-actions"><button type="button" className="demo-btn secondary" onClick={()=>setDraft(null)}>Cancel</button>
    <button className="demo-btn primary" disabled={!draft.customerName.trim()||!draft.serviceName.trim()}>Save appointment</button></div>
   </form>
  </div></div>}
 </div>;
}
