/** Zero-dependency, browser-local Excel and PDF exports for the showcase.
 * All records are synthetic; no production API or service is contacted.
 */
export type DemoSheet={name:string;columns:{key:string;label:string}[];rows:Record<string,string|number|null|undefined>[]};
const encoder=new TextEncoder();
const encode=(s:string)=>encoder.encode(s);
function append(parts:Uint8Array[]):Uint8Array{
 const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);
 let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;
}
const xml=(v:unknown)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;");
function columnName(index:number){
 let result='';for(let x=index+1;x>0;x=Math.floor((x-1)/26))result=String.fromCharCode(65+(x-1)%26)+result;
 return result;
}
function crc32(bytes:Uint8Array){
 let crc=0xffffffff;
 for(const byte of bytes){
  crc^=byte;for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
 }
 return (crc^0xffffffff)>>>0;
}
function zip(files:{path:string;data:Uint8Array}[]):Uint8Array{
 const parts:Uint8Array[]=[],central:Uint8Array[]=[];
 let offset=0;
 for(const file of files){
  const name=encode(file.path),bytes=file.data,crc=crc32(bytes);
  const local=new Uint8Array(30+name.length),v=new DataView(local.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);
  v.setUint16(8,0,true);v.setUint32(14,crc,true);
  v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);
  v.setUint16(26,name.length,true);local.set(name,30);
  const cd=new Uint8Array(46+name.length),c=new DataView(cd.buffer);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);
  c.setUint16(6,20,true);c.setUint32(16,crc,true);
  c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);
  c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
  cd.set(name,46);central.push(cd);
  parts.push(local,bytes);offset+=local.length+bytes.length;
 }
 const centralData=append(central),end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);
 e.setUint16(10,files.length,true);e.setUint32(12,centralData.length,true);
 e.setUint32(16,offset,true);
 return append([...parts,centralData,end]);
}
function workbook(sheets:DemoSheet[]):Uint8Array{
 const contentTypes=['<?xml version="1.0" encoding="UTF-8"?>',
 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
 '<Default Extension="xml" ContentType="application/xml"/>',
 '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
 ...sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'),'</Types>'].join('');
 const wb='<?xml version="1.0" encoding="UTF-8"?>'+
 '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '+
 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
 sheets.map((s,i)=>'<sheet name="'+xml(s.name.slice(0,31))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+
 '</sheets></workbook>';
 const rels='<?xml version="1.0" encoding="UTF-8"?>'+
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
 sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+
 '</Relationships>';
 const rootRels='<?xml version="1.0" encoding="UTF-8"?>'+
 '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
 '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const files=[{path:'[Content_Types].xml',data:encode(contentTypes)},
  {path:'_rels/.rels',data:encode(rootRels)},
  {path:'xl/workbook.xml',data:encode(wb)},
  {path:'xl/_rels/workbook.xml.rels',data:encode(rels)}];
 sheets.forEach((sheet,i)=>{
  const grid=[Object.fromEntries(sheet.columns.map(c=>[c.key,c.label])),...sheet.rows];
  const xmlRows=grid.map((row,r)=>'<row r="'+(r+1)+'">'+sheet.columns.map((c,j)=>{
   const value=row[c.key],address=columnName(j)+(r+1);
   return typeof value==='number'&&Number.isFinite(value)
    ?'<c r="'+address+'"><v>'+value+'</v></c>'
    :'<c r="'+address+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
  }).join('')+'</row>').join('');
  files.push({path:'xl/worksheets/sheet'+(i+1)+'.xml',data:encode(
   '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+
   xmlRows+'</sheetData></worksheet>')});
 });
 return zip(files);
}
function printable(value:unknown):string{
 return String(value??'').normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replaceAll('\\','\\\\')
  .replaceAll('(','\\(').replaceAll(')','\\)');
}
function pdf(sheets:DemoSheet[]):Uint8Array{
 const rows:string[]=[];
 for(const sheet of sheets){
  rows.push('STRATIFYPOS DEMO - '+sheet.name);
  rows.push(sheet.columns.map(c=>c.label).join(' | '));
  for(const row of sheet.rows){
   rows.push(sheet.columns.map(c=>String(row[c.key]??'')).join(' | '));
  }
  rows.push('');
 }
 const lines=rows.flatMap(line=>{
  const result:string[]=[];for(let i=0;i<line.length;i+=112)result.push(line.slice(i,i+112));
  return result.length?result:[''];
 });
 const pages: string[][]=[];for(let i=0;i<lines.length;i+=48)pages.push(lines.slice(i,i+48));
 if(!pages.length)pages.push(['No report records']);
 const objects:string[]=['','','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const pageNumbers:number[]=[];
 for(const linesForPage of pages){
  const pageObj=objects.length+1,contentObj=pageObj+1;
  pageNumbers.push(pageObj);
  const stream='BT /F1 9 Tf 38 552 Td 12 TL '+linesForPage.map((line,i)=>
   (i?'T* ':'')+'('+printable(line)+') Tj').join('\n')+' ET\n';
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R >> >> /Contents '+contentObj+' 0 R >>');
  objects.push('<< /Length '+encode(stream).length+' >>\nstream\n'+stream+'endstream');
 }
 objects[0]='<< /Type /Catalog /Pages 2 0 R >>';
 objects[1]='<< /Type /Pages /Kids ['+pageNumbers.map(n=>n+' 0 R').join(' ')+'] /Count '+pages.length+' >>';
 // PDF font resides at object 3; pages begin at object 4.
 let doc='%PDF-1.4\n',offsets=[0];
 objects.forEach((obj,i)=>{offsets.push(encode(doc).length);
  doc+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
 const position=encode(doc).length;
 doc+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+
 offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+
 'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+position+'\n%%EOF';
 return encode(doc);
}
export function createDemoExport(sheets:DemoSheet[],format:'xlsx'|'pdf'):Blob{
 if(!sheets.length||sheets.some(s=>!s.columns.length||s.columns.length>30||s.rows.length>5000))
  throw new Error('Narrow the report or provide report columns');
 const content=format==='xlsx'?workbook(sheets):pdf(sheets);
 return new Blob([content as BlobPart],{type:format==='xlsx'
  ?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf'});
}
export function downloadDemoExport(sheets:DemoSheet[],format:'xlsx'|'pdf',name:string){
 const result=createDemoExport(sheets,format),url=URL.createObjectURL(result),link=document.createElement('a');
 link.href=url;link.download=name+'.'+format;document.body.appendChild(link);
 link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),15000);
}
