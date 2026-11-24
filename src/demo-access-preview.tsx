import React,{useState} from 'react';
import {ArrowLeft,ShieldCheck,RotateCcw,Trash2} from 'lucide-react';
import {demoAccounts,merchantPages,initialDemoAccess,canAccountView,availableDemoAccounts,deleteDemoBusiness,deleteDemoUser,DEMO_BUSINESS_NAME,type DemoData,type DemoExtension,type DemoPermissions,type MerchantPage} from './demo-data';
const labels:Record<MerchantPage,string>={overview:'Dashboard',pos:'Point of Sale',products:'Products & Services',inventory:'Inventory',warehouse:'Stock & Transfers',purchasing:'Purchasing',memberships:'Customer Memberships',appointments:'Appointment Scheduling',register:'Cash Registers',qr:'Customer QR Orders',kitchen:'Kitchen Display',refunds:'Refunds',guide:'Feature Walkthrough',orders:'Transactions',reports:'Reports',staff:'Team & Attendance',branches:'Branches',settings:'Settings'};
function ModuleFields({value,onChange}:{value:DemoPermissions;onChange:(v:DemoPermissions)=>void}){
 return <div className="demo-form-grid">{merchantPages.map(key=><label className="demo-label" key={key}>{labels[key]}<select value={value[key]===undefined?'inherit':String(value[key])} onChange={e=>{const next={...value};if(e.target.value==='inherit')delete next[key];else next[key]=e.target.value==='true';onChange(next);}}><option value="inherit">Inherit{key==='appointments'||key==='memberships'?' (approval required)':''}</option><option value="true">Allow</option><option value="false">Block</option></select></label>)}</div>;
}
export function DemoAccessPreview({data,ext,replace,reset}:{data:DemoData;ext:DemoExtension;replace:(d:DemoData,e:DemoExtension)=>void;reset:()=>void}){
 const access=data.access??initialDemoAccess(),[scope,setScope]=useState('business'),[message,setMessage]=useState(''),[error,setError]=useState('');
 const people=demoAccounts.filter(a=>data.staff.some(s=>s.name===a.name)),person=people.find(a=>a.email===scope),member=person?access.users[person.email]??{enabled:true,modules:{}}:null;
 function apply(next:DemoData,nextExt=ext){replace(next,nextExt);setError('');setMessage('Sample changes saved in this browser.');}
 function updateModules(modules:DemoPermissions){
  if(access.deleted)return;
  if(scope==='business')apply({...data,access:{...access,business:modules}});
  else if(person&&member)apply({...data,access:{...access,users:{...access.users,[person.email]:{...member,modules}}}});
 }
 function remove(email:string){
  const confirmation=window.prompt('Permanently remove this fictional account from the demo? Type '+email+' to confirm.');
  if(confirmation===null)return;
  try{apply(deleteDemoUser(data,ext,email,confirmation));if(scope===email)setScope('business');}
  catch(e){setMessage('');setError((e as Error).message);}
 }
 function removeBusiness(){const confirmation=window.prompt('Delete all fictional business data, users and branches in this browser? Type '+DEMO_BUSINESS_NAME+' to confirm.');if(confirmation===null)return;
  try{const next=deleteDemoBusiness(data,confirmation);apply(next.data,next.extension);setScope('business');}
  catch(e){setMessage('');setError((e as Error).message);}
 }
 return <main className="demo-partner demo-access-preview"><div className="demo-disclaimer"><ShieldCheck size={16}/> PORTFOLIO DEMO — SIMULATED PLATFORM ACCESS</div><div className="demo-inline-form"><a className="demo-btn secondary" href="/"><ArrowLeft size={16}/> Merchant demo</a><button className="demo-btn secondary" onClick={()=>{if(window.confirm('Restore the fictional business and all sample accounts?')){reset();setScope('business');setError('');setMessage('Original sample data restored.');}}}><RotateCcw size={15}/> Reset sample data</button></div>
 <div className="demo-heading"><div><div className="demo-eyebrow">ACCESS CONTROL SANDBOX</div><h1>Platform access simulator</h1><p>Try the Super Admin permission and deletion workflows without a real platform account. Changes affect only the sample business in this browser. No production access or actual credentials.</p></div></div>
 {message&&<p role="status">{message}</p>}{error&&<p className="demo-error" role="alert">{error}</p>}
 <div className="demo-metrics"><div className="demo-metric"><span>Sample businesses</span><strong>{access.deleted?0:1}</strong></div><div className="demo-metric"><span>Branch records</span><strong>{data.branches.length}</strong></div><div className="demo-metric"><span>Available accounts</span><strong>{availableDemoAccounts(data).length}</strong></div></div>
 {access.deleted?<section className="demo-card"><div className="demo-partner-inner"><h2>Sample business deleted</h2><p>All local business records, employees and branches were removed. Reset the demo to explore again.</p></div></section>:<>
 <section className="demo-card"><div className="demo-card-title"><h2>Business and module approvals</h2></div><div className="demo-partner-inner"><p>Memberships and appointments require explicit approval. A business-wide Block overrides an employee Allow. Role restrictions always apply.</p><label className="demo-label">Apply permissions to<select value={scope} onChange={e=>setScope(e.target.value)}><option value="business">Entire sample business</option>{people.map(a=><option key={a.email} value={a.email}>{a.name} · {a.role}</option>)}</select></label>
 {member&&person&&<label className="demo-inline-form"><input type="checkbox" checked={member.enabled} onChange={e=>apply({...data,access:{...access,users:{...access.users,[person.email]:{...member,enabled:e.target.checked}}}})}/> Workspace enabled</label>}
 <ModuleFields value={scope==='business'?access.business:member?.modules??{}} onChange={updateModules}/><small>Changes save immediately. Return to merchant demo or sign in as a different sample role to inspect the result.</small></div></section>
 <section className="demo-card"><div className="demo-card-title"><h2>Sample users</h2></div><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>User</th><th>Role</th><th>Workspace</th><th>Manual modules</th><th>Actions</th></tr></thead><tbody>{people.map(a=><tr key={a.email}><td><b>{a.name}</b><div className="demo-muted">{a.email}</div></td><td>{a.role}</td><td>{availableDemoAccounts(data).some(x=>x.email===a.email)?'Available':'Blocked'}</td><td>{['memberships','appointments'].filter(k=>canAccountView(data,a,k)).map(k=>labels[k as MerchantPage]).join(', ')||'None'}</td><td><div className="demo-inline-form"><button className="demo-btn secondary" onClick={()=>setScope(a.email)}>Manage access</button><button className="demo-btn secondary" onClick={()=>remove(a.email)}><Trash2 size={14}/> Delete</button></div></td></tr>)}</tbody></table></div></section>
 <section className="demo-card"><div className="demo-card-title"><h2>Delete fictional business</h2></div><div className="demo-partner-inner"><p>All records here are disposable sample data. Deleting the fictional business also removes its users and branches. The live system instead blocks deletion when protected financial history exists.</p><button className="demo-btn secondary" onClick={removeBusiness}><Trash2 size={15}/> Delete sample business</button></div></section></>}
 </main>;
}
