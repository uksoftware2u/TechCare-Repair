import { useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, ChartBar, CheckCircle, CloudArrowUp, Database, Funnel, Gauge, GearSix, LinkSimple, MagnifyingGlass, PlugsConnected, WarningCircle } from "@phosphor-icons/react";
import { ConfigurableListing } from "./components/ConfigurableListing.jsx";
import { ListingModule } from "./components/ListingModule.jsx";
import { databaseApi } from "./database-api.js";
import "./accounting-sync.css";

const initialRecords = [
  {id:"SYNC-000128",type:"Customer",source:"CUST-000128",description:"Lim Wei Jie",target:"Debtor",autoCountRef:"380-L001",lastSync:"12/08/2026 10:12",status:"Synced",message:"Created successfully"},
  {id:"SYNC-000127",type:"Invoice",source:"INV-20260812-008",description:"Repair SR-20260812-002",target:"Sales Invoice",autoCountRef:"IV-000088",lastSync:"12/08/2026 10:10",status:"Synced",message:"Posted successfully"},
  {id:"SYNC-000126",type:"Payment",source:"PAY-20260812-005",description:"RM 180.00 · Lim Wei Jie",target:"Official Receipt",autoCountRef:"OR-000051",lastSync:"12/08/2026 10:10",status:"Synced",message:"Payment applied"},
  {id:"SYNC-000125",type:"Customer",source:"CUST-000126",description:"Ahmad Faizal",target:"Debtor",autoCountRef:"—",lastSync:"—",status:"Pending",message:"Waiting for manual sync"},
  {id:"SYNC-000124",type:"Stock Item",source:"PART-KB-ASUS-01",description:"ASUS VivoBook Keyboard",target:"Stock Item",autoCountRef:"—",lastSync:"12/08/2026 09:55",status:"Failed",message:"Stock item code already exists"},
  {id:"SYNC-000123",type:"Invoice",source:"INV-20260812-009",description:"Repair SR-20260812-005",target:"Sales Invoice",autoCountRef:"—",lastSync:"—",status:"Pending",message:"Queued after repair confirmation"},
];
const columns = [
  {id:"id",label:"Sync ID",width:135,visible:true},{id:"type",label:"Record Type",width:120,visible:true},{id:"source",label:"Source Reference",width:165,visible:true},{id:"description",label:"Description",width:220,visible:true},{id:"target",label:"AutoCount Target",width:150,visible:true},{id:"autoCountRef",label:"AutoCount Reference",width:165,visible:true},{id:"lastSync",label:"Last Sync",width:165,visible:true},{id:"status",label:"Status",width:115,visible:true},{id:"message",label:"Result / Message",width:220,visible:true},
];
const defaultSettings = {
  connection:"AutoCount Accounting On-Premises",
  onPremiseType:"Local Network",
  serverAddress:"localhost",
  autoCountPort:"19500",
  sqlServer:"localhost\\A2006",
  sqlAuthentication:"SQL Server Authentication",
  sqlUsername:"",
  sqlPassword:"",
  onPremiseApiUrl:"http://127.0.0.1:8090/api/autocount",
  accountBook:"TechCare PC Sdn. Bhd.",
  databaseName:"AED_TECHCARE",
  username:"api_user",
  password:"",
  baseUrl:"https://accounting-api.autocountcloud.com",
  apiKey:"",
  webApiBaseUrl:"https://api.autocount.cloud",
  webApiKey:"",
  webApiConnectorId:"",
  webApiCompanyId:"",
  autoSync:true,
  interval:"5",
  retry:"3"
};

function syncCell(record,column) {
  if (column.id === "id" || column.id === "source" || column.id === "autoCountRef") return <b>{record[column.id]}</b>;
  if (column.id === "status") {
    const tone = record.status === "Synced" ? "ok" : record.status === "Failed" ? "warning" : record.status === "Syncing" ? "info" : "";
    return <i className={`lm-badge ${tone}`}>{record.status}</i>;
  }
  return record[column.id];
}

export function AccountingSync({onDashboard}) {
  const [tab,setTab] = useState("Sync Listing");
  const [records,setRecords] = useState(initialRecords);
  const [query,setQuery] = useState("");
  const [status,setStatus] = useState("All Statuses");
  const [type,setType] = useState("All Types");
  const [selected,setSelected] = useState(null);
  const [settings,setSettings] = useState(defaultSettings);
  const [notice,setNotice] = useState("");
  const [testing,setTesting] = useState(false);
  const [connectionStatus,setConnectionStatus] = useState("idle");
  const [savingSettings,setSavingSettings] = useState(false);
  const [connectionMessage,setConnectionMessage] = useState("Test the connection before saving.");
  const [findingBooks,setFindingBooks] = useState(false);
  const [foundBooks,setFoundBooks] = useState([]);
  const [bookFindError,setBookFindError] = useState("");
  const [showBookFinder,setShowBookFinder] = useState(false);
  const [showBookAttach,setShowBookAttach] = useState(false);
  const [attachBook,setAttachBook] = useState({name:"",database:""});
  const [usagePeriod,setUsagePeriod] = useState("This Month");
  useEffect(()=>{Promise.all([databaseApi.accountingSync(),databaseApi.setting("autocount-api-settings")]).then(([syncRecords,apiSettings])=>{setRecords(syncRecords);setSettings({...defaultSettings,...apiSettings});}).catch((error)=>setNotice(`SQL Server load failed: ${error.message}`));},[]);
  const shown = useMemo(() => records.filter((record) => Object.values(record).join(" ").toLowerCase().includes(query.toLowerCase()) && (status === "All Statuses" || record.status === status) && (type === "All Types" || record.type === type)),[records,query,status,type]);
  const count = (value) => records.filter((record) => record.status === value).length;
  const usage = useMemo(() => {
    const provider=settings.connection==="AutoCount Web API"?"AutoCount Web API":settings.connection==="AutoCount Cloud Accounting"?"Cloud Accounting":"On-Premises";
    const now=new Date(),start=new Date(now);start.setHours(0,0,0,0);if(usagePeriod==="This Month")start.setDate(1);else if(usagePeriod==="Last 30 Days")start.setDate(start.getDate()-29);
    const periodRecords=records.filter((record)=>record.eventAt&&new Date(record.eventAt)>=start),completed=periodRecords.filter((record)=>record.status!=="Pending"&&record.status!=="Syncing"),successful=completed.filter((record)=>record.status==="Synced").length,failed=completed.filter((record)=>record.status==="Failed").length;
    const endpoints=[{name:"Customers / Debtors",type:"Customer"},{name:"Sales Invoices",type:"Invoice"},{name:"Payments / Receipts",type:"Payment"},{name:"Stock Items",type:"Stock Item"}].map((item)=>{const matching=completed.filter((record)=>record.type===item.type);return{...item,total:matching.length,successful:matching.filter((record)=>record.status==="Synced").length,failed:matching.filter((record)=>record.status==="Failed").length};});
    return{provider,total:completed.length,successful,failed,pending:periodRecords.length-completed.length,successRate:completed.length?Math.round(successful/completed.length*100):0,endpoints};
  },[records,settings.connection,usagePeriod]);
  const updateSetting = (key,value) => {
    setSettings((current) => ({...current,[key]:value}));
    if (["connection","onPremiseType","serverAddress","autoCountPort","sqlServer","sqlAuthentication","sqlUsername","sqlPassword","onPremiseApiUrl","accountBook","databaseName","username","password","baseUrl","apiKey","webApiBaseUrl","webApiKey","webApiConnectorId","webApiCompanyId"].includes(key)) {
      setConnectionStatus("idle");
      setConnectionMessage("Test the connection before saving.");
    }
  };

  async function manualSync(ids) {
    const targets = Array.isArray(ids) ? ids : [ids];
    const selectedRecords=records.filter((record)=>targets.includes(record.id));
    setRecords((current) => current.map((record) => targets.includes(record.id) ? {...record,status:"Syncing",message:"Sending to AutoCount..."} : record));
    if (selected && targets.includes(selected.id)) setSelected((current) => ({...current,status:"Syncing",message:"Sending to AutoCount..."}));
    const customerRecords=selectedRecords.filter((record)=>record.type==="Customer"&&record.target==="Debtor"),stockRecords=selectedRecords.filter((record)=>record.type==="Stock Item"&&record.target==="Stock Item"),unsupported=selectedRecords.filter((record)=>!customerRecords.includes(record)&&!stockRecords.includes(record));
    try {
      await Promise.all(unsupported.map((record)=>databaseApi.updateAccountingSync({...record,status:"Failed",message:`${record.target} external sync is not configured yet`})));
      const [customerResult,stockResult]=await Promise.all([customerRecords.length?databaseApi.syncCustomers(customerRecords.map((record)=>record.source)):Promise.resolve({count:0,failed:[],pending:[]}),stockRecords.length?databaseApi.syncStockItems(stockRecords.map((record)=>record.source)):Promise.resolve({count:0,failed:[],pending:[]})]),result={count:customerResult.count+stockResult.count,failed:[...(customerResult.failed||[]),...(stockResult.failed||[])],pending:[...(customerResult.pending||[]),...(stockResult.pending||[])]};
      const refreshed=await databaseApi.accountingSync();setRecords(refreshed);setSelected((current)=>current?refreshed.find((record)=>record.id===current.id)||current:current);
      const failed=(result.failed?.length||0)+unsupported.length,pending=result.pending?.length||0;setNotice(failed||pending?`${result.count} synced${pending?` · ${pending} awaiting confirmation`:""}${failed?` · ${failed} failed`:""}. Check Result / Message for details.`:`${result.count} record${result.count===1?"":"s"} synced to AutoCount`);
    } catch(error) {
      const refreshed=await databaseApi.accountingSync().catch(()=>null);if(refreshed){setRecords(refreshed);setSelected((current)=>current?refreshed.find((record)=>record.id===current.id)||current:current);}setNotice(`Sync failed: ${error.message}`);
    }
  }
  function syncOutstanding() {
    const ids = records.filter((record) => record.status === "Pending" || record.status === "Failed").map((record) => record.id);
    if (!ids.length) { setNotice("All records are already synced"); return; }
    manualSync(ids);
  }
  async function saveApiSettings() {
    const port=Number(settings.autoCountPort);if(settings.connection==="AutoCount Accounting On-Premises"&&(!Number.isInteger(port)||port<1||port>65535)){setNotice("Enter a valid AutoCount Port from 1 to 65535");return;}
    setSavingSettings(true);
    try { await databaseApi.saveSetting("autocount-api-settings",settings);const confirmed=await databaseApi.setting("autocount-api-settings");setSettings({...defaultSettings,...confirmed});if(connectionStatus!=="connected")setConnectionMessage("Settings saved. Test the connection when ready.");setNotice("AutoCount API Settings saved to SQL Server"); }
    catch(error) { setNotice(`SQL Server save failed: ${error.message}`); }
    finally{setSavingSettings(false);}
  }
  async function testConnection() {
    const isOnPremise = settings.connection === "AutoCount Accounting On-Premises";
    const isWebApi = settings.connection === "AutoCount Web API";
    const port = Number(settings.autoCountPort);
    const missingOnPremise = !settings.serverAddress.trim() || !settings.sqlServer.trim() || !settings.accountBook.trim() || !settings.username.trim() || !settings.password;
    const invalidPort = !Number.isInteger(port) || port < 1 || port > 65535;
    const missingCloud = !settings.baseUrl.trim() || !settings.apiKey.trim();
    const missingWebApi = !settings.webApiBaseUrl.trim() || !settings.webApiKey.trim() || !settings.webApiConnectorId.trim() || !settings.webApiCompanyId.trim();
    if ((isOnPremise && (missingOnPremise || invalidPort)) || (isWebApi ? missingWebApi : !isOnPremise && missingCloud)) {
      setConnectionStatus("error");
      setConnectionMessage(isOnPremise && invalidPort ? "Enter a valid port from 1 to 65535." : "Complete all required connection fields.");
      return;
    }
    setTesting(true);
    setConnectionStatus("testing");
    setConnectionMessage(isOnPremise ? `Checking ${settings.onPremiseApiUrl}...` : isWebApi ? `Checking ${settings.webApiBaseUrl}...` : "Checking AutoCount Cloud API...");
    try { const result=await databaseApi.testAutoCountConnection(settings);setConnectionStatus("connected");setConnectionMessage(result.message);setNotice("Connection successful"); }
    catch(error){setConnectionStatus("error");setConnectionMessage(error.message);setNotice(`Connection failed: ${error.message}`);}
    finally{setTesting(false);}
  }
  async function findAccountBooks() {
    if (!settings.sqlServer.trim()) {
      setConnectionStatus("error");
      setConnectionMessage("Enter the SQL Server before finding Account Books.");
      return;
    }
    setShowBookAttach(false);
    setShowBookFinder(true);
    setFindingBooks(true);
    setFoundBooks([]);
    setBookFindError("");
    try {
      const result=await databaseApi.findAutoCountAccountBooks(settings);
      setFoundBooks(result.books||[]);
      if(!(result.books||[]).length)setConnectionMessage("SQL Server connected, but no user Account Book databases are visible to this login.");
    } catch(findError) {
      setBookFindError(findError.message);
      setConnectionStatus("error");
      setConnectionMessage(findError.message);
    } finally { setFindingBooks(false); }
  }
  function selectAccountBook(book) {
    setSettings((current) => ({...current,accountBook:book.name,databaseName:book.database}));
    setConnectionStatus("idle");
    setConnectionMessage("Account Book selected. Test the connection before saving.");
    setShowBookFinder(false);
  }
  function attachAccountBookSetting() {
    if (!attachBook.name.trim() || !attachBook.database.trim()) {
      setNotice("Enter the Account Book Name and Database Name");
      return;
    }
    selectAccountBook({name:attachBook.name.trim(),database:attachBook.database.trim()});
    setAttachBook({name:"",database:""});
    setShowBookAttach(false);
    setNotice("Account Book attached to this connection");
  }

  const toolbar = <><div className="lm-search"><MagnifyingGlass size={20}/><input aria-label="Search sync listing" placeholder="Search Sync ID, source reference, description, or AutoCount reference" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="as-filter"><Funnel size={17}/><select aria-label="Filter sync type" value={type} onChange={(event) => setType(event.target.value)}><option>All Types</option><option>Customer</option><option>Invoice</option><option>Payment</option><option>Stock Item</option></select></div><div className="as-filter"><select aria-label="Filter sync status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All Statuses</option><option>Synced</option><option>Pending</option><option>Failed</option><option>Syncing</option></select></div></>;
  const actions = <div className="as-header-actions"><button className="as-secondary" onClick={() => setTab("API Settings")}><GearSix size={18}/> API Settings</button><button className="lm-primary" onClick={syncOutstanding}><CloudArrowUp size={18}/> Manual Sync</button></div>;

  return <ListingModule active="Accounting Sync" title="Accounting Sync" description="Monitor and manually sync records between TechCare and AutoCount." onNavigate={(item) => item === "Dashboard" && onDashboard()} primaryAction={actions} summary={[{label:"All Records",value:records.length},{label:"Synced",value:count("Synced")},{label:"Pending",value:count("Pending")},{label:"Failed",value:count("Failed")}]}> 
    <div className="as-tabs"><button className={tab === "Sync Listing" ? "active" : ""} onClick={() => setTab("Sync Listing")}><ArrowsClockwise size={18}/> Sync Listing</button><button className={tab === "API Usage" ? "active" : ""} onClick={() => setTab("API Usage")}><ChartBar size={18}/> API Usage</button><button className={tab === "API Settings" ? "active" : ""} onClick={() => setTab("API Settings")}><GearSix size={18}/> API Settings</button></div>
    {tab === "Sync Listing" && <ConfigurableListing columns={columns} rows={shown} rowKey={(record) => record.id} renderCell={syncCell} onRowClick={setSelected} storageKey="techcare-accounting-sync-layout-v1" toolbar={toolbar} emptyMessage="No AutoCount sync records match your filters." recordLabel="sync records" totalCount={records.length}/ >}
    {tab === "API Usage" && <section className="as-usage">
      <div className="as-usage-head"><div><h2>AutoCount API Usage</h2><p>Locally tracked synchronization operations for AutoCount Web API and Cloud Accounting.</p></div><label>Period<select value={usagePeriod} onChange={(event)=>setUsagePeriod(event.target.value)}><option>Today</option><option>This Month</option><option>Last 30 Days</option></select></label></div>
      <div className="as-provider-strip"><span className={usage.provider==="AutoCount Web API"?"active":""}><CloudArrowUp size={18}/><b>Web API</b><strong>{usage.provider==="AutoCount Web API"?usage.total:0}</strong><small>tracked operations</small></span><span className={usage.provider==="Cloud Accounting"?"active":""}><Gauge size={18}/><b>Cloud Accounting</b><strong>{usage.provider==="Cloud Accounting"?usage.total:0}</strong><small>tracked operations</small></span><span className={usage.provider==="On-Premises"?"active":""}><Database size={18}/><b>On-Premises</b><strong>{usage.provider==="On-Premises"?usage.total:0}</strong><small>local operations</small></span></div>
      <div className="as-usage-cards"><article><small>Total Operations</small><strong>{usage.total}</strong><span>{usagePeriod}</span></article><article className="ok"><small>Successful</small><strong>{usage.successful}</strong><span>{usage.successRate}% success rate</span></article><article className="failed"><small>Failed</small><strong>{usage.failed}</strong><span>Review failed sync records</span></article><article><small>Pending</small><strong>{usage.pending}</strong><span>Waiting to be processed</span></article></div>
      <div className="as-usage-grid">
        <section><div className="as-usage-section-head"><div><h3>Usage by Data Type</h3><p>Each synchronized business record counts as one tracked operation.</p></div><b>{usage.total} total</b></div><div className="as-endpoint-list">{usage.endpoints.map((endpoint)=>{const width=usage.total?Math.max(4,Math.round(endpoint.total/usage.total*100)):0;return <div className="as-endpoint-row" key={endpoint.type}><span><b>{endpoint.name}</b><small>{endpoint.successful} successful{endpoint.failed?` · ${endpoint.failed} failed`:""}</small></span><div><i style={{width:`${width}%`}}/></div><strong>{endpoint.total}</strong></div>})}</div></section>
        <aside><h3>Provider Usage Limit</h3><div className="as-limit-state"><Gauge size={28}/><b>Provider quota unavailable</b><p>AutoCount has not supplied a usage-limit response for this connection. The counter shows operations recorded by this system, not billing quota.</p></div><dl><div><dt>Active Connection</dt><dd>{usage.provider}</dd></div><div><dt>Account Book</dt><dd>{settings.accountBook||settings.webApiCompanyId||"Not selected"}</dd></div><div><dt>Tracking Source</dt><dd>Accounting Sync records</dd></div></dl></aside>
      </div>
      <div className="as-usage-note"><WarningCircle size={18}/><span><b>Usage counting</b><small>A Web API command may perform status polling internally. This screen counts the business sync operation once, so it remains useful without inflating usage.</small></span></div>
    </section>}
    {tab === "API Settings" && <section className="as-settings">
      <div className="as-settings-head">
        <div><h2>AutoCount API Settings</h2><p>Configure the connection used for automatic and manual synchronization.</p></div>
        <span className={`as-connection-pill ${connectionStatus}`}>
          {connectionStatus === "connected" ? <CheckCircle size={17} weight="fill"/> : connectionStatus === "error" ? <WarningCircle size={17} weight="fill"/> : <PlugsConnected size={17}/>} {connectionStatus === "connected" ? "Connected" : connectionStatus === "testing" ? "Testing" : connectionStatus === "error" ? "Check settings" : "Not tested"}
        </span>
      </div>
      <div className="as-form-grid as-connection-grid">
        <label className="wide">Connection Type<select value={settings.connection} onChange={(event) => { updateSetting("connection",event.target.value); setConnectionStatus("idle"); setConnectionMessage("Test the connection before saving."); }}><option>AutoCount Accounting On-Premises</option><option>AutoCount Web API</option><option>AutoCount Cloud Accounting</option></select></label>
        {settings.connection === "AutoCount Accounting On-Premises" ? <>
          <label>On-Premises Connection Type<select value={settings.onPremiseType} onChange={(event) => updateSetting("onPremiseType",event.target.value)}><option>Local Network</option><option>Custom Host</option></select><small>Use Local Network when AutoCount is in this office.</small></label>
          <label>Server Address<input placeholder="localhost or 192.168.1.10" value={settings.serverAddress} onChange={(event) => updateSetting("serverAddress",event.target.value)}/><small>Computer name, internal IP or private DNS.</small></label>
          <label>AutoCount Port<input type="number" min="1" max="65535" value={settings.autoCountPort} onChange={(event) => updateSetting("autoCountPort",event.target.value)}/><small>Default AutoCount Server port is 19500.</small></label>
          <label>SQL Server<input placeholder="SERVER\\A2006 or IP,PORT" value={settings.sqlServer} onChange={(event) => updateSetting("sqlServer",event.target.value)}/><small>Use the SQL instance name or fixed SQL port.</small></label>
          <label>SQL Authentication<select value={settings.sqlAuthentication||"SQL Server Authentication"} onChange={(event)=>updateSetting("sqlAuthentication",event.target.value)}><option>SQL Server Authentication</option><option>Windows Authentication</option></select><small>Used only to discover Account Book databases.</small></label>
          {settings.sqlAuthentication!=="Windows Authentication"&&<><label>SQL Username<input autoComplete="username" value={settings.sqlUsername||""} onChange={(event)=>updateSetting("sqlUsername",event.target.value)}/></label><label>SQL Password<input type="password" autoComplete="current-password" value={settings.sqlPassword||""} onChange={(event)=>updateSetting("sqlPassword",event.target.value)}/></label></>}
          <label className="wide">On-Premise API URL<input placeholder="http://127.0.0.1:8090/api/autocount" value={settings.onPremiseApiUrl||""} onChange={(event)=>updateSetting("onPremiseApiUrl",event.target.value)}/><small>REST Bridge or AutoCount API plug-in URL. AutoCount Server port 19500 cannot receive Debtor data.</small></label>
          <div className="wide as-account-book-field">
            <label>Company / Account Book<input value={settings.accountBook} onChange={(event) => updateSetting("accountBook",event.target.value)}/></label>
            <small>Database: <b>{settings.databaseName || "Not selected"}</b></small>
            <div className="as-account-book-actions"><button type="button" onClick={findAccountBooks} disabled={findingBooks}><MagnifyingGlass size={16}/>{findingBooks ? "Finding..." : "Find Account Book"}</button><button type="button" onClick={() => { setShowBookAttach((current) => !current); setShowBookFinder(false); }}><LinkSimple size={16}/>Attach Account Book</button></div>
            {showBookFinder && <div className="as-book-panel"><div className="as-book-panel-head"><b>Available Account Books</b><button type="button" onClick={() => setShowBookFinder(false)}>Close</button></div>{findingBooks ? <p>Searching {settings.sqlServer}...</p> : bookFindError ? <p className="as-book-error">{bookFindError}</p> : foundBooks.length ? foundBooks.map((book) => <button type="button" className="as-book-result" key={`${book.server}-${book.database}`} onClick={() => selectAccountBook(book)}><span><b>{book.name}</b><small>{book.database} · {book.server}</small></span><strong>Select</strong></button>) : <p>No Account Books are visible to this SQL login.</p>}</div>}
            {showBookAttach && <div className="as-book-panel as-attach-panel"><b>Attach an Account Book</b><div><label>Account Book Name<input placeholder="Company name" value={attachBook.name} onChange={(event) => setAttachBook((current) => ({...current,name:event.target.value}))}/></label><label>Database Name<input placeholder="Example: AED_COMPANY" value={attachBook.database} onChange={(event) => setAttachBook((current) => ({...current,database:event.target.value}))}/></label></div><div className="as-attach-actions"><button type="button" onClick={() => setShowBookAttach(false)}>Cancel</button><button type="button" className="lm-primary" onClick={attachAccountBookSetting}><LinkSimple size={16}/>Attach</button></div></div>}
          </div>
          <label>AutoCount Username<input autoComplete="username" value={settings.username} onChange={(event) => updateSetting("username",event.target.value)}/></label>
          <label>AutoCount Password<input type="password" autoComplete="current-password" placeholder="Enter password" value={settings.password} onChange={(event) => updateSetting("password",event.target.value)}/></label>
        </> : settings.connection === "AutoCount Web API" ? <>
          <label className="wide">Web API Base URL<input value={settings.webApiBaseUrl} onChange={(event)=>updateSetting("webApiBaseUrl",event.target.value)} placeholder="https://api.autocount.cloud"/><small>Cloud command API. Do not enter localhost or a LAN address.</small></label>
          <label className="wide">Tenant API Key<input type="password" autoComplete="off" value={settings.webApiKey} onChange={(event)=>updateSetting("webApiKey",event.target.value)} placeholder="Tenant API key from AutoCount dashboard"/><small>Used as the Bearer key. Connector Key stays inside the Windows Local Connector and is not stored here.</small></label>
          <label>Connector ID<input value={settings.webApiConnectorId} onChange={(event)=>updateSetting("webApiConnectorId",event.target.value)} placeholder="customer-main"/></label>
          <label>Company ID<input value={settings.webApiCompanyId} onChange={(event)=>updateSetting("webApiCompanyId",event.target.value)} placeholder="Company ID from dashboard"/></label>
        </> : <>
          <label className="wide">Base URL<input value={settings.baseUrl} onChange={(event) => updateSetting("baseUrl",event.target.value)}/></label>
          <label className="wide">API Key / Access Token<input type="password" value={settings.apiKey} onChange={(event) => updateSetting("apiKey",event.target.value)}/></label>
          <label className="wide">Company / Account Book<input value={settings.accountBook} onChange={(event) => updateSetting("accountBook",event.target.value)}/></label>
        </>}
      </div>
      <div className={`as-connection-result ${connectionStatus}`}>
        <span>{connectionStatus === "connected" ? <CheckCircle size={19} weight="fill"/> : connectionStatus === "error" ? <WarningCircle size={19} weight="fill"/> : <PlugsConnected size={19}/>}</span>
        <div><b>{connectionStatus === "connected" ? "Connection successful" : connectionStatus === "testing" ? "Testing connection" : connectionStatus === "error" ? "Connection not ready" : "Ready to test"}</b><small>{connectionMessage}</small></div>
      </div>
      <div className="as-form-grid as-sync-grid"><label>Automatic Sync Interval (Minutes)<input type="number" min="1" value={settings.interval} onChange={(event) => updateSetting("interval",event.target.value)}/></label><label>Retry Attempts<input type="number" min="0" value={settings.retry} onChange={(event) => updateSetting("retry",event.target.value)}/></label></div>
      <label className="as-switch"><span><b>Enable Automatic Sync</b><small>Queue customers, invoices, payments and stock items after confirmation.</small></span><input type="checkbox" checked={settings.autoSync} onChange={(event) => updateSetting("autoSync",event.target.checked)}/></label>
      <div className="as-settings-actions"><button onClick={testConnection} disabled={testing||savingSettings}><PlugsConnected size={18}/>{testing ? "Testing..." : "Test Connection"}</button><button className="lm-primary" disabled={savingSettings} onClick={saveApiSettings}>{savingSettings?"Saving...":"Save API Settings"}</button></div>
    </section>}
    {selected && <div className="lm-modal-bg" onClick={() => setSelected(null)}><section className="lm-modal as-modal" onClick={(event) => event.stopPropagation()}><div className="as-modal-head"><div><h2>{selected.source}</h2><p>{selected.type} · {selected.description}</p></div><i className={`lm-badge ${selected.status === "Synced" ? "ok" : selected.status === "Failed" ? "warning" : "info"}`}>{selected.status}</i></div><div className="lm-detail-grid"><div><small>Sync ID</small><b>{selected.id}</b></div><div><small>AutoCount Target</small><b>{selected.target}</b></div><div><small>AutoCount Reference</small><b>{selected.autoCountRef}</b></div><div><small>Last Sync</small><b>{selected.lastSync}</b></div></div><div className={`as-result ${selected.status === "Failed" ? "failed" : ""}`}>{selected.status === "Failed" ? <WarningCircle size={18}/> : <CheckCircle size={18}/>}<span><small>Result / Message</small><b>{selected.message}</b></span></div><div className="lm-modal-actions"><button onClick={() => setSelected(null)}>Close</button><button className="primary" disabled={selected.status === "Syncing"} onClick={() => manualSync(selected.id)}><ArrowsClockwise size={17}/>{selected.status === "Syncing" ? "Syncing..." : selected.status === "Synced" ? "Sync Again" : "Manual Sync"}</button></div></section></div>}
    {notice && <div className="as-toast" onClick={() => setNotice("")}>{notice}</div>}
  </ListingModule>;
}
