import { useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, Buildings, Funnel, LockSimple, MagnifyingGlass, MapPin, PencilSimple, Plus, UserCircle } from "@phosphor-icons/react";
import { AutoCountDebtorForm } from "./components/AutoCountDebtorForm.jsx";
import { ConfigurableListing } from "./components/ConfigurableListing.jsx";
import { ListingModule } from "./components/ListingModule.jsx";
import { databaseApi } from "./database-api.js";
import "./customer-edit.css";

export const initialCustomerRecords = [
  {id:"CUST-000128",debtor:"380-L001",name:"Lim Wei Jie",company:"Lim Wei Jie",mobile:"+60 16-778 8990",email:"wei.jie.lim@gmail.com",tin:"IG12345678010",type:"RETAIL",area:"KUALA LUMPUR",balance:"RM 180.00",synced:true,last:"12/08/2026 10:12"},
  {id:"CUST-000127",debtor:"380-S001",name:"Siti Nur Aisyah",company:"Siti Nur Aisyah",mobile:"+60 12-345 6789",email:"siti.aisyah@gmail.com",tin:"—",type:"RETAIL",area:"SELANGOR",balance:"RM 0.00",synced:true,last:"12/08/2026 09:40"},
  {id:"CUST-000126",debtor:"—",name:"Ahmad Faizal",company:"Ahmad Faizal",mobile:"+60 12-345 6789",email:"ahmad.faizal@gmail.com",tin:"—",type:"RETAIL",area:"KUALA LUMPUR",balance:"RM 250.00",synced:false,last:"Not synced"},
  {id:"CUST-000125",debtor:"380-F001",name:"Farah Nadia",company:"Farah Nadia",mobile:"+60 11-2088 7741",email:"farah.nadia@gmail.com",tin:"—",type:"RETAIL",area:"SELANGOR",balance:"RM 0.00",synced:true,last:"11/08/2026 16:22"},
];

const columns = [
  {id:"id",label:"Customer ID",width:140,visible:true},{id:"company",label:"Customer / Company",width:210,visible:true},
  {id:"mobile",label:"Mobile",width:145,visible:true},{id:"email",label:"Email",width:220,visible:true},
  {id:"debtor",label:"Debtor Account",width:145,visible:true},{id:"type",label:"Customer Type",width:120,visible:true},{id:"debtorType",label:"Debtor Type",width:150,visible:true},
  {id:"area",label:"Area",width:145,visible:true},{id:"balance",label:"Balance",width:120,visible:true},
  {id:"synced",label:"Sync Status",width:125,visible:true},{id:"syncMessage",label:"Error Message",width:320,visible:true},
];

function renderCell(customer,column) {
  if (column.id === "company") return <><b>{customer.company}</b><small>{customer.name}</small></>;
  if (column.id === "synced") return <i className={`lm-badge ${customer.syncEnabled===false ? "" : customer.synced ? "ok" : "warning"}`}>{customer.syncEnabled===false ? "Disabled" : customer.synced ? "Synced" : customer.syncStatus||"Pending"}</i>;
  if (column.id === "syncMessage") return customer.synced?<span>—</span>:<small className="customer-sync-list-error" title={customer.syncMessage||""}>{customer.syncEnabled===false?"AutoCount sync is disabled.":customer.syncMessage||"Waiting for first AutoCount sync."}</small>;
  if (["id","balance"].includes(column.id)) return <b>{customer[column.id]}</b>;
  return customer[column.id];
}

function editValue(value) { return value === "—" || value === "-" || value == null ? "" : value; }
function postcodeValue(value) { return String(value||"").replace(/\D/g,"").slice(0,6); }

export function Customers({onBack,onNewRepair,customers=initialCustomerRecords,setCustomers}) {
  const [query,setQuery] = useState("");
  const [syncFilter,setSyncFilter] = useState("All Statuses");
  const [selected,setSelected] = useState(null);
  const [editing,setEditing] = useState(false);
  const [editForm,setEditForm] = useState(null);
  const [editError,setEditError] = useState("");
  const [savingEdit,setSavingEdit] = useState(false);
  const [newCustomerOpen,setNewCustomerOpen] = useState(false);
  const [syncNotice,setSyncNotice] = useState("");
  const [syncingIds,setSyncingIds] = useState([]);
  const [areas,setAreas] = useState([]);
  const [customerOptions,setCustomerOptions] = useState([]);
  const agents=customerOptions.filter((item)=>item.type==="Agent"&&item.active!==false),debtorTypes=customerOptions.filter((item)=>item.type==="DebtorType"&&item.active!==false),creditTerms=customerOptions.filter((item)=>item.type==="CreditTerm"&&item.active!==false);
  useEffect(()=>{let active=true;(async()=>{try{const areaResult=await databaseApi.syncCustomerAreas();if(active&&areaResult.areas?.length)setAreas(areaResult.areas);}catch{try{const savedAreas=await databaseApi.customerAreas();if(active)setAreas(savedAreas);}catch{}}try{const optionResult=await databaseApi.syncCustomerOptions();if(active&&optionResult.options?.length)setCustomerOptions(optionResult.options);}catch{try{const savedOptions=await databaseApi.customerOptions();if(active)setCustomerOptions(savedOptions);}catch{}}})();return()=>{active=false;};},[]);
  const shown = useMemo(() => customers.filter((customer) => Object.values(customer).join(" ").toLowerCase().includes(query.toLowerCase()) && (syncFilter === "All Statuses" || (syncFilter === "Synced" ? customer.synced : !customer.synced))), [customers,query,syncFilter]);

  async function saveNewCustomer(form) {
    const customer = {id:`CUST-${String(129+customers.length).padStart(6,"0")}`,debtor:form.debtor,name:form.attention||form.company,company:form.company,mobile:form.mobile||"—",email:form.email||"—",tin:"—",type:"RETAIL",area:form.area||"—",balance:"RM 0.00",syncEnabled:form.syncEnabled!==false,synced:false,syncStatus:form.syncEnabled===false?"Disabled":"Pending",syncMessage:form.syncEnabled===false?"AutoCount sync is disabled for this local record.":"Waiting for first AutoCount sync.",last:"Not synced"};
    Object.assign(customer,form,{name:form.attention||form.company,mobile:form.mobile||"—",email:form.email||"—"});
    try { await databaseApi.createCustomer(customer); } catch (error) { setSyncNotice(`SQL Server save failed: ${error.message}`); throw error; }
    setCustomers?.((current) => [customer,...current]);
    setNewCustomerOpen(false);
    setSyncNotice(`${customer.company} saved · pending AutoCount sync`);
  }
  function startEdit() {
    setEditForm({...selected});
    setEditError("");
    setEditing(true);
  }
  function updateEdit(key,value) { setEditForm((current) => ({...current,[key]:value})); }
  function cancelEdit() { setEditing(false); setEditForm(null); setEditError(""); }
  async function saveEdit(event) {
    event.preventDefault();
    if (!editForm.company.trim()) return setEditError("Company Name is required.");
    if (editForm.debtor !== "—" && !/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(editForm.debtor.trim().toUpperCase())) return setEditError("Enter a valid Debtor Account code.");
    const updated = {...editForm,debtor:editForm.debtor.trim().toUpperCase(),synced:false,last:"Not synced"};
    let localSaved=false;setSavingEdit(true);setEditError("");
    try {
      await databaseApi.updateCustomer(updated);localSaved=true;
      let finalCustomer=updated,message=`${updated.company} saved locally · AutoCount sync required`;
      if(updated.syncEnabled!==false&&updated.autoCountOrigin&&updated.debtor&&updated.debtor!=="—"){
        const result=await databaseApi.syncCustomers([updated.id]),failure=result.failed?.[0],confirmed=result.customers?.find((item)=>item.id===updated.id);
        if(failure)throw new Error(failure.error||"AutoCount rejected the update.");
        if(confirmed){finalCustomer={...updated,...confirmed};message=`${updated.company} updated in AutoCount`;}
        else if(result.pending?.length)message=`${updated.company} saved · AutoCount update awaiting confirmation`;
      }
      setCustomers?.((current)=>current.map((item)=>item.id===finalCustomer.id?finalCustomer:item));setSelected(finalCustomer);cancelEdit();setSyncNotice(message);
    } catch (error) { const failedUpdated=localSaved?{...updated,syncStatus:"Failed",syncMessage:error.message}:updated;setEditError(localSaved?`Saved locally, but AutoCount update failed: ${error.message}`:`SQL Server update failed: ${error.message}`);setCustomers?.((current)=>current.map((item)=>item.id===updated.id?failedUpdated:item));setSelected(failedUpdated); }
    finally{setSavingEdit(false);}
  }
  function closeDetail() { setSelected(null); cancelEdit(); }
  function openNewCustomer(){setNewCustomerOpen(true);databaseApi.customerAreas().then(setAreas).catch(()=>{});databaseApi.customerOptions().then(setCustomerOptions).catch(()=>{});}
  function showAllCustomers() { setQuery(""); setSyncFilter("All Statuses"); }
  async function syncData(ids) {
    const targets=[...new Set(ids)].filter(Boolean);if(!targets.length){setSyncNotice("All customer records are already synced");return;}
    setSyncingIds(targets);setSyncNotice("");
    try{const result=await databaseApi.syncCustomers(targets),updates=new Map(result.customers.map((item)=>[item.id,item])),failedCount=result.failed?.length||0,pendingCount=result.pending?.length||0,failedDetail=result.failed?.[0]?.error||"";setCustomers?.((current)=>current.map((item)=>updates.has(item.id)?{...item,...updates.get(item.id)}:item));setSelected((current)=>current&&updates.has(current.id)?{...current,...updates.get(current.id)}:current);setSyncNotice(failedCount||pendingCount?`${result.count} synced${pendingCount?` · ${pendingCount} awaiting confirmation`:""}${failedCount?` · ${failedCount} failed${failedDetail?`: ${failedDetail}`:""}`:""}${result.skipped?.length?` · ${result.skipped.length} skipped (Debtor Account required)`:""}`:`${result.count} customer record${result.count===1?"":"s"} synced to AutoCount${result.skipped?.length?` · ${result.skipped.length} skipped (Debtor Account required)`:""}`);}catch(error){setSyncNotice(`Sync failed: ${error.message}`);}finally{setSyncingIds([]);}
  }
  async function twoWaySync() {
    const outbound=customers.filter((item)=>item.syncEnabled!==false&&!item.synced&&item.debtor&&item.debtor!=="—").map((item)=>item.id);setSyncingIds(["__two_way__"]);setSyncNotice("");
    try{const pushed=outbound.length?await databaseApi.syncCustomers(outbound):{count:0,failed:[],pending:[],skipped:[]},pulled=await databaseApi.syncCustomersFromAutoCount(false),refreshed=pulled.customers||[];setCustomers?.(refreshed);setAreas(pulled.areas||[]);setCustomerOptions(pulled.options||[]);setSelected((current)=>current?refreshed.find((item)=>item.id===current.id)||current:current);const failed=pushed.failed?.length||0,pending=pushed.pending?.length||0;setSyncNotice(`Two-way sync complete · ${pushed.count} sent${pending?` · ${pending} awaiting confirmation`:""}${failed?` · ${failed} failed`:""} · ${pulled.imported} imported · ${pulled.updated} updated · ${pulled.unchanged} unchanged · ${pulled.areaCount||0} areas · ${pulled.optionCount||0} maintenance options · ${pulled.detailed||0} full details${pulled.detailFailures?` · ${pulled.detailFailures} detail skipped`:""}${pulled.conflicts?` · ${pulled.conflicts} conflict${pulled.conflicts===1?"":"s"}`:""}`);}catch(error){setSyncNotice(`Two-way sync failed: ${error.message}`);}finally{setSyncingIds([]);}
  }
  function navigate(item) { if (item === "Dashboard") onBack(); }
  const toolbar = <><div className="lm-search"><MagnifyingGlass size={20}/><input aria-label="Search customer listing" placeholder="Search customer, company, mobile, email, Debtor Account, or TIN" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="lm-filter"><Funnel size={18}/><select aria-label="Filter customer sync status" value={syncFilter} onChange={(event) => setSyncFilter(event.target.value)}><option>All Statuses</option><option>Synced</option><option>Pending</option></select></div></>;

  return <ListingModule active="Customers" title="Customers" description="Customer master records linked to AutoCount Debtor Accounts." onNavigate={navigate} primaryAction={<div className="customer-primary-actions"><button className="customer-sync-button" disabled={Boolean(syncingIds.length)} onClick={twoWaySync}><ArrowsClockwise size={17}/>{syncingIds.length?"Syncing...":"Two-Way Sync"}</button><button className="lm-primary" onClick={openNewCustomer}><Plus size={17}/> New Customer</button></div>} summary={[{label:"All Customers",value:customers.length,onClick:showAllCustomers,active:syncFilter==="All Statuses"&&!query},{label:"Synced",value:customers.filter((item) => item.synced).length,onClick:()=>{setQuery("");setSyncFilter("Synced");},active:syncFilter==="Synced"&&!query},{label:"Pending Sync",value:customers.filter((item) => item.syncEnabled!==false&&!item.synced).length,onClick:()=>{setQuery("");setSyncFilter("Pending");},active:syncFilter==="Pending"&&!query},{label:"Outstanding",value:"RM 430"}]}>
    <ConfigurableListing columns={columns} rows={shown} rowKey={(row) => row.id} renderCell={renderCell} onRowClick={(customer) => {setSelected(customer);setEditing(false);}} storageKey="techcare-customer-list-layout-v1" toolbar={toolbar} emptyMessage="No customer records match your search." recordLabel="customer records" totalCount={customers.length}/>
    {selected && <div className="lm-modal-bg" onClick={closeDetail}>
      {!editing ? <section className="lm-modal customer-detail-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{selected.company}</h2><p>{selected.id} · AutoCount Debtor: {selected.debtor}</p>
        <div className="lm-detail-grid"><div><small>Company Name 2</small><b>{selected.company2||"—"}</b></div><div><small>Contact Name</small><b>{selected.name}</b></div><div><small>Control Account</small><b>{selected.controlAccount||"—"}</b></div><div><small>Debtor Type</small><b>{selected.debtorType||"—"}</b></div><div><small>Mobile</small><b>{selected.mobile}</b></div><div><small>Phone</small><b>{selected.phone||"—"}</b></div><div><small>Email</small><b>{selected.email}</b></div><div><small>TIN</small><b>{selected.tin}</b></div><div><small>Tax Entity ID</small><b>{selected.taxEntityId||"—"}</b></div><div><small>Area</small><b>{selected.area}</b></div><div><small>Billing Address</small><b>{selected.billingAddress||"—"}</b></div><div><small>Delivery Address</small><b>{selected.deliveryAddress||"—"}</b></div><div><small>Currency</small><b>{selected.currency||"MYR"}</b></div><div><small>Active / Group / Cash Sale</small><b>{selected.active?"Active":"Inactive"} · {selected.groupCompany?"Group":"Normal"} · {selected.cashSaleDebtor?"Cash Sale":"Credit"}</b></div><div><small>Outstanding Balance</small><b>{selected.balance}</b></div><div><small>AutoCount Status</small><b>{selected.synced ? "Synced" : selected.syncStatus||"Pending"}</b></div>{!selected.synced&&<div className="customer-sync-error"><small>Sync Error / Message</small><b>{selected.syncMessage||"Waiting for first AutoCount sync."}</b></div>}</div>
        <div className="lm-modal-actions"><button onClick={closeDetail}>Close</button><button onClick={onNewRepair}>New Repair</button><button disabled={selected.syncEnabled===false||syncingIds.includes(selected.id)} onClick={()=>syncData([selected.id])}><ArrowsClockwise size={16}/>{selected.syncEnabled===false?"Sync Disabled":syncingIds.includes(selected.id)?"Syncing...":selected.synced?"Sync Again":"Sync Data"}</button><button className="primary" onClick={startEdit}><PencilSimple size={16}/> Edit Customer</button></div>
      </section> : <form className="lm-modal customer-edit-modal" onSubmit={saveEdit} onClick={(event) => event.stopPropagation()}>
        <div className="customer-edit-head"><div><h2>Edit Customer</h2><p>{editForm.id} · Update customer master information.</p></div><span className={editForm.autoCountOrigin?"linked":"local"}>{editForm.autoCountOrigin?"AutoCount linked":"Local record"}</span></div>
        {editForm.autoCountOrigin&&<div className="customer-lock-note"><LockSimple size={16}/><span><b>Account codes are controlled by AutoCount</b><small>Debtor Account and Control Account cannot be changed here. All supported changes will update AutoCount when saved.</small></span></div>}
        <div className="customer-edit-sections">
          <section><header><Buildings size={17}/><div><h3>Account Setup</h3><p>AutoCount account classification and status.</p></div></header><div className="customer-edit-grid account-grid">
            <label>Debtor Account<span className="customer-input-lock"><input value={editValue(editForm.debtor)} disabled={Boolean(editForm.autoCountOrigin)} onChange={(event)=>updateEdit("debtor",event.target.value.toUpperCase())} placeholder="380-A001"/>{editForm.autoCountOrigin&&<LockSimple size={14}/>}</span></label>
            <label>Control Account<span className="customer-input-lock"><input value={editValue(editForm.controlAccount)} disabled={Boolean(editForm.autoCountOrigin)} onChange={(event)=>updateEdit("controlAccount",event.target.value)}/>{editForm.autoCountOrigin&&<LockSimple size={14}/>}</span></label>
            <label>Customer Type<select value={editForm.type} onChange={(event)=>updateEdit("type",event.target.value)}><option>RETAIL</option><option>COMPANY</option><option>DEALER</option></select></label>
            <label>Debtor Type<select value={editValue(editForm.debtorType)} onChange={(event)=>updateEdit("debtorType",event.target.value)}><option value="">Select debtor type</option>{editValue(editForm.debtorType)&&!debtorTypes.some((item)=>item.code===editValue(editForm.debtorType))&&<option value={editValue(editForm.debtorType)}>{editValue(editForm.debtorType)}</option>}{debtorTypes.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
            <div className="customer-edit-flags"><label><input type="checkbox" checked={Boolean(editForm.active)} onChange={(event)=>updateEdit("active",event.target.checked)}/> Active</label><label><input type="checkbox" checked={Boolean(editForm.groupCompany)} onChange={(event)=>updateEdit("groupCompany",event.target.checked)}/> Group Company</label><label><input type="checkbox" checked={Boolean(editForm.cashSaleDebtor)} onChange={(event)=>updateEdit("cashSaleDebtor",event.target.checked)}/> Cash Sale Debtor</label><label><input aria-label="Sync to AutoCount" type="checkbox" checked={editForm.syncEnabled!==false} onChange={(event)=>updateEdit("syncEnabled",event.target.checked)}/> Sync to AutoCount</label></div>
          </div></section>
          <section><header><UserCircle size={17}/><div><h3>Company Information</h3><p>Registered identity, tax and commercial details.</p></div></header><div className="customer-edit-grid">
            <label className="wide-two">Company Name *<input autoFocus value={editForm.company} onChange={(event)=>updateEdit("company",event.target.value)}/></label>
            <label>Company Name 2<input value={editValue(editForm.company2)} onChange={(event)=>updateEdit("company2",event.target.value)}/></label>
            <label>Contact Name<input value={editValue(editForm.name)} onChange={(event)=>updateEdit("name",event.target.value)}/></label>
            <label>Business Registration No.<input value={editValue(editForm.reg)} onChange={(event)=>updateEdit("reg",event.target.value)}/></label>
            <label>TIN / Tax Registration No.<input value={editValue(editForm.tin)} onChange={(event)=>updateEdit("tin",event.target.value||"—")}/></label>
            <label>Tax Entity ID<input type="number" min="0" value={editValue(editForm.taxEntityId)} onChange={(event)=>updateEdit("taxEntityId",event.target.value)}/></label>
            <label>Business Nature<input value={editValue(editForm.businessNature)} onChange={(event)=>updateEdit("businessNature",event.target.value)}/></label>
            <label>Currency<input value={editValue(editForm.currency)} onChange={(event)=>updateEdit("currency",event.target.value.toUpperCase())}/></label>
            <label>Credit Term<select value={editValue(editForm.displayTerm)} onChange={(event)=>updateEdit("displayTerm",event.target.value)}>{editValue(editForm.displayTerm)&&!creditTerms.some((item)=>item.code===editValue(editForm.displayTerm))&&<option value={editValue(editForm.displayTerm)}>{editValue(editForm.displayTerm)}</option>}{creditTerms.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
          </div></section>
          <section><header><MapPin size={17}/><div><h3>Billing &amp; Delivery</h3><p>Separate AutoCount address lines for accurate documents.</p></div></header><div className="customer-address-grid">
            <div className="customer-address-block"><b>Billing Address</b>{[1,2,3,4].map((line)=><label key={`billing-${line}`}>Address {line}<input value={editValue(editForm[`billingAddress${line}`])} onChange={(event)=>updateEdit(`billingAddress${line}`,event.target.value)}/></label>)}<label>Post / Zip Code<input inputMode="numeric" pattern="[0-9]{0,6}" maxLength={6} placeholder="Max 6 digits" value={postcodeValue(editForm.billingPostcode)} onChange={(event)=>updateEdit("billingPostcode",postcodeValue(event.target.value))}/></label></div>
            <div className="customer-address-block"><b>Delivery Address</b>{[1,2,3,4].map((line)=><label key={`delivery-${line}`}>Address {line}<input value={editValue(editForm[`deliveryAddress${line}`])} onChange={(event)=>updateEdit(`deliveryAddress${line}`,event.target.value)}/></label>)}<label>Post / Zip Code<input inputMode="numeric" pattern="[0-9]{0,6}" maxLength={6} placeholder="Max 6 digits" value={postcodeValue(editForm.deliveryPostcode)} onChange={(event)=>updateEdit("deliveryPostcode",postcodeValue(event.target.value))}/></label></div>
          </div></section>
          <section><header><UserCircle size={17}/><div><h3>Contact &amp; Assignment</h3><p>Communication details and responsible AutoCount agent.</p></div></header><div className="customer-edit-grid">
            <label>Mobile<input value={editValue(editForm.mobile)} onChange={(event)=>updateEdit("mobile",event.target.value||"—")}/></label>
            <label>Phone 1<input value={editValue(editForm.phone)} onChange={(event)=>updateEdit("phone",event.target.value)}/></label>
            <label>Phone 2<input value={editValue(editForm.phone2)} onChange={(event)=>updateEdit("phone2",event.target.value)}/></label>
            <label>Fax 1<input value={editValue(editForm.fax)} onChange={(event)=>updateEdit("fax",event.target.value)}/></label>
            <label>Fax 2<input value={editValue(editForm.fax2)} onChange={(event)=>updateEdit("fax2",event.target.value)}/></label>
            <label>Attention<input value={editValue(editForm.attention)} onChange={(event)=>updateEdit("attention",event.target.value)}/></label>
            <label>Email<input type="email" value={editValue(editForm.email)} onChange={(event)=>updateEdit("email",event.target.value||"—")}/></label>
            <label>Statement Email<input type="email" value={editValue(editForm.statementEmail)} onChange={(event)=>updateEdit("statementEmail",event.target.value)}/></label>
            <label>Website<input value={editValue(editForm.website)} onChange={(event)=>updateEdit("website",event.target.value)}/></label>
            <label>Area<select value={editValue(editForm.area)} onChange={(event)=>updateEdit("area",event.target.value||"—")}><option value="">Select area</option>{editValue(editForm.area)&&!areas.some((item)=>item.code===editValue(editForm.area))&&<option value={editValue(editForm.area)}>{editValue(editForm.area)}</option>}{areas.map((item)=><option key={item.code} value={item.code}>{item.description&&item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
            <label>Agent<select value={editValue(editForm.agent)} onChange={(event)=>updateEdit("agent",event.target.value)}><option value="">Unassigned</option>{editValue(editForm.agent)&&!agents.some((item)=>item.code===editValue(editForm.agent))&&<option value={editValue(editForm.agent)}>{editValue(editForm.agent)}</option>}{agents.map((item)=><option key={item.code} value={item.code}>{item.description!==item.code?`${item.code} — ${item.description}`:item.code}</option>)}</select></label>
          </div></section>
        </div>
        {editError && <div className="customer-edit-error" role="alert">{editError}</div>}
        <div className="lm-modal-actions customer-edit-actions"><button type="button" disabled={savingEdit} onClick={cancelEdit}>Cancel</button><button className="primary" type="submit" disabled={savingEdit}>{savingEdit?"Updating...":editForm.syncEnabled!==false&&editForm.autoCountOrigin?"Update AutoCount":"Save Changes"}</button></div>
      </form>}
    </div>}
    {newCustomerOpen && <AutoCountDebtorForm existingCustomers={customers} areas={areas} agents={agents} debtorTypes={debtorTypes} creditTerms={creditTerms} onCancel={() => setNewCustomerOpen(false)} onSave={saveNewCustomer}/>} 
    {syncNotice && <div className="cl-toast" onClick={() => setSyncNotice("")}>{syncNotice}</div>}
  </ListingModule>;
}
