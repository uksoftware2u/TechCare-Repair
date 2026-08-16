import { Package, Printer, X } from "@phosphor-icons/react";
import "./warranty-batch-confirmation.css";

function displayDate(value) {
  if (!value) return "—";
  const parts = String(value).slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

const code39 = {
  "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn",
  A:"wnnnnwnnw",B:"nnwnnwnnw",C:"wnwnnwnnn",D:"nnnnwwnnw",E:"wnnnwwnnn",F:"nnwnwwnnn",G:"nnnnnwwnw",H:"wnnnnwwnn",I:"nnwnnwwnn",J:"nnnnwwwnn",
  K:"wnnnnnnww",L:"nnwnnnnww",M:"wnwnnnnwn",N:"nnnnwnnww",O:"wnnnwnnwn",P:"nnwnwnnwn",Q:"nnnnnnwww",R:"wnnnnnwwn",S:"nnwnnnwwn",T:"nnnnwnwwn",
  U:"wwnnnnnnw",V:"nwwnnnnnw",W:"wwwnnnnnn",X:"nwnnwnnnw",Y:"wwnnwnnnn",Z:"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","$":"nwnwnwnnn","/":"nwnwnnnwn","+":"nwnnnwnwn","%":"nnnwnwnwn","*":"nwnnwnwnn"
};

function TrackingBarcode({ value }) {
  const original=String(value||"").trim();
  const safe=original.toUpperCase().replace(/[^0-9A-Z. $/+%\-]/g,"");
  if(!original||original==="—"||!safe)return <div className="wb-item-barcode missing"><span>No Serial Barcode</span><b>{original||"—"}</b></div>;
  const encoded=`*${safe}*`;
  const units=encoded.split("").reduce((total,char)=>total+[...code39[char]].reduce((sum,width)=>sum+(width==="w"?3:1),0)+1,20);
  let x=10;
  const bars=[];
  encoded.split("").forEach((char)=>{[...code39[char]].forEach((width,index)=>{const size=width==="w"?3:1;if(index%2===0)bars.push(<rect key={`${char}-${x}-${index}`} x={x} y="1" width={size} height="30"/>);x+=size;});x+=1;});
  return <div className="wb-item-barcode" aria-label={`Serial Number Barcode ${safe}`}><svg viewBox={`0 0 ${units} 32`} role="img"><title>Serial No. {safe}</title>{bars}</svg><b>{original}</b></div>;
}

function ItemCheckList() {
  return <div className="wb-item-checklist" aria-label="Item Check List"><span><i/>Serial Verified</span><span><i/>Device Checked</span><span><i/>Packed</span></div>;
}

export function WarrantyBatchHistory({ batches, onClose, onReprint }) {
  return <div className="lm-modal-bg" onClick={onClose}><section className="lm-modal wb-history" onClick={(event)=>event.stopPropagation()}><header><div><h2>Batch Sent History</h2><p>Open any sent batch to reprint its Supplier confirmation listing.</p></div><button aria-label="Close Batch History" onClick={onClose}><X size={19}/></button></header><div className="wb-history-list">{batches.length ? batches.map((batch)=><article key={batch.id}><span className="wb-history-icon"><Package size={20}/></span><span><b>{batch.id}</b><small>{batch.supplier} · Sent {displayDate(batch.sentAt)}</small></span><strong>{batch.items?.length||batch.itemIds?.length||0} item{(batch.items?.length||batch.itemIds?.length||0)===1?"":"s"}</strong><button onClick={()=>onReprint(batch)}><Printer size={16}/> Reprint</button></article>) : <div className="wb-history-empty">No sent batches yet.</div>}</div><div className="lm-modal-actions"><button onClick={onClose}>Close</button></div></section></div>;
}

export function WarrantyBatchSentConfirmation({ batch, companyProfile, onClose, onPrint }) {
  const items=batch.items||[];
  const company=companyProfile||{};
  return <div className="wb-confirmation-overlay" onClick={onClose}><section className="wb-confirmation-modal" onClick={(event)=>event.stopPropagation()}><header><div><h2>Sent Confirmation</h2><p>{batch.id} · Ready to print or reprint</p></div><button aria-label="Close Sent Confirmation" onClick={onClose}><X size={19}/></button></header><article className="wb-confirmation-paper"><div className="wb-document-title"><div className="wb-company-identity">{company.logo&&<img src={company.logo} alt={`${company.name||"Company"} logo`}/>}<div><b>{company.name||"Company Profile"}</b><span>{company.registration&&company.registration!=="—"?`Registration No. ${company.registration}`:"Warranty Supplier Dispatch"}</span></div></div><strong>SENT CONFIRMATION</strong></div><div className="wb-company-details"><span>{company.address||"Company address not configured"}</span><b>{[company.phone,company.email,company.website].filter((value)=>value&&value!=="—").join(" · ")||"Company contact details not configured"}</b></div><div className="wb-document-meta"><span><small>Batch No.</small><b>{batch.id}</b></span><span><small>Supplier</small><b>{batch.supplier}</b></span><span><small>Sent Date</small><b>{displayDate(batch.sentAt)}</b></span><span><small>Expected Return</small><b>{displayDate(batch.expectedReturn)}</b></span></div><section className="wb-document-items"><h3>Sent Item Listing</h3><div className="wb-document-row head"><span>#</span><span>Warranty / Repair</span><span>Device</span><span>Serial No. Barcode</span><span>Check List</span><span>Claim Reference</span></div>{items.map((item,index)=><div className="wb-document-row" key={item.id}><span>{index+1}</span><span><b>{item.id}</b><small>{item.repair}</small></span><span><b>{item.device}</b><small>{item.customer}</small></span><TrackingBarcode value={item.serial}/><ItemCheckList/><span>{item.claim||"—"}</span></div>)}</section><div className="wb-document-summary"><span>Total Sent Items</span><b>{items.length}</b></div>{batch.notes&&<div className="wb-document-notes"><small>Dispatch Notes</small><p>{batch.notes}</p></div>}<div className="wb-document-signatures"><span>Prepared / Sent By</span><span>Supplier Acknowledgement</span></div><footer>{batch.id} · Generated by {company.name||"Company Profile"} Warranty Batch Preparation</footer></article><div className="wb-confirmation-actions"><button onClick={onClose}>Close</button><button className="primary" onClick={onPrint}><Printer size={17}/> Print Sent Confirmation</button></div></section></div>;
}
