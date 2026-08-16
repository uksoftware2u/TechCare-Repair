import { useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, BuildingOffice, CheckCircle, MagicWand, Warning, X } from "@phosphor-icons/react";
import { databaseApi } from "../database-api.js";
import "./AutoCountDebtorForm.css";
import "./AutoCountDebtorDuplicate.css";

const initialForm = {
  company: "", company2:"", reg: "", debtor: "", tin:"", taxEntityId:"", controlAccount:"380-0000", debtorType:"",
  groupCompany:false, active:true, cashSaleDebtor:false, syncEnabled:true,
  billingAddress1:"", billingAddress2:"", billingAddress3:"", billingAddress4:"", billingPostcode: "",
  sameDelivery: true, deliveryAddress1:"", deliveryAddress2:"", deliveryAddress3:"", deliveryAddress4:"", deliveryPostcode: "", attention: "",
  businessNature: "", phone: "", phone2:"", mobile: "", fax: "", fax2:"", area: "", email: "",
  statementEmail: "", website: "", agent: "", currency:"MYR", displayTerm:"C.O.D.", createAnother: false,
};

function debtorLetter(company) { return company.toUpperCase().match(/[A-Z]/)?.[0] || ""; }
function deriveDebtor(company) {
  const letter = company.toUpperCase().match(/[A-Z]/)?.[0];
  if (!letter) return "380-0000";
  return `380-${letter}001`;
}

function normalizedName(value){return String(value||"").trim().replace(/\s+/g," ").toLowerCase();}
function normalizedPhone(value){return String(value||"").replace(/\D/g,"");}
function postcodeValue(value){return String(value||"").replace(/\D/g,"").slice(0,6);}

export function AutoCountDebtorForm({ onCancel, onSave, existingCustomers=[], areas=[], agents=[], debtorTypes=[], creditTerms=[] }) {
  const [form, setForm] = useState(initialForm);
  const [debtorEdited, setDebtorEdited] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [duplicateConfirmed,setDuplicateConfirmed] = useState(false);
  const duplicates=useMemo(()=>{
    const names=[normalizedName(form.company),normalizedName(form.attention)].filter(Boolean),mobile=normalizedPhone(form.mobile);
    return existingCustomers.filter((customer)=>{
      const customerNames=[normalizedName(customer.company),normalizedName(customer.name)].filter(Boolean),customerMobile=normalizedPhone(customer.mobile||customer.phone);
      return names.some((name)=>customerNames.includes(name))||(mobile.length>=7&&customerMobile===mobile);
    }).map((customer)=>({...customer,duplicateReasons:[names.some((name)=>[normalizedName(customer.company),normalizedName(customer.name)].includes(name))?"Same name":null,mobile.length>=7&&normalizedPhone(customer.mobile||customer.phone)===mobile?"Same mobile":null].filter(Boolean)}));
  },[existingCustomers,form.company,form.attention,form.mobile]);
  useEffect(()=>setDuplicateConfirmed(false),[form.company,form.attention,form.mobile]);
  useEffect(() => {
    const letter=debtorLetter(form.company);
    if (!letter||debtorEdited) return;
    const timer=window.setTimeout(()=>databaseApi.debtorPreview(letter).then(({debtor})=>setForm(current=>({...current,debtor}))).catch(()=>{}),200);
    return ()=>window.clearTimeout(timer);
  },[form.company,debtorEdited]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateCompany = (company) => setForm((current) => ({ ...current, company, debtor: debtorEdited ? current.debtor : deriveDebtor(company) }));

  async function submit(event) {
    event.preventDefault();
    if (!form.company.trim()) { setError("Company Name is required."); return; }
    if(duplicates.length&&!duplicateConfirmed){setError("Possible duplicate customer found. Review the match and confirm before saving.");return;}
    let debtor = form.debtor || deriveDebtor(form.company);
    if (!/^380-(?:0000|[A-Z]\d{3})$/.test(debtor)) { setError("Debtor Account must follow 380-A001 format."); return; }
    setError(""); setSyncing(true);
    try { ({debtor}=await databaseApi.reserveDebtor(debtorLetter(form.company),debtorEdited?debtor:undefined)); }
    catch(error) { setError(`SQL Server debtor number failed: ${error.message}`); setSyncing(false); return; }
    const billingAddress=[form.billingAddress1,form.billingAddress2,form.billingAddress3,form.billingAddress4].filter(Boolean).join("\n");
    const deliveryFields=form.sameDelivery?{deliveryAddress1:form.billingAddress1,deliveryAddress2:form.billingAddress2,deliveryAddress3:form.billingAddress3,deliveryAddress4:form.billingAddress4}:{deliveryAddress1:form.deliveryAddress1,deliveryAddress2:form.deliveryAddress2,deliveryAddress3:form.deliveryAddress3,deliveryAddress4:form.deliveryAddress4};
    const deliveryAddress=[deliveryFields.deliveryAddress1,deliveryFields.deliveryAddress2,deliveryFields.deliveryAddress3,deliveryFields.deliveryAddress4].filter(Boolean).join("\n");
    const deliveryPostcode = form.sameDelivery ? form.billingPostcode : form.deliveryPostcode;
    try { await onSave({ ...form,...deliveryFields, debtor, billingAddress, deliveryAddress, deliveryPostcode, allowDuplicate:duplicateConfirmed }); }
    catch(error){setError(error.message||"Unable to save customer.");setSyncing(false);return;}
    setSyncing(false);
  }

  return <div className="acm-overlay" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <form className="acm-modal" role="dialog" aria-modal="true" aria-labelledby="new-customer-title" onSubmit={submit}>
      <header className="acm-header">
        <div className="acm-title-icon"><BuildingOffice size={23} weight="duotone" /></div>
        <div className="acm-title"><h2 id="new-customer-title">New Customer</h2><p>Create a customer record and sync it to AutoCount.</p></div>
        <span className="acm-status"><CheckCircle size={16} weight="fill" /> AutoCount Connected</span>
        <button className="acm-close" type="button" aria-label="Close" onClick={onCancel}><X size={20} /></button>
      </header>
      <div className="acm-body">
        <section className="acm-section">
          <div className="acm-section-heading"><div><h3>Customer &amp; AutoCount</h3><p>Core information used for the linked debtor account.</p></div></div>
          <div className="acm-grid acm-grid-three">
            <label className="acm-span-two">Company Name <em>*</em><input autoFocus aria-label="Company Name" placeholder="e.g. TechCare PC Sdn. Bhd." value={form.company} onChange={(event) => updateCompany(event.target.value)} /></label>
            <label>Business Registration No.<input placeholder="Optional" value={form.reg} onChange={(event) => update("reg", event.target.value)} /></label>
            <label className="acm-span-two">Company Name 2<input value={form.company2} onChange={(event)=>update("company2",event.target.value)}/></label>
            <label>Control Account<input value="380-0000" disabled title="Fixed control account for local customers"/><small className="acm-field-note">Fixed for customers created in this system</small></label>
            <label className="acm-span-two">Debtor Account<div className="acm-input-action"><input aria-label="Debtor Account" placeholder="Generated automatically" value={form.debtor} onChange={(event) => { setDebtorEdited(true); update("debtor", event.target.value.toUpperCase()); }} /><button type="button" onClick={() => { setDebtorEdited(false); const letter=debtorLetter(form.company); if(letter) databaseApi.debtorPreview(letter).then(({debtor})=>update("debtor",debtor)); }}><MagicWand size={16} /> Generate</button></div></label>
            <label>Debtor Type<select value={form.debtorType} onChange={(event)=>update("debtorType",event.target.value)}><option value="">Select debtor type</option>{debtorTypes.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
            <label>TIN<input value={form.tin} onChange={(event)=>update("tin",event.target.value)}/></label>
            <label>Tax Entity ID<input type="number" min="0" value={form.taxEntityId} onChange={(event)=>update("taxEntityId",event.target.value)}/></label>
            <label className="acm-check"><input type="checkbox" checked={form.active} onChange={(event)=>update("active",event.target.checked)}/><span>Active</span></label>
            <label className="acm-check"><input type="checkbox" checked={form.groupCompany} onChange={(event)=>update("groupCompany",event.target.checked)}/><span>Group Company</span></label>
            <label className="acm-check"><input type="checkbox" checked={form.cashSaleDebtor} onChange={(event)=>update("cashSaleDebtor",event.target.checked)}/><span>Cash Sale Debtor</span></label>
            <label className="acm-check"><input aria-label="Sync to AutoCount" type="checkbox" checked={form.syncEnabled} onChange={(event)=>update("syncEnabled",event.target.checked)}/><span>Sync to AutoCount</span></label>
          </div>
        </section>
        <div className="acm-columns">
          <section className="acm-section">
            <div className="acm-section-heading"><div><h3>Billing &amp; Delivery</h3><p>Addresses and business details.</p></div></div>
            <div className="acm-grid">
              <label className="acm-full">Billing Address<input placeholder="Address 1" value={form.billingAddress1} onChange={(event)=>update("billingAddress1",event.target.value)}/><input placeholder="Address 2" value={form.billingAddress2} onChange={(event)=>update("billingAddress2",event.target.value)}/><input placeholder="Address 3" value={form.billingAddress3} onChange={(event)=>update("billingAddress3",event.target.value)}/><input placeholder="Address 4" value={form.billingAddress4} onChange={(event)=>update("billingAddress4",event.target.value)}/></label>
              <label>Post / Zip Code<input inputMode="numeric" pattern="[0-9]{0,6}" maxLength={6} placeholder="Max 6 digits" value={form.billingPostcode} onChange={(event) => update("billingPostcode", postcodeValue(event.target.value))} /></label>
              <label className="acm-check acm-full"><input type="checkbox" checked={form.sameDelivery} onChange={(event) => update("sameDelivery", event.target.checked)} /><span>Delivery address is the same as billing</span></label>
              {!form.sameDelivery && <><label className="acm-full">Delivery Address<input placeholder="Address 1" value={form.deliveryAddress1} onChange={(event)=>update("deliveryAddress1",event.target.value)}/><input placeholder="Address 2" value={form.deliveryAddress2} onChange={(event)=>update("deliveryAddress2",event.target.value)}/><input placeholder="Address 3" value={form.deliveryAddress3} onChange={(event)=>update("deliveryAddress3",event.target.value)}/><input placeholder="Address 4" value={form.deliveryAddress4} onChange={(event)=>update("deliveryAddress4",event.target.value)}/></label><label>Delivery Post / Zip Code<input inputMode="numeric" pattern="[0-9]{0,6}" maxLength={6} placeholder="Max 6 digits" value={form.deliveryPostcode} onChange={(event) => update("deliveryPostcode", postcodeValue(event.target.value))} /></label></>}
              <label>Attention<input value={form.attention} onChange={(event) => update("attention", event.target.value)} /></label>
              <label>Business Nature<input value={form.businessNature} onChange={(event) => update("businessNature", event.target.value)} /></label>
            </div>
          </section>
          <section className="acm-section">
            <div className="acm-section-heading"><div><h3>Contact &amp; Assignment</h3><p>How to reach and manage this customer.</p></div></div>
            <div className="acm-grid">
              <label>Phone<input type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
              <label>Phone 2<input type="tel" value={form.phone2} onChange={(event)=>update("phone2",event.target.value)}/></label>
              <label>Mobile<input type="tel" placeholder="+60" value={form.mobile} onChange={(event) => update("mobile", event.target.value)} /></label>
              <label>Fax<input type="tel" value={form.fax} onChange={(event) => update("fax", event.target.value)} /></label>
              <label>Fax 2<input type="tel" value={form.fax2} onChange={(event)=>update("fax2",event.target.value)}/></label>
              <label>Area<select value={form.area} onChange={(event) => update("area", event.target.value)}><option value="">Select area</option>{areas.map((item)=><option key={item.code} value={item.code}>{item.description&&item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
              <label className="acm-full">Email Address<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></label>
              <label className="acm-full">Statement Email<input type="email" value={form.statementEmail} onChange={(event) => update("statementEmail", event.target.value)} /></label>
              <label className="acm-full">Website<input type="url" placeholder="https://" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
              <label>Agent<select value={form.agent} onChange={(event) => update("agent", event.target.value)}><option value="">Unassigned</option>{agents.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
              <label>Credit Term<select value={form.displayTerm} onChange={(event)=>update("displayTerm",event.target.value)}>{creditTerms.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
              <label>Currency<select value={form.currency} onChange={(event)=>update("currency",event.target.value)}><option>MYR</option><option>USD</option><option>SGD</option></select></label>
            </div>
          </section>
        </div>
        {duplicates.length>0&&<section className="acm-duplicate-warning" role="alert"><div className="acm-duplicate-title"><Warning size={21} weight="fill"/><span><b>Possible duplicate customer</b><small>Same name or mobile number already exists.</small></span></div><div className="acm-duplicate-list">{duplicates.slice(0,3).map((customer)=><div key={customer.id}><span><b>{customer.company||customer.name}</b><small>{customer.id} · {customer.mobile||customer.phone||"No mobile"}</small></span><em>{customer.duplicateReasons.join(" + ")}</em></div>)}</div><label className="acm-duplicate-confirm"><input type="checkbox" checked={duplicateConfirmed} onChange={(event)=>{setDuplicateConfirmed(event.target.checked);setError("");}}/><span>I checked the existing record and confirm this is a different customer.</span></label></section>}
        {error && <div className="acm-error" role="alert">{error}</div>}
      </div>
      <footer className="acm-footer">
        <label className="acm-check"><input type="checkbox" checked={form.createAnother} onChange={(event) => update("createAnother", event.target.checked)} /><span>Create another customer after saving</span></label>
        <div className="acm-actions"><button type="button" className="acm-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="acm-primary" disabled={syncing}><ArrowsClockwise className={syncing ? "acm-spin" : ""} size={18} />{syncing ? "Saving..." : duplicates.length ? "Confirm & Save Customer" : form.syncEnabled ? "Save & Sync AutoCount" : "Save Customer"}</button></div>
      </footer>
    </form>
  </div>;
}
