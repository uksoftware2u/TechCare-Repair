import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsClockwise, BuildingOffice, Camera, ClockCounterClockwise, Database, DownloadSimple, EnvelopeSimple, FloppyDisk, Funnel, LinkSimple, MagnifyingGlass, Plus, ShieldCheck, SlidersHorizontal, Trash, Users } from "@phosphor-icons/react";
import { ConfigurableListing } from "./components/ConfigurableListing.jsx";
import { ListingModule } from "./components/ListingModule.jsx";
import { databaseApi } from "./database-api.js";
import { useAccess } from "./access-control.jsx";
import "./general-maintenance.css";
import "./user-maintenance.css";
import "./company-profile-logo.css";
import "./company-profile-loading.css";
import "./receipt-footer-options.css";
import "./access-audit.css";
import "./audit-trail-details.css";
import "./user-access-rights.css";
import "./email-configuration.css";
import "./backup-restore.css";

const initialUsers = [
  {id:"USR-001",name:"Nur Aisyah",username:"aisyah",email:"aisyah@techcare.my",role:"Counter Staff",branch:"Kuala Lumpur",lastLogin:"12/08/2026 10:01",status:"Active",photo:""},
  {id:"USR-002",name:"Rizal Hakim",username:"rizal",email:"rizal@techcare.my",role:"Technician",branch:"Kuala Lumpur",lastLogin:"12/08/2026 09:42",status:"Active",photo:""},
  {id:"USR-003",name:"Aiman Zulkifli",username:"aiman",email:"aiman@techcare.my",role:"Technician",branch:"Subang Jaya",lastLogin:"11/08/2026 17:28",status:"Active",photo:""},
  {id:"USR-004",name:"Farah Nadia",username:"farah",email:"farah@techcare.my",role:"Supervisor",branch:"Kuala Lumpur",lastLogin:"12/08/2026 08:55",status:"Active",photo:""},
  {id:"USR-005",name:"Admin Support",username:"support",email:"support@techcare.my",role:"Administrator",branch:"All Branches",lastLogin:"01/08/2026 14:20",status:"Inactive",photo:""},
];
const userColumns = [
  {id:"photo",label:"Photo",width:75,visible:true},{id:"id",label:"User ID",width:105,visible:true},{id:"name",label:"Full Name",width:170,visible:true},{id:"username",label:"Username",width:125,visible:true},{id:"email",label:"Email",width:205,visible:true},{id:"role",label:"Role",width:140,visible:true},{id:"commissionType",label:"Commission",width:135,visible:true},{id:"commissionValue",label:"Rate / Amount",width:125,visible:true},{id:"branch",label:"Branch",width:150,visible:true},{id:"lastLogin",label:"Last Login",width:165,visible:true},{id:"status",label:"Status",width:105,visible:true},
];
const companyStorageKey = "techcare-company-profile-v1";
const optionsStorageKey = "techcare-maintenance-options-v1";
const defaultCompany = {name:"",registration:"",tin:"",sst:"",phone:"",email:"",website:"",address:"",currency:"MYR",timezone:"Asia/Kuala_Lumpur",logo:""};
const defaultOptions = {repairPrefix:"SR",nextNumber:"20260812-005",defaultFee:"50.00",warrantyDays:"14",collectionOverdueDays:"7",taxRate:"8",receiptCopies:"2",autoDebtor:true,autoInvoice:true,requirePhotos:true,notifyReady:true,allowDiscount:false,termsConditions:"Device received subject to inspection. Please present this receipt when collecting the device."};
const defaultEmailConfiguration = {method:"Default Email App (mailto)",senderName:"",replyTo:"",defaultCc:"",subjectPrefix:"[Service Centre]",signature:"Thank you.\nService Team"};
const blankUser = {id:"",name:"",username:"",email:"",role:"Counter Staff",branch:"Kuala Lumpur",lastLogin:"Never",status:"Active",photo:"",password:"",confirmPassword:"",commissionType:"None",commissionValue:0};
const accessStorageKey = "techcare-access-rights-v1";
const accessRoles = ["Administrator","Manager","Supervisor","Counter Staff","Technician"];
const accessModules = ["Dashboard","Repairs","Ready for Collection","Customers","Warranty","Onsite Service","Service Contracts","Suppliers","Stock Items","Accounting Sync","Reports","General Maintenance"];
const accessActions = ["View","Create","Edit","Delete","Approve","Print","Sync"];
function buildDefaultRights() {
  return Object.fromEntries(accessRoles.map((role) => [role,Object.fromEntries(accessModules.map((module) => [module,Object.fromEntries(accessActions.map((action) => {
    const allowed = role === "Administrator" || (["Manager","Supervisor"].includes(role) && action !== "Delete") || (role === "Counter Staff" && ["Dashboard","Repairs","Ready for Collection","Customers","Onsite Service","Service Contracts","Stock Items"].includes(module) && ["View","Create","Edit","Print"].includes(action)) || (role === "Technician" && ["Dashboard","Repairs","Ready for Collection","Warranty","Onsite Service","Stock Items"].includes(module) && ["View","Edit","Print"].includes(action) && (module !== "Ready for Collection" || action === "View"));
    return [action,allowed];
  }))]))]));
}
function cloneAccessMatrix(matrix) {
  return Object.fromEntries(accessModules.map((module) => [module,Object.fromEntries(accessActions.map((action) => [action,Boolean(matrix?.[module]?.[action])]))]));
}
function mergeAccessMatrix(base,override) {
  return Object.fromEntries(accessModules.map((module)=>[module,Object.fromEntries(accessActions.map((action)=>[action,override?.[module]?.[action] ?? Boolean(base?.[module]?.[action])]))]));
}
function mergeRoleRights(saved) {
  const defaults=buildDefaultRights();
  const merged=Object.fromEntries(accessRoles.map((role)=>[role,mergeAccessMatrix(defaults[role],saved?.[role])]));
  merged.Administrator["General Maintenance"]=Object.fromEntries(accessActions.map((action)=>[action,true]));
  return merged;
}
const initialAudit = [
  {id:"AUD-000128",time:"12/08/2026 10:18:42",user:"Nur Aisyah",module:"Accounting Sync",action:"Manual Sync",reference:"SYNC-000124",result:"Success",details:"Stock Item synced to AutoCount as AC-ASUS01",ip:"192.168.1.21"},
  {id:"AUD-000127",time:"12/08/2026 10:15:08",user:"Nur Aisyah",module:"Repairs",action:"Create",reference:"SR-20260812-005",result:"Success",details:"Created repair intake and queued AutoCount invoice",ip:"192.168.1.21"},
  {id:"AUD-000126",time:"12/08/2026 10:12:31",user:"Admin Support",module:"General Maintenance",action:"Update",reference:"Company Profile",result:"Success",details:"Updated company contact information",ip:"192.168.1.10"},
  {id:"AUD-000125",time:"12/08/2026 09:55:16",user:"Rizal Hakim",module:"Repairs",action:"Update",reference:"SR-20260812-002",result:"Success",details:"Repair status changed to Repairing",ip:"192.168.1.33"},
  {id:"AUD-000124",time:"12/08/2026 09:48:03",user:"Nur Aisyah",module:"Customers",action:"Create",reference:"CUST-000128",result:"Success",details:"Customer created and synced to AutoCount",ip:"192.168.1.21"},
  {id:"AUD-000123",time:"12/08/2026 09:40:27",user:"Admin Support",module:"User Maintenance",action:"Login Failed",reference:"support",result:"Failed",details:"Invalid password entered",ip:"192.168.1.44"},
];
const auditColumns = [{id:"time",label:"Date & Time",width:175,visible:true},{id:"user",label:"User",width:150,visible:true},{id:"module",label:"Module",width:165,visible:true},{id:"action",label:"Action",width:190,visible:true},{id:"reference",label:"Reference",width:165,visible:true},{id:"severity",label:"Severity",width:110,visible:true},{id:"result",label:"Result",width:105,visible:true},{id:"durationMs",label:"Duration",width:105,visible:true},{id:"ip",label:"IP Address",width:130,visible:true}];

function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "U"; }
function UserAvatar({user,large=false}) { return user.photo ? <img className={`um-avatar ${large?"large":""}`} src={user.photo} alt={`${user.name} profile`} /> : <span className={`um-avatar um-initials ${large?"large":""}`}>{initials(user.name)}</span>; }
function userCell(user,column) {
  if (column.id === "photo") return <UserAvatar user={user}/>;
  if (column.id === "commissionValue") return user.commissionType === "Item Rate" ? `${Number(user.commissionValue||0)}%` : user.commissionType === "Item Amount" ? `RM ${Number(user.commissionValue||0).toFixed(2)}` : "—";
  if (column.id === "id" || column.id === "name") return <b>{user[column.id]}</b>;
  if (column.id === "status") return <i className={`lm-badge ${user.status === "Active" ? "ok" : "warning"}`}>{user.status}</i>;
  return user[column.id];
}
function auditCell(record,column) {
  if (["time","reference"].includes(column.id)) return <b>{record[column.id]}</b>;
  if (column.id === "result") return <i className={`lm-badge ${record.result === "Success" ? "ok" : "warning"}`}>{record.result}</i>;
  if (column.id === "severity") return <i className={`aa-severity ${String(record.severity||"Information").toLowerCase()}`}>{record.severity||"Information"}</i>;
  if (column.id === "durationMs") return record.durationMs ? `${record.durationMs} ms` : "—";
  return record[column.id];
}
function prettyAuditJson(value){if(!value)return "No data recorded.";try{return JSON.stringify(JSON.parse(value),null,2);}catch{return value;}}

export function GeneralMaintenance({onDashboard,onOptionsChange,onEmailConfigurationChange,onAccessRightsChange}) {
  const {user:currentUser}=useAccess();
  const [tab,setTab] = useState("Company Profile");
  const [notice,setNotice] = useState("");
  const [users,setUsers] = useState(initialUsers);
  const [query,setQuery] = useState("");
  const [role,setRole] = useState("All Roles");
  const [editingUser,setEditingUser] = useState(null);
  const [userDraft,setUserDraft] = useState(blankUser);
  const [userError,setUserError] = useState("");
  const photoInput = useRef(null);
  const logoInput = useRef(null);
  const [company,setCompany] = useState(defaultCompany);
  const [companyLoading,setCompanyLoading] = useState(true);
  const [companyLoadError,setCompanyLoadError] = useState(false);
  const [options,setOptions] = useState(defaultOptions);
  const [emailConfiguration,setEmailConfiguration] = useState(defaultEmailConfiguration);
  const [accessRole,setAccessRole] = useState("Administrator");
  const [accessRights,setAccessRights] = useState(buildDefaultRights);
  const [accessScope,setAccessScope] = useState("Role");
  const [accessUser,setAccessUser] = useState(initialUsers[0].id);
  const [userAccessRights,setUserAccessRights] = useState({});
  const [auditRecords,setAuditRecords] = useState(initialAudit);
  const [auditQuery,setAuditQuery] = useState("");
  const [auditModule,setAuditModule] = useState("All Modules");
  const [auditResult,setAuditResult] = useState("All Results");
  const [auditSeverity,setAuditSeverity] = useState("All Severities");
  const [auditUser,setAuditUser] = useState("All Users");
  const [auditFrom,setAuditFrom] = useState("");
  const [auditTo,setAuditTo] = useState("");
  const [selectedAudit,setSelectedAudit] = useState(null);
  const [backupBusy,setBackupBusy] = useState("");
  const [restoreFile,setRestoreFile] = useState(null);
  const [restoreConfirmation,setRestoreConfirmation] = useState("");
  const [restoreOpen,setRestoreOpen] = useState(false);
  useEffect(() => {
    databaseApi.companyProfile().then((value)=>{setCompany(value);setCompanyLoadError(false);}).catch((error)=>{setCompanyLoadError(true);setNotice(`Company Profile load failed: ${error.message}`);}).finally(()=>setCompanyLoading(false));
    Promise.all([databaseApi.users(),databaseApi.setting("maintenance-options"),databaseApi.accessRights(),databaseApi.setting("user-access-rights").catch(()=>({})),databaseApi.auditTrail(),databaseApi.setting("email-configuration").catch(()=>defaultEmailConfiguration)]).then(([userValues,optionValues,rightValues,userRightValues,auditValues,emailValues])=>{setUsers(userValues);setAccessUser((current) => userValues.some((user) => user.id === current) ? current : userValues[0]?.id || "");setOptions({...defaultOptions,...optionValues});setAccessRights(mergeRoleRights(rightValues));setUserAccessRights(userRightValues);setAuditRecords(auditValues);setEmailConfiguration({...defaultEmailConfiguration,...emailValues});}).catch((error)=>setNotice(`Maintenance data load failed: ${error.message}`));
  },[]);
  const shownUsers = useMemo(() => users.filter((user) => Object.values(user).join(" ").toLowerCase().includes(query.toLowerCase()) && (role === "All Roles" || user.role === role)),[users,query,role]);
  const shownAudit = useMemo(() => auditRecords.filter((record) => {const day=record.timeIso?.slice(0,10)||"";return Object.values(record).join(" ").toLowerCase().includes(auditQuery.toLowerCase()) && (auditModule === "All Modules" || record.module === auditModule) && (auditResult === "All Results" || record.result === auditResult) && (auditSeverity === "All Severities" || (record.severity||"Information") === auditSeverity) && (auditUser === "All Users" || record.user === auditUser) && (!auditFrom||!day||day>=auditFrom) && (!auditTo||!day||day<=auditTo);}),[auditRecords,auditQuery,auditModule,auditResult,auditSeverity,auditUser,auditFrom,auditTo]);
  const selectedAccessUser = users.find((user) => user.id === accessUser);
  const inheritedUserMatrix = accessRights[selectedAccessUser?.role] || accessRights["Counter Staff"];
  const userHasOverride = Boolean(userAccessRights[accessUser]);
  const activeAccessMatrix = accessScope === "Role" ? accessRights[accessRole] : userHasOverride ? mergeAccessMatrix(inheritedUserMatrix,userAccessRights[accessUser]) : inheritedUserMatrix;

  const updateCompany = (key,value) => setCompany((current) => current ? ({...current,[key]:value}) : current);
  const updateOption = (key,value) => setOptions((current) => ({...current,[key]:value}));
  const updateEmailConfiguration = (key,value) => setEmailConfiguration((current) => ({...current,[key]:value}));
  const updateUser = (key,value) => setUserDraft((current) => ({...current,[key]:value}));
  function addAudit(module,action,reference,details,result="Success") {
    const now=new Date(),record={id:`AUD-${String(129 + auditRecords.length).padStart(6,"0")}`,time:now.toLocaleString("en-GB"),timeIso:now.toISOString(),userId:currentUser.id,user:currentUser.name,module,action,reference,result,severity:result==="Failed"?"Warning":"Information",details,method:"MANUAL",path:"",changedFields:"",requestData:"",responseData:"",userAgent:navigator.userAgent,sessionId:"",durationMs:0,ip:"127.0.0.1"};
    setAuditRecords((current) => [record,...current]); databaseApi.addAudit(record).catch(()=>{});
  }
  async function saveSettings() {
    const isCompany = tab === "Company Profile";
    if (isCompany && (companyLoading || companyLoadError)) { setNotice(companyLoadError ? "Company Profile could not be loaded from SQL Server" : "Company Profile is still loading"); return; }
    if(tab==="Configuration"&&emailConfiguration.replyTo&&!/^\S+@\S+\.\S+$/.test(emailConfiguration.replyTo)){setNotice("Enter a valid Reply-to Email address");return;}
    try { if(isCompany) await databaseApi.saveCompanyProfile(company); else if(tab==="Configuration") await databaseApi.saveSetting("email-configuration",emailConfiguration); else await databaseApi.saveSetting("maintenance-options",options); } catch(error) { setNotice(`SQL Server save failed: ${error.message}`); return; }
    if (tab === "Options") onOptionsChange?.(options);
    if (tab === "Configuration") onEmailConfigurationChange?.(emailConfiguration);
    setNotice(`${tab} saved successfully`);
    addAudit("General Maintenance","Update",tab,`${tab} settings updated`);
  }
  function uploadCompanyLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setNotice("Please select an image file"); return; }
    if (file.size > 1024 * 1024) { setNotice("Company logo must be smaller than 1 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { updateCompany("logo",reader.result); setNotice("Logo ready — click Save Changes"); };
    reader.readAsDataURL(file);
  }
  function openNewUser() { setEditingUser("new"); setUserDraft({...blankUser,id:`USR-${String(users.length+1).padStart(3,"0")}`}); setUserError(""); }
  function openUser(user) { setEditingUser(user.id); setUserDraft({...user}); setUserError(""); }
  function closeUser() { setEditingUser(null); setUserError(""); }
  function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUserError("Please select an image file."); return; }
    if (file.size > 3 * 1024 * 1024) { setUserError("Photo must be smaller than 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { updateUser("photo",reader.result); setUserError(""); };
    reader.readAsDataURL(file);
  }
  async function saveUser(event) {
    event.preventDefault();
    if (!userDraft.name.trim() || !userDraft.username.trim() || !userDraft.email.trim()) { setUserError("Full Name, Username and Email are required."); return; }
    if (!/^\S+@\S+\.\S+$/.test(userDraft.email)) { setUserError("Enter a valid email address."); return; }
    if (editingUser === "new" && userDraft.password.length < 8) { setUserError("Password must contain at least 8 characters."); return; }
    if (userDraft.password && userDraft.password !== userDraft.confirmPassword) { setUserError("Password and Confirm Password do not match."); return; }
    if (userDraft.commissionType !== "None" && Number(userDraft.commissionValue) <= 0) { setUserError("Enter a Commission Rate or Amount greater than zero."); return; }
    const duplicate = users.some((user) => user.id !== userDraft.id && user.username.toLowerCase() === userDraft.username.toLowerCase());
    if (duplicate) { setUserError("Username is already in use."); return; }
    try { if(editingUser==="new") await databaseApi.createUser(userDraft); else await databaseApi.updateUser(userDraft); } catch(error) { setUserError(`SQL Server save failed: ${error.message}`); return; }
    const savedUser={...userDraft,password:"",confirmPassword:""};
    setUsers((current) => editingUser === "new" ? [savedUser,...current] : current.map((user) => user.id === savedUser.id ? savedUser : user));
    addAudit("User Maintenance",editingUser === "new" ? "Create" : "Update",userDraft.id,`${userDraft.name} · ${userDraft.role}`);
    setNotice(`${userDraft.name} saved successfully`); closeUser();
  }
  function toggleAccess(module,action) {
    if (accessScope === "Role") { if(accessRole==="Administrator"&&module==="General Maintenance"){setNotice("Administrator General Maintenance access is protected and cannot be disabled");return;} setAccessRights((current) => ({...current,[accessRole]:{...current[accessRole],[module]:{...current[accessRole]?.[module],[action]:!current[accessRole]?.[module]?.[action]}}})); return; }
    if (!accessUser) return;
    setUserAccessRights((current) => { const base=mergeAccessMatrix(inheritedUserMatrix,current[accessUser]); return {...current,[accessUser]:{...base,[module]:{...base[module],[action]:!base[module]?.[action]}}}; });
  }
  function setAllAccess(value) {
    const matrix=Object.fromEntries(accessModules.map((module) => [module,Object.fromEntries(accessActions.map((action) => [action,value]))]));
    if (accessScope === "Role") {if(accessRole==="Administrator")matrix["General Maintenance"]=Object.fromEntries(accessActions.map((action)=>[action,true]));setAccessRights((current) => ({...current,[accessRole]:matrix}));}
    else if (accessUser) setUserAccessRights((current) => ({...current,[accessUser]:matrix}));
  }
  function resetUserAccess() { if (!accessUser) return; setUserAccessRights((current) => { const next={...current}; delete next[accessUser]; return next; }); setNotice(`${selectedAccessUser?.name || accessUser} reset to ${selectedAccessUser?.role || "role"} permissions — save to confirm`); }
  async function saveAccessRights() {
    const target=accessScope === "Role" ? accessRole : selectedAccessUser?.name || accessUser;
    try { if(accessScope === "Role") await databaseApi.saveAccessRights(accessRights); else await databaseApi.saveSetting("user-access-rights",userAccessRights); } catch(error) { setNotice(`SQL Server save failed: ${error.message}`); return; }
    addAudit("Access Rights","Update",accessScope === "Role" ? accessRole : accessUser,`${accessScope} permissions updated for ${target}`);
    onAccessRightsChange?.({roleAccessRights:accessRights,userAccessRights});
    setNotice(`${accessScope} Access Rights saved for ${target}`);
  }
  function exportAudit() {
    const headers = ["Audit ID","Date & Time","User ID","User","Module","Action","Reference","Severity","Result","Method","Request Path","Changed Fields","Duration (ms)","IP Address","Session ID","User Agent","Details","Request Data","Response Data"];
    const rows = shownAudit.map((record) => [record.id,record.time,record.userId,record.user,record.module,record.action,record.reference,record.severity,record.result,record.method,record.path,record.changedFields,record.durationMs,record.ip,record.sessionId,record.userAgent,record.details,record.requestData,record.responseData]);
    const csv = [headers,...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); link.download = "techcare-audit-trail.csv"; link.click(); URL.revokeObjectURL(link.href); setNotice("Audit Trail exported to CSV");
  }
  async function refreshAudit(){try{const values=await databaseApi.auditTrail();setAuditRecords(values);setNotice(`Audit Trail refreshed · ${values.length} events`);}catch(error){setNotice(`Audit Trail refresh failed: ${error.message}`);}}
  async function downloadBackup(){setBackupBusy("Creating");try{const result=await databaseApi.downloadBackup();setNotice(`Backup downloaded: ${result.fileName} · ${(result.size/1048576).toFixed(2)} MB`);}catch(error){setNotice(`Backup download failed: ${error.message}`);}finally{setBackupBusy("");}}
  function chooseRestoreFile(event){const file=event.target.files?.[0]||null;if(file&&!file.name.toLowerCase().endsWith(".bak")){setNotice("Please select a SQL Server .bak backup file");event.target.value="";setRestoreFile(null);return;}setRestoreFile(file);}
  async function restoreSelectedFile(){if(!restoreFile)return;setBackupBusy("Restoring");try{const result=await databaseApi.restoreBackupFile(restoreFile,restoreConfirmation);setRestoreOpen(false);setNotice(`Database restored from ${result.fileName}. Reloading...`);setTimeout(()=>location.reload(),1800);}catch(error){setNotice(`Restore failed: ${error.message}`);}finally{setBackupBusy("");}}

  const userToolbar = <><div className="lm-search"><MagnifyingGlass size={20}/><input aria-label="Search user listing" placeholder="Search user, username, email, role, or branch" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="lm-filter"><Funnel size={18}/><select aria-label="Filter user role" value={role} onChange={(event) => setRole(event.target.value)}><option>All Roles</option>{accessRoles.map((item)=><option key={item}>{item}</option>)}</select></div></>;
  const auditToolbar = <><div className="lm-search"><MagnifyingGlass size={20}/><input aria-label="Search audit trail" placeholder="Search user, action, reference, field, path, session, or IP" value={auditQuery} onChange={(event) => setAuditQuery(event.target.value)}/></div><div className="aa-filter"><Funnel size={17}/><select aria-label="Filter audit module" value={auditModule} onChange={(event) => setAuditModule(event.target.value)}><option>All Modules</option>{[...new Set(auditRecords.map((record) => record.module))].map((module) => <option key={module}>{module}</option>)}</select></div><div className="aa-filter"><select aria-label="Filter audit user" value={auditUser} onChange={(event)=>setAuditUser(event.target.value)}><option>All Users</option>{[...new Set(auditRecords.map((record)=>record.user))].map((name)=><option key={name}>{name}</option>)}</select></div><div className="aa-filter"><select aria-label="Filter audit severity" value={auditSeverity} onChange={(event)=>setAuditSeverity(event.target.value)}><option>All Severities</option><option>Information</option><option>High</option><option>Warning</option><option>Critical</option></select></div><div className="aa-filter"><select aria-label="Filter audit result" value={auditResult} onChange={(event) => setAuditResult(event.target.value)}><option>All Results</option><option>Success</option><option>Failed</option></select></div><label className="aa-date-filter">From<input type="date" aria-label="Audit From Date" value={auditFrom} onChange={(event)=>setAuditFrom(event.target.value)}/></label><label className="aa-date-filter">To<input type="date" aria-label="Audit To Date" value={auditTo} onChange={(event)=>setAuditTo(event.target.value)}/></label></>;
  const testRecipient=emailConfiguration.replyTo||company?.email||"";
  const testSubject=`${emailConfiguration.subjectPrefix} Test Email Link`.trim();
  const testBody=`This test confirms that the Service Centre email link can open your selected email application.\n\n${emailConfiguration.signature}`;
  const testEmailLink=emailConfiguration.method==="Gmail Web Link"?`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(testRecipient)}${emailConfiguration.defaultCc?`&cc=${encodeURIComponent(emailConfiguration.defaultCc)}`:""}&su=${encodeURIComponent(testSubject)}&body=${encodeURIComponent(testBody)}`:`mailto:${encodeURIComponent(testRecipient)}?subject=${encodeURIComponent(testSubject)}${emailConfiguration.defaultCc?`&cc=${encodeURIComponent(emailConfiguration.defaultCc)}`:""}&body=${encodeURIComponent(testBody)}`;
  const action = tab === "User Maintenance" ? <button className="lm-primary" onClick={openNewUser}><Plus size={17}/> New User</button> : tab === "Access Rights" ? <button className="lm-primary" onClick={saveAccessRights}><ShieldCheck size={17}/> Save Access Rights</button> : tab === "Audit Trail" ? <div className="aa-header-actions"><button onClick={refreshAudit}><ArrowsClockwise size={17}/> Refresh</button><button className="lm-primary" onClick={exportAudit}><DownloadSimple size={17}/> Export CSV</button></div> : tab === "Backup & Restore" ? null : <button className="lm-primary" disabled={tab === "Company Profile" && (companyLoading || companyLoadError)} onClick={saveSettings}><FloppyDisk size={17}/> Save Changes</button>;

  return <ListingModule active="General Maintenance" title="General Maintenance" description="Manage company information, system users, and operational defaults." onNavigate={(item) => item === "Dashboard" && onDashboard()} primaryAction={action}>
    <div className="gm-tabs"><button className={tab === "Company Profile" ? "active" : ""} onClick={() => setTab("Company Profile")}><BuildingOffice size={18}/> Company Profile</button><button className={tab === "User Maintenance" ? "active" : ""} onClick={() => setTab("User Maintenance")}><Users size={18}/> User Maintenance</button><button className={tab === "Access Rights" ? "active" : ""} onClick={() => setTab("Access Rights")}><ShieldCheck size={18}/> Access Rights</button><button className={tab === "Audit Trail" ? "active" : ""} onClick={() => setTab("Audit Trail")}><ClockCounterClockwise size={18}/> Audit Trail</button><button className={tab === "Backup & Restore" ? "active" : ""} onClick={() => setTab("Backup & Restore")}><Database size={18}/> Backup & Restore</button><button className={tab === "Options" ? "active" : ""} onClick={() => setTab("Options")}><SlidersHorizontal size={18}/> Options</button><button className={tab === "Configuration" ? "active" : ""} onClick={() => setTab("Configuration")}><EnvelopeSimple size={18}/> Configuration</button></div>
    {tab === "Company Profile" && companyLoading && <div className="gm-profile-load-state">Loading Company Profile from SQL Server...</div>}
    {tab === "Company Profile" && companyLoadError && <div className="gm-profile-load-state error">Company Profile could not be loaded. Existing fields are disabled to prevent saving stale data.</div>}
    {tab === "Company Profile" && <section className="gm-card"><div className="gm-section-head"><h2>Company Profile</h2><p>Information used on receipts, quotations, invoices, and system integrations.</p></div><div className="gm-logo-card"><div className="gm-logo-preview">{company.logo ? <img src={company.logo} alt="Company logo"/> : <BuildingOffice size={34}/>}</div><div><b>Company Logo</b><p>Used on Repair Intake Receipts and printed documents.</p><input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadCompanyLogo}/><span><button type="button" onClick={() => logoInput.current?.click()}><Camera size={16}/>{company.logo ? "Change Logo" : "Upload Logo"}</button>{company.logo && <button type="button" className="remove" onClick={() => updateCompany("logo","")}><Trash size={16}/> Remove</button>}</span><small>JPG, PNG or WebP · Max 1 MB</small></div></div><div className="gm-form-grid"><label>Company Name<input value={company.name} onChange={(event) => updateCompany("name",event.target.value)}/></label><label>Business Registration No.<input value={company.registration} onChange={(event) => updateCompany("registration",event.target.value)}/></label><label>Tax Identification No. (TIN)<input value={company.tin} onChange={(event) => updateCompany("tin",event.target.value)}/></label><label>SST Registration No.<input value={company.sst} onChange={(event) => updateCompany("sst",event.target.value)}/></label><label>Phone<input value={company.phone} onChange={(event) => updateCompany("phone",event.target.value)}/></label><label>Email<input value={company.email} onChange={(event) => updateCompany("email",event.target.value)}/></label><label>Website<input value={company.website} onChange={(event) => updateCompany("website",event.target.value)}/></label><label>Base Currency<select value={company.currency} onChange={(event) => updateCompany("currency",event.target.value)}><option>MYR</option><option>SGD</option><option>USD</option></select></label><label className="wide">Business Address<textarea rows="4" value={company.address} onChange={(event) => updateCompany("address",event.target.value)}/></label><label>Timezone<select value={company.timezone} onChange={(event) => updateCompany("timezone",event.target.value)}><option>Asia/Kuala_Lumpur</option><option>Asia/Singapore</option></select></label></div></section>}
    {tab === "User Maintenance" && <ConfigurableListing columns={userColumns} rows={shownUsers} rowKey={(user) => user.id} renderCell={userCell} onRowClick={openUser} storageKey="techcare-user-list-layout-v2" toolbar={userToolbar} emptyMessage="No users match your search." recordLabel="user accounts" totalCount={users.length}/ >}
    {tab === "Options" && <section className="gm-options"><article><div className="gm-section-head"><h2>Repair Defaults</h2><p>Default numbering, fees, warranty periods, and receipt settings.</p></div><div className="gm-form-grid"><label>Repair Number Prefix<input value={options.repairPrefix} onChange={(event) => updateOption("repairPrefix",event.target.value)}/></label><label>Next Repair Number<input value={options.nextNumber} onChange={(event) => updateOption("nextNumber",event.target.value)}/></label><label>Default Diagnostic Fee (RM)<input type="number" value={options.defaultFee} onChange={(event) => updateOption("defaultFee",event.target.value)}/></label><label>Default Warranty Period (Days)<input type="number" value={options.warrantyDays} onChange={(event) => updateOption("warrantyDays",event.target.value)}/></label><label>Default SST Rate (%)<input type="number" value={options.taxRate} onChange={(event) => updateOption("taxRate",event.target.value)}/></label><label>Receipt Copies<input type="number" value={options.receiptCopies} onChange={(event) => updateOption("receiptCopies",event.target.value)}/></label></div></article><article><div className="gm-section-head"><h2>Workflow &amp; Integration</h2><p>Control validation, notifications, and AutoCount automation.</p></div><div className="gm-switches">{[["autoDebtor","Create AutoCount debtor automatically"],["autoInvoice","Create invoice after repair confirmation"],["requirePhotos","Require intake condition photos"],["notifyReady","Notify customer when repair is ready"],["allowDiscount","Allow counter staff to apply discounts"]].map(([key,label]) => <label key={key}><span><b>{label}</b><small>{key.startsWith("auto") ? "AutoCount integration setting" : "Repair workflow setting"}</small></span><input type="checkbox" checked={options[key]} onChange={(event) => updateOption(key,event.target.checked)}/></label>)}</div></article><article className="gm-receipt-footer-options"><div className="gm-section-head"><h2>Receipt Footer</h2><p>Content printed at the bottom of the customer Repair Intake Receipt.</p></div><label>Terms &amp; Conditions<textarea rows="6" aria-label="Receipt Terms and Conditions" placeholder="Enter receipt terms and conditions..." value={options.termsConditions || ""} onChange={(event) => updateOption("termsConditions",event.target.value)}/><small>Line breaks will be preserved on the printed receipt.</small></label></article></section>}

    {tab === "Access Rights" && <section className="aa-access"><div className="aa-access-head aa-access-head-users"><div><h2>Access Rights</h2><p>Configure permissions by role or for an individual user.</p></div><div className="aa-access-targets"><label>Access Level<select aria-label="Access Level" value={accessScope} onChange={(event) => setAccessScope(event.target.value)}><option>Role</option><option>User</option></select></label>{accessScope === "Role" ? <label>Access Role<select aria-label="Access Role" value={accessRole} onChange={(event) => setAccessRole(event.target.value)}>{accessRoles.map((item) => <option key={item}>{item}</option>)}</select></label> : <label>User Access<select aria-label="User Access" value={accessUser} onChange={(event) => setAccessUser(event.target.value)}>{users.map((user) => <option value={user.id} key={user.id}>{user.name} · {user.role}</option>)}</select></label>}</div><div className="aa-access-actions"><button onClick={() => setAllAccess(true)}>Select All</button><button onClick={() => setAllAccess(false)}>Clear All</button>{accessScope === "User" && userHasOverride && <button className="aa-reset-access" onClick={resetUserAccess}>Reset to Role</button>}</div></div>{accessScope === "User" && <div className={`aa-user-access-status ${userHasOverride ? "custom" : "inherited"}`}><Users size={17}/><span><b>{selectedAccessUser?.name}</b>{userHasOverride ? ` has custom permissions overriding ${selectedAccessUser?.role}.` : ` is inheriting permissions from ${selectedAccessUser?.role}.`}</span></div>}{accessScope==="Role"&&accessRole==="Administrator"&&<div className="aa-protected-access"><ShieldCheck size={17}/><span>Administrator access to General Maintenance is protected and cannot be disabled.</span></div>}<div className="aa-matrix"><div className="aa-matrix-head"><b>Module</b>{accessActions.map((action) => <b key={action}>{action}</b>)}</div>{accessModules.map((module) => <div className={`aa-matrix-row ${accessScope==="Role"&&accessRole==="Administrator"&&module==="General Maintenance"?"protected":""}`} key={module}><strong>{module}</strong>{accessActions.map((permission) => {const protectedAccess=accessScope==="Role"&&accessRole==="Administrator"&&module==="General Maintenance";return <label key={permission} title={protectedAccess?"Protected Administrator access":permission + " " + module}><input type="checkbox" disabled={protectedAccess} checked={protectedAccess||Boolean(activeAccessMatrix?.[module]?.[permission])} onChange={() => toggleAccess(module,permission)}/><span></span></label>;})}</div>)}</div><p className="aa-hint"><ShieldCheck size={16}/>{accessScope === "Role" ? `Changes apply to all active users assigned to ${accessRole} after saving.` : userHasOverride ? `Custom permissions apply only to ${selectedAccessUser?.name} after saving.` : `${selectedAccessUser?.name} currently follows ${selectedAccessUser?.role} permissions.`}</p></section>}
    {tab === "Audit Trail" && <><section className="aa-audit-summary"><article><span>Filtered / Total</span><b>{shownAudit.length} / {auditRecords.length}</b></article><article><span>Failed Events</span><b>{auditRecords.filter((record) => record.result === "Failed").length}</b></article><article><span>High / Critical</span><b>{auditRecords.filter((record) => ["High","Critical"].includes(record.severity)).length}</b></article><article><span>Active Users</span><b>{new Set(auditRecords.map((record) => record.user)).size}</b></article></section><ConfigurableListing columns={auditColumns} rows={shownAudit} rowKey={(record) => record.id} renderCell={auditCell} onRowClick={setSelectedAudit} storageKey="techcare-audit-trail-layout-v2" toolbar={auditToolbar} emptyMessage="No audit events match your filters." recordLabel="audit events" totalCount={auditRecords.length}/></>}
    {tab === "Backup & Restore" && <section className="br-simple"><div className="br-simple-section"><div className="br-simple-icon"><Database size={42}/></div><h2>Download Full Database Backup</h2><p>Creates one complete SQL Server backup containing repairs, customers, photos, warranty claims, contracts, settings and audit records.</p><button className="lm-primary br-download" onClick={downloadBackup} disabled={Boolean(backupBusy)}><DownloadSimple size={19}/>{backupBusy==="Creating"?"Preparing Backup...":"Backup Now"}</button><small>Your browser downloads a `.bak` file that can be stored on USB, an external hard disk or another safe location.</small></div><div className="br-divider"></div><div className="br-simple-section br-restore-file"><div className="br-simple-icon restore"><ArrowsClockwise size={42}/></div><h2>Restore from Backup File</h2><p>Select a TechCare SQL Server `.bak` file. Current data will be replaced only after Administrator confirmation.</p><label className="br-file-picker"><input type="file" accept=".bak,application/octet-stream" onChange={chooseRestoreFile}/><span>{restoreFile?restoreFile.name:"Choose .bak File"}</span></label>{restoreFile&&<small>{(restoreFile.size/1048576).toFixed(2)} MB selected</small>}<button className="br-restore-button" disabled={!restoreFile||Boolean(backupBusy)} onClick={()=>{setRestoreConfirmation("");setRestoreOpen(true);}}>Continue to Restore</button></div></section>}
    {restoreOpen&&<div className="lm-modal-bg" onClick={()=>!backupBusy&&setRestoreOpen(false)}><section className="lm-modal br-upload-restore-modal" onClick={(event)=>event.stopPropagation()}><ShieldCheck size={42}/><h2>Restore Selected Backup?</h2><p><b>{restoreFile?.name}</b> will replace the current database. All users should stop working until the system reloads.</p><div className="br-restore-safety">A current safety backup will be created automatically before restoration.</div><label>Type <b>RESTORE</b> to confirm<input autoFocus value={restoreConfirmation} onChange={(event)=>setRestoreConfirmation(event.target.value)} placeholder="RESTORE"/></label><div className="lm-modal-actions"><button disabled={Boolean(backupBusy)} onClick={()=>setRestoreOpen(false)}>Cancel</button><button className="br-danger" disabled={restoreConfirmation!=="RESTORE"||Boolean(backupBusy)} onClick={restoreSelectedFile}>{backupBusy==="Restoring"?"Restoring Database...":"Restore Database"}</button></div></section></div>}
    {selectedAudit && <div className="lm-modal-bg" onClick={() => setSelectedAudit(null)}><section className="lm-modal aa-audit-modal aa-audit-modal-expanded" onClick={(event) => event.stopPropagation()}><div className="aa-audit-head"><div><h2>{selectedAudit.action}</h2><p>{selectedAudit.id} · {selectedAudit.time}</p></div><span className="aa-audit-badges"><i className={`aa-severity ${String(selectedAudit.severity||"Information").toLowerCase()}`}>{selectedAudit.severity||"Information"}</i><i className={"lm-badge " + (selectedAudit.result === "Success" ? "ok" : "warning")}>{selectedAudit.result}</i></span></div><div className="lm-detail-grid aa-audit-grid"><div><small>User</small><b>{selectedAudit.user}</b><span>{selectedAudit.userId||"No User ID"}</span></div><div><small>Module</small><b>{selectedAudit.module}</b></div><div><small>Reference</small><b>{selectedAudit.reference}</b></div><div><small>IP Address</small><b>{selectedAudit.ip}</b></div><div><small>Request</small><b>{[selectedAudit.method,selectedAudit.path].filter(Boolean).join(" ")||"Manual event"}</b></div><div><small>Duration</small><b>{selectedAudit.durationMs?`${selectedAudit.durationMs} ms`:"Not measured"}</b></div><div><small>Session ID</small><b>{selectedAudit.sessionId||"Not recorded"}</b></div><div><small>Changed Fields</small><b>{selectedAudit.changedFields||"Not specified"}</b></div></div><div className="aa-detail"><small>Event Details</small><p>{selectedAudit.details}</p></div><details className="aa-audit-payload"><summary>Request Data <span>Sensitive values are redacted</span></summary><pre>{prettyAuditJson(selectedAudit.requestData)}</pre></details><details className="aa-audit-payload"><summary>Response Data</summary><pre>{prettyAuditJson(selectedAudit.responseData)}</pre></details><details className="aa-audit-payload"><summary>Browser / Device</summary><pre>{selectedAudit.userAgent||"Not recorded"}</pre></details><div className="lm-modal-actions"><button onClick={() => setSelectedAudit(null)}>Close</button></div></section></div>}
    {editingUser && <div className="lm-modal-bg" onClick={closeUser}><form className="lm-modal um-modal" onSubmit={saveUser} onClick={(event) => event.stopPropagation()}><div className="um-head"><div><h2>{editingUser === "new" ? "New User" : "Edit User"}</h2><p>{userDraft.id} · {userDraft.role}</p></div><div className="um-photo"><UserAvatar user={userDraft} large/><input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadPhoto}/><div><button type="button" onClick={() => photoInput.current?.click()}><Camera size={16}/>{userDraft.photo ? "Change Photo" : "Upload Photo"}</button>{userDraft.photo && <button type="button" className="remove" aria-label="Remove Photo" onClick={() => updateUser("photo","")}><Trash size={16}/></button>}<small>JPG, PNG or WebP · Max 3 MB</small></div></div></div><div className="um-form-grid"><label>Full Name *<input autoFocus value={userDraft.name} onChange={(event) => updateUser("name",event.target.value)}/></label><label>Username *<input value={userDraft.username} onChange={(event) => updateUser("username",event.target.value)}/></label><label className="wide">Email *<input type="email" value={userDraft.email} onChange={(event) => updateUser("email",event.target.value)}/></label><label>{editingUser === "new" ? "Password *" : "New Password"}<input type="password" autoComplete="new-password" placeholder={editingUser === "new" ? "Minimum 8 characters" : "Leave blank to keep current password"} value={userDraft.password||""} onChange={(event) => updateUser("password",event.target.value)}/></label><label>{editingUser === "new" ? "Confirm Password *" : "Confirm New Password"}<input type="password" autoComplete="new-password" value={userDraft.confirmPassword||""} onChange={(event) => updateUser("confirmPassword",event.target.value)}/></label><label>Access Role<select value={userDraft.role} onChange={(event) => updateUser("role",event.target.value)}>{accessRoles.map((item)=><option key={item}>{item}</option>)}</select></label><label>Branch<select value={userDraft.branch} onChange={(event) => updateUser("branch",event.target.value)}><option>Kuala Lumpur</option><option>Subang Jaya</option><option>All Branches</option></select></label><label>Status<select value={userDraft.status} onChange={(event) => updateUser("status",event.target.value)}><option>Active</option><option>Inactive</option></select></label><label>Last Login<input value={userDraft.lastLogin} disabled/></label><label>Commission Calculation<select aria-label="Commission Calculation" value={userDraft.commissionType||"None"} onChange={(event)=>updateUser("commissionType",event.target.value)}><option>None</option><option>Item Rate</option><option>Item Amount</option></select><small className="um-field-help">Item Rate = percentage of each completed item. Item Amount = fixed amount per item quantity.</small></label><label>{userDraft.commissionType==="Item Rate"?"Item Rate (%)":userDraft.commissionType==="Item Amount"?"Item Amount (RM)":"Commission Value"}<input aria-label="Commission Value" type="number" min="0" step="0.01" disabled={(userDraft.commissionType||"None")==="None"} value={userDraft.commissionValue||0} onChange={(event)=>updateUser("commissionValue",event.target.value)}/></label></div>{userError && <div className="um-error" role="alert">{userError}</div>}<div className="lm-modal-actions"><button type="button" onClick={closeUser}>Cancel</button><button className="primary" type="submit"><FloppyDisk size={16}/> Save User</button></div></form></div>}
    {tab === "Options" && <section className="gm-card gm-collection-options"><div className="gm-section-head"><h2>Collection Reminder</h2><p>Set when an uncollected repair should be highlighted for customer follow-up.</p></div><div className="gm-form-grid"><label>Collection Overdue After (Days)<input type="number" min="1" value={options.collectionOverdueDays} onChange={(event) => updateOption("collectionOverdueDays",event.target.value)}/><small>Used by Ready for Collection and the Dashboard overdue count.</small></label></div></section>}

    {tab === "Configuration" && <section className="gm-card gm-email-configuration">
      <div className="gm-section-head"><h2>Email Configuration</h2><p>Use a simple email link to open the computer's default email application. No mailbox password or SMTP server is stored.</p></div>
      <div className="gm-email-method"><EnvelopeSimple size={25}/><span><b>{emailConfiguration.method}</b><small>{emailConfiguration.method==="Gmail Web Link"?"Opens Gmail Compose using the Google account already signed in to the browser.":"Works with Outlook, Windows Mail, Apple Mail and other registered email applications."}</small></span><i>Simple Link</i></div>
      <div className="gm-form-grid">
        <label>Email Method<select value={emailConfiguration.method} onChange={(event)=>updateEmailConfiguration("method",event.target.value)}><option>Default Email App (mailto)</option><option>Gmail Web Link</option></select></label>
        <label>Sender Display Name<input placeholder="e.g. Service Team" value={emailConfiguration.senderName} onChange={(event)=>updateEmailConfiguration("senderName",event.target.value)}/></label>
        <label>Reply-to Email<input type="email" placeholder="service@company.com" value={emailConfiguration.replyTo} onChange={(event)=>updateEmailConfiguration("replyTo",event.target.value)}/></label>
        <label>Default CC<input type="email" placeholder="Optional" value={emailConfiguration.defaultCc} onChange={(event)=>updateEmailConfiguration("defaultCc",event.target.value)}/></label>
        <label className="wide">Subject Prefix<input placeholder="[Service Centre]" value={emailConfiguration.subjectPrefix} onChange={(event)=>updateEmailConfiguration("subjectPrefix",event.target.value)}/></label>
        <label className="wide">Email Signature<textarea rows="6" placeholder="Email closing and company contact details..." value={emailConfiguration.signature} onChange={(event)=>updateEmailConfiguration("signature",event.target.value)}/></label>
      </div>
      <div className="gm-email-test"><div><b>Test the link</b><span>This opens a prepared email in {emailConfiguration.method==="Gmail Web Link"?"Gmail":"the default email application"}. You can review it before sending.</span></div><a href={testEmailLink} target={emailConfiguration.method==="Gmail Web Link"?"_blank":undefined} rel={emailConfiguration.method==="Gmail Web Link"?"noreferrer":undefined}><LinkSimple size={17}/> Test Email Link</a></div>
      <div className="gm-email-note"><ShieldCheck size={17}/><span><b>No email password is stored.</b> The user remains responsible for reviewing recipients, content and attachments before pressing Send.</span></div>
    </section>}
    {notice && <div className="gm-toast" onClick={() => setNotice("")}>{notice}</div>}
  </ListingModule>;
}
