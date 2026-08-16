import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle, ClockCounterClockwise, EnvelopeSimple, Funnel, MagnifyingGlass, Package, PaperPlaneTilt, Plus, Printer, Trash, X } from "@phosphor-icons/react";
import { ConfigurableListing } from "./components/ConfigurableListing.jsx";
import { ListingModule } from "./components/ListingModule.jsx";
import { RepairBarcodeLookup } from "./components/RepairBarcodeLookup.jsx";
import { databaseApi } from "./database-api.js";
import { WarrantyBatchHistory, WarrantyBatchSentConfirmation } from "./WarrantyBatchDocuments.jsx";
import { createIndividualSentPdf, WarrantyIndividualSentConfirmation } from "./WarrantyIndividualSentConfirmation.jsx";
import "./warranty.css";
import "./warranty-batch.css";
import "./warranty-direct-intake.css";
import "./warranty-reminder.css";
import "./warranty-return.css";
import "./warranty-send.css";

const initialRecords = [
  { id:"WR-260812-018", repair:"SR-20260801-076", customer:"Hafiz Rahman", device:"ASUS TUF Gaming F15", supplier:"ASUS Malaysia", claim:"—", sent:"—", expected:"—", returned:"—", status:"Preparation", notes:"Prepare device and supplier documents." },
  { id:"WR-260812-017", repair:"SR-20260803-081", customer:"Melissa Tan", device:"Acer Swift 3", supplier:"SNS Network", claim:"CLM-SNS-11542", sent:"04/08/2026", expected:"17/08/2026", returned:"—", status:"Sent to Supplier", notes:"Awaiting supplier diagnosis." },
  { id:"WR-260811-016", repair:"SR-20260729-068", customer:"Kumar Raj", device:"Lenovo IdeaPad 5", supplier:"Lenovo Malaysia", claim:"CLM-LNV-30776", sent:"30/07/2026", expected:"13/08/2026", returned:"—", status:"Sent to Supplier", notes:"Supplier confirmed replacement unit." },
  { id:"WR-260810-015", repair:"SR-20260725-055", customer:"Nurul Huda", device:"HP Pavilion 14", supplier:"Ingram Micro", claim:"CLM-IM-90118", sent:"26/07/2026", expected:"12/08/2026", returned:"12/08/2026", status:"Returned from Supplier", notes:"Device received and ready for inspection." },
];

const columns = [
  {id:"id",label:"Warranty No.",width:150,visible:true},
  {id:"repair",label:"Repair No.",width:145,visible:true},
  {id:"customer",label:"Customer",width:160,visible:true},
  {id:"device",label:"Device",width:200,visible:true},
  {id:"supplier",label:"Supplier",width:165,visible:true},
  {id:"claim",label:"Claim Reference",width:155,visible:true},
  {id:"sent",label:"Sent Date",width:115,visible:true},
  {id:"sentDays",label:"With Supplier",width:130,visible:true},
  {id:"expected",label:"Expected Return",width:130,visible:true},
  {id:"returned",label:"Returned Date",width:125,visible:true},
  {id:"status",label:"Stage",width:175,visible:true},
];
const stages = ["Preparation", "Sent to Supplier", "Returned from Supplier"];
const blankClaim = { repair:"", customerId:"", customer:"", phone:"", device:"", deviceType:"Laptop", brand:"", model:"", serial:"", purchaseDate:"", issue:"", supplier:"", expected:"", notes:"", batchToSupplier:false };
const blankReturn = { outcome:"Warranty Approved", replacementDetails:"", rejectReason:"", additionalCharge:"" };
const blankIndividualSend = { deliveryMethod:"Self Delivery", deliveryContact:"", deliveryReference:"", deliveryPhotos:[] };
const emptyBatchState = { ready:{}, batches:[] };

function malaysiaToday() { return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kuala_Lumpur",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
function displayDate(value) { if(!value) return "—"; const [year,month,day]=value.split("-"); return `${day}/${month}/${year}`; }
function addDays(value,days) { const date=new Date(`${value}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10); }

function cell(record, column) {
  if (column.id === "id" || column.id === "repair") return <b>{record[column.id]}</b>;
  if (column.id === "status") {
    const tone = record.status === "Preparation" ? "warning" : record.status === "Returned from Supplier" ? "ok" : "info";
    return <i className={`lm-badge ${tone}`}>{record.status}</i>;
  }
  if(column.id === "sentDays") return record.status === "Sent to Supplier" ? <span className={`wr-waiting-days ${record.sentDays >= 14 ? "overdue" : ""}`}>{record.sentDays} day{record.sentDays===1?"":"s"}</span> : "—";
  return record[column.id];
}

export function Warranty({ onDashboard, onRepairs, onCustomers, onSuppliers, companyProfile, repairRecords:allRepairRecords = [], customerRecords = [], initialRepair, onInitialRepairConsumed, startDirectClaim, onDirectClaimConsumed, onOpenRepair, onRepairStatusChange, onRepairCreated }) {
  const [records, setRecords] = useState(initialRecords);
  const repairRecords = allRepairRecords.filter((repair)=>!records.some((record)=>record.repair===repair.no&&record.status!=="Returned from Supplier"));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All Stages");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [directCreating, setDirectCreating] = useState(false);
  const [claimMode, setClaimMode] = useState("Existing Repair");
  const [claimForm, setClaimForm] = useState(blankClaim);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [batchState,setBatchState] = useState(emptyBatchState);
  const [batchOpen,setBatchOpen] = useState(false);
  const [batchSupplier,setBatchSupplier] = useState("");
  const [batchSelection,setBatchSelection] = useState([]);
  const [batchExpected,setBatchExpected] = useState("");
  const [batchNotes,setBatchNotes] = useState("");
  const [batchSaving,setBatchSaving] = useState(false);
  const [batchHistoryOpen,setBatchHistoryOpen] = useState(false);
  const [batchConfirmation,setBatchConfirmation] = useState(null);
  const [suppliers,setSuppliers] = useState([]);
  const [warrantyLoaded,setWarrantyLoaded] = useState(false);
  const [emailConfiguration,setEmailConfiguration] = useState({method:"Default Email App (mailto)",subjectPrefix:"[Service Centre]",signature:"Thank you.\nService Team"});
  const [reminderRecord,setReminderRecord] = useState(null);
  const [reminderSubject,setReminderSubject] = useState("");
  const [reminderMessage,setReminderMessage] = useState("");
  const [reminderSending,setReminderSending] = useState(false);
  const [returnRecord,setReturnRecord] = useState(null);
  const [returnForm,setReturnForm] = useState(blankReturn);
  const [returnSaving,setReturnSaving] = useState(false);
  const [sendRecord,setSendRecord] = useState(null);
  const [sendForm,setSendForm] = useState(blankIndividualSend);
  const [sendSaving,setSendSaving] = useState(false);
  const [individualConfirmation,setIndividualConfirmation] = useState(null);
  const [confirmationEmailing,setConfirmationEmailing] = useState(false);
  const [sendCameraOpen,setSendCameraOpen] = useState(false);
  const sendPhotoInput=useRef(null),sendCameraVideo=useRef(null),sendCameraStream=useRef(null);
  useEffect(() => { Promise.all([databaseApi.warranty(),databaseApi.setting("warranty-batches").catch(()=>emptyBatchState),databaseApi.suppliers(),databaseApi.setting("email-configuration").catch(()=>({}))]).then(([warrantyRecords,savedBatchState,supplierRecords,emailSettings])=>{setRecords(warrantyRecords);setBatchState({ready:savedBatchState.ready||{},batches:savedBatchState.batches||[]});setSuppliers(supplierRecords);setEmailConfiguration((current)=>({...current,...emailSettings}));setWarrantyLoaded(true);}).catch((error)=>setNotice(`SQL Server load failed: ${error.message}`)); }, []);
  useEffect(()=>{if(!initialRepair||!warrantyLoaded)return;const activeClaim=records.find((record)=>record.repair===initialRepair.no&&record.status!=="Returned from Supplier");if(activeClaim){setSelected(activeClaim);setCreating(false);}else{setClaimMode("Existing Repair");setClaimForm({...blankClaim,repair:initialRepair.no,customer:initialRepair.customer,device:initialRepair.device});setCreating(true);}setError("");onInitialRepairConsumed?.();},[initialRepair?.no,warrantyLoaded]);
  useEffect(()=>{if(!startDirectClaim)return;openDirectClaim();onDirectClaimConsumed?.();},[startDirectClaim]);
  useEffect(()=>{if(sendCameraOpen&&sendCameraVideo.current&&sendCameraStream.current)sendCameraVideo.current.srcObject=sendCameraStream.current;},[sendCameraOpen]);
  useEffect(()=>()=>sendCameraStream.current?.getTracks().forEach((track)=>track.stop()),[]);

  const shown = useMemo(() => records.filter((row) => {
    const matchesSearch=Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStage=filter === "All Stages" || (filter === "Batch Ready" ? row.status === "Preparation" && Boolean(batchState.ready[row.id]) : row.status === filter);
    return matchesSearch && matchesStage;
  }), [records, query, filter, batchState.ready]);
  const count = (stage) => records.filter((record) => record.status === stage).length;
  const batchReadyRecords = records.filter((record) => record.status === "Preparation" && batchState.ready[record.id]);
  const batchSuppliers = [...new Set(batchReadyRecords.map((record) => record.supplier))];
  const batchItems = batchReadyRecords.filter((record) => record.supplier === batchSupplier).map((record)=>({...record,customer:`${record.customer} · SN ${record.serial||"—"}`}));
  const activeWarrantyRepairNos = new Set(records.filter((record)=>record.status!=="Returned from Supplier").map((record)=>record.repair));
  const updateClaim = (key, value) => setClaimForm((current) => ({ ...current, [key]: value }));
  function filterFromSummary(nextFilter) { setFilter((current)=>nextFilter !== "All Stages" && current === nextFilter ? "All Stages" : nextFilter); }
  function selectRepair(repairNo) { const repair=repairRecords.find((item)=>item.no===repairNo);setClaimForm((current)=>({...current,repair:repairNo,customer:repair?.customer||"",device:repair?.device||""}));setError(""); }
  function selectDirectCustomer(customerId) { const customer=customerRecords.find((item)=>item.id===customerId);setClaimForm((current)=>({...current,customerId,customer:customer?.name||customer?.company||"",phone:customer?.mobile||customer?.phone||""}));setError(""); }
  function openDirectClaim() { setClaimMode("Direct Warranty Intake");setClaimForm(blankClaim);setError("");setCreating(false);setDirectCreating(true); }
  function openExistingClaim() { setClaimMode("Existing Repair");setClaimForm(blankClaim);setError("");setDirectCreating(false);setCreating(true); }
  function openLinkedRepair(record) { const repair=allRepairRecords.find((item)=>item.no===record.repair);if(!repair){setNotice(`Linked Repair ${record.repair} is not available`);return;}onOpenRepair?.(repair); }

  function navigate(item) {
    ({ Dashboard:onDashboard, Repairs:onRepairs, Customers:onCustomers, Suppliers:onSuppliers }[item])?.();
  }
  async function createClaim(event) {
    if(claimMode !== "Direct Warranty Intake") return createExistingClaim(event);
    event.preventDefault();
    const customer=customerRecords.find((item)=>item.id===claimForm.customerId);
    if(!customer || !claimForm.brand.trim() || !claimForm.model.trim() || !claimForm.serial.trim() || !claimForm.issue.trim() || !claimForm.supplier.trim()) {
      setError("Select a Customer, then enter Brand, Model, Serial Number, Reported Issue and Supplier.");return;
    }
    let result;
    try {
      result=await databaseApi.createDirectWarranty({customerId:customer.id,customer:customer.name||customer.company,phone:customer.mobile||customer.phone||"",deviceType:claimForm.deviceType,brand:claimForm.brand,model:claimForm.model,serial:claimForm.serial,purchaseDate:claimForm.purchaseDate||null,issue:claimForm.issue,supplier:claimForm.supplier,expectedDate:claimForm.expected||null,notes:claimForm.notes||null});
    } catch(error) { setError(`SQL Server save failed: ${error.message}`);return; }
    const record=result.warranty;
    onRepairCreated?.(result.repair);
    if(claimForm.batchToSupplier){const nextBatchState={...batchState,ready:{...batchState.ready,[record.id]:true}};try{await databaseApi.saveSetting("warranty-batches",nextBatchState);setBatchState(nextBatchState);}catch(error){setError(`Warranty created, but Batch Preparation failed: ${error.message}`);return;}}
    setRecords((current)=>[record,...current]);setDirectCreating(false);setClaimForm(blankClaim);setError("");setNotice(`${record.id} added to Preparation`);
  }
  async function createExistingClaim(event) {
    event.preventDefault();
    const linkedRepair=repairRecords.find((repair)=>repair.no===claimForm.repair);
    if (!linkedRepair || !claimForm.supplier.trim()) {
      setError("Select an existing Repair and Supplier."); return;
    }
    const draft = { ...claimForm, customer:linkedRepair.customer, device:linkedRepair.device, serial:linkedRepair.serial||"—", claim:"—", sent:"—", returned:"—", expected:claimForm.expected || "—", status:"Preparation" };
    let saved;try { saved=await databaseApi.createWarranty({...draft,expectedDate:claimForm.expected||null}); } catch(error) { setError(`SQL Server save failed: ${error.message}`); return; }
    const record={...draft,...saved,id:saved.id};
    if(claimForm.batchToSupplier){const nextBatchState={...batchState,ready:{...batchState.ready,[record.id]:true}};try{await databaseApi.saveSetting("warranty-batches",nextBatchState);setBatchState(nextBatchState);}catch(error){setError(`Warranty created, but Batch Preparation failed: ${error.message}`);return;}}
    setRecords((current) => [record, ...current]); setCreating(false); setClaimForm(blankClaim); setError("");
    onRepairStatusChange?.(record.repair,"Warranty Preparation");
    setNotice(`${record.id} added to Preparation`);
  }
  async function advance(record) {
    if(record.status === "Sent to Supplier"){setReturnRecord(record);setReturnForm(blankReturn);setError("");return;}
    if(record.status === "Preparation"){setSendRecord(record);setSendForm(blankIndividualSend);setError("");return;}
    const nextStatus = record.status === "Preparation" ? "Sent to Supplier" : "Returned from Supplier";
    const updated = { ...record, status:nextStatus };
    const today=malaysiaToday();
    if (nextStatus === "Sent to Supplier") {
      updated.sent = displayDate(today);
      updated.claim = record.claim === "—" ? `CLM-${record.supplier.replace(/[^A-Z]/gi,"").toUpperCase().slice(0,4)}-${String(Date.now()).slice(-5)}` : record.claim;
      updated.expected = record.expected === "—" ? displayDate(addDays(today,14)) : record.expected;
    } else updated.returned = displayDate(today);
    try { await databaseApi.updateWarranty({...updated,sentDate:nextStatus==="Sent to Supplier"?today:null,returnedDate:nextStatus==="Returned from Supplier"?today:null}); } catch(error) { setNotice(`SQL Server update failed: ${error.message}`); return; }
    if(nextStatus==="Sent to Supplier"&&batchState.ready[record.id]){const ready={...batchState.ready};delete ready[record.id];const nextBatchState={...batchState,ready};setBatchState(nextBatchState);databaseApi.saveSetting("warranty-batches",nextBatchState).catch(()=>{});}
    setRecords((current) => current.map((item) => item.id === record.id ? updated : item));
    onRepairStatusChange?.(record.repair,nextStatus==="Returned from Supplier"?"Diagnosis":"Warranty - Sent to Supplier");
    setSelected(updated); setNotice(`${record.id} updated to ${nextStatus}`);
  }
  async function confirmIndividualSend() {
    if(!sendRecord)return;
    const requiresReference=["Pickup by Lalamove","Other Courier / Logistics"].includes(sendForm.deliveryMethod);
    if(!sendForm.deliveryContact.trim()){setError("Enter the delivery or pickup contact details.");return;}
    if(requiresReference&&!sendForm.deliveryReference.trim()){setError("Enter the order, vehicle, or tracking reference.");return;}
    const today=malaysiaToday(),sentTimestamp=new Date().toISOString();
    const updated={...sendRecord,status:"Sent to Supplier",sent:displayDate(today),sentDate:sentTimestamp,deliveryMethod:sendForm.deliveryMethod,deliveryContact:sendForm.deliveryContact.trim(),deliveryReference:sendForm.deliveryReference.trim(),deliveryPhotos:sendForm.deliveryPhotos.slice(0,3),sentPrintCount:0,sentEmailCount:0};
    updated.claim=sendRecord.claim === "—" ? `CLM-${sendRecord.supplier.replace(/[^A-Z]/gi,"").toUpperCase().slice(0,4)}-${String(Date.now()).slice(-5)}` : sendRecord.claim;
    updated.expected=sendRecord.expected === "—" ? displayDate(addDays(today,14)) : sendRecord.expected;
    setSendSaving(true);setError("");
    try{await databaseApi.updateWarranty({...updated,sentDate:sentTimestamp});}
    catch(error){setError(`SQL Server update failed: ${error.message}`);setSendSaving(false);return;}
    setRecords((current)=>current.map((item)=>item.id===updated.id?updated:item));
    onRepairStatusChange?.(updated.repair,"Warranty - Sent to Supplier");
    setSelected(updated);setSendRecord(null);setSendSaving(false);setIndividualConfirmation(updated);setNotice(`${updated.id} sent individually · Sent Confirmation ready`);
  }
  function stopSendCamera(){sendCameraStream.current?.getTracks().forEach((track)=>track.stop());sendCameraStream.current=null;setSendCameraOpen(false);}
  async function openSendCamera(){
    if(sendForm.deliveryPhotos.length>=3){setError("Maximum 3 dispatch photos reached.");return;}
    if(!navigator.mediaDevices?.getUserMedia){setError("No camera was detected. Use Upload Photo instead.");return;}
    try{sendCameraStream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});setSendCameraOpen(true);setError("");}
    catch{setError("Camera is unavailable or permission was not granted. Use Upload Photo if needed.");}
  }
  function optimizeSendPhoto(source,maxWidth=2560,maxHeight=1920){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const scale=Math.min(1,maxWidth/image.width,maxHeight/image.height),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext("2d");context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(image,0,0,canvas.width,canvas.height);const optimized=canvas.toDataURL("image/webp",.94);resolve(optimized.length<source.length?optimized:source);};image.onerror=reject;image.src=source;});}
  function addSendPhoto(photo){setSendForm((current)=>({...current,deliveryPhotos:[...current.deliveryPhotos,photo].slice(0,3)}));}
  async function chooseSendPhotos(event){
    const files=[...(event.target.files||[])].filter((file)=>file.type.startsWith("image/")).slice(0,3-sendForm.deliveryPhotos.length);
    for(const file of files){if(file.size>8*1024*1024){setError(`${file.name} is larger than 8 MB.`);continue;}const source=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});addSendPhoto(await optimizeSendPhoto(source));}
    event.target.value="";
  }
  function captureSendPhoto(){const video=sendCameraVideo.current;if(!video?.videoWidth)return;const scale=Math.min(1,2560/video.videoWidth,1920/video.videoHeight),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));const context=canvas.getContext("2d");context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(video,0,0,canvas.width,canvas.height);addSendPhoto(canvas.toDataURL("image/webp",.94));stopSendCamera();setNotice("Dispatch photo captured and optimized in high quality");}
  function removeSendPhoto(index){setSendForm((current)=>({...current,deliveryPhotos:current.deliveryPhotos.filter((_,photoIndex)=>photoIndex!==index)}));}
  function mergeConfirmationAudit(record,saved){const updated={...record,...saved};setRecords((current)=>current.map((item)=>item.id===updated.id?updated:item));setSelected((current)=>current?.id===updated.id?updated:current);setIndividualConfirmation(updated);return updated;}
  async function printIndividualConfirmation(record){
    let current=record;try{const saved=await databaseApi.recordWarrantySentConfirmation(record.id,{type:"Print"});current=mergeConfirmationAudit(record,saved);}catch(error){setNotice(`Print audit could not be recorded: ${error.message}`);}
    setIndividualConfirmation(current);window.setTimeout(()=>window.print(),120);
  }
  async function emailIndividualConfirmation(record){
    const recipient=String(record.supplierEmail||"").trim();if(!/^\S+@\S+\.\S+$/.test(recipient)||recipient==="—"){setNotice("Supplier Email is not configured. Update it in Suppliers first.");return;}
    setConfirmationEmailing(true);const gmail=emailConfiguration.method==="Gmail Web Link",mailWindow=gmail?window.open("about:blank","_blank"):null;
    try{
      const blob=await createIndividualSentPdf(record,companyProfile),file=new File([blob],`${record.id}-Individual-Sent-Confirmation.pdf`,{type:"application/pdf"});
      try{if(navigator.share&&navigator.canShare?.({files:[file]})){mailWindow?.close();await navigator.share({title:`Sent Confirmation ${record.id}`,text:`Warranty item sent to ${record.supplier}`,files:[file]});const saved=await databaseApi.recordWarrantySentConfirmation(record.id,{type:"Email",recipient});mergeConfirmationAudit(record,saved);setNotice(`Sent Confirmation PDF shared for ${recipient}`);setConfirmationEmailing(false);return;}}catch(error){if(error?.name==="AbortError"){mailWindow?.close();setNotice("Email sharing was cancelled");setConfirmationEmailing(false);return;}}
      const download=document.createElement("a");download.href=URL.createObjectURL(blob);download.download=file.name;download.click();window.setTimeout(()=>URL.revokeObjectURL(download.href),1000);
      const prefix=emailConfiguration.subjectPrefix?.trim(),subject=`${prefix?`${prefix} `:""}Individual Sent Confirmation ${record.id}`,body=`Dear ${record.supplierContact&&record.supplierContact!=="—"?record.supplierContact:record.supplier},\n\nPlease find the Individual Sent Confirmation PDF for the warranty item attached.\n\nWarranty No: ${record.id}\nRepair No: ${record.repair}\nDevice: ${record.device}\nSerial No: ${record.serial}\nDelivery Method: ${record.deliveryMethod}\nTracking / Reference: ${record.deliveryReference||"—"}\n\n${emailConfiguration.signature||""}`,cc=emailConfiguration.defaultCc?`&cc=${encodeURIComponent(emailConfiguration.defaultCc)}`:"",compose=gmail?`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}${cc}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`:`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(body)}`;
      if(gmail&&mailWindow)mailWindow.location.href=compose;else window.location.href=compose;
      const saved=await databaseApi.recordWarrantySentConfirmation(record.id,{type:"Email",recipient});mergeConfirmationAudit(record,saved);setNotice(`PDF downloaded and email compose opened for ${recipient}`);
    }catch(error){mailWindow?.close();setNotice(`Unable to prepare Sent Confirmation email: ${error.message}`);}finally{setConfirmationEmailing(false);}
  }
  async function recordIndividualReturn() {
    if(!returnRecord)return;
    if(returnForm.outcome === "Warranty Approved" && !returnForm.replacementDetails.trim()){setError("Record what was replaced or repaired under warranty.");return;}
    if(returnForm.outcome === "Rejected / Chargeable" && !returnForm.rejectReason.trim()){setError("Reject Reason is required.");return;}
    setReturnSaving(true);setError("");
    try{
      const saved=await databaseApi.recordWarrantyReturn(returnRecord.id,{...returnForm,additionalCharge:Number(returnForm.additionalCharge||0)});
      const updated={...returnRecord,...saved};setRecords((current)=>current.map((record)=>record.id===updated.id?updated:record));setSelected(updated);setReturnRecord(null);onRepairStatusChange?.(updated.repair,"Diagnosis");setNotice(`${updated.id} returned · ${saved.returnOutcome}`);
    }catch(error){setError(`Unable to record supplier return: ${error.message}`);}finally{setReturnSaving(false);}
  }
  async function undoIndividualSend(record) {
    if(!window.confirm(`Return ${record.id} to Preparation?\n\nThis will clear its individual Sent Date and Claim Reference.`))return;
    try{await databaseApi.undoIndividualWarrantySend(record.id);}catch(error){setNotice(`Unable to return to Preparation: ${error.message}`);return;}
    const updated={...record,status:"Preparation",claim:"—",sent:"—",deliveryMethod:"",deliveryContact:"",deliveryReference:"",deliveryPhotos:[],sentPrintCount:0,sentEmailCount:0,sentLastPrintedAt:"",sentLastEmailedAt:"",sentLastEmailedTo:""};
    setRecords((current)=>current.map((item)=>item.id===record.id?updated:item));
    setSelected(updated);onRepairStatusChange?.(record.repair,"Warranty Preparation");setNotice(`${record.id} returned to Preparation`);
  }
  function openSupplierReminder(record) {
    const days=Number(record.sentDays||0),prefix=emailConfiguration.subjectPrefix?.trim();
    setReminderRecord(record);
    setReminderSubject(`${prefix?`${prefix} `:""}Warranty Follow-up: ${record.id} · ${days} days with supplier`);
    setReminderMessage(`Dear ${record.supplierContact&&record.supplierContact!=="—"?record.supplierContact:record.supplier},\n\nThis is a follow-up for Warranty Claim ${record.id} (${record.claim}) for ${record.device}, Serial No. ${record.serial}. The item was sent on ${record.sent} and has been with your service centre for ${days} day${days===1?"":"s"}.\n\nExpected Return: ${record.expected}\nPlease provide the latest repair status and estimated return date.\n\n${emailConfiguration.signature||`${companyProfile?.name||"Service Centre"}`}`);
    setError("");
  }
  async function sendSupplierReminder() {
    if(!reminderRecord)return;
    const recipient=String(reminderRecord.supplierEmail||"").trim();
    if(!recipient||recipient==="—"){setError("Supplier Email is not configured. Update it in Suppliers first.");return;}
    setReminderSending(true);setError("");
    let mailWindow=null;const gmail=emailConfiguration.method==="Gmail Web Link";
    if(gmail)mailWindow=window.open("about:blank","_blank");
    try{
      const saved=await databaseApi.remindWarrantySupplier(reminderRecord.id,{to:recipient,subject:reminderSubject,message:reminderMessage});
      const cc=emailConfiguration.defaultCc?`&cc=${encodeURIComponent(emailConfiguration.defaultCc)}`:"";
      const compose=gmail?`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}${cc}&su=${encodeURIComponent(reminderSubject)}&body=${encodeURIComponent(reminderMessage)}`:`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(reminderSubject)}${cc}&body=${encodeURIComponent(reminderMessage)}`;
      if(gmail&&mailWindow)mailWindow.location.href=compose;else window.location.href=compose;
      const updated={...reminderRecord,reminderCount:saved.reminderCount,lastReminderAt:saved.lastReminderAt};
      setRecords((current)=>current.map((record)=>record.id===updated.id?updated:record));setSelected((current)=>current?.id===updated.id?updated:current);setReminderRecord(null);setNotice(`Supplier reminder #${saved.reminderCount} prepared for ${recipient}`);
    }catch(error){mailWindow?.close();setError(`Unable to prepare supplier reminder: ${error.message}`);}finally{setReminderSending(false);}
  }
  async function setBatchReady(record,value) {
    const ready={...batchState.ready}; if(value)ready[record.id]=true;else delete ready[record.id];
    const next={...batchState,ready};
    try{await databaseApi.saveSetting("warranty-batches",next);}catch(error){setNotice(`SQL Server update failed: ${error.message}`);return;}
    setBatchState(next);setSelected((current)=>current?.id===record.id?{...current}:current);setNotice(value?`${record.id} added to Batch Preparation`:`${record.id} removed from Batch Preparation`);
  }
  function openBatchPreparation() {
    if(!batchReadyRecords.length){setNotice("Tick Batch to Supplier on a Preparation item first");return;}
    const supplier=batchReadyRecords[0].supplier;setBatchSupplier(supplier);setBatchSelection([]);setBatchExpected("");setBatchNotes("");setError("");setBatchOpen(true);
  }
  function toggleBatchItem(id) { setBatchSelection((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id]); }
  function confirmationItems(batch) { return (batch.items?.length?batch.items:(batch.itemIds||[]).map((id)=>records.find((item)=>item.id===id)).filter(Boolean)).map((item)=>{const current=records.find((record)=>record.id===item.id);return {...item,serial:item.serial&&item.serial!=="—"?item.serial:current?.serial||"—",claim:item.claim||current?.claim||"—"};}); }
  function openBatchConfirmation(batch) { setBatchHistoryOpen(false);setBatchConfirmation({...batch,items:confirmationItems(batch)}); }
  function printBatchConfirmation() { window.setTimeout(()=>window.print(),100); }
  async function sendBatch() {
    if(!batchSelection.length){setError("Pick at least one warranty item for this batch.");return;}
    const missingSerialRecords=records.filter((record)=>batchSelection.includes(record.id)&&(!record.serial||record.serial==="—"));
    if(missingSerialRecords.length){setError(`Serial No. is required before Batch Send: ${missingSerialRecords.map((record)=>record.id).join(", ")}`);return;}
    const today=malaysiaToday(),dateKey=today.replaceAll("-","");
    const sequence=1+batchState.batches.filter((batch)=>batch.id?.startsWith(`WB-${dateKey}-`)).length;
    const batchId=`WB-${dateKey}-${String(sequence).padStart(3,"0")}`;
    const items=records.filter((record)=>batchSelection.includes(record.id)).map((record,index)=>({id:record.id,repair:record.repair,customer:record.customer,device:record.device,serial:record.serial||"—",claim:record.claim==="—"?`${batchId}-${String(index+1).padStart(2,"0")}`:record.claim}));
    const batch={id:batchId,supplier:batchSupplier,itemIds:batchSelection,items,sentAt:today,expectedReturn:batchExpected||null,notes:batchNotes,status:"Sent to Supplier"};
    const ready={...batchState.ready};batchSelection.forEach((id)=>delete ready[id]);
    const nextBatchState={ready,batches:[batch,...batchState.batches]};
    setBatchSaving(true);setError("");
    try{await databaseApi.batchSendWarranty({batchId,supplier:batchSupplier,itemIds:batchSelection,sentDate:today,expectedDate:batchExpected||null,notes:batchNotes||null,batchState:nextBatchState});}catch(error){setError(`SQL Server batch send failed: ${error.message}`);setBatchSaving(false);return;}
    setRecords((current)=>current.map((record)=>{const index=batchSelection.indexOf(record.id);return index<0?record:{...record,status:"Sent to Supplier",sent:displayDate(today),expected:batchExpected?displayDate(batchExpected):record.expected,claim:record.claim==="—"?`${batchId}-${String(index+1).padStart(2,"0")}`:record.claim};}));
    records.filter((record)=>batchSelection.includes(record.id)).forEach((record)=>onRepairStatusChange?.(record.repair,"Warranty - Sent to Supplier"));
    setBatchState(nextBatchState);setSelected(null);setBatchOpen(false);setBatchSaving(false);setBatchConfirmation(batch);setNotice(`${batchId} sent to ${batchSupplier} · Sent Confirmation ready to print`);
  }

  const toolbar = <><div className="lm-search"><MagnifyingGlass size={20}/><input aria-label="Search warranty listing" placeholder="Search warranty, repair, customer, device, supplier, or claim reference" value={query} onChange={(event) => setQuery(event.target.value)}/></div><div className="lm-filter"><Funnel size={18}/><select aria-label="Filter warranty stage" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All Stages</option><option>Batch Ready</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></div></>;

  return <ListingModule active="Warranty" title="Warranty" description="Prepare claims, send devices to suppliers, and track every return." onNavigate={navigate} headerCenter={<RepairBarcodeLookup onOpenRepair={onOpenRepair}/>} primaryAction={<div className="wr-primary-actions"><button className="wr-batch-history-action" onClick={()=>setBatchHistoryOpen(true)}><ClockCounterClockwise size={17}/> Batch History</button><button className="wr-batch-action" onClick={openBatchPreparation}><Package size={17}/> Batch Preparation{batchReadyRecords.length>0&&<span>{batchReadyRecords.length}</span>}</button><button className="lm-primary" onClick={openDirectClaim}><Plus size={17}/> New Warranty Claim</button></div>} summary={[{label:"All Claims",value:records.length,active:filter==="All Stages",onClick:()=>filterFromSummary("All Stages")},{label:"Preparation",value:count("Preparation"),active:filter==="Preparation",onClick:()=>filterFromSummary("Preparation")},{label:"Batch Ready",value:batchReadyRecords.length,active:filter==="Batch Ready",onClick:()=>filterFromSummary("Batch Ready")},{label:"Sent to Supplier",value:count("Sent to Supplier"),active:filter==="Sent to Supplier",onClick:()=>filterFromSummary("Sent to Supplier")},{label:"Returned",value:count("Returned from Supplier"),active:filter==="Returned from Supplier",onClick:()=>filterFromSummary("Returned from Supplier")}]}> 
    <section className="wr-flow"><div><span>1</span><b>Preparation</b><small>Prepare device and claim documents</small></div><ArrowRight size={18}/><div><span>2</span><b>Sent to Supplier</b><small>Track claim and expected return</small></div><ArrowRight size={18}/><div><span>3</span><b>Returned from Supplier</b><small>Record receipt from supplier</small></div></section>
    <ConfigurableListing columns={columns} rows={shown} rowKey={(row) => row.id} renderCell={cell} rowClassName={(row)=>row.status === "Preparation" && batchState.ready[row.id] ? "wr-batch-ready-row" : ""} onRowClick={setSelected} storageKey="techcare-warranty-list-layout-v2" toolbar={toolbar} emptyMessage="No warranty claims match your search." recordLabel="warranty claims" totalCount={records.length}/>

    {selected && <div className="lm-modal-bg" onClick={() => setSelected(null)}>
      <section className="lm-modal wr-modal" onClick={(event) => event.stopPropagation()}>
        <div className="wr-modal-head"><div><h2>{selected.id}</h2><p>{selected.device} · {selected.customer}</p></div><i className={`lm-badge ${selected.status === "Preparation" ? "warning" : selected.status === "Returned from Supplier" ? "ok" : "info"}`}>{selected.status}</i></div>
        <div className="wr-stage-line">{stages.map((stage, index) => { const activeIndex = stages.indexOf(selected.status); return <div key={stage} className={index <= activeIndex ? "done" : ""}><span>{index < activeIndex ? <CheckCircle size={18} weight="fill"/> : index + 1}</span><small>{stage}</small></div>; })}</div>
        <div className="lm-detail-grid"><div><small>Repair No.</small><b>{selected.repair}</b></div><div><small>Supplier</small><b>{selected.supplier}</b></div><div><small>Claim Reference</small><b>{selected.claim}</b></div><div><small>Sent Date</small><b>{selected.sent}</b></div><div><small>Expected Return</small><b>{selected.expected}</b></div><div><small>Returned Date</small><b>{selected.returned}</b></div></div>
        {selected.status === "Sent to Supplier" && <div className={`wr-supplier-wait ${selected.sentDays >= 14 ? "overdue" : ""}`}><ClockCounterClockwise size={22}/><span><b>With Supplier for {selected.sentDays} day{selected.sentDays===1?"":"s"}</b><small>{selected.reminderCount?`${selected.reminderCount} reminder${selected.reminderCount===1?"":"s"} · Last ${selected.lastReminderAt}`:"No supplier reminder sent yet"}</small></span></div>}
        {selected.deliveryMethod && <div className="wr-delivery-summary"><div><small>Delivery Method</small><b>{selected.deliveryMethod}</b></div><div><small>Delivery / Pickup Contact</small><b>{selected.deliveryContact||"—"}</b></div><div><small>Tracking / Reference</small><b>{selected.deliveryReference||"—"}</b></div></div>}
        {selected.deliveryPhotos?.length>0&&<div className="wr-send-photo-section"><div className="wr-send-photo-head"><b>Dispatch Record Photos</b><span>{selected.deliveryPhotos.length} photo{selected.deliveryPhotos.length===1?"":"s"}</span></div><div className="wr-send-photo-strip">{selected.deliveryPhotos.map((photo,index)=><figure key={index}><img src={photo} alt={`Dispatch record ${index+1}`}/></figure>)}</div></div>}
        {selected.status === "Preparation" && <label className="wr-batch-check"><input type="checkbox" checked={Boolean(batchState.ready[selected.id])} onChange={(event) => setBatchReady(selected,event.target.checked)}/><span><b>Batch to Supplier</b><small>Add this item to Batch Preparation for a combined supplier shipment.</small></span></label>}
        <div className="wr-note"><small>Notes</small><p>{selected.notes || "No notes recorded."}</p></div>
        {selected.status === "Returned from Supplier" && selected.returnOutcome && <div className={`wr-return-result ${selected.returnOutcome === "Warranty Approved" ? "approved" : "rejected"}`}><div><small>Return Outcome</small><b>{selected.returnOutcome}</b></div>{selected.returnOutcome === "Warranty Approved" ? <div><small>Replacement / Work Performed</small><p>{selected.replacementDetails}</p></div> : <><div><small>Reject Reason</small><p>{selected.rejectReason}</p></div><div><small>Additional Charge</small><b>RM {Number(selected.additionalCharge||0).toFixed(2)}</b></div></>}</div>}
        <div className="lm-modal-actions"><button onClick={() => setSelected(null)}>Close</button><button onClick={()=>openLinkedRepair(selected)}>Open Linked Repair</button>{selected.status!=="Preparation"&&selected.deliveryMethod&&selected.deliveryMethod!=="Batch Shipment"&&<button onClick={()=>setIndividualConfirmation(selected)}><Printer size={17}/> Print / Email Sent Confirmation</button>}{selected.status === "Sent to Supplier" && <button className="wr-remind-supplier" onClick={()=>openSupplierReminder(selected)}><EnvelopeSimple size={17}/> Remind Supplier</button>}{selected.status === "Sent to Supplier" && !String(selected.claim).startsWith("WB-") && <button className="wr-undo-send" onClick={()=>undoIndividualSend(selected)}>Back to Preparation</button>}{selected.status !== "Returned from Supplier" && !(selected.status === "Preparation" && batchState.ready[selected.id]) && <button className="primary" onClick={() => advance(selected)}>{selected.status === "Preparation" ? <><PaperPlaneTilt size={17}/> Send Individually</> : <><Package size={17}/> Record Individual Return</>}</button>}</div>
      </section>
    </div>}

    {sendRecord && <div className="lm-modal-bg wr-send-bg" onClick={()=>setSendRecord(null)}><section className="lm-modal wr-send-modal" role="dialog" aria-modal="true" aria-labelledby="wr-send-title" onClick={(event)=>event.stopPropagation()}>
      <div className="wr-send-head"><PaperPlaneTilt size={29} weight="duotone"/><div><h2 id="wr-send-title">Send Individually</h2><p>{sendRecord.id} · {sendRecord.device} · {sendRecord.supplier}</p></div></div>
      <fieldset className="wr-send-options"><legend>Delivery Method *</legend><div className="wr-send-options-grid">{[
        ["Self Delivery","Delivered by your own staff to the supplier."],
        ["Pickup by Supplier Staff","Supplier arranges pickup using their own staff."],
        ["Pickup by Lalamove","Record the Lalamove driver and order reference."],
        ["Other Courier / Logistics","Use another courier or logistics company."],
      ].map(([method,description])=><label key={method} className={sendForm.deliveryMethod===method?"selected":""}><input type="radio" name="delivery-method" checked={sendForm.deliveryMethod===method} onChange={()=>{setSendForm((current)=>({...current,deliveryMethod:method,deliveryContact:"",deliveryReference:""}));setError("");}}/><span><b>{method}</b><small>{description}</small></span></label>)}</div></fieldset>
      <div className="wr-send-fields">
        <label>{sendForm.deliveryMethod==="Self Delivery"?"Delivered By *":sendForm.deliveryMethod==="Pickup by Supplier Staff"?"Supplier Pickup Person *":sendForm.deliveryMethod==="Pickup by Lalamove"?"Lalamove Driver Name *":"Courier / Logistics Company *"}<input autoFocus placeholder={sendForm.deliveryMethod==="Self Delivery"?"Staff name":sendForm.deliveryMethod==="Pickup by Supplier Staff"?"Supplier staff name / contact":"Name and contact details"} value={sendForm.deliveryContact} onChange={(event)=>setSendForm((current)=>({...current,deliveryContact:event.target.value}))}/></label>
        <label>{sendForm.deliveryMethod==="Pickup by Lalamove"?"Lalamove Order / Vehicle No. *":sendForm.deliveryMethod==="Other Courier / Logistics"?"Tracking No. *":sendForm.deliveryMethod==="Pickup by Supplier Staff"?"Vehicle No. / Staff Contact":"Handover / Vehicle Reference"}<input placeholder={sendForm.deliveryMethod==="Other Courier / Logistics"?"Courier tracking number":"Order, vehicle, phone, or handover reference"} value={sendForm.deliveryReference} onChange={(event)=>setSendForm((current)=>({...current,deliveryReference:event.target.value}))}/><small>{["Pickup by Lalamove","Other Courier / Logistics"].includes(sendForm.deliveryMethod)?"Required for shipment tracking.":"Optional, but recommended for audit tracking."}</small></label>
      </div>
      <div className="wr-send-photo-section"><div className="wr-send-photo-head"><b>Dispatch Record Photos</b><span>Optional · Maximum 3 · High-quality compressed</span></div><input ref={sendPhotoInput} className="wr-send-photo-input" type="file" accept="image/*" multiple onChange={chooseSendPhotos}/>{sendForm.deliveryPhotos.length<3&&<div className="wr-send-photo-actions"><button type="button" onClick={openSendCamera}><Camera size={17}/> Take Photo</button><button type="button" onClick={()=>sendPhotoInput.current?.click()}><Plus size={17}/> Upload Photo</button></div>}{sendForm.deliveryPhotos.length>0&&<div className="wr-send-photo-strip">{sendForm.deliveryPhotos.map((photo,index)=><figure key={index}><img src={photo} alt={`Dispatch record ${index+1}`}/><button type="button" aria-label={`Remove dispatch photo ${index+1}`} onClick={()=>removeSendPhoto(index)}><Trash size={14}/></button></figure>)}</div>}</div>
      <div className="wr-send-rule"><CheckCircle size={17}/><span>The Warranty Claim will move to Sent to Supplier only after this delivery record is saved.</span></div>
      {error&&<div className="wr-error">{error}</div>}
      <div className="lm-modal-actions"><button onClick={()=>setSendRecord(null)}>Cancel</button><button className="primary" disabled={sendSaving||!sendForm.deliveryContact.trim()||(["Pickup by Lalamove","Other Courier / Logistics"].includes(sendForm.deliveryMethod)&&!sendForm.deliveryReference.trim())} onClick={confirmIndividualSend}><PaperPlaneTilt size={17}/>{sendSaving?"Saving Delivery...":"Confirm & Send to Supplier"}</button></div>
    </section></div>}

    {sendCameraOpen&&<div className="wr-send-camera-overlay" onClick={stopSendCamera}><section className="wr-send-camera-modal" role="dialog" aria-modal="true" aria-label="Dispatch Record Camera" onClick={(event)=>event.stopPropagation()}><header><div><h2>Dispatch Record Camera</h2><p>Capture the packed item, handover, vehicle, or courier label for reference.</p></div><button type="button" aria-label="Close Camera" onClick={stopSendCamera}><X size={20}/></button></header><video ref={sendCameraVideo} autoPlay playsInline muted/><div className="wr-send-camera-actions"><button type="button" onClick={stopSendCamera}>Cancel</button><button type="button" className="primary" onClick={captureSendPhoto}><Camera size={18}/> Capture Photo</button></div></section></div>}

    {returnRecord && <div className="lm-modal-bg wr-return-bg" onClick={()=>setReturnRecord(null)}><section className="lm-modal wr-return-modal" role="dialog" aria-modal="true" aria-labelledby="wr-return-title" onClick={(event)=>event.stopPropagation()}>
      <div className="wr-return-head"><Package size={29} weight="duotone"/><div><h2 id="wr-return-title">Record Individual Return</h2><p>{returnRecord.id} · {returnRecord.device} · {returnRecord.supplier}</p></div></div>
      <fieldset className="wr-return-options"><legend>Return Outcome *</legend>{["Warranty Approved","Rejected / Chargeable"].map((outcome)=><label key={outcome} className={returnForm.outcome===outcome?"selected":""}><input type="radio" name="return-outcome" checked={returnForm.outcome===outcome} onChange={()=>{setReturnForm({...blankReturn,outcome});setError("");}}/><span><b>{outcome}</b><small>{outcome==="Warranty Approved"?"Supplier accepted the claim and repaired or replaced an item.":"Supplier rejected the warranty claim; an external charge may apply."}</small></span></label>)}</fieldset>
      {returnForm.outcome === "Warranty Approved" ? <label className="wr-return-field">Replacement / Work Performed *<textarea rows="4" placeholder="Example: Replaced mainboard under warranty; updated BIOS and tested." value={returnForm.replacementDetails} onChange={(event)=>setReturnForm((current)=>({...current,replacementDetails:event.target.value}))}/></label> : <div className="wr-return-rejected"><label className="wr-return-field">Reject Reason *<textarea rows="4" placeholder="Example: Physical damage is not covered by manufacturer warranty." value={returnForm.rejectReason} onChange={(event)=>setReturnForm((current)=>({...current,rejectReason:event.target.value}))}/></label><label className="wr-return-field">Additional Charge (RM)<input type="number" min="0" step="0.01" placeholder="0.00" value={returnForm.additionalCharge} onChange={(event)=>setReturnForm((current)=>({...current,additionalCharge:event.target.value}))}/><small>Record supplier inspection, transport, parts, or other external charges.</small></label></div>}
      <div className="wr-return-link-note"><ArrowRight size={17}/><span>After recording the return, the linked Repair moves to Diagnosis. Any additional charge can be included in its quotation.</span></div>
      {error&&<div className="wr-error">{error}</div>}
      <div className="lm-modal-actions"><button onClick={()=>setReturnRecord(null)}>Cancel</button><button className="primary" disabled={returnSaving||(returnForm.outcome==="Warranty Approved"?!returnForm.replacementDetails.trim():!returnForm.rejectReason.trim())} onClick={recordIndividualReturn}><CheckCircle size={17}/>{returnSaving?"Saving Return...":"Confirm Individual Return"}</button></div>
    </section></div>}

    {reminderRecord && <div className="lm-modal-bg wr-reminder-bg" onClick={()=>setReminderRecord(null)}><section className="lm-modal wr-reminder-modal" role="dialog" aria-modal="true" aria-labelledby="wr-reminder-title" onClick={(event)=>event.stopPropagation()}>
      <div className="wr-reminder-head"><EnvelopeSimple size={28} weight="duotone"/><div><h2 id="wr-reminder-title">Supplier Email Reminder</h2><p>{reminderRecord.id} has been with {reminderRecord.supplier} for <b>{reminderRecord.sentDays} days</b>.</p></div></div>
      <div className="wr-reminder-meta"><span><small>To</small><b>{reminderRecord.supplierEmail}</b></span><span><small>Sent Date</small><b>{reminderRecord.sent}</b></span><span><small>Expected Return</small><b>{reminderRecord.expected}</b></span></div>
      <label>Subject<input value={reminderSubject} onChange={(event)=>setReminderSubject(event.target.value)}/></label>
      <label>Message<textarea rows="10" value={reminderMessage} onChange={(event)=>setReminderMessage(event.target.value)}/></label>
      <p className="wr-email-method"><EnvelopeSimple size={15}/> Opens with {emailConfiguration.method||"Default Email App (mailto)"}. The reminder time and count will be recorded.</p>
      {error&&<div className="wr-error">{error}</div>}
      <div className="lm-modal-actions"><button onClick={()=>setReminderRecord(null)}>Cancel</button><button className="primary" disabled={reminderSending||!reminderSubject.trim()||!reminderMessage.trim()} onClick={sendSupplierReminder}><PaperPlaneTilt size={17}/>{reminderSending?"Preparing Email...":"Send Email Reminder"}</button></div>
    </section></div>}

    {batchOpen && <div className="lm-modal-bg" onClick={() => setBatchOpen(false)}><section className="lm-modal wr-batch-modal" onClick={(event) => event.stopPropagation()}><div className="wr-batch-head"><div><h2>Batch Preparation</h2><p>Pick Preparation items for one combined shipment. Returns will still be recorded individually.</p></div><Package size={28} weight="duotone"/></div><label className="wr-batch-supplier">Supplier<select aria-label="Batch Supplier" value={batchSupplier} onChange={(event)=>{setBatchSupplier(event.target.value);setBatchSelection([]);}}>{batchSuppliers.map((supplier)=><option key={supplier}>{supplier}</option>)}</select></label><div className="wr-batch-items"><header><b>Pick Warranty Items</b><span>{batchSelection.length} selected</span></header>{batchItems.map((record)=><label key={record.id} className={batchSelection.includes(record.id)?"selected":""}><input type="checkbox" checked={batchSelection.includes(record.id)} onChange={()=>toggleBatchItem(record.id)}/><span><b>{record.id} · {record.device}</b><small>{record.repair} · {record.customer}</small></span></label>)}</div><div className="wr-batch-fields"><label>Expected Return<input type="date" value={batchExpected} onChange={(event)=>setBatchExpected(event.target.value)}/></label><label>Batch Notes<input placeholder="Courier, tracking number, package notes..." value={batchNotes} onChange={(event)=>setBatchNotes(event.target.value)}/></label></div>{error&&<div className="wr-error">{error}</div>}<div className="wr-batch-rule"><CheckCircle size={17}/><span>Items share one outbound batch, while each Warranty Claim keeps its own claim reference, status and individual Returned Date.</span></div><div className="lm-modal-actions"><button onClick={()=>setBatchOpen(false)}>Cancel</button><button className="primary" disabled={batchSaving||!batchSelection.length} onClick={sendBatch}><PaperPlaneTilt size={17}/>{batchSaving?"Sending Batch...":`Send ${batchSelection.length||""} Item${batchSelection.length===1?"":"s"} to Supplier`}</button></div></section></div>}

    {creating && <div className="lm-modal-bg" onClick={() => setCreating(false)}><form className="lm-modal wr-create" onSubmit={createClaim} onClick={(event) => event.stopPropagation()}><h2>New Warranty Claim</h2><p>Link an existing Repair to the Warranty workflow.</p><div className="wr-form-grid"><label className="wide">Linked Repair *<select autoFocus aria-label="Linked Repair" value={claimForm.repair} onChange={(event)=>selectRepair(event.target.value)}><option value="">Select an existing Repair</option>{repairRecords.map((repair)=><option value={repair.no} disabled={activeWarrantyRepairNos.has(repair.no)&&repair.no!==claimForm.repair} key={repair.no}>{repair.no} · {repair.customer} · {repair.device}{activeWarrantyRepairNos.has(repair.no)?" · Active Warranty":""}</option>)}</select></label><label>Customer<input value={claimForm.customer} readOnly/></label><label>Device<input value={claimForm.device} readOnly/></label><label>Supplier *<select value={claimForm.supplier} onChange={(event) => updateClaim("supplier",event.target.value)}><option value="">Select supplier</option>{suppliers.filter((supplier)=>supplier.status==="Active").map((supplier)=><option key={supplier.id}>{supplier.company}</option>)}</select></label><label>Expected Return<input type="date" value={claimForm.expected} onChange={(event) => updateClaim("expected",event.target.value)}/></label><label className="wide">Preparation Notes<textarea rows="3" value={claimForm.notes} onChange={(event) => updateClaim("notes",event.target.value)}/></label><label className="wide wr-create-batch"><input type="checkbox" checked={claimForm.batchToSupplier} onChange={(event)=>updateClaim("batchToSupplier",event.target.checked)}/><span><b>Batch to Supplier</b><small>Add this claim to Batch Preparation after creation.</small></span></label></div>{error && <div className="wr-error">{error}</div>}<div className="lm-modal-actions"><button type="button" onClick={() => setCreating(false)}>Cancel</button><button className="primary" type="submit">Create Warranty from Repair</button></div></form></div>}
    {directCreating && <div className="lm-modal-bg" onClick={() => setDirectCreating(false)}><form className="lm-modal wr-create wr-intake-modal" onSubmit={createClaim} onClick={(event) => event.stopPropagation()}><h2>Direct Warranty Intake</h2><p>Register a walk-in claim. The system creates its linked Repair service case automatically.</p><div className="wr-claim-mode"><button type="button" onClick={openExistingClaim}>Existing Repair</button><button type="button" className="active">Direct Warranty Intake</button></div><div className="wr-direct-note"><b>One intake, two linked records</b><span>The Repair service case and Warranty Claim are saved together, then follow the same Batch and individual return workflow.</span></div><div className="wr-form-grid"><label className="wide">Customer *<select autoFocus aria-label="Direct Warranty Customer" value={claimForm.customerId} onChange={(event)=>selectDirectCustomer(event.target.value)}><option value="">Select an existing Customer</option>{customerRecords.map((customer)=><option value={customer.id} key={customer.id}>{customer.name||customer.company} · {customer.mobile||customer.phone||"No phone"}</option>)}</select></label><label>Contact<input value={claimForm.phone} readOnly/></label><label>Device Type<select value={claimForm.deviceType} onChange={(event)=>updateClaim("deviceType",event.target.value)}><option>Laptop</option><option>Desktop</option><option>Tablet</option><option>Mobile Phone</option><option>Printer</option><option>Other</option></select></label><label>Brand *<input value={claimForm.brand} onChange={(event)=>updateClaim("brand",event.target.value)}/></label><label>Model *<input value={claimForm.model} onChange={(event)=>updateClaim("model",event.target.value)}/></label><label>Serial Number *<input value={claimForm.serial} onChange={(event)=>updateClaim("serial",event.target.value)}/></label><label>Purchase Date<input type="date" value={claimForm.purchaseDate} onChange={(event)=>updateClaim("purchaseDate",event.target.value)}/></label><label className="wide">Reported Issue *<textarea rows="3" value={claimForm.issue} onChange={(event)=>updateClaim("issue",event.target.value)}/></label><label>Supplier *<select value={claimForm.supplier} onChange={(event)=>updateClaim("supplier",event.target.value)}><option value="">Select supplier</option>{suppliers.filter((supplier)=>supplier.status==="Active").map((supplier)=><option key={supplier.id}>{supplier.company}</option>)}</select></label><label>Expected Return<input type="date" value={claimForm.expected} onChange={(event)=>updateClaim("expected",event.target.value)}/></label><label className="wide">Preparation Notes<textarea rows="3" value={claimForm.notes} onChange={(event)=>updateClaim("notes",event.target.value)}/></label><label className="wide wr-create-batch"><input type="checkbox" checked={claimForm.batchToSupplier} onChange={(event)=>updateClaim("batchToSupplier",event.target.checked)}/><span><b>Batch to Supplier</b><small>Add this claim to Batch Preparation after creation.</small></span></label></div>{error&&<div className="wr-error">{error}</div>}<div className="lm-modal-actions"><button type="button" onClick={()=>setDirectCreating(false)}>Cancel</button><button className="primary" type="submit">Create Direct Warranty Intake</button></div></form></div>}
    {individualConfirmation&&<WarrantyIndividualSentConfirmation record={individualConfirmation} companyProfile={companyProfile} onClose={()=>setIndividualConfirmation(null)} onPrint={()=>printIndividualConfirmation(individualConfirmation)} onEmail={()=>emailIndividualConfirmation(individualConfirmation)} emailing={confirmationEmailing}/>} 
    {batchHistoryOpen && <WarrantyBatchHistory batches={batchState.batches} onClose={()=>setBatchHistoryOpen(false)} onReprint={openBatchConfirmation}/>} 
    {batchConfirmation && <WarrantyBatchSentConfirmation batch={batchConfirmation} companyProfile={companyProfile} onClose={()=>setBatchConfirmation(null)} onPrint={printBatchConfirmation}/>} 
    {notice && <div className="wr-toast" onClick={() => setNotice("")}>{notice}</div>}
  </ListingModule>;
}
