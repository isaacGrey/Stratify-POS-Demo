/** Small zero-dependency exporters for the browser-local demo. These produce genuine XLSX and PDF bytes. */
const encoder=new TextEncoder();
const xmlEscape=(s:unknown)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const concat=(parts:Uint8Array[]):Uint8Array=>{const size=parts.reduce((n,p)=>n+p.length,0);const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out};
const le=(num:number,bytes:number)=>{const arr=new Uint8Array(bytes);for(let i=0;i<bytes;i++)arr[i]=Math.floor(num/2**(8*i))&255;return arr};
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let b=0;b<8;b++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=(data:Uint8Array)=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
function zip(files:[string,string][]):Uint8Array{
 const parts:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const [name,value] of files){const n=encoder.encode(name),d=encoder.encode(value),crc=crc32(d);
  const local=concat([le(0x04034b50,4),le(20,2),le(0,2),le(0,2),le(0,4),
   le(crc,4),le(d.length,4),le(d.length,4),le(n.length,2),le(0,2),n,d]);parts.push(local);
  central.push(concat([le(0x02014b50,4),le(20,2),le(20,2),le(0,2),le(0,2),
   le(0,4),le(crc,4),le(d.length,4),le(d.length,4),le(n.length,2),
   le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(offset,4),n]));
  offset+=local.length;
 }
 const dir=concat(central),body=concat(parts);
 return concat([body,dir,le(0x06054b50,4),le(0,2),le(0,2),le(files.length,2),
  le(files.length,2),le(dir.length,4),le(body.length,4),le(0,2)]);
}
function column(index:number){let s='';for(let i=index+1;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
export function xlsxBytes(headers:string[],rows:(string|number|null)[][]):Uint8Array{
 const all=[headers,...rows];
 const sheet='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>'+
 all.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((value,c)=>{const ref=column(c)+(r+1);
  return typeof value==='number'&&Number.isFinite(value)?
   '<c r="'+ref+'"><v>'+value+'</v></c>':
   '<c r="'+ref+'" t="inlineStr"><is><t>'+xmlEscape(value)+'</t></is></c>';}).join('')+'</row>').join('')+
 '</sheetData></worksheet>';
 return zip([
  ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
  ['xl/worksheets/sheet1.xml','<?xml version="1.0" encoding="UTF-8"?>'+sheet]
 ]);
}
const pdfEscape=(s:unknown)=>String(s??'').replace(/[^\x20-\x7e]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
export function pdfBytes(title:string,headers:string[],rows:(string|number|null)[][]):Uint8Array{
 const lines=[title,'StratifyPOS DEMO - simulated data','',headers.join(' | '),
  ...rows.map(row=>row.map(x=>String(x??'')).join(' | '))];
 const pages: string[][]=[];for(let i=0;i<lines.length;i+=44)pages.push(lines.slice(i,i+44));
 if(!pages.length)pages.push([]);
 const objects:string[]=['','<< /Type /Catalog /Pages 2 0 R >>','',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const kidIds:number[]=[];
 for(let p=0;p<pages.length;p++){const pageId=objects.length,kid=pageId;
  const contentId=pageId+1;kidIds.push(kid);
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents '+contentId+' 0 R >>');
  const stream=pages[p].map((line,i)=>'BT /F1 '+(i===0&&p===0?'14':'9')+' Tf 32 '+(560-i*12)+' Td ('+
   pdfEscape(line.slice(0,140))+') Tj ET').join('\n');
  objects.push('<< /Length '+encoder.encode(stream).length+' >>\nstream\n'+stream+'\nendstream');
 }
 objects[2]='<< /Type /Pages /Count '+pages.length+' /Kids ['+kidIds.map(id=>id+' 0 R').join(' ')+'] >>';
 let text='%PDF-1.4\n';const offsets=[0];
 for(let i=1;i<objects.length;i++){offsets.push(encoder.encode(text).length);text+=i+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const start=encoder.encode(text).length;text+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
 for(let i=1;i<objects.length;i++)text+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 text+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';
 return encoder.encode(text);
}
export function downloadDemoReport(format:'xlsx'|'pdf',file:string,title:string,headers:string[],rows:(string|number|null)[][]){
 const bytes=format==='xlsx'?xlsxBytes(headers,rows):pdfBytes(title,headers,rows);
 const mime=format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf';
 const blob=new Blob([bytes as BlobPart],{type:mime});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=file+'.'+format;document.body.append(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
