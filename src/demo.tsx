import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users, Store, Settings,
  LogOut, RotateCcw, Plus, Minus, Search, Check, CreditCard, Wallet,
  Clock3, ShieldCheck, Menu, X, ReceiptText,
  TrendingUp, AlertTriangle, Trash2, Pencil, Download, CalendarDays, ArrowRight
} from 'lucide-react';
import {
  DEMO_PASSWORD, DEMO_SESSION_KEY, DEMO_STORAGE_KEY, EXTENSION_KEY, demoAccounts, readDemoData,
  writeDemoData, initialDemoData, readExtension,writeExtension,seedExtension,type DemoExtension, type DemoData, type DemoRole, type DemoProduct,
  type DemoSale, type DemoPayment, type DemoOrderType, type DemoSaleLine, type DemoKind, type DemoItemType, type DemoItemClass,
  productType,productClass,tracksStock,fulfillMembershipSale,newId
} from './demo-data';
import {WarehouseWorkflows,PurchasingWorkflows,MembershipWorkflows,RegisterWorkflows,KitchenWorkflows,QrWorkflows,RefundWorkflows,DemoFeatureGuide} from './workflows';
import {usesFoodFulfillment,saleOrderType,needsKitchenTicket,kitchenLineItems} from './sale-flow';
import './demo.css';

type Page = 'overview'|'pos'|'products'|'inventory'|'warehouse'|'purchasing'|'memberships'|'register'|'qr'|'kitchen'|'refunds'|'guide'|'orders'|'reports'|'staff'|'branches'|'settings';
type Account = (typeof demoAccounts)[number];
type CartLine = { productId: string; qty: number };
const money = (amount: number) => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',minimumFractionDigits:2}).format(amount/100);
const dateFmt = (value: string) => new Date(value).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});
const sameDay = (left: string, right: string) => new Date(left).toDateString()===new Date(right).toDateString();
const today = () => new Date().toISOString();
const menuItems: {id:Page;label:string;icon:React.ComponentType<{size?:number}>}[] = [
  {id:'overview',label:'Dashboard',icon:LayoutDashboard},
  {id:'pos',label:'Point of Sale',icon:ShoppingCart},
  {id:'products',label:'Products & Services',icon:Package},
  {id:'inventory',label:'Inventory Management',icon:Store},
  {id:'warehouse',label:'Stock & Transfers',icon:Store},
  {id:'purchasing',label:'Purchasing & Suppliers',icon:Package},
  {id:'memberships',label:'Customer Memberships',icon:CalendarDays},
  {id:'register',label:'Cash Registers',icon:Wallet},
  {id:'qr',label:'Customer QR Orders',icon:ShoppingCart},
  {id:'kitchen',label:'Kitchen Display',icon:ReceiptText},
  {id:'refunds',label:'Cash Refunds',icon:CreditCard},
  {id:'guide',label:'Feature Walkthrough',icon:ShieldCheck},
  {id:'orders',label:'Sales & Transactions',icon:ReceiptText},
  {id:'reports',label:'Reports & Analytics',icon:BarChart3},
  {id:'staff',label:'Team & Attendance',icon:Users},
  {id:'branches',label:'Branches & Locations',icon:Store},
  {id:'settings',label:'Settings',icon:Settings}
];
function Pill({children,tone='normal'}:{children:React.ReactNode;tone?:string}) { return <span className={'demo-pill '+tone}>{children}</span>; }
function Heading({eyebrow='WORKSPACE',title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:React.ReactNode}) {
  return <div className="demo-heading"><div><div className="demo-eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div><div className="demo-heading-actions">{actions}</div></div>;
}
function Card({title,children,right}:{title:string;children:React.ReactNode;right?:React.ReactNode}) {
  return <section className="demo-card"><div className="demo-card-title"><h2>{title}</h2>{right}</div>{children}</section>;
}
function Table({heads,children}:{heads:string[];children:React.ReactNode}) {
  return <div className="demo-table-scroll"><table className="demo-table"><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Empty({message='No records found.'}:{message?:string}) {return <div className="demo-empty">{message}</div>;}
function App() {
  const [data,setData] = useState<DemoData>(readDemoData);
  const [extension,setExtension] = useState<DemoExtension>(()=>readExtension(readDemoData().products));
  const [email,setEmail] = useState<string>(()=>{try{return sessionStorage.getItem(DEMO_SESSION_KEY)||'';}catch{return '';}});
  const [page,setPage] = useState<Page>('overview');
  const [mobile,setMobile] = useState(false);
  const [toast,setToast] = useState('');
  const [showReset,setShowReset] = useState(false);
  const [branch,setBranch] = useState('b1');
  const account = demoAccounts.find(u=>u.email===email);
  const role = account?.role;
  const permitted = (id:Page) => role!=='cashier'||['overview','pos','orders','staff','register','kitchen','guide'].includes(id);
  function change(update: (old:DemoData)=>DemoData) {
    setData(previous=>{const next=update(previous);writeDemoData(next);return next;});
  }
  function updateExtension(update:(old:DemoExtension)=>DemoExtension){setExtension(previous=>{const next=update(previous);writeExtension(next);return next;});}
  function notify(message:string){setToast(message);}
  useEffect(()=>{if(!toast)return;const timeout=window.setTimeout(()=>setToast(''),3500);return()=>window.clearTimeout(timeout);},[toast]);
  function reset() {const next=initialDemoData();const ext=seedExtension(next.products);setData(next);setExtension(ext);try{localStorage.removeItem(DEMO_STORAGE_KEY);localStorage.removeItem(EXTENSION_KEY);}catch{}setShowReset(false);notify('Sample data restored to its original state.');}
  function login(next:Account) {setEmail(next.email);try{sessionStorage.setItem(DEMO_SESSION_KEY,next.email);}catch{}setPage('overview');notify('Welcome to the portfolio demonstration.');}
  function logout(){setEmail('');try{sessionStorage.removeItem(DEMO_SESSION_KEY);}catch{}setPage('overview');}
  function navigate(next:Page){if(!permitted(next))return;setPage(next);setMobile(false);}
  useEffect(()=>{document.title='StratifyPOS • Interactive Portfolio Demo';},[]);
  if(!account)return <Login onLogin={login}/>;
  const visible=menuItems.filter(item=>permitted(item.id));
  const content = ({
    overview:<Dashboard data={data} ext={extension} open={navigate} />,
    pos:<PointOfSale data={data} ext={extension} updateExtension={updateExtension} role={role!} branch={branch} setBranch={setBranch} change={change} notify={notify} name={account.name} />,
    products:<Products data={data} ext={extension} updateExtension={updateExtension} change={change} notify={notify}/>,
    warehouse:<WarehouseWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    purchasing:<PurchasingWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    memberships:<MembershipWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    register:<RegisterWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    qr:<QrWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    kitchen:<KitchenWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    refunds:<RefundWorkflows {...{data: data,ext: extension,role:role!,actor:account.name,update:updateExtension,change,notify}}/>,
    guide:<DemoFeatureGuide/>,
    inventory:<Inventory data={data} ext={extension} updateExtension={updateExtension} notify={notify}/>,
    orders:<Orders data={data}/>,
    reports:<Reports data={data}/>,
    staff:<Staff data={data} account={account} change={change} notify={notify}/>,
    branches:<Branches data={data}/>,
    settings:<SettingsPage data={data} change={change} reset={()=>setShowReset(true)}/>
  })[page];
  return <div className="demo-shell">
    {mobile&&<button className="demo-overlay" aria-label="Close menu" onClick={()=>setMobile(false)}/>}
    <aside className={'demo-sidebar '+(mobile?'open':'')}>
      <div className="demo-brand"><img src="/stratify-logo.png" alt=""/><div><strong>Stratify<span>POS</span></strong><small>SMART BUSINESS MANAGEMENT</small></div><button className="demo-close-menu" onClick={()=>setMobile(false)} aria-label="Close"><X size={19}/></button></div>
      <div className="demo-workspace"><span className="demo-workspace-icon"><Store size={20}/></span><div><small>DEMO WORKSPACE</small><strong>Stratify Demo Business</strong><span>Sample business account</span></div></div>
      <p className="demo-nav-caption">WORKSPACE</p>
      <nav aria-label="Demo navigation">{visible.map(({id,label,icon:Icon})=><button type="button" key={id} className={'demo-nav '+(page===id?'active':'')} onClick={()=>navigate(id)}><Icon size={19}/>{label}{page===id&&<span className="demo-nav-dot"/>}</button>)}</nav>
      <div className="demo-sidebar-bottom"><div className="demo-sidebar-note"><b><ShieldCheck size={16}/> Demo environment</b><p>All transactions are simulated. Changes are stored only in this browser.</p></div><button className="demo-nav" onClick={logout}><LogOut size={19}/> Sign out</button></div>
    </aside>
    <div className="demo-main">
      <div className="demo-disclaimer"><span><ShieldCheck size={15}/> PORTFOLIO DEMO — SIMULATED DATA ONLY</span><button onClick={()=>setShowReset(true)}><RotateCcw size={14}/> Reset demo</button></div>
      <header className="demo-topbar"><div className="demo-topbar-left"><button className="demo-menu-button" onClick={()=>setMobile(true)} aria-label="Open menu"><Menu size={22}/></button><span>Workspace <b>/</b> {menuItems.find(item=>item.id===page)?.label}</span></div><div className="demo-topbar-user"><span className="demo-date"><CalendarDays size={16}/> {new Date().toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span><div className="demo-avatar">{account.name[0]}</div><div><strong>{account.name}</strong><small>{role?.charAt(0).toUpperCase()+role!.slice(1)} · Demo</small></div></div></header>
      <main className="demo-content">{content}<footer className="demo-footer">StratifyPOS portfolio demonstration · No real orders, payments, or financial records.</footer></main>
    </div>
    {toast&&<div className="demo-toast" role="status"><Check size={16}/>{toast}</div>}
    {showReset&&<div className="demo-modal-backdrop" onMouseDown={()=>setShowReset(false)}><div className="demo-modal" role="dialog" aria-modal="true" aria-label="Reset demo" onMouseDown={e=>e.stopPropagation()}><h2>Reset demo workspace?</h2><p>All changes made in this browser—including checkouts, memberships, purchasing, transfers and QR orders—will be replaced with the original sample data.</p><div className="demo-actions"><button className="demo-btn secondary" onClick={()=>setShowReset(false)}>Cancel</button><button className="demo-btn primary" onClick={reset}><RotateCcw size={16}/> Reset sample data</button></div></div></div>}
  </div>;
}
function Login({onLogin}:{onLogin:(account:Account)=>void}) {
  const [selected,setSelected]=useState(demoAccounts[0].email);
  const [password,setPassword]=useState(DEMO_PASSWORD);
  const [error,setError]=useState('');
  function submit(event:React.FormEvent){event.preventDefault();const account=demoAccounts.find(a=>a.email===selected);if(!account||password!==DEMO_PASSWORD){setError('Use the demo password shown below.');return;}onLogin(account);}
  return <div className="demo-login"><div className="demo-login-intro"><div className="demo-login-brand"><img src="/stratify-logo.png" alt=""/><strong>Stratify<span>POS</span></strong></div><div className="demo-login-eyebrow"><span className="demo-live-dot"/> INTERACTIVE PORTFOLIO SHOWCASE</div><h1>Your business.<br/>One smarter workspace<span>.</span></h1><p>Explore a multi-industry POS: try checkout, stock transfers, purchasing, memberships, customer QR orders, kitchen tickets and reporting.</p><div className="demo-preview"><div className="demo-preview-label"><span>THE EXPERIENCE</span><Pill tone="green">Explore freely</Pill></div><img src="/previews/dashboard.png" alt="Screenshot of the StratifyPOS dashboard"/></div><div className="demo-login-footer">Built as a demonstration of SaaS POS workflows, frontend engineering, and business systems.</div></div>
    <div className="demo-login-right"><div className="demo-login-card"><Pill tone="amber"><ShieldCheck size={13}/> PUBLIC DEMO — NO REAL DATA</Pill><h2>Explore StratifyPOS</h2><p className="demo-muted">Choose a sample account to see the system from different roles. No registration required.</p><div className="demo-role-picker">{demoAccounts.map(a=><button type="button" onClick={()=>{setSelected(a.email);setPassword(DEMO_PASSWORD);setError('');}} className={'demo-role '+(selected===a.email?'selected':'')} key={a.email}><div className="demo-role-avatar">{a.name[0]}</div><div><strong>{a.role[0].toUpperCase()+a.role.slice(1)}</strong><small>{a.description}</small></div><span className="demo-role-check">{selected===a.email?<Check size={15}/>:null}</span></button>)}</div><form onSubmit={submit}><label className="demo-label">Demo email<input readOnly value={selected}/></label><label className="demo-label">Demo password<input value={password} onChange={e=>setPassword(e.target.value)} type="text" autoComplete="off"/></label>{error&&<div className="demo-error" role="alert">{error}</div>}<button className="demo-btn primary demo-sign-in" type="submit">Enter demo workspace <ArrowRight size={18}/></button></form><div className="demo-credentials"><span>Shared demo password</span><code>{DEMO_PASSWORD}</code><span>· Sample accounts only</span></div><div className="demo-safe-note"><ShieldCheck size={18}/><p>No backend connection. No actual payment processing. Your changes are saved locally and can be reset at any time.</p></div></div></div>
  </div>;
}
function Dashboard({data,ext,open}:{data:DemoData;ext:DemoExtension;open:(page:Page)=>void}) {
  const daily=data.orders.filter(o=>sameDay(o.date,today()));
  const revenue=daily.reduce((a,b)=>a+b.total,0);
  const low=data.products.filter(p=>p.active&&tracksStock(p)&&data.branches.some(b=>(ext.balances[b.id]?.[p.id]??0)<=p.reorder));
  const qty:Record<string,number>={};
  for(const order of data.orders)for(const line of order.lines)qty[line.name]=(qty[line.name]||0)+line.qty;
  const top=Object.entries(qty).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return <><Heading eyebrow="GOOD DAY ☀" title="Your business, at a glance." description="Monitor your sales, inventory, and business activity in this demo workspace." actions={<button className="demo-btn primary" onClick={()=>open('pos')}><Plus size={17}/> New sale</button>}/><div className="demo-metrics"><Metric label="Today's revenue" value={money(revenue)} icon={Wallet} detail="Simulated completed transactions" tone="brown"/><Metric label="Orders today" value={String(daily.length)} icon={ShoppingCart} detail="Sample orders" tone="peach"/><Metric label="Low stock alerts" value={String(low.length)} icon={AlertTriangle} detail="Branch-level physical stock alerts" tone="sand"/><Metric label="Team members" value={String(data.staff.length)} icon={Users} detail="Demo accounts" tone="sage"/></div><div className="demo-two-col"><Card title="Recent transactions" right={<button className="demo-link" onClick={()=>open('orders')}>View all <ArrowRight size={14}/></button>}><Table heads={['Order','Date','Payment','Total']}>{data.orders.slice().reverse().slice(0,6).map(o=><tr key={o.id}><td>{o.id}</td><td>{dateFmt(o.date)}</td><td className="capitalize">{o.payment}</td><td><b>{money(o.total)}</b></td></tr>)}</Table></Card><Card title="Bestselling items" right={<Pill>By units sold</Pill>}>{top.map(([name,count],i)=><div className="demo-ranking" key={name}><span>{String(i+1).padStart(2,'0')}</span><strong>{name}</strong><small>{count} sold</small></div>)}</Card></div><div className="demo-tip"><div><span className="demo-tip-star">✦</span><div><strong>Ready for your next sale?</strong><p>Products, inventory, and transaction history update together when you check out.</p></div></div><button className="demo-btn primary" onClick={()=>open('pos')}>Open POS <ArrowRight size={16}/></button></div></>;
}
function Metric({label,value,icon:Icon,detail,tone='brown'}:{label:string;value:string;icon:React.ComponentType<{size?:number}>;detail:string;tone?:string}) {
  return <div className="demo-metric"><div><span>{label}</span><div className={'demo-metric-icon '+tone}><Icon size={21}/></div></div><strong>{value}</strong><small>{detail}</small></div>;
}
function PointOfSale({data,ext,updateExtension,role,branch,setBranch,change,notify,name}:{data:DemoData;ext:DemoExtension;updateExtension:(fn:(old:DemoExtension)=>DemoExtension)=>void;role:DemoRole;branch:string;setBranch:(id:string)=>void;change:(fn:(old:DemoData)=>DemoData)=>void;notify:(s:string)=>void;name:string}) {
  const [cart,setCart]=useState<CartLine[]>([]);
  const [category,setCategory]=useState('All');
  const [search,setSearch]=useState('');
  const [payment,setPayment]=useState<DemoPayment>('cash');
  const [type,setType]=useState<DemoOrderType>('takeout');
  const [tender,setTender]=useState('');
  const [promo,setPromo]=useState(false);
  const [receipt,setReceipt]=useState<DemoSale|null>(null);
  const [error,setError]=useState('');
  const [customerId,setCustomerId]=useState('');
  const [newCustomer,setNewCustomer]=useState('');
  const categories=['All',...new Set(data.products.map(p=>p.category))];
  const filtered=data.products.filter(p=>p.active&&
    (productType(p)!=='membership'||ext.plans.some(plan=>plan.productId===p.id&&plan.active&&plan.sellThroughPos))&&
    (category==='All'||p.category===category)&&
    (p.name+' '+(p.sku||'')+' '+(p.barcode||'')).toLowerCase().includes(search.toLowerCase()));
  const lines=cart.map(row=>({row,product:data.products.find(p=>p.id===row.productId)!})).filter(x=>x.product);
  const hasFoodItems=usesFoodFulfillment(lines.map(x=>x.product));
  const hasNonFoodItems=lines.some(x=>!usesFoodFulfillment([x.product]));
  const hasMembership=lines.some(x=>productType(x.product)==='membership');
  const subtotal=lines.reduce((sum,{row,product})=>sum+row.qty*product.price,0);
  const discount=promo&&data.promotionActive&&!hasMembership?Math.round(subtotal*.1):0;
  const tax=Math.round((subtotal-discount)*data.taxRate/100);
  const service=Math.round((subtotal-discount)*data.serviceRate/100);
  const total=subtotal-discount+tax+service;
  const paid=payment==='cash'?Math.round(Number(tender||0)*100):total;
  const available=(p:DemoProduct)=>productType(p)==='membership'?1:!tracksStock(p)?100:ext.balances[branch]?.[p.id]??0;
  function add(product:DemoProduct) {setError('');setCart(previous=>{const match=previous.find(row=>row.productId===product.id);if(match)return previous.map(row=>row.productId===product.id?{...row,qty:Math.min(available(product),row.qty+1)}:row);return [...previous,{productId:product.id,qty:1}];});}
  function adjust(id:string,delta:number) {setCart(previous=>previous.map(row=>row.productId===id?{...row,qty:Math.max(0,row.qty+delta)}:row).filter(row=>row.qty>0));}
  function addCustomer(){const name=newCustomer.trim();if(!name)return;const id='cus-'+newId();updateExtension(old=>({...old,customers:[...old.customers,{id,name,email:'',phone:'',reference:'MEM-'+String(old.customers.length+1).padStart(3,'0')}]}));setCustomerId(id);setNewCustomer('');notify('Customer added to demo membership records.');}
  function checkout() {
    if(!cart.length){setError('Add a product to the order first.');return;}
    if(lines.some(({row,product})=>row.qty>available(product))){setError('Insufficient stock. Please adjust the order.');return;}
    if(payment==='cash'&&paid<total){setError('Cash tendered must cover the total.');return;}
    if(hasMembership&&!ext.customers.some(c=>c.id===customerId)){setError('Select or register a customer before selling a membership.');return;}
    const saleLines:DemoSaleLine[]=lines.map(({row,product})=>({productId:product.id,name:product.name,price:product.price,qty:row.qty}));
    const sale:DemoSale={id:'POS-'+String(1025+data.orders.length),date:today(),branchId:branch,cashier:name,type:saleOrderType(lines.map(x=>x.product),type),payment,lines:saleLines,subtotal,discount,tax,service,total,tender:paid,customerId:hasMembership?customerId:undefined};
    try{fulfillMembershipSale(ext,sale,data.products);}catch(err){setError((err as Error).message);return;}
    change(prev=>({...prev,orders:[...prev.orders,sale]}));
    updateExtension(old=>{const next={ ...old,
      balances:{...old.balances,[branch]:Object.fromEntries(Object.entries(old.balances[branch]||{}).map(([id,stock])=>[id,stock-(lines.find(x=>x.product.id===id&&tracksStock(x.product))?.row.qty||0)]))},
      movements:[...lines.filter(x=>tracksStock(x.product)).map(({row,product})=>({id:globalThis.crypto.randomUUID(),date:new Date().toISOString(),productId:product.id,from:branch,to:null,qty:row.qty,kind:'sale' as const,reason:'Checkout '+sale.id})),...old.movements],
      // A ticket points at a sale, but the kitchen view filters it to food lines only.
      tickets:needsKitchenTicket(lines.map(x=>x.product))
        ? [{id:globalThis.crypto.randomUUID(),orderId:sale.id,branchId:branch,status:'pending' as const,updatedAt:new Date().toISOString()},...old.tickets]
        : old.tickets,
      registers:old.registers.map(r=>r.cashier===name&&r.branchId===branch&&r.status==='open'&&sale.payment==='cash'?{...r,movements:r.movements+sale.total}:r)
    };
    return fulfillMembershipSale(next,sale,data.products);
    });
    setReceipt(sale);setCart([]);setTender('');setPromo(false);setError('');notify(hasMembership?'Membership sale recorded. Customer entitlement activated or renewed.':hasFoodItems?'Demo sale saved. Inventory, reports and kitchen queue updated.':'Standard sale saved. Inventory and reports updated.');
  }
  function holdOrder(){if(!cart.length)return;updateExtension(old=>({...old,holds:[{id:globalThis.crypto.randomUUID(),branchId:branch,cashier:name,createdAt:new Date().toISOString(),items:cart},...old.holds]}));setCart([]);notify('Order held. Resume it from the list below.');}
  function resumeHold(id:string){const held=ext.holds.find(h=>h.id===id);if(!held)return;setBranch(held.branchId);setCart(held.items);updateExtension(old=>({...old,holds:old.holds.filter(h=>h.id!==id)}));notify('Held cart restored. Prices and availability will be checked at checkout.');}
  return <><Heading eyebrow="SALES WORKSPACE" title="Point of sale" description="Build an order, select a payment method, and complete a simulated checkout." actions={<select className="demo-input" aria-label="Branch" value={branch} onChange={e=>setBranch(e.target.value)}>{data.branches.filter(b=>b.active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>}/><div className="demo-inline-form demo-pos-operations"><button className="demo-btn secondary" disabled={!cart.length} onClick={holdOrder}>Hold / park cart</button>{ext.holds.filter(h=>h.cashier===name).map(h=><button className="demo-btn secondary" key={h.id} onClick={()=>resumeHold(h.id)}>Resume held order ({h.items.length} lines)</button>)}</div><div className="demo-pos-layout"><div className="demo-pos-catalog"><div className="demo-pos-filters"><label className="demo-search"><Search size={18}/><input placeholder="Search products, services, SKU or barcode..." value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="demo-chips">{categories.map(c=><button className={category===c?'active':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div></div><div className="demo-product-grid">{filtered.map(p=><button type="button" key={p.id} disabled={!available(p)} onClick={()=>add(p)} className="demo-product-tile"><span className="demo-product-art">{p.emoji}</span><strong>{p.name}</strong><small>{p.category} · {productType(p)==='membership'?'Membership':productType(p)==='service'?'One-time service':available(p)+' available'}</small><div><b>{money(p.price)}</b><span className="demo-product-add"><Plus size={17}/></span></div></button>)}</div>{!filtered.length&&<Empty message="No matching products."/>}</div><div className="demo-checkout"><div className="demo-checkout-head"><h2>Current sale</h2><Pill>{cart.reduce((n,c)=>n+c.qty,0)} items</Pill></div>{hasMembership&&<div className="demo-membership-picker"><p><b>Membership purchase</b> · A named customer is required. Plans activate or renew automatically after simulated payment.</p><label className="demo-label">Customer<select value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Select a customer</option>{ext.customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.reference})</option>)}</select></label><div className="demo-inline-form"><input aria-label="New membership customer name" placeholder="New customer name" value={newCustomer} onChange={e=>setNewCustomer(e.target.value)}/><button className="demo-btn secondary" onClick={addCustomer} disabled={!newCustomer.trim()}><Plus size={14}/> Add customer</button></div><p className="demo-membership-info">One membership plan per item; automatic recurring charges are not enabled.</p></div>}{hasFoodItems&&<div className="demo-fulfillment-options">
    <strong>Food & beverage fulfillment</strong>
    {hasNonFoodItems&&<small>Applies only to food and beverage items in this mixed cart.</small>}
    <div className="demo-order-types">{(['takeout','dine_in','delivery'] as DemoOrderType[]).map(t=><button className={type===t?'active':''} onClick={()=>setType(t)} key={t}>{t==='dine_in'?'Dine-in':t==='takeout'?'Takeout':'Delivery'}</button>)}</div>
  </div>}<div className="demo-cart-lines">{lines.length?lines.map(({row,product})=><div className="demo-cart-line" key={row.productId}><span className="demo-cart-emoji">{product.emoji}</span><div><strong>{product.name}</strong><small>{money(product.price)}</small><div className="demo-quantity"><button aria-label={'Remove one '+product.name} onClick={()=>adjust(product.id,-1)}><Minus size={13}/></button><b>{row.qty}</b><button aria-label={'Add one '+product.name} disabled={row.qty>=available(product)} onClick={()=>adjust(product.id,1)}><Plus size={13}/></button></div></div><strong>{money(row.qty*product.price)}</strong></div>):<div className="demo-cart-empty"><ShoppingCart size={33}/><strong>Your sale is empty</strong><p>Add a product or service to begin.</p></div>}</div><div className="demo-cart-summary"><label className="demo-promo"><input type="checkbox" checked={promo&&!hasMembership} disabled={!data.promotionActive||hasMembership} onChange={e=>setPromo(e.target.checked)}/> Apply DEMO10 discount (10%){hasMembership?' · Unavailable with memberships':''}</label><div><span>Subtotal</span><b>{money(subtotal)}</b></div>{discount>0&&<div><span>Discount</span><b>-{money(discount)}</b></div>}{tax>0&&<div><span>Tax</span><b>{money(tax)}</b></div>}{service>0&&<div><span>Service</span><b>{money(service)}</b></div>}<div className="demo-total"><span>Total</span><strong>{money(total)}</strong></div></div><div className="demo-payment"><strong>Payment method (simulated)</strong><div>{(['cash','gcash','maya','card'] as DemoPayment[]).map(p=><button key={p} className={payment===p?'active':''} onClick={()=>setPayment(p)}>{p==='cash'?<Wallet size={15}/>:<CreditCard size={15}/>} {p.toUpperCase()}</button>)}</div>{payment==='cash'&&<label className="demo-label">Cash tendered (PHP)<input type="number" min="0" step=".01" placeholder="e.g. 500" value={tender} onChange={e=>setTender(e.target.value)}/></label>}{payment==='cash'&&<p className="demo-change">Change: <b>{money(Math.max(0,paid-total))}</b></p>}</div>{error&&<p className="demo-error" role="alert">{error}</p>}<button className="demo-btn primary demo-checkout-btn" onClick={checkout} disabled={!cart.length}><Check size={18}/> Complete demo sale</button><small className="demo-payment-note">No payment will be charged. {role==='cashier'?'Cashier access is simulated.':''}</small></div></div>{receipt&&<div className="demo-modal-backdrop"><div className="demo-modal demo-receipt" role="dialog" aria-modal="true" aria-label="Simulated receipt"><Pill tone="green"><Check size={14}/> Sale completed</Pill><h2>Demo receipt</h2><p>{receipt.id} · {dateFmt(receipt.date)}</p><div className="demo-receipt-lines">{receipt.lines.map(line=><div key={line.productId}><span>{line.qty} × {line.name}</span><b>{money(line.price*line.qty)}</b></div>)}<hr/><div><span>Total</span><strong>{money(receipt.total)}</strong></div><div><span>Payment</span><b>{receipt.payment.toUpperCase()}</b></div></div><p className="demo-receipt-warning">SIMULATED TRANSACTION · NOT A FISCAL RECEIPT</p><button className="demo-btn primary demo-full" onClick={()=>setReceipt(null)}>Done</button></div></div>}</>;
}
function Products({data,ext,updateExtension,change,notify}:{data:DemoData;ext:DemoExtension;updateExtension:(fn:(e:DemoExtension)=>DemoExtension)=>void;change:(fn:(d:DemoData)=>DemoData)=>void;notify:(s:string)=>void}) {
  const empty={name:'',category:'Retail',price:'',cost:'',stock:'20',reorder:'8',emoji:'📦',kind:'physical' as DemoKind,
    itemType:'physical' as DemoItemType,itemClass:'general_merchandise' as DemoItemClass,trackInventory:true,sku:'',barcode:''};
  const [draft,setDraft]=useState<typeof empty & {id?:string}|null>(null);
  const [query,setQuery]=useState('');
  const rows=data.products.filter(p=>(p.name+' '+p.category).toLowerCase().includes(query.toLowerCase()));
  function save(e:React.FormEvent){e.preventDefault();if(!draft||!draft.name.trim())return;const price=Math.round(Number(draft.price)*100),cost=Math.round(Number(draft.cost)*100),stock=Number(draft.stock),reorder=Number(draft.reorder);if(!(price>0)||cost<0||stock<0||reorder<0||![price,cost,stock,reorder].every(Number.isFinite)){return;}const id=draft.id||'p'+Date.now();const original=data.products.find(p=>p.id===id);
  if(draft.itemType==='membership'&&!original){notify('Create new membership plans from the Memberships module to link POS correctly.');return;}
  if(original&&productType(original)==='membership'&&draft.itemType!=='membership'){notify('Linked membership items cannot be converted to a different type.');return;}
  const itemClass=draft.itemType==='membership'?'membership_plan':draft.itemClass;
  const trackInventory=draft.itemType==='physical'&&draft.trackInventory;
  const kind:DemoKind=itemClass==='food_beverage'?'food_beverage':draft.itemType==='physical'?(trackInventory?'physical':'non_stock'):'service';
  const previousBalance=Object.values(ext.balances).reduce((n,b)=>n+(b[id]||0),0);
  const total=original?previousBalance:(trackInventory?Math.floor(stock):0);
  const item:DemoProduct={id,name:draft.name.trim(),category:draft.category,price,cost,stock:total,reorder:trackInventory?Math.floor(reorder):0,emoji:draft.emoji||'📦',kind,
    itemType:draft.itemType,itemClass,trackInventory,sku:draft.sku,barcode:draft.barcode,active:true};
  change(old=>({...old,products:draft.id?old.products.map(p=>p.id===id?{...item,active:p.active}:p):[...old.products,item]}));
  updateExtension(old=>{const delta=original?0:total;
   return {...old,balances:{...old.balances,b1:{...old.balances.b1,[id]:Math.max(0,(old.balances.b1?.[id]||0)+delta)},b2:{...old.balances.b2,[id]:old.balances.b2?.[id]||0}},
    plans:old.plans.map(plan=>plan.productId===id?{...plan,name:item.name}:plan)};
  });setDraft(null);notify('Demo product saved.');}
  return <><Heading title="Products & services" description="Manage products, retail items and services across industries. All changes stay in this browser." actions={<button className="demo-btn primary" onClick={()=>setDraft(empty)}><Plus size={17}/> Add product</button>}/><Card title="Product catalog" right={<label className="demo-search demo-search-small"><Search size={16}/><input placeholder="Search products" value={query} onChange={e=>setQuery(e.target.value)}/></label>}><Table heads={['Product','Type / Class','Category','Price','On hand','Status','Actions']}>{rows.map(p=><tr key={p.id}><td><span className="demo-table-emoji">{p.emoji}</span><b>{p.name}</b></td><td><b>{productType(p)==='membership'?'Membership':productType(p)==='service'?'One-time service':'Physical'}</b><span className="demo-item-kind">{productClass(p).replaceAll('_',' ')}</span></td><td>{p.category}</td><td>{money(p.price)}</td><td>{!tracksStock(p)?'—':Object.values(ext.balances).reduce((n,b)=>n+(b[p.id]||0),0)}</td><td><Pill tone={p.active?'green':'muted'}>{p.active?'Active':'Inactive'}</Pill></td><td><div className="demo-inline-actions"><button onClick={()=>setDraft({id:p.id,name:p.name,category:p.category,price:String(p.price/100),cost:String(p.cost/100),stock:String(p.stock),reorder:String(p.reorder),emoji:p.emoji,kind:p.kind||'physical',itemType:productType(p),itemClass:productClass(p),trackInventory:tracksStock(p),sku:p.sku||'',barcode:p.barcode||''})}><Pencil size={15}/> Edit</button><button onClick={()=>{change(old=>({...old,products:old.products.map(row=>row.id===p.id?{...row,active:!row.active}:row)}));notify('Product visibility updated.');}}>{p.active?'Disable':'Enable'}</button></div></td></tr>)}</Table></Card>{draft&&<div className="demo-modal-backdrop" onMouseDown={()=>setDraft(null)}><div className="demo-modal" role="dialog" aria-modal="true" aria-label="Product editor" onMouseDown={e=>e.stopPropagation()}><h2>{draft.id?'Edit':'Add'} demo product</h2><form onSubmit={save}><div className="demo-form-grid"><label className="demo-label wide">Name<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label className="demo-label">Category (any industry)<input maxLength={60} required value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} placeholder="e.g. Grocery, Salon, Repairs"/></label><label className="demo-label">Product type<select disabled={!!draft.id&&productType(data.products.find(p=>p.id===draft.id)!)==='membership'} value={draft.itemType} onChange={e=>{const t=e.target.value as DemoItemType;setDraft({...draft,itemType:t,itemClass:t==='physical'?'general_merchandise':t==='service'?'general_service':'membership_plan',trackInventory:t==='physical',kind:t==='physical'?'physical':'service'});}}>
   <option value="physical">Physical product</option><option value="service">One-time service</option><option value="membership">Membership / subscription</option>
  </select></label>
  <label className="demo-label">Product class<select value={draft.itemClass} disabled={draft.itemType==='membership'} onChange={e=>setDraft({...draft,itemClass:e.target.value as DemoItemClass})}>
    {draft.itemType==='membership'?<option value="membership_plan">Membership plan</option>:<>
      <option value={draft.itemType==='physical'?'general_merchandise':'general_service'}>{draft.itemType==='physical'?'General merchandise':'General service'}</option>
      <option value="food_beverage">Food & beverage</option>
    </>}
  </select></label>
  {draft.itemType==='physical'&&<label className="demo-label wide demo-inline-form"><input type="checkbox" checked={draft.trackInventory} onChange={e=>setDraft({...draft,trackInventory:e.target.checked})}/> Track inventory</label>}
  {draft.itemType==='membership'&&<p className="demo-muted wide">{draft.id?'This item is linked to a Memberships plan. Update its POS availability in Memberships.':'Create a membership plan from the Memberships module to automatically generate its linked POS item.'}</p>}<label className="demo-label">SKU<input value={draft.sku} onChange={e=>setDraft({...draft,sku:e.target.value})}/></label>
  <label className="demo-label">Barcode<input value={draft.barcode} onChange={e=>setDraft({...draft,barcode:e.target.value})}/></label>
  <label className="demo-label">Emoji<input value={draft.emoji} onChange={e=>setDraft({...draft,emoji:e.target.value})}/></label>{([['price','Price (PHP)'],['cost','Cost (PHP)'],['stock','Starting stock'],['reorder','Reorder threshold']] as const).map(([key,label])=><label className="demo-label" key={key}>{label}<input required disabled={key==='stock'&&!!draft.id} min="0" step={key==='stock'||key==='reorder'?'1':'.01'} type="number" value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}</div><div className="demo-actions"><button type="button" className="demo-btn secondary" onClick={()=>setDraft(null)}>Cancel</button><button className="demo-btn primary" type="submit" disabled={draft.itemType==='membership'&&!draft.id}>Save product</button></div></form></div></div>}</>;
}
function Inventory({data,ext,updateExtension,notify}:{data:DemoData;ext:DemoExtension;updateExtension:(fn:(e:DemoExtension)=>DemoExtension)=>void;notify:(s:string)=>void}) {
 const [selected,setSelected]=useState<DemoProduct|null>(null);
 const [branch,setBranch]=useState('b1');
 const [amount,setAmount]=useState('10'),[reason,setReason]=useState('Manual stock count correction');
 const [direction,setDirection]=useState<'in'|'out'>('in'),[error,setError]=useState('');
 const physical=data.products.filter(tracksStock);
 const balance=(p:DemoProduct)=>ext.balances[branch]?.[p.id]||0;
 const low=physical.filter(p=>balance(p)<=p.reorder).length;
 const total=physical.reduce((n,p)=>n+balance(p),0);
 function adjust(e:React.FormEvent){e.preventDefault();if(!selected)return;
  const count=Number(amount),current=balance(selected),delta=(direction==='in'?1:-1)*count;
  if(!Number.isInteger(count)||count<=0||count>10000||current+delta<0){setError('Invalid quantity or insufficient branch stock');return;}
  updateExtension(old=>({...old,balances:{...old.balances,[branch]:{...old.balances[branch],[selected.id]:current+delta}},
   movements:[{id:globalThis.crypto.randomUUID(),date:new Date().toISOString(),productId:selected.id,from:direction==='out'?branch:null,to:direction==='in'?branch:null,qty:count,kind:'adjustment' as const,reason},...old.movements]}));
  notify('Branch stock adjustment saved.');setSelected(null);setError('');
 }
 return <><Heading title="Inventory management" description="Adjust stock for an individual location, inspect balances and use Stock & Transfers to move inventory between branches."
 actions={<select className="demo-input" value={branch} onChange={e=>setBranch(e.target.value)}>{data.branches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select>}/>
 <div className="demo-metrics demo-metrics-three"><Metric label="Stock items" value={String(physical.length)} icon={Package} tone="sage" detail="Monitored physical catalog"/>
 <Metric label="Low stock alerts" value={String(low)} icon={AlertTriangle} tone="sand" detail="At or below reorder point"/>
 <Metric label="Total units on hand" value={String(total)} icon={Store} tone="peach" detail="For selected branch"/></div>
 <Card title="Branch stock balances"><Table heads={['Item','Category','On hand','Reorder at','Status','Action']}>{physical.map(p=><tr key={p.id}><td><span className="demo-table-emoji">{p.emoji}</span><b>{p.name}</b></td><td>{p.category}</td><td>{balance(p)}</td><td>{p.reorder}</td><td><Pill tone={balance(p)<=p.reorder?'amber':'green'}>{balance(p)<=p.reorder?'Low stock':'Healthy'}</Pill></td><td><button className="demo-link" onClick={()=>{setSelected(p);setAmount('10');setDirection('in');}}>Adjust stock</button></td></tr>)}</Table></Card>
 {selected&&<div className="demo-modal-backdrop" onMouseDown={()=>setSelected(null)}><div className="demo-modal" role="dialog" aria-modal="true" aria-label="Stock adjustment" onMouseDown={e=>e.stopPropagation()}><h2>Adjust branch stock</h2>
 <p>{selected.emoji} {selected.name} · {balance(selected)} at {data.branches.find(b=>b.id===branch)?.name}</p>
 <form onSubmit={adjust}><label className="demo-label">Adjustment<select value={direction} onChange={e=>setDirection(e.target.value as 'in'|'out')}><option value="in">Stock in (+)</option><option value="out">Stock out (-)</option></select></label>
 <label className="demo-label">Quantity<input type="number" min="1" step="1" max={direction==='out'?balance(selected):10000} required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label className="demo-label">Reason<input maxLength={300} required value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<p role="alert" className="demo-error">{error}</p>}
 <div className="demo-actions"><button type="button" className="demo-btn secondary" onClick={()=>setSelected(null)}>Cancel</button><button className="demo-btn primary">Save adjustment</button></div></form></div></div>}</>;
}
function Orders({data}:{data:DemoData}) {
  const [query,setQuery]=useState('');const [payment,setPayment]=useState('all');const [selected,setSelected]=useState<DemoSale|null>(null);
  const rows=data.orders.filter(o=>(payment==='all'||o.payment===payment)&&(o.id+' '+o.cashier+' '+o.lines.map(l=>l.name).join(' ')).toLowerCase().includes(query.toLowerCase())).slice().reverse();
  return <><Heading title="Sales & transactions" description="Browse simulated transactions completed in this demo."/><Card title="Transaction history" right={<div className="demo-toolbar"><label className="demo-search demo-search-small"><Search size={16}/><input placeholder="Search transactions" value={query} onChange={e=>setQuery(e.target.value)}/></label><select className="demo-input" aria-label="Payment filter" value={payment} onChange={e=>setPayment(e.target.value)}><option value="all">All payments</option>{['cash','gcash','maya','card'].map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div>}><Table heads={['Order','Date','Branch','Payment','Total','Details']}>{rows.map(o=><tr key={o.id}><td><b>{o.id}</b></td><td>{dateFmt(o.date)}</td><td>{data.branches.find(b=>b.id===o.branchId)?.name||'—'}</td><td><Pill>{o.payment.toUpperCase()}</Pill></td><td><b>{money(o.total)}</b></td><td><button className="demo-link" onClick={()=>setSelected(o)}>View receipt</button></td></tr>)}</Table>{!rows.length&&<Empty/>}</Card>{selected&&<div className="demo-modal-backdrop" onMouseDown={()=>setSelected(null)}><div className="demo-modal demo-receipt" role="dialog" aria-modal="true" aria-label="Demo transaction" onMouseDown={e=>e.stopPropagation()}><h2>{selected.id}</h2><p>{dateFmt(selected.date)} · {selected.cashier}</p><div className="demo-receipt-lines">{selected.lines.map((line,i)=><div key={i}><span>{line.qty} × {line.name}</span><b>{money(line.qty*line.price)}</b></div>)}<hr/><div><span>Total</span><strong>{money(selected.total)}</strong></div><div><span>Payment</span><b>{selected.payment.toUpperCase()}</b></div></div><p className="demo-receipt-warning">SIMULATED TRANSACTION · NOT A FISCAL RECEIPT</p><button className="demo-btn primary demo-full" onClick={()=>setSelected(null)}>Close</button></div></div>}</>;
}
function Reports({data}:{data:DemoData}) {
  const revenue=data.orders.reduce((n,o)=>n+o.total,0);
  const qty:Record<string,{count:number,total:number}>={};
  for(const order of data.orders)for(const l of order.lines){const previous=qty[l.name]||{count:0,total:0};qty[l.name]={count:previous.count+l.qty,total:previous.total+l.qty*l.price};}
  const ranked=Object.entries(qty).sort((a,b)=>b[1].total-a[1].total);
  const max=Math.max(1,...ranked.map(([,v])=>v.total));
  function exportCsv(){const rows=[['Order','Date','Branch','Payment','Total PHP'],...data.orders.map(o=>[o.id,o.date,data.branches.find(b=>b.id===o.branchId)?.name||'',o.payment,String(o.total/100)])];const csv=rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download='stratifypos-demo-sales.csv';link.click();URL.revokeObjectURL(url);}
  return <><Heading title="Reports & analytics" description="Synthetic business performance and sales insights." actions={<button className="demo-btn secondary" onClick={exportCsv}><Download size={16}/> Export demo CSV</button>}/><div className="demo-metrics demo-metrics-three"><Metric label="Total revenue" value={money(revenue)} icon={TrendingUp} detail="Sample sales, all dates"/><Metric label="Transactions" value={String(data.orders.length)} icon={ReceiptText} detail="Completed demo orders" tone="sage"/><Metric label="Average order" value={money(data.orders.length?Math.round(revenue/data.orders.length):0)} icon={Wallet} detail="Per sample transaction" tone="peach"/></div><div className="demo-two-col"><Card title="Revenue by product"><div className="demo-bars">{ranked.slice(0,7).map(([name,row])=><div className="demo-bar-row" key={name}><div><span>{name}</span><b>{money(row.total)}</b></div><div className="demo-track"><span style={{width:String(row.total/max*100)+'%'}}/></div></div>)}</div></Card><Card title="Sales by payment method"><div className="demo-payment-summary">{(['cash','gcash','maya','card'] as DemoPayment[]).map(p=>{const orders=data.orders.filter(o=>o.payment===p);return <div key={p}><span>{p.toUpperCase()}</span><strong>{money(orders.reduce((n,o)=>n+o.total,0))}</strong><small>{orders.length} orders</small></div>;})}</div></Card></div><Card title="Top selling products"><Table heads={['Product','Units sold','Gross sales']}>{ranked.map(([name,row])=><tr key={name}><td><b>{name}</b></td><td>{row.count}</td><td>{money(row.total)}</td></tr>)}</Table></Card></>;
}
function Staff({data,account,change,notify}:{data:DemoData;account:Account;change:(fn:(d:DemoData)=>DemoData)=>void;notify:(s:string)=>void}) {
  const isCashier=account.role==='cashier';const person=data.staff.find(p=>p.name===account.name);
  function toggle(){if(!person)return;change(old=>({...old,staff:old.staff.map(s=>s.id===person.id?{...s,shiftStart:s.shiftStart?null:today()}:s)}));notify(person.shiftStart?'Shift ended.':'Shift started.');}
  return <><Heading title="Team & attendance" description="Explore sample team roles and a local shift check-in workflow."/><Card title="My attendance"><div className="demo-attendance"><div><Clock3 size={25}/><div><strong>{person?.shiftStart?'Clocked in':'Not currently clocked in'}</strong><p>{person?.shiftStart?'Since '+dateFmt(person.shiftStart):'You can simulate starting a shift.'}</p></div></div><button className="demo-btn primary" onClick={toggle}>{person?.shiftStart?'Clock out':'Clock in'}</button></div></Card>{!isCashier&&<Card title="Team directory"><Table heads={['Employee','Role','Assigned branch','Shift status']}>{data.staff.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td className="capitalize">{s.role}</td><td>{data.branches.find(b=>b.id===s.branchId)?.name}</td><td><Pill tone={s.shiftStart?'green':'muted'}>{s.shiftStart?'Clocked in':'Not active'}</Pill></td></tr>)}</Table></Card>}</>;
}
function Branches({data}:{data:DemoData}) {return <><Heading title="Branches & locations" description="Sample business locations used throughout the demo."/><div className="demo-branch-grid">{data.branches.map(b=><Card key={b.id} title={b.name} right={<Pill tone="green">Active</Pill>}><div className="demo-branch-card"><Store size={30}/><p>{b.location}</p><p><b>{data.orders.filter(o=>o.branchId===b.id).length}</b> demo transactions</p><small>Sample location — no live store connection</small></div></Card>)}</div></>;}
function SettingsPage({data,change,reset}:{data:DemoData;change:(fn:(d:DemoData)=>DemoData)=>void;reset:()=>void}) {
  const [tax,setTax]=useState(String(data.taxRate));const [service,setService]=useState(String(data.serviceRate));const [footer,setFooter]=useState(data.footer);
  function save(e:React.FormEvent){e.preventDefault();const t=Number(tax),s=Number(service);if(![t,s].every(v=>Number.isFinite(v)&&v>=0&&v<=30))return;change(old=>({...old,taxRate:t,serviceRate:s,footer}));}
  return <><Heading title="Settings" description="Configure simulated checkout calculations and reset sample data."/><div className="demo-two-col"><Card title="Checkout settings"><form className="demo-settings-form" onSubmit={save}><label className="demo-label">Tax rate (%)<input type="number" min="0" max="30" step=".01" value={tax} onChange={e=>setTax(e.target.value)}/></label><label className="demo-label">Service rate (%)<input type="number" min="0" max="30" step=".01" value={service} onChange={e=>setService(e.target.value)}/></label><label className="demo-label">Receipt footer<textarea rows={3} value={footer} onChange={e=>setFooter(e.target.value)}/></label><button className="demo-btn primary">Save demo settings</button></form></Card><Card title="Demo environment"><div className="demo-environment"><ShieldCheck size={28}/><h3>Safe to explore</h3><p>This portfolio build is browser-only. It has no real authentication backend, no payment gateway, and no access to production tenant data.</p><p>State persists in this browser until you reset it or clear local storage.</p><button className="demo-btn secondary" onClick={reset}><RotateCcw size={15}/> Restore original demo data</button></div></Card></div></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
