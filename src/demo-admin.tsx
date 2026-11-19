import React,{useState} from 'react';
import {Bell,Check,RefreshCcw} from 'lucide-react';
import {type DemoData,type DemoExtension} from './demo-data';

type Props={data:DemoData;ext:DemoExtension;update:(fn:(state:DemoExtension)=>DemoExtension)=>void};
export function DemoPlatformUsers({data}:Pick<Props,'data'>){
 const [query,setQuery]=useState(''),[business,setBusiness]=useState('all');
 const workspaces=[
  {name:'Stratify Demo Business',industry:data.businessType==='food'?'Restaurant / food & beverage':'Other business',
   people:data.staff.map(p=>({...p,email:p.name.toLowerCase().replaceAll(' ','.')+'@example.invalid'}))},
  {name:'Example Coffee House',industry:'Restaurant / food & beverage',people:[{id:'business2',name:'Riley Chen',role:'owner',email:'riley@example.invalid'}]},
  {name:'Example Clinic',industry:'Other business',people:[{id:'business3',name:'Dr. Robin Cruz',role:'manager',email:'robin@example.invalid'}]}
 ];
 const users=workspaces.flatMap(b=>b.people.map(u=>({...u,business:b.name}))).filter(x=>
  (business==='all'||x.business===business)&&(x.name+' '+x.email+' '+x.business).toLowerCase().includes(query.toLowerCase()));
 return <><div className="demo-heading"><div><div className="demo-eyebrow">PLATFORM ADMINISTRATION</div>
  <h1>Platform users</h1><p>Search simulated users by their associated business. No changes affect real accounts.</p></div></div>
  <div className="demo-card demo-appt-filters"><div className="demo-toolbar">
   <input className="demo-input" aria-label="Search platform users" placeholder="User name or email" value={query} onChange={e=>setQuery(e.target.value)}/>
   <select className="demo-input" aria-label="Filter users by business" value={business} onChange={e=>setBusiness(e.target.value)}>
    <option value="all">All registered businesses</option>{workspaces.map(b=><option key={b.name} value={b.name}>{b.name}</option>)}
   </select></div></div>
  <div className="demo-card"><div className="demo-card-title"><h2>Users ({users.length})</h2></div>
   <div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Name</th><th>Email</th><th>Business</th><th>Role</th></tr></thead>
    <tbody>{users.map(u=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.business}</td><td>{u.role}</td></tr>)}</tbody>
   </table></div>
  </div></>;
}
export function DemoPlatformDashboard({ext}:Pick<Props,'ext'>){
 const unread=ext.platformNotifications.filter(n=>!n.read).length;
 return <><div className="demo-heading"><div><div className="demo-eyebrow">PLATFORM ADMINISTRATION</div>
  <h1>Platform dashboard</h1><p>Example subscription and trial events, not production records.</p></div></div>
  <div className="demo-metrics demo-metrics-three">
   <div className="demo-metric"><small>Sample businesses</small><strong>3</strong></div>
   <div className="demo-metric"><small>Unread notifications</small><strong>{unread}</strong></div>
   <div className="demo-metric"><small>Attention required</small><strong>{ext.platformNotifications.filter(n=>!n.read&&n.kind==='action').length}</strong></div>
  </div><div className="demo-card"><div className="demo-card-title"><h2>Recent platform activities</h2></div>
   <div className="demo-platform-activities">{ext.platformNotifications.map(n=><div key={n.id}>
    <strong>{n.title}</strong><span>{n.message}</span><small>{new Date(n.date).toLocaleString('en-PH')}</small>
   </div>)}</div></div>
 </>;
}
export function DemoNotificationBell({ext,update}:Pick<Props,'ext'|'update'>){
 const [expanded,setExpanded]=useState(false);
 const unread=ext.platformNotifications.filter(n=>!n.read).length;
 function mark(id:string){update(old=>({...old,platformNotifications:old.platformNotifications.map(n=>n.id===id?{...n,read:true}:n)}));}
 return <div className="demo-platform-notifications">
  <button className="demo-menu-button demo-bell" title="Platform notifications" aria-label={'Notifications ('+unread+' unread)'}
   onClick={()=>setExpanded(!expanded)}><Bell size={20}/>{unread>0&&<span className="demo-unread">{unread}</span>}</button>
  {expanded&&<section className="demo-notification-popover"><div className="demo-card-title"><h2>Platform notifications</h2>
   <button className="demo-link" onClick={()=>setExpanded(false)}>Close</button></div>
   <div className="demo-notice-list">{ext.platformNotifications.map(n=><div className={'demo-notice '+(!n.read?'new':'')} key={n.id}>
    <div><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.date).toLocaleString('en-PH')}</small></div>
    {!n.read&&<button className="demo-link" onClick={()=>mark(n.id)} aria-label={'Mark '+n.title+' read'}><Check size={14}/></button>}
   </div>)}</div>
   <p className="demo-muted" style={{padding:12}}>Demo notifications update locally as you mark them read. No live platform connection.</p>
  </section>}
 </div>;
}
