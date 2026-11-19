import React,{useState} from 'react';
import {type DemoData,type DemoExtension,type DemoProduct,type DemoSale,type DemoRole,
  type DemoServicePlan,calendarExpiry,newId,tracksStock,transferDemoStock,refundDemoSale} from './demo-data';
import {ClipboardList,ArrowRightLeft,Plus,CheckCircle2,Clock3,RefreshCw,PackageCheck,Wallet,ChefHat,QrCode} from 'lucide-react';
import {kitchenTicketView,kitchenLineItems,needsKitchenTicket,saleOrderType} from './sale-flow';

const currency=(n:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n/100);
const localDay=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const short=(s:string|null)=>s||'Lifetime';
const options=[['none','No expiry / lifetime'],['months:1','1 month'],['months:2','2 months'],['months:3','3 months'],['months:6','6 months'],['months:12','1 year'],['months:24','2 years'],['days:7','7 days'],['days:30','30 days'],['custom','Custom expiry date']];
type Props={data:DemoData;ext:DemoExtension;role:DemoRole;actor:string;update:(change:(e:DemoExtension)=>DemoExtension)=>void;change:(change:(d:DemoData)=>DemoData)=>void;notify:(s:string)=>void};
function Intro({title,text}:{title:string;text:string}){return <div className="demo-heading"><div><div className="demo-eyebrow">INTERACTIVE DEMO WORKFLOW</div><h1>{title}</h1><p>{text}</p></div></div>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="demo-card demo-workflow-section"><div className="demo-card-title"><h2>{title}</h2></div>{children}</section>}
function Select({label,value,onChange,children}:{label:string;value:string;onChange:(v:string)=>void;children:React.ReactNode}){return <label className="demo-label">{label}<select className="demo-input" value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>}
function Message({error}:{error:string}){return error?<p role="alert" className="demo-error">{error}</p>:null}
export function WarehouseWorkflows({data,ext,update,notify}:Props){
 const [product,setProduct]=useState('p1'),[from,setFrom]=useState('b1'),[to,setTo]=useState('b2'),[qty,setQty]=useState('5'),[reason,setReason]=useState('Rebalance inventory'),[error,setError]=useState('');
 const physical=data.products.filter(tracksStock);
 const target=data.products.find(p=>p.id===product);
 function transfer(e:React.FormEvent){e.preventDefault();try{update(old=>transferDemoStock(old,product,from,to,Number(qty),reason));setError('');notify('Stock transfer recorded across both branches.');}catch(err){setError((err as Error).message)}}
 return <><Intro title="Inventory & warehouse transfers" text="Monitor each branch, transfer stock, and inspect every simulated movement. StratifyPOS Development tracks branches; multiple stockrooms within one branch are not yet implemented."/>
 <div className="demo-workflow-metrics">{data.branches.map(b=><div className="demo-workflow-stat" key={b.id}><small>{b.name}</small><strong>{physical.reduce((n,p)=>n+(ext.balances[b.id]?.[p.id]||0),0)}</strong><span>stock units</span></div>)}</div>
 <Section title="Transfer between branches"><form className="demo-workflow-form" onSubmit={transfer}>
  <Select label="Stock item" value={product} onChange={setProduct}>{physical.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</Select>
  <Select label="From branch" value={from} onChange={setFrom}>{data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</Select>
  <Select label="To branch" value={to} onChange={setTo}>{data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</Select>
  <label className="demo-label">Quantity<input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label>
  <label className="demo-label">Reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label>
  <div className="demo-workflow-span"><p className="demo-muted">Available at source: <b>{ext.balances[from]?.[product]||0} {target?.name||'units'}</b></p><Message error={error}/><button className="demo-btn primary"><ArrowRightLeft size={16}/> Transfer stock</button></div>
 </form></Section>
 <Section title="Branch stock balances"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Item</th>{data.branches.map(b=><th key={b.id}>{b.name}</th>)}<th>Total</th></tr></thead><tbody>{physical.map(p=><tr key={p.id}><td>{p.emoji} {p.name}</td>{data.branches.map(b=><td key={b.id}>{ext.balances[b.id]?.[p.id]||0}</td>)}<td><b>{data.branches.reduce((n,b)=>n+(ext.balances[b.id]?.[p.id]||0),0)}</b></td></tr>)}</tbody></table></div></Section>
 <Section title="Stock movement ledger"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Action</th><th>Item</th><th>From</th><th>To</th><th>Quantity</th><th>Reason</th></tr></thead><tbody>{ext.movements.slice(0,35).map(m=><tr key={m.id}><td>{m.kind}</td><td>{data.products.find(p=>p.id===m.productId)?.name}</td><td>{data.branches.find(b=>b.id===m.from)?.name||'—'}</td><td>{data.branches.find(b=>b.id===m.to)?.name||'—'}</td><td>{m.qty}</td><td>{m.reason}</td></tr>)}{!ext.movements.length&&<tr><td colSpan={6}>No movements yet. Try a transfer.</td></tr>}</tbody></table></div></Section></>;
}
export function PurchasingWorkflows({data,ext,update,notify}:Props){
 const [supplier,setSupplier]=useState('sup1'),[branch,setBranch]=useState('b1'),[product,setProduct]=useState('p1'),[qty,setQty]=useState('15'),[cost,setCost]=useState('75'),[newSupplier,setNewSupplier]=useState(''),[error,setError]=useState('');
 function create(e:React.FormEvent){e.preventDefault();const amount=Number(qty),unit=Math.round(Number(cost)*100);if(!Number.isInteger(amount)||amount<=0||!Number.isInteger(unit)||unit<0){setError('Enter valid quantity and cost');return;}update(old=>({...old,purchases:[{id:newId(),date:new Date().toISOString(),branchId:branch,supplierId:supplier,productId:product,ordered:amount,received:0,cost:unit},...old.purchases]}));setError('');notify('Purchase order created. Receive stock below.');}
 function receive(id:string){const po=ext.purchases.find(p=>p.id===id);if(!po)return;const input=window.prompt('Units to receive (remaining: '+(po.ordered-po.received)+')',String(po.ordered-po.received));if(input===null)return;const amount=Number(input);if(!Number.isInteger(amount)||amount<=0||amount>po.ordered-po.received){setError('Invalid receipt: quantity exceeds outstanding purchase order');return;}update(old=>({...old,
  purchases:old.purchases.map(p=>p.id===id?{...p,received:p.received+amount}:p),
  balances:{...old.balances,[po.branchId]:{...old.balances[po.branchId],[po.productId]:(old.balances[po.branchId]?.[po.productId]||0)+amount}},
  movements:[{id:newId(),date:new Date().toISOString(),productId:po.productId,from:null,to:po.branchId,qty:amount,kind:'receive',reason:'Purchase receipt '+id.slice(0,8)},...old.movements]
 }));setError('');notify('Goods received; branch stock increased.');}
 return <><Intro title="Purchasing & suppliers" text="Create sample supplier purchase orders and receive them in parts. Receipts update the selected branch stock."/>
 <Section title="Suppliers"><div className="demo-inline-form"><input aria-label="New supplier" placeholder="Supplier name" value={newSupplier} onChange={e=>setNewSupplier(e.target.value)}/><button className="demo-btn secondary" disabled={!newSupplier.trim()} onClick={()=>{update(old=>({...old,suppliers:[...old.suppliers,{id:newId(),name:newSupplier.trim(),contact:''}]}));setNewSupplier('');notify('Supplier added.')}}><Plus size={15}/> Add supplier</button></div><p>{ext.suppliers.map(s=>s.name).join(' · ')}</p></Section>
 <Section title="Create purchase order"><form className="demo-workflow-form" onSubmit={create}>
  <Select label="Supplier" value={supplier} onChange={setSupplier}>{ext.suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select>
  <Select label="Receiving branch" value={branch} onChange={setBranch}>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Select>
  <Select label="Stock item" value={product} onChange={setProduct}>{data.products.filter(tracksStock).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select>
  <label className="demo-label">Order quantity<input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label>
  <label className="demo-label">Unit cost (PHP)<input type="number" min="0" step=".01" value={cost} onChange={e=>setCost(e.target.value)}/></label>
  <div className="demo-workflow-span"><Message error={error}/><button className="demo-btn primary"><Plus size={16}/> Create purchase order</button></div>
 </form></Section>
 <Section title="Purchase order receiving"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Item</th><th>Supplier</th><th>Branch</th><th>Ordered</th><th>Received</th><th>Action</th></tr></thead><tbody>{ext.purchases.map(p=><tr key={p.id}><td>{data.products.find(x=>x.id===p.productId)?.name}</td><td>{ext.suppliers.find(x=>x.id===p.supplierId)?.name}</td><td>{data.branches.find(x=>x.id===p.branchId)?.name}</td><td>{p.ordered}</td><td>{p.received}</td><td><button className="demo-btn secondary" disabled={p.received===p.ordered} onClick={()=>receive(p.id)}><PackageCheck size={15}/> Receive</button></td></tr>)}{!ext.purchases.length&&<tr><td colSpan={6}>Create a purchase order to try partial receiving.</td></tr>}</tbody></table></div></Section></>;
}
export function MembershipWorkflows({data,ext,role,update,change,notify}:Props){
 const [tab,setTab]=useState<'members'|'customers'|'plans'>('members');
 const [lookup,setLookup]=useState('');
 const [statusFilter,setStatusFilter]=useState('all'),[planFilter,setPlanFilter]=useState('all');
 const readonly=role==='cashier';
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[plan,setPlan]=useState('plan1'),[customer,setCustomer]=useState('cus1'),[branch,setBranch]=useState('b1');
 const [start,setStart]=useState(localDay()),[expiry,setExpiry]=useState('default'),[custom,setCustom]=useState(''),[reason,setReason]=useState('Demo membership granted');
 const [planName,setPlanName]=useState(''),[duration,setDuration]=useState('months:1'),[planPrice,setPlanPrice]=useState('999'),[sellThroughPos,setSellThroughPos]=useState(true);
 const [error,setError]=useState('');
 const plans=ext.plans.filter(p=>p.active);
 const visibleEntitlements=ext.entitlements.filter(e=>{const c=ext.customers.find(x=>x.id===e.customerId),p=ext.plans.find(x=>x.id===e.planId);return (c?.name+' '+c?.reference+' '+p?.name).toLowerCase().includes(lookup.trim().toLowerCase());});
 function expiration(p:DemoServicePlan,first:string):string|null {
  if(expiry==='none')return null;
  if(expiry==='custom'){if(!custom||custom<first)throw Error('Choose an expiry date on or after the start');return custom;}
  return calendarExpiry(first,p.durationKind,p.durationValue);
 }
 function grant(e:React.FormEvent){e.preventDefault();const p=ext.plans.find(x=>x.id===plan);if(!p||!customer||reason.trim().length<5){setError('Choose a customer and plan, and provide a reason');return;}try{const end=expiration(p,start);const at=new Date().toISOString();
 update(old=>({...old,entitlements:[{id:newId(),customerId:customer,planId:plan,branchId:branch,startsOn:start,expiresOn:end,status:'active',events:[{id:newId(),at,kind:'grant',reason,expiresOn:end}]},...old.entitlements]}));
 notify('Customer membership issued (no actual charge).');setError('');}catch(err){setError((err as Error).message)}}
 function renew(id:string){const membership=ext.entitlements.find(e=>e.id===id);if(!membership||membership.status==='cancelled')return;const p=ext.plans.find(x=>x.id===membership.planId);if(!p)return;const first=membership.expiresOn&&membership.expiresOn>localDay()?membership.expiresOn:localDay();
 const choice=window.prompt('Renewal duration: months (1, 2, 3, 6, 12), "lifetime", or custom YYYY-MM-DD','1');if(choice===null)return;let end:string|null;try{
 end=choice.toLowerCase()==='lifetime'?null:/^\d{4}-\d{2}-\d{2}$/.test(choice)?choice:calendarExpiry(first,'months',Number(choice));
 if(end!==null&&end<first)throw Error('Expiry must follow effective date');
 }catch(err){setError((err as Error).message);return;}
 update(old=>({...old,entitlements:old.entitlements.map(e=>e.id===id?{...e,expiresOn:end,
 events:[...e.events,{id:newId(),at:new Date().toISOString(),kind:'renew',reason:'Manual demo renewal',expiresOn:end}]}:e)}));setError('');notify('Membership renewed in sample data.');}
 function cancel(id:string){const reason=window.prompt('Cancellation reason','Customer requested cancellation');if(!reason)return;update(old=>({...old,entitlements:old.entitlements.map(e=>e.id===id?{...e,status:'cancelled',
 events:[...e.events,{id:newId(),at:new Date().toISOString(),kind:'cancel',reason,expiresOn:e.expiresOn}]}:e)}));notify('Membership cancelled.');}
 function addPlan(e:React.FormEvent){
 e.preventDefault();
 const cents=Math.round(Number(planPrice)*100);
 if(!planName.trim()||!Number.isInteger(cents)||cents<=0){setError('Provide a plan name and positive selling price');return;}
 const [kind,value]=duration.split(':');
 const durationKind=kind as DemoServicePlan['durationKind'],durationValue=value?Number(value):null;
 try{calendarExpiry(localDay(),durationKind,durationValue)}catch(err){setError((err as Error).message);return;}
 const productId='mem-'+newId(),planId='plan-'+newId();
 const title=planName.trim();
 // A membership plan is the source of truth; its POS item is created automatically.
 const item:DemoProduct={id:productId,name:title,category:'Memberships',price:cents,cost:0,
  stock:0,reorder:0,emoji:'🎟️',active:true,kind:'service',itemType:'membership',
  itemClass:'membership_plan',trackInventory:false};
 const servicePlan:DemoServicePlan={id:planId,productId,name:title,durationKind,durationValue,active:true,sellThroughPos};
 change(old=>({...old,products:[...old.products,item]}));
 update(old=>({...old,plans:[...old.plans,servicePlan]}));
 setPlanName('');setError('');notify(sellThroughPos?'Membership plan created and linked to POS.':'Membership plan created (POS sales disabled).');
}
 const status=(e:DemoExtension['entitlements'][number])=>e.status==='cancelled'?'Cancelled':e.startsOn>localDay()?'Scheduled':e.expiresOn&&e.expiresOn<localDay()?'Expired':'Active';
 const filteredEntitlements=visibleEntitlements.filter(e=>(statusFilter==='all'||status(e).toLowerCase()===statusFilter)&&(planFilter==='all'||e.planId===planFilter));
 return <><div className="demo-membership-header"><div className="demo-eyebrow">MEMBERSHIP MANAGEMENT</div><h1>Customer memberships</h1>
 <p>Check customer validity, monitor renewals and manage linked POS plans. Demo purchases are simulated.</p></div>
 <div className="demo-membership-summary">
 {['Active','Scheduled','Expired','Cancelled'].map(s=><div key={s} className="demo-membership-kpi"><small>{s}</small>
 <strong>{ext.entitlements.filter(e=>status(e)===s).length}</strong></div>)}
 <div className="demo-membership-kpi"><small>Registered customers</small><strong>{ext.customers.length}</strong></div></div>
 {!readonly&&<div className="demo-chips">{([['members','Memberships'],['customers','Customers'],['plans','Plans']] as const).map(([k,v])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{v}</button>)}</div>}
 {(readonly||tab==='members')&&<>{readonly&&<div className="demo-membership-picker"><label className="demo-label">Find customer membership by name, member reference or plan<input value={lookup} onChange={e=>setLookup(e.target.value)} placeholder="Search member name or ID"/></label><p>Reception lookup only. Cashiers cannot issue, renew, cancel or edit memberships.</p></div>}<div className="demo-workflow-metrics">{['Active','Scheduled','Expired','Cancelled'].map(s=><div key={s} className="demo-workflow-stat"><small>{s}</small><strong>{ext.entitlements.filter(e=>status(e)===s).length}</strong></div>)}</div>
 {!readonly&&<Section title="Issue customer membership"><form className="demo-workflow-form" onSubmit={grant}>
  <Select label="Customer" value={customer} onChange={setCustomer}>{ext.customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select>
  <Select label="Service plan" value={plan} onChange={setPlan}>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select>
  <Select label="Branch" value={branch} onChange={setBranch}>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Select>
  <label className="demo-label">Start date<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
  <Select label="Expiry" value={expiry} onChange={setExpiry}><option value="default">Service plan preset</option><option value="custom">Custom date</option><option value="none">No expiry</option></Select>
  {expiry==='custom'&&<label className="demo-label">Custom expiry<input type="date" min={start} value={custom} onChange={e=>setCustom(e.target.value)}/></label>}
  <label className="demo-label demo-workflow-span">Reason / external payment reference<input value={reason} onChange={e=>setReason(e.target.value)}/></label>
  <div className="demo-workflow-span"><Message error={error}/><button className="demo-btn primary"><Plus size={16}/> Issue membership</button></div>
 </form></Section>}
 <Section title="Membership register"><div className="demo-membership-filters">
 <input className="demo-input" aria-label="Search membership register" placeholder="Find member name, ID or plan" value={lookup} onChange={e=>setLookup(e.target.value)}/>
 <select className="demo-input" aria-label="Filter membership status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
 <option value="all">All statuses</option>{['active','scheduled','expired','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}</select>
 <select className="demo-input" aria-label="Filter membership plan" value={planFilter} onChange={e=>setPlanFilter(e.target.value)}>
 <option value="all">All plans</option>{ext.plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
 </div><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Customer</th><th>Service</th><th>Start</th><th>Expires</th><th>Status</th><th>History & actions</th></tr></thead><tbody>{filteredEntitlements.map(e=><tr key={e.id}><td>{ext.customers.find(x=>x.id===e.customerId)?.name}<small className="demo-item-kind">{ext.customers.find(x=>x.id===e.customerId)?.reference}</small></td><td>{ext.plans.find(x=>x.id===e.planId)?.name}</td><td>{e.startsOn}</td><td>{short(e.expiresOn)}</td><td>{status(e)}</td><td><div className="demo-inline-form"><button className="demo-btn secondary" onClick={()=>window.alert(e.events.map(v=>v.kind+' · '+v.at.slice(0,10)+' · '+short(v.expiresOn)+' · '+v.reason+(v.saleId?' · '+v.saleId:'')).join('\n'))}>History ({e.events.length})</button>{!readonly&&e.status==='active'&&<><button className="demo-btn secondary" onClick={()=>renew(e.id)}><RefreshCw size={14}/> Renew</button><button className="demo-btn secondary" onClick={()=>cancel(e.id)}>Cancel</button></>}</div></td></tr>)}{!filteredEntitlements.length&&<tr><td colSpan={6}>No matching memberships.</td></tr>}</tbody></table></div></Section></>}
 {!readonly&&tab==='customers'&&<><Section title="Add customer"><form className="demo-workflow-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;update(old=>({...old,customers:[...old.customers,{id:newId(),name,email,phone:'',reference:'MEM-'+String(old.customers.length+1).padStart(3,'0')}]}));setName('');setEmail('');notify('Demo customer created.');}}>
  <label className="demo-label">Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label className="demo-label">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><div className="demo-workflow-span"><button className="demo-btn primary">Add customer</button></div>
 </form></Section><Section title="Customers">{ext.customers.map(c=><p key={c.id}>{c.reference} · <b>{c.name}</b> · {c.email}</p>)}</Section></>}
 {!readonly&&tab==='plans'&&<><Section title="Define service plan"><form className="demo-workflow-form" onSubmit={addPlan}>
  <label className="demo-label">POS selling price (PHP)<input type="number" min="0.01" step="0.01" required value={planPrice} onChange={e=>setPlanPrice(e.target.value)}/></label>
  <label className="demo-label">Plan title<input value={planName} onChange={e=>setPlanName(e.target.value)}/></label>
  <Select label="Default validity" value={duration} onChange={setDuration}>{options.filter(([k])=>k!=='custom').map(([k,v])=><option key={k} value={k}>{v}</option>)}</Select>
  <label className="demo-label"><span>POS availability</span><span className="demo-inline-form"><input type="checkbox" checked={sellThroughPos} onChange={e=>setSellThroughPos(e.target.checked)}/> Sell through POS</span></label><div className="demo-workflow-span"><Message error={error}/><button className="demo-btn primary">Create linked plan</button></div>
 </form></Section><Section title="Service plans">{ext.plans.map(p=>{const item=data.products.find(i=>i.id===p.productId);return <div className="demo-plan-row" key={p.id}><div><b>{p.name}</b><small>{p.durationKind==='none'?'No expiry':p.durationValue+' '+p.durationKind} · {item?currency(item.price):'Unlinked item'}</small></div><button className="demo-btn secondary" onClick={()=>{update(old=>({...old,plans:old.plans.map(plan=>plan.id===p.id?{...plan,sellThroughPos:!plan.sellThroughPos}:plan)}));notify('POS availability updated.');}}>{p.sellThroughPos?'Selling in POS':'Enable POS sales'}</button></div>})}</Section></>}
 </>;
}
export function RegisterWorkflows({data,ext,actor,update,notify}:Props){
 const [branch,setBranch]=useState('b1'),[opening,setOpening]=useState('1000'),[amount,setAmount]=useState('100'),[reason,setReason]=useState('Petty cash');
 const active=ext.registers.find(r=>r.cashier===actor&&r.status==='open');
 function open(){if(active){notify('Close the previous register before opening another.');return;}const cash=Math.round(Number(opening)*100);if(!Number.isInteger(cash)||cash<0)return;update(old=>({...old,registers:[{id:newId(),cashier:actor,branchId:branch,opening:cash,movements:0,status:'open',openedAt:new Date().toISOString()},...old.registers]}));notify('Cash register opened.');}
 function movement(sign:number){if(!active)return;const value=Math.round(Number(amount)*100);if(!Number.isInteger(value)||value<=0||active.opening+active.movements+value*sign<0)return;update(old=>({...old,registers:old.registers.map(r=>r.id===active.id?{...r,movements:r.movements+value*sign}:r)}));notify('Cash movement saved.');}
 function close(){if(!active)return;const answer=window.prompt('Counted closing cash (PHP)',String((active.opening+active.movements)/100));if(answer===null)return;const counted=Math.round(Number(answer)*100);if(!Number.isInteger(counted)||counted<0)return;update(old=>({...old,registers:old.registers.map(r=>r.id===active.id?{...r,status:'closed',counted,closedAt:new Date().toISOString()}:r)}));notify('Register closed with variance recorded.');}
 return <><Intro title="Cash registers & cashier shifts" text="Open a personal register, manage cash in and out, and close with a counted variance. This simulates the Development branch cash-drawer workflow."/>
 <Section title="My cashier register"><div className="demo-workflow-form"><Select label="Branch" value={branch} onChange={setBranch}>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Select>
 {!active?<label className="demo-label">Opening cash (PHP)<input type="number" min="0" step=".01" value={opening} onChange={e=>setOpening(e.target.value)}/></label>:<>
 <label className="demo-label">Cash movement (PHP)<input type="number" min="0.01" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label className="demo-label">Reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label></>}
 <div className="demo-workflow-span">{active?<div className="demo-inline-form"><b>Expected balance: {currency(active.opening+active.movements)}</b><button className="demo-btn secondary" onClick={()=>movement(1)}>Cash in</button><button className="demo-btn secondary" onClick={()=>movement(-1)}>Cash out</button><button className="demo-btn primary" onClick={close}>Close register</button></div>:<button className="demo-btn primary" onClick={open}>Open register</button>}</div></div></Section>
 <Section title="Register history"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Cashier</th><th>Branch</th><th>Opening</th><th>Expected</th><th>Counted</th><th>Variance</th><th>Status</th></tr></thead><tbody>{ext.registers.map(r=><tr key={r.id}><td>{r.cashier}</td><td>{data.branches.find(b=>b.id===r.branchId)?.name}</td><td>{currency(r.opening)}</td><td>{currency(r.opening+r.movements)}</td><td>{r.counted===undefined?'—':currency(r.counted)}</td><td>{r.counted===undefined?'—':currency(r.counted-r.opening-r.movements)}</td><td>{r.status}</td></tr>)}</tbody></table></div></Section></>;
}
export function KitchenWorkflows({data,ext,update,notify}:Props){
 const steps=['pending','preparing','ready','completed'] as const;
 // Existing browser-local tickets may have been generated by older demo code,
 // which created a kitchen ticket for EVERY sale, including gym memberships.
 // Derive the actual queue from food/beverage line items, not the ticket alone.
 const kitchen=kitchenTicketView(ext.tickets,data.orders,data.products);
 const excluded=ext.tickets.length-kitchen.length;
 function removeInvalidTickets(){
  const allowed=new Set(kitchen.map(({ticket})=>ticket.id));
  update(old=>({...old,tickets:old.tickets.filter(t=>allowed.has(t.id))}));
  notify('Removed ineligible legacy kitchen tickets without changing sales.');
 }
 return <><Intro title="Kitchen display system" text="Kitchen tickets are only for food and beverage preparation. Retail sales, gym memberships, and other services are handled outside the kitchen."/>
 {excluded>0&&<div className="demo-kitchen-cleanup">
   <p><strong>{excluded} old or invalid ticket{excluded===1?'':'s'} excluded.</strong> These were created for non-food sales or reference a missing order. Your sales history remains unchanged.</p>
   <button className="demo-btn secondary" onClick={removeInvalidTickets}>Remove invalid tickets</button>
 </div>}
 <div className="demo-workflow-cards">{kitchen.map(({ticket:t,lines})=>{const idx=steps.indexOf(t.status);return <section className="demo-workflow-ticket" key={t.id}><div className="demo-inline-form"><ChefHat size={20}/><b>{t.orderId}</b><span className="demo-pill">{t.status}</span></div>
 <p>{lines.map(l=>l.qty+' × '+l.name).join(', ')}</p>
 {idx>=0&&idx<3&&<button className="demo-btn primary" onClick={()=>{update(old=>({...old,tickets:old.tickets.map(x=>x.id===t.id?{...x,status:steps[idx+1],updatedAt:new Date().toISOString()}:x)}));notify('Kitchen ticket advanced.');}}>Mark {steps[idx+1]}</button>}
 </section>})}
 {!kitchen.length&&<div className="demo-empty">No food or beverage orders awaiting kitchen processing. Standard retail and service sales never enter this queue.</div>}</div></>;
}
export function QrWorkflows({data,ext,update,change,notify}:Props){
 const [branch,setBranch]=useState('b1'),[table,setTable]=useState('Table 1'),[product,setProduct]=useState('p1'),[qty,setQty]=useState('1'),[payment,setPayment]=useState<'cash'|'gcash'|'maya'|'card'>('cash');
 function create(){const count=Number(qty);if(!Number.isInteger(count)||count<1)return;update(old=>({...old,requests:[{id:newId(),branchId:branch,table,items:[{productId:product,qty:count}],payment,status:'awaiting_payment',createdAt:new Date().toISOString()},...old.requests]}));notify('QR order request received; awaiting payment review.');}
 function confirm(id:string){
  const request=ext.requests.find(r=>r.id===id);
  if(!request||request.status!=='awaiting_payment')return;
  const choices=request.items.map(item=>({item,product:data.products.find(p=>p.id===item.productId)}));
  if(choices.some(({item,product})=>!product||!product.active||!Number.isInteger(item.qty)||item.qty<1||
       (product.kind!=='service'&&product.kind!=='non_stock'&&(ext.balances[request.branchId]?.[item.productId]||0)<item.qty))){
    window.alert('Some requested products are unavailable or out of stock at this location.');return;
  }
  if(!window.confirm('Demo only: confirm that this sample payment was reviewed? No money is actually collected.'))return;
  const saleLines=choices.map(({item,product})=>({productId:product!.id,name:product!.name,price:product!.price,qty:item.qty}));
  const total=saleLines.reduce((n,l)=>n+l.price*l.qty,0),orderId='QR-'+id.slice(0,8);
  const foodProducts=choices.map(x=>x.product!);
  const sale:DemoSale={id:orderId,date:new Date().toISOString(),branchId:request.branchId,cashier:'QR demo review',
    type:saleOrderType(foodProducts,'dine_in'),payment:request.payment,lines:saleLines,subtotal:total,discount:0,tax:0,service:0,total,tender:total};
  change(old=>({...old,orders:[...old.orders,sale]}));
  update(old=>{
    const balances={...old.balances,[request.branchId]:{...old.balances[request.branchId]}};
    for(const {item,product} of choices)if(product!.kind!=='service'&&product!.kind!=='non_stock')
      balances[request.branchId][item.productId]=(balances[request.branchId][item.productId]||0)-item.qty;
    const movements=choices.filter(x=>x.product!.kind!=='service'&&x.product!.kind!=='non_stock').map(({item})=>({
      id:newId(),date:new Date().toISOString(),productId:item.productId,from:request.branchId,to:null,
      qty:item.qty,kind:'sale' as const,reason:'QR checkout '+orderId
    }));
    // Even imported or legacy QR requests cannot send a non-food sale into the kitchen.
    const foodLines=kitchenLineItems(saleLines,data.products);
    return {...old,balances,movements:[...movements,...old.movements],
      requests:old.requests.map(r=>r.id===id?{...r,status:'confirmed',orderId}:r),
      tickets:data.businessType==='food'&&data.kitchenEnabled&&needsKitchenTicket(foodProducts)&&foodLines.length
        ?[{id:newId(),orderId,branchId:request.branchId,status:'pending' as const,updatedAt:new Date().toISOString()},...old.tickets]
        :old.tickets};
  });
  notify(data.businessType==='food'&&data.kitchenEnabled&&needsKitchenTicket(foodProducts)?'Payment confirmed; food sent to kitchen.':'Standard sale confirmed without a kitchen ticket.');
 }
 return <><Intro title="Customer QR menus & requests" text="Simulate a customer scanning a table QR, submitting an unpaid request, and a manager confirming payment before the kitchen receives it. No actual QR payment gateway is connected."/>
 <Section title="Simulate a table QR order"><div className="demo-workflow-form">
 <Select label="Branch" value={branch} onChange={setBranch}>{data.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Select>
 <label className="demo-label">Table<input value={table} onChange={e=>setTable(e.target.value)}/></label>
 <Select label="Menu item" value={product} onChange={setProduct}>{data.products.filter(p=>p.active&&needsKitchenTicket([p])).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select>
 <label className="demo-label">Quantity<input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label>
 <Select label="Intended payment" value={payment} onChange={v=>setPayment(v as typeof payment)}>{(['cash','gcash','maya','card'] as const).map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</Select>
 <div className="demo-workflow-span"><button className="demo-btn primary" onClick={create}><QrCode size={16}/> Submit QR request</button></div></div></Section>
 <Section title="Payment review queue"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Table</th><th>Product</th><th>Payment</th><th>State</th><th>Review</th></tr></thead><tbody>{ext.requests.map(r=><tr key={r.id}><td>{r.table}</td><td>{r.items.map(i=>data.products.find(p=>p.id===i.productId)?.name).join(', ')}</td><td>{r.payment}</td><td>{r.status}</td><td>{r.status==='awaiting_payment'&&<div className="demo-inline-form"><button className="demo-btn primary" onClick={()=>confirm(r.id)}><CheckCircle2 size={14}/> Confirm paid</button><button className="demo-btn secondary" onClick={()=>update(old=>({...old,requests:old.requests.map(x=>x.id===r.id?{...x,status:'cancelled'}:x)}))}>Cancel</button></div>}</td></tr>)}</tbody></table></div></Section></>;
}
export function RefundWorkflows({data,ext,update,notify}:Props){
 const [order,setOrder]=useState(''),[amount,setAmount]=useState(''),[reason,setReason]=useState('Customer requested refund'),[error,setError]=useState('');
 const eligible=data.orders.filter(s=>s.payment==='cash');
 function submit(e:React.FormEvent){e.preventDefault();const sale=eligible.find(s=>s.id===order);if(!sale){setError('Choose a cash sale');return;}try{update(old=>refundDemoSale(old,sale,Math.round(Number(amount)*100),reason));setError('');notify('Cash refund recorded without changing historical sales.');}catch(e){setError((e as Error).message);}}
 return <><Intro title="Cash refunds & transaction adjustments" text="Simulate supervised cash refunds with an append-only refund history. Fully refunded POS memberships are revoked or their renewal reversed. Partial membership refunds, cashless gateway reversals and item-level restocking are unavailable."/>
 <Section title="Authorize sample refund"><form className="demo-workflow-form" onSubmit={submit}>
 <Select label="Cash sale" value={order} onChange={setOrder}><option value="">Choose order</option>{eligible.map(s=><option key={s.id} value={s.id}>{s.id} · {currency(s.total)}</option>)}</Select>
 <label className="demo-label">Refund amount (PHP)<input type="number" min=".01" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label className="demo-label">Reason<input value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <div className="demo-workflow-span"><Message error={error}/><button className="demo-btn primary">Record cash refund</button></div></form></Section>
 <Section title="Refund ledger"><div className="demo-table-scroll"><table className="demo-table"><thead><tr><th>Sale</th><th>Amount</th><th>Reason</th><th>Date</th></tr></thead><tbody>{ext.refunds.map(r=><tr key={r.id}><td>{r.orderId}</td><td>{currency(r.amount)}</td><td>{r.reason}</td><td>{r.date.slice(0,10)}</td></tr>)}</tbody></table></div></Section></>;
}
export function DemoFeatureGuide(){return <><Intro title="Feature walkthrough" text="Explore the complete sample business journey. Each workflow is fully isolated from production data."/><div className="demo-workflow-cards">{[
 ['Products & services','Create and edit catalog items, including physical goods and services.'],
 ['POS checkout','Build a cart, apply discounts, record a sample payment and view the receipt.'],
 ['Stock transfers','Move stock between branches and inspect recorded movements.'],
 ['Purchasing','Create purchase orders, receive goods partially and update inventory.'],
 ['Customer memberships','Create plans with linked POS items, sell to named customers and renew entitlements.'],
 ['QR & kitchen','Submit a table request, confirm simulated payment and progress the KDS.'],
 ['Register operations','Open registers, record cash movements and reconcile closing cash.'],
 ['Refunds & reporting','Review sales, record cash refunds and inspect the revenue impact.']
 ].map(([a,b])=><div className="demo-workflow-ticket" key={a}><b>{a}</b><p>{b}</p></div>)}</div></>}
