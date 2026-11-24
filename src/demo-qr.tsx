import React,{useEffect,useRef,useState} from 'react';
import {initialDemoData,type DemoBranch} from './demo-data';
import {isFoodOrBeverage} from './sale-flow';
const tables=['Table 1','Table 2','Table 3','Table 4','Table 5','Table 6'];
const money=(n:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n/100);
type QrConstructor={new(element:HTMLElement,options:{text:string;width:number;height:number;correctLevel:number}):unknown;CorrectLevel:{M:number}};
export function DemoTableQr({branches}:{branches:DemoBranch[]}){
 const active=branches.filter(b=>b.active);
 const [branch,setBranch]=useState(active[0]?.id||'');
 const [table,setTable]=useState(tables[0]);
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 const box=useRef<HTMLDivElement>(null);
 const valid=active.some(b=>b.id===branch);
 const url=new URL(window.location.origin+'/');url.searchParams.set('demoMenu','1');url.searchParams.set('branch',branch);url.searchParams.set('table',table);
 const href=url.toString();
 useEffect(()=>{
  setReady(false);setError('');if(!valid||!box.current)return;
  const host=box.current;host.replaceChildren();
  const Encoder=(window as Window & {QRCode?:QrConstructor}).QRCode;
  if(!Encoder){setError('QR encoder unavailable. Open the sample menu link instead.');return;}
  try{new Encoder(host,{text:href,width:256,height:256,correctLevel:Encoder.CorrectLevel.M});setReady(!!host.querySelector('canvas'));}
  catch{setError('Unable to generate the QR code. Open the sample menu link instead.');}
  return()=>host.replaceChildren();
 },[href,valid]);
 function download(){
  const qr=box.current?.querySelector('canvas');if(!qr)return;
  const image=document.createElement('canvas');image.width=800;image.height=800;
  const ctx=image.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,800,800);ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,80,80,640,640);
  image.toBlob(blob=>{if(!blob){setError('Could not prepare image.');return;}const uri=URL.createObjectURL(blob);const a=document.createElement('a');a.href=uri;a.download='stratify-demo-'+branch+'-'+table.toLowerCase().replaceAll(' ','-')+'.png';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(uri),30000);},'image/png');
 }
 return <div className="demo-qr-panel"><div className="demo-workflow-form"><label className="demo-label">Branch<select value={branch} onChange={e=>setBranch(e.target.value)}>{active.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="demo-label">Table<select value={table} onChange={e=>setTable(e.target.value)}>{tables.map(t=><option key={t}>{t}</option>)}</select></label></div><div className="demo-qr-preview" ref={box} role="img" aria-label={'Sample menu QR for '+table}/>{error&&<p role="alert">{error}</p>}<div className="demo-inline-form"><button className="demo-btn primary" disabled={!ready||!valid} onClick={download}>Download QR code (PNG)</button>{valid&&<a className="demo-btn secondary" href={href} target="_blank" rel="noopener noreferrer">Open sample menu</a>}</div><p className="demo-muted">Scannable example link. Every device sees the same fictional menu; orders and edited catalog data are not shared across devices. Use the request simulator below to demonstrate checkout.</p></div>;
}
export function PublicDemoMenu(){
 const params=new URLSearchParams(window.location.search);
 const data=initialDemoData();
 const branch=data.branches.find(b=>b.id===params.get('branch')&&b.active);
 const table=params.get('table');
 return <main className="demo-public-menu"><div className="demo-disclaimer">PORTFOLIO DEMO — SAMPLE MENU ONLY</div><img src="/stratify-logo.png" alt="StratifyPOS" width="60"/><h1>StratifyPOS sample menu</h1>{branch&&table&&tables.includes(table)?<><p>{branch.name} · {table}</p><div className="demo-product-grid">{data.products.filter(p=>p.active&&isFoodOrBeverage(p)).map(p=><div className="demo-product-tile" key={p.id}><span className="demo-product-art">{p.emoji}</span><strong>{p.name}</strong><small>{p.category}</small><b>{money(p.price)}</b></div>)}</div><p>No real orders or payments can be submitted from this sample menu.</p></>:<p role="alert">This is not a recognized sample table link.</p>}<a className="demo-btn secondary" href="/">Return to merchant demo</a></main>;
}
