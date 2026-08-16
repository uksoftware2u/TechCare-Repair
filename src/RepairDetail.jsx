import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenText,
  CalendarBlank,
  CheckCircle,
  Eye,
  FileText,
  FloppyDisk,
  MagnifyingGlassPlus,
  Package,
  PaperPlaneTilt,
  Plus,
  Printer,
  Star,
  Trash,
  User,
  Wrench,
  X,
  YoutubeLogo,
} from "@phosphor-icons/react";
import "./quotation-preview.css";
import "./quotation-watermark.css";
import "./test-ratings.css";
import "./repair-warranty-link.css";
import "./diagnosis-completion.css";
import "./diagnosis-route-icons.css";
import "./repair-workflow-track.css";
import "./repair-work-execution.css";
import "./diagnosis-bypass.css";
import "./diagnosis-tests-remark.css";
import "./diagnosis-photos.css";
import "./diagnosis-attention.css";
import "./quotation-stock-items.css";
import "./quotation-delete-item.css";
import "./quotation-approval-flow.css";
import { databaseApi } from "./database-api.js";
import { useAccess } from "./access-control.jsx";
import { MasterDataNav } from "./components/MasterDataNav.jsx";
import { ModuleNavIcon } from "./components/ModuleNavIcon.jsx";

const tests = [
  "Visual inspection",
  "BIOS keyboard test",
  "Driver & Device Manager",
  "External keyboard test",
  "Ribbon cable & connector",
  "Liquid damage check",
];
const stages = ["Received", "Diagnosis", "Quotation", "Repair", "Ready"];
const commonPostRepairTests = [
  "Power On / Boot",
  "Original Customer Issue Retest",
  "Main Functions",
  "Ports / Connectivity",
  "Temperature / Stability",
  "Final Visual Check",
];
const repairSubstages = ["Preparation", "Installation", "Testing", "QA", "Ready Gate"];
const repairSubstageLabels = { Preparation: "Technician Guide", Installation: "Repair", Testing: "Testing", QA: "Final QA", "Ready Gate": "Ready Gate" };
const emptyTechnicianGuide = { note: "", serviceImageUrl: "", disassemblyImageUrl: "", anatomyImageUrl: "", youtubeUrl: "" };

function isComputerRepair(deviceType) {
  return /computer|desktop|laptop|notebook|workstation|all.?in.?one/i.test(String(deviceType || ""));
}
function youtubeEmbedUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    let id = "";
    if (/(^|\.)youtu\.be$/i.test(url.hostname)) id = url.pathname.split("/").filter(Boolean)[0] || "";
    if (/(^|\.)youtube\.com$/i.test(url.hostname)) id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] || "";
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function workflowId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
}
function elapsedMinutes(start, end) {
  if (!start || !end) return null;
  const value = Math.round((new Date(end) - new Date(start)) / 60000);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function elapsedLabel(minutes) {
  if (minutes === null) return "Not recorded";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours < 24) return `${hours}h ${remainder}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
function assessmentDate(value) {
  return value
    ? new Date(value).toLocaleString("en-MY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "Not recorded";
}
const fallbackRepair = {
  no: "SR-20260812-002",
  customer: "Lim Wei Jie",
  phone: "+60 16-778 8990",
  device: "ASUS VivoBook 14 X1404ZA",
  issue: "Keyboard not working",
  technician: "Rizal",
  status: "Waiting Approval",
  due: "15/08/2026",
  amount: "RM 180.00",
};

function stageIndex(status) {
  if (status === "Received") return 0;
  if (status === "Diagnosis") return 1;
  if (status === "Waiting Approval") return 2;
  if (status === "Repairing") return 3;
  if (["Warranty Preparation", "Warranty - Sent to Supplier"].includes(status))
    return 3;
  if (status === "Ready for Collection") return 4;
  return 0;
}

export function RepairDetail({
  onBack,
  repair,
  onRepairUpdate,
  companyProfile,
  onCreateWarranty,
  onDashboard,
  onWarranty,
  onCollections,
  onOnsiteService,
  onContracts,
}) {
  const { can } = useAccess();
  const detail = repair || fallbackRepair;
  const [repairStatus, setRepairStatus] = useState(detail.status);
  const activeStage = stageIndex(repairStatus);
  const workflowAnchor = useRef(null);
  const [workflowFocus, setWorkflowFocus] = useState(
    activeStage === 0 ? 1 : activeStage,
  );
  const keyboardRepair = detail.no === "SR-20260812-002";
  const receivedDate = detail.no.includes("20260811")
    ? "11/08/2026"
    : "12/08/2026";
  const deviceIdentifierLabel =
    detail.identifierType === "Customer Asset Tag"
      ? "Asset Tag"
      : ["Custom Built - No Serial", "Serial Label Missing"].includes(
            detail.identifierType,
          )
        ? "Internal ID"
        : "SN";
  const deviceIdentifier =
    detail.identifierType === "Customer Asset Tag"
      ? detail.customerAssetTag
      : ["Custom Built - No Serial", "Serial Label Missing"].includes(
            detail.identifierType,
          )
        ? detail.internalDeviceId
        : detail.serial;
  const recordedDeviceIdentifier =
    deviceIdentifier || detail.serial || detail.internalDeviceId || "Not recorded";
  const repairPhotos = Array.isArray(detail.photos)
    ? detail.photos
        .filter((photo) => typeof photo === "string" && photo.trim())
        .slice(0, 3)
    : [];
  const [lines, setLines] = useState(() =>
    keyboardRepair
      ? [
          { name: "Diagnostic Fee", qty: 1, price: 30, discount: 0 },
          { name: "Keyboard Module", qty: 1, price: 150, discount: 0 },
          { name: "Labour", qty: 1, price: 50, discount: 0 },
        ]
      : [{ name: "Diagnostic Fee", qty: 1, price: 50, discount: 0 }],
  );
  const [approval, setApproval] = useState("Email");
  const [sent, setSent] = useState(false);
  const [quotationIssued, setQuotationIssued] = useState(
    ["Sent", "Approved"].includes(detail.quotationStatus),
  );
  const [quotationBusy,setQuotationBusy]=useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  const [validUntil, setValidUntil] = useState("2026-08-19");
  const [message, setMessage] = useState(
    "Please review the quotation above. Let us know if you have any questions.",
  );
  const [symptom, setSymptom] = useState(detail.issue);
  const [explanation, setExplanation] = useState(
    activeStage === 0
      ? "Pending technician diagnosis."
      : keyboardRepair
        ? "The built-in keyboard is faulty. We recommend replacement."
        : `Inspection findings for: ${detail.issue}`,
  );
  const [rootCause, setRootCause] = useState(
    activeStage === 0
      ? "Not diagnosed yet."
      : keyboardRepair
        ? "Internal keyboard module faulty. Ribbon connector stable, no corrosion."
        : "Diagnosis in progress.",
  );
  const [internalNote, setInternalNote] = useState(
    `${detail.no} · ${detail.status}`,
  );
  const [recommendedRepair, setRecommendedRepair] = useState(
    keyboardRepair
      ? "Replace keyboard module"
      : "Inspection / diagnosis required",
  );
  const [testsPerformedRemark, setTestsPerformedRemark] = useState("");
  const [testRatings, setTestRatings] = useState(() =>
    Object.fromEntries(
      tests.map((test, index) => [
        test,
        activeStage === 0 ? 0 : keyboardRepair && index === 1 ? 2 : 5,
      ]),
    ),
  );
  const [diagnosisNotice, setDiagnosisNotice] = useState("");
  const [technicalUsers, setTechnicalUsers] = useState([]);
  const [technicalCheckedBy, setTechnicalCheckedBy] = useState("");
  const [technicalCheckedAt, setTechnicalCheckedAt] = useState("");
  const [technicalCheckRemark, setTechnicalCheckRemark] = useState("");
  const [diagnosisCompleted, setDiagnosisCompleted] = useState(
    ["Waiting Approval", "Repairing"].includes(detail.status),
  );
  const diagnosisNeedsAttention =
    !diagnosisCompleted && ["Received", "Diagnosis"].includes(repairStatus);
  const maxAccessibleStage = Math.max(
    diagnosisCompleted ? 2 : 1,
    stageIndex(repairStatus),
  );
  const [completionRoute, setCompletionRoute] = useState("");
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [checkerSelection, setCheckerSelection] = useState("");
  const [checkerRemark, setCheckerRemark] = useState("");
  const [checkerRoute, setCheckerRoute] = useState("Prepare Quotation");
  const [checkerError, setCheckerError] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [repairWorkflow, setRepairWorkflow] = useState({
    assignedTechnician: detail.technician === "Unassigned" ? "" : detail.technician || "",
    partsReady: false,
    oldPartsDisposition: "Return to Customer",
    currentSubstage: "Preparation",
    items: [],
    tests: [],
    qa: {
      issueResolved: false,
      conditionVerified: false,
      accessoriesVerified: false,
      dataHandlingConfirmed: false,
      checkedBy: "",
      remark: "",
      confirmedAt: null,
    },
    activity: [],
    assessment: {},
    technicianGuide: { ...emptyTechnicianGuide },
  });
  const [repairWorkflowBusy, setRepairWorkflowBusy] = useState(false);
  const [repairWorkflowNotice, setRepairWorkflowNotice] = useState("");
  const [repairSubFocus, setRepairSubFocus] = useState("Preparation");
  const [testingIssueFound, setTestingIssueFound] = useState(false);
  const [testingRemark, setTestingRemark] = useState("");
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [enlargedGuideImage, setEnlargedGuideImage] = useState(null);
  const [technicianGuideOpen, setTechnicianGuideOpen] = useState(false);
  useEffect(() => {
    if (!enlargedPhoto) return;
    const close = (event) => {
      if (event.key === "Escape") setEnlargedPhoto(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [enlargedPhoto]);
  useEffect(() => {
    if (!enlargedGuideImage) return;
    const close = (event) => {
      if (event.key === "Escape") setEnlargedGuideImage(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [enlargedGuideImage]);
  useEffect(() => {
    if (!technicianGuideOpen) return;
    const close = (event) => {
      if (event.key === "Escape") setTechnicianGuideOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [technicianGuideOpen]);
  useEffect(() => {
    databaseApi
      .users()
      .then((users) =>
        setTechnicalUsers(
          users.filter(
            (user) =>
              user.status === "Active" &&
              ["Technician", "Supervisor", "Manager", "Administrator"].includes(user.role),
          ),
        ),
      )
      .catch(() => setTechnicalUsers([]));
  }, []);
  useEffect(() => {
    databaseApi.stockItems().then((items) => setStockItems(items.filter((item) => item.active))).catch(() => setStockItems([]));
  }, []);
  useEffect(() => {
    databaseApi
      .repairWorkflow(detail.no)
      .then((value) => {
        setRepairSubFocus(value.currentSubstage || "Preparation");
        const failedTest = (value.tests || []).find((test) => test.result === "Fail");
        setTestingIssueFound(Boolean(failedTest));
        setTestingRemark(failedTest?.observation || "");
        setRepairWorkflow((current) => ({
          ...current,
          ...value,
          assignedTechnician:
            value.assignedTechnician || current.assignedTechnician,
          items: value.items || [],
          tests: value.tests || [],
          qa: { ...current.qa, ...(value.qa || {}) },
          activity: value.activity || [],
          technicianGuide: { ...emptyTechnicianGuide, ...(value.technicianGuide || {}) },
        }));
      })
      .catch(() => {});
  }, [detail.no]);
  useEffect(() => {
    databaseApi
      .diagnosis(detail.no)
      .then((value) => {
        setSymptom(value.symptom);
        setExplanation(value.explanation);
        setRootCause(value.rootCause);
        setInternalNote(value.internalNote);
        setRecommendedRepair(value.recommendedRepair);
        setTestsPerformedRemark(value.testsPerformedRemark || "");
        setTestRatings(value.testRatings);
        setTechnicalCheckedBy(value.technicalCheckedBy || "");
        setTechnicalCheckedAt(value.technicalCheckedAt || "");
        setTechnicalCheckRemark(value.technicalCheckRemark || "");
        setDiagnosisCompleted(Boolean(value.diagnosisCompleted));
        setCompletionRoute(value.completionRoute || "");
        setDiagnosisHistory(value.history || []);
        if (value.quotation?.lines) setLines(value.quotation.lines);
        if (value.quotation?.approval) setApproval(value.quotation.approval);
        if (value.quotation?.validUntil)
          setValidUntil(value.quotation.validUntil);
        if (value.quotation?.message) setMessage(value.quotation.message);
        if (value.quotation?.status)
          setQuotationIssued(
            ["Sent", "Approved"].includes(value.quotation.status),
          );
      })
      .catch(() => {});
  }, [detail.no]);
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0),
    [lines],
  );
  const discount = useMemo(
    () => lines.reduce((sum, line) => sum + Math.min(Math.max(Number(line.discount || 0), 0), Number(line.qty || 0) * Number(line.price || 0)), 0),
    [lines],
  );
  const taxableAmount = Math.max(subtotal - discount, 0);
  const sst = taxableAmount * 0.08;
  const total = taxableAmount + sst;
  const company = useMemo(() => {
    const fallback = {
      name: "TechCare PC Sdn. Bhd.",
      registration: "202601012345",
      address: "12, Jalan Kuchai Maju 8\n58200 Kuala Lumpur",
      phone: "+60 3-7981 8800",
      email: "service@techcare.my",
      logo: "",
    };
    return { ...fallback, ...companyProfile };
  }, [companyProfile]);
  function moveWorkflowFocus(index) {
    setWorkflowFocus(index);
    window.setTimeout(
      () =>
        workflowAnchor.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }
  function focusWorkflowStage(index) {
    if (index > maxAccessibleStage) return;
    moveWorkflowFocus(index);
  }
  const repairItemsComplete =
    repairWorkflow.items.length > 0 &&
    repairWorkflow.items.every((item) => item.status === "Completed");
  const repairTestsComplete =
    repairWorkflow.tests.length > 0 &&
    repairWorkflow.tests.every((test) => ["Pass", "N/A"].includes(test.result));
  const testingAllChecked =
    repairWorkflow.tests.length > 0 &&
    repairWorkflow.tests.every((test) => ["Pass", "N/A"].includes(test.result));
  const repairQaComplete =
    repairWorkflow.qa.issueResolved &&
    repairWorkflow.qa.conditionVerified &&
    repairWorkflow.qa.accessoriesVerified &&
    repairWorkflow.qa.dataHandlingConfirmed &&
    Boolean(repairWorkflow.qa.checkedBy) &&
    Boolean(repairWorkflow.qa.confirmedAt);
  const repairReadyGate =
    repairItemsComplete && repairTestsComplete && repairQaComplete;
  const repairWorkRemark = repairWorkflow.items[0]?.remark || "";
  const computerRepair = isComputerRepair(detail.deviceType);
  const computerReferenceImage = /desktop|workstation/i.test(String(detail.deviceType || ""))
    ? "/desktop-pc-technician-reference.png"
    : "/computer-technician-reference.png";
  const guideVideoEmbed = youtubeEmbedUrl(repairWorkflow.technicianGuide?.youtubeUrl);
  const technicianGuideLocked = ["Ready for Collection", "Completed", "Collected"].includes(repairStatus);
  const repairCurrentSubstageIndex = Math.max(
    repairSubstages.indexOf(repairWorkflow.currentSubstage),
    0,
  );
  const repairSubFocusIndex = Math.max(repairSubstages.indexOf(repairSubFocus), 0);
  const repairSubReadOnly = repairSubFocusIndex < repairCurrentSubstageIndex;
  const readyAssessment = useMemo(() => {
    const data = repairWorkflow.assessment || {};
    const diagnosisTotal = Number(data.diagnosisCheckCount || tests.length);
    const diagnosisChecked = Number(data.diagnosisCheckedCount || 0);
    const diagnosisCoverage = diagnosisTotal
      ? Math.round((diagnosisChecked / diagnosisTotal) * 100)
      : 0;
    const testTotal = repairWorkflow.tests.length;
    const testPassed = repairWorkflow.tests.filter((test) => test.result === "Pass").length;
    const testNotFullyChecked = repairWorkflow.tests.filter((test) => test.result === "N/A");
    const testFailed = repairWorkflow.tests.filter((test) => test.result === "Fail").length;
    const testingCoverage = testTotal
      ? Math.round((testPassed / testTotal) * 100)
      : 0;
    const tracePoints = [
      data.receivedAt,
      data.diagnosisCompletedAt,
      data.repairStartedAt,
      data.qaConfirmedAt,
      data.readyAt,
    ];
    const traceCoverage = tracePoints.filter(Boolean).length / tracePoints.length;
    const qaPassed = repairQaComplete;
    const score = Math.round(
      diagnosisCoverage * 0.3 +
        testingCoverage * 0.35 +
        (qaPassed ? 20 : 0) +
        traceCoverage * 15,
    );
    const rating =
      score >= 90
        ? "Excellent"
        : score >= 75
          ? "Good"
          : score >= 60
            ? "Fair"
            : "Needs Attention";
    const warnings = [];
    if (diagnosisCoverage < 100)
      warnings.push(`${diagnosisTotal - diagnosisChecked} diagnosis check(s) were not rated.`);
    if (testNotFullyChecked.length)
      warnings.push(`${testNotFullyChecked.length} testing check(s) were recorded as N/A: ${testNotFullyChecked.map((test) => test.name).join(", ")}.`);
    if (testFailed) warnings.push(`${testFailed} testing check(s) still show Fail.`);
    if (!data.diagnosisCompletedAt) warnings.push("Diagnosis completion time was not recorded.");
    return {
      ...data,
      diagnosisTotal,
      diagnosisChecked,
      diagnosisCoverage,
      testTotal,
      testPassed,
      testNotFullyChecked,
      testingCoverage,
      score,
      rating,
      warnings,
      receivedToDiagnosis: elapsedMinutes(data.receivedAt, data.diagnosisCompletedAt),
      diagnosisToRepair: elapsedMinutes(data.diagnosisCompletedAt, data.repairStartedAt),
      repairToReady: elapsedMinutes(data.repairStartedAt, data.readyAt),
      totalTurnaround: elapsedMinutes(data.receivedAt, data.readyAt),
    };
  }, [repairWorkflow.assessment, repairWorkflow.tests, repairQaComplete]);
  async function persistRepairWorkflow(next, activity) {
    setRepairWorkflowBusy(true);
    setRepairWorkflowNotice("");
    try {
      const payload = {
        ...next,
        activity: activity
          ? {
              ...activity,
              performedBy:
                activity.performedBy ||
                next.assignedTechnician ||
                "System User",
            }
          : undefined,
      };
      await databaseApi.saveRepairWorkflow(detail.no, payload);
      const refreshed = await databaseApi.repairWorkflow(detail.no);
      setRepairWorkflow((current) => ({
        ...current,
        ...refreshed,
        items: refreshed.items || [],
        tests: refreshed.tests || [],
        qa: { ...current.qa, ...(refreshed.qa || {}) },
        activity: refreshed.activity || [],
        technicianGuide: { ...emptyTechnicianGuide, ...(refreshed.technicianGuide || {}) },
      }));
      setRepairSubFocus(refreshed.currentSubstage || next.currentSubstage);
      return refreshed;
    } catch (error) {
      setRepairWorkflowNotice(`Unable to save Repair workflow: ${error.message}`);
      return null;
    } finally {
      setRepairWorkflowBusy(false);
    }
  }
  function updateTechnicianGuide(key, value) {
    setRepairWorkflow((current) => ({
      ...current,
      technicianGuide: { ...emptyTechnicianGuide, ...(current.technicianGuide || {}), [key]: value },
    }));
  }
  async function saveTechnicianGuide() {
    setRepairWorkflowBusy(true);
    setRepairWorkflowNotice("");
    try {
      const saved = await databaseApi.saveTechnicianGuide(detail.no, repairWorkflow.technicianGuide || emptyTechnicianGuide);
      setRepairWorkflow((current) => ({ ...current, technicianGuide: { ...emptyTechnicianGuide, ...(saved.technicianGuide || {}) } }));
      setRepairWorkflowNotice("Technician Guide saved for this repair.");
    } catch (error) {
      setRepairWorkflowNotice(`Unable to save Technician Guide: ${error.message}`);
    } finally {
      setRepairWorkflowBusy(false);
    }
  }
  async function startRepairWork() {
    if (!repairWorkflow.assignedTechnician) {
      setRepairWorkflowNotice("Assign a technician before starting Repair.");
      return;
    }
    if (!repairWorkflow.partsReady) {
      setRepairWorkflowNotice("Confirm that required parts are ready.");
      return;
    }
    try {
      await databaseApi.saveTechnicianGuide(detail.no, repairWorkflow.technicianGuide || emptyTechnicianGuide);
    } catch (error) {
      setRepairWorkflowNotice(`Check the Technician Guide links before starting: ${error.message}`);
      return;
    }
    const seededItems = repairWorkflow.items.length
      ? repairWorkflow.items
      : lines
          .filter(
            (line) =>
              (line.itemCode || line.name) &&
              !/diagnostic fee/i.test(line.name || ""),
          )
          .map((line) => ({
            id: workflowId("WORK"),
            itemCode: line.itemCode || "",
            description: line.name || "Repair work",
            action: line.itemType === "Service Item" ? "Repair Component" : "Install Component",
            serialBatchNo: "",
            qty: Number(line.qty || 1),
            installedBy: repairWorkflow.assignedTechnician,
            status: "Pending",
            remark: "",
          }));
    if (!seededItems.length)
      seededItems.push({
        id: workflowId("WORK"),
        itemCode: "",
        description: recommendedRepair || "Repair work",
        action: "Repair Component",
        serialBatchNo: "",
        qty: 1,
        installedBy: repairWorkflow.assignedTechnician,
        status: "Pending",
        remark: "",
      });
    const seededTests = repairWorkflow.tests.length
      ? repairWorkflow.tests
      : commonPostRepairTests.map((name) => ({
          id: workflowId("TEST"),
          name,
          result: "Pending",
          observation: "",
          testedBy: repairWorkflow.assignedTechnician,
        }));
    const next = {
      ...repairWorkflow,
      items: seededItems,
      tests: seededTests,
      currentSubstage: "Installation",
    };
    await persistRepairWorkflow(next, {
      type: "Repair Started",
      details: "Repair work prepared",
    });
    setRepairWorkflowNotice("Repair started · Record handler and remark.");
  }
  function updateRepairSummary(key, value) {
    setRepairWorkflow((current) => ({
      ...current,
      ...(key === "installedBy" ? { assignedTechnician: value } : {}),
      items: current.items.map((item) => ({ ...item, [key]: value })),
    }));
  }
  function toggleRepairTestChecked(test) {
    setRepairWorkflow((current) => ({
      ...current,
      tests: current.tests.map((item) =>
        item.id === test.id
          ? {
              ...item,
              result: ["Pass", "N/A"].includes(item.result) ? "Pending" : "Pass",
              testedBy: item.testedBy || current.assignedTechnician || "",
            }
          : item,
      ),
    }));
  }
  function updateAllTestsBy(value) {
    setRepairWorkflow((current) => ({
      ...current,
      tests: current.tests.map((test) => ({ ...test, testedBy: value })),
    }));
  }
  async function completeRepairWork() {
    if (!repairWorkflow.assignedTechnician) {
      setRepairWorkflowNotice("Select who handled this repair before continuing.");
      return;
    }
    const baseItems = repairWorkflow.items.length
      ? repairWorkflow.items
      : [{
          id: workflowId("WORK"),
          itemCode: "",
          description: recommendedRepair || "Repair completed",
          action: "Repair Component",
          serialBatchNo: "",
          qty: 1,
          remark: repairWorkRemark,
        }];
    const completedItems = baseItems.map((item) => ({
      ...item,
      installedBy: repairWorkflow.assignedTechnician,
      remark: repairWorkRemark,
      status: "Completed",
    }));
    const next = {
      ...repairWorkflow,
      items: completedItems,
      tests: repairWorkflow.tests.map((test) => ({
        ...test,
        result: test.result === "Fail" ? "Pending" : test.result,
        testedBy: test.testedBy || repairWorkflow.assignedTechnician,
      })),
      currentSubstage: "Testing",
    };
    const saved = await persistRepairWorkflow(next, {
      type: "Repair Completed",
      details: repairWorkRemark || "Repair work completed · Continue to testing",
    });
    if (saved) {
      setTestingIssueFound(false);
      setTestingRemark("");
      setRepairWorkflowNotice("Repair completed · Continue to Quick Retest.");
    }
  }
  async function saveRepairTests() {
    const testedBy =
      repairWorkflow.tests.find((test) => test.testedBy)?.testedBy ||
      repairWorkflow.assignedTechnician;
    if (!testedBy) {
      setRepairWorkflowNotice("Select who performed the testing.");
      return;
    }
    if (testingIssueFound) {
      const unchecked = repairWorkflow.tests.filter(
        (test) => !["Pass", "N/A"].includes(test.result),
      );
      if (!unchecked.length) {
        setRepairWorkflowNotice("Untick the check that has an issue.");
        return;
      }
      if (!testingRemark.trim()) {
        setRepairWorkflowNotice("Enter a short remark for the issue found.");
        return;
      }
      const failedTests = repairWorkflow.tests.map((test) => ({
        ...test,
        testedBy,
        result: ["Pass", "N/A"].includes(test.result) ? "Pass" : "Fail",
        observation: ["Pass", "N/A"].includes(test.result)
          ? test.observation
          : testingRemark.trim(),
      }));
      const next = {
        ...repairWorkflow,
        tests: failedTests,
        currentSubstage: "Installation",
      };
      const saved = await persistRepairWorkflow(next, {
        type: "Post-Repair Test Failed",
        details: `${unchecked.map((test) => test.name).join(", ")} · ${testingRemark.trim()}`,
      });
      if (saved)
        setRepairWorkflowNotice("Issue recorded · Returned to Repair.");
      return;
    }
    if (!testingAllChecked && !testingRemark.trim()) {
      setRepairWorkflowNotice("Enter a remark explaining why testing was not fully completed.");
      return;
    }
    const passedTests = repairWorkflow.tests.map((test) => ({
      ...test,
      result: ["Pass", "N/A"].includes(test.result) ? "Pass" : "N/A",
      testedBy,
      observation: ["Pass", "N/A"].includes(test.result)
        ? test.observation
        : `Not fully tested: ${testingRemark.trim()}`,
    }));
    const next = {
      ...repairWorkflow,
      tests: passedTests,
      currentSubstage: "QA",
    };
    const saved = await persistRepairWorkflow(next, {
      type: "Post-Repair Testing Completed",
      details: testingAllChecked
        ? `${passedTests.length} checks passed`
        : `${passedTests.filter((test) => test.result === "Pass").length}/${passedTests.length} checks passed · Incomplete testing: ${testingRemark.trim()}`,
    });
    if (saved)
      setRepairWorkflowNotice("Testing completed · Final QA is now required.");
  }
  function updateRepairQa(key, value) {
    setRepairWorkflow((current) => ({
      ...current,
      qa: { ...current.qa, [key]: value, confirmedAt: null },
    }));
  }
  async function confirmRepairQa() {
    const qa = repairWorkflow.qa;
    if (
      !qa.checkedBy ||
      !qa.issueResolved ||
      !qa.conditionVerified ||
      !qa.accessoriesVerified ||
      !qa.dataHandlingConfirmed
    ) {
      setRepairWorkflowNotice("Complete all Final QA confirmations and select QA Checked By.");
      return;
    }
    const next = {
      ...repairWorkflow,
      currentSubstage: "Ready Gate",
      qa: { ...qa, confirmedAt: new Date().toISOString() },
    };
    await persistRepairWorkflow(next, {
      type: "Final QA Confirmed",
      details: qa.remark || "All QA checks confirmed",
      performedBy: qa.checkedBy,
    });
    setRepairWorkflowNotice("Final QA confirmed · Device can now be marked Ready.");
  }
  function printQuotation() {
    setPrintCount((count) => count + 1);
    window.setTimeout(() => window.print(), 100);
  }
  function quotationPayload(){return{lines,approval,validUntil,message};}
  async function sendQuotation(){
    if(!lines.length){setDiagnosisNotice("Add at least one Quotation Item before sending.");return;}
    setQuotationBusy(true);
    try{const saved=await databaseApi.quotationAction(detail.no,{action:"Send",quotation:quotationPayload()});setRepairStatus(saved.status);setQuotationIssued(true);onRepairUpdate?.({...detail,status:saved.status,quotationStatus:"Sent"});setSent(true);setDiagnosisNotice("");}
    catch(error){setDiagnosisNotice(`Quotation send failed: ${error.message}`);}
    finally{setQuotationBusy(false);}
  }
  async function approveQuotation(){
    if(!window.confirm(`Confirm customer approval for ${detail.no} and start Repair?`))return;
    setQuotationBusy(true);
    try{const saved=await databaseApi.quotationAction(detail.no,{action:"Approve",quotation:quotationPayload()});setRepairStatus(saved.status);setQuotationIssued(true);onRepairUpdate?.({...detail,status:saved.status,quotationStatus:"Approved"});setDiagnosisNotice("Quotation approved · Repair workflow started");moveWorkflowFocus(3);}
    catch(error){setDiagnosisNotice(`Unable to start Repair: ${error.message}`);}
    finally{setQuotationBusy(false);}
  }
  async function markReadyForCollection(){
    if(!window.confirm(`Complete ${detail.no} and post it to Ready for Collection?`))return;
    setQuotationBusy(true);setDiagnosisNotice("");
    try{await databaseApi.updateRepair(detail.no,{status:"Ready for Collection",technician:repairWorkflow.assignedTechnician||detail.technician});const refreshed=await databaseApi.repairWorkflow(detail.no);setRepairWorkflow((current)=>({...current,...refreshed,items:refreshed.items||[],tests:refreshed.tests||[],qa:{...current.qa,...(refreshed.qa||{})},activity:refreshed.activity||[],assessment:refreshed.assessment||{}}));const updated={...detail,status:"Ready for Collection",technician:repairWorkflow.assignedTechnician||detail.technician};setRepairStatus("Ready for Collection");onRepairUpdate?.(updated);setDiagnosisNotice("Repair completed · Posted to Ready for Collection · commission ledger updated");moveWorkflowFocus(4);}
    catch(error){setDiagnosisNotice(`Unable to complete Repair: ${error.message}`);}
    finally{setQuotationBusy(false);}
  }
  async function saveDiagnosisDraft({
    complete = false,
    checker = "",
    remark = "",
    route = "Prepare Quotation",
  } = {}) {
    const quotationReady = complete && route === "Prepare Quotation";
    const saved = await databaseApi.saveDiagnosis(detail.no, {
      symptom,
      explanation,
      rootCause,
      internalNote,
      recommendedRepair,
      testsPerformedRemark,
      testRatings,
      diagnosisCompleted: complete,
      completionRoute: route,
      quotationReady: complete && route === "Prepare Quotation",
      technicalCheckedBy: checker,
      technicalCheckRemark: remark,
      quotation: { lines, approval, validUntil, message },
    });
    setDiagnosisHistory((current) =>
      [
        {
          id: saved.diagnosisId,
          savedAt: saved.savedAt,
          completed: complete,
          route: complete ? route : "Draft",
          checkedBy: checker,
          remark,
        },
        ...current,
      ].slice(0, 20),
    );
    if (complete) {
      setTechnicalCheckedBy(checker);
      setTechnicalCheckedAt(
        saved.technicalCheckedAt ||
          new Date().toLocaleString("en-MY", { hour12: false }),
      );
      setTechnicalCheckRemark(remark);
      setCompletionRoute(route);
      setDiagnosisCompleted(true);
    }
    setDiagnosisNotice(
      quotationReady
        ? "Diagnosis completed · Quotation is ready for customer approval"
        : "Diagnosis draft saved to SQL Server",
    );
    setDiagnosisNotice(
      complete
        ? route === "Bypass Quotation"
          ? "Diagnosis completed · Quotation bypassed · Repair started"
          : "Diagnosis completed · Quotation is ready for customer approval"
        : "Diagnosis draft saved · Continue diagnosis on the next session when needed",
    );
    return saved;
  }
  function openTechnicalChecker() {
    const preferred =
      technicalUsers.find((user) => user.name === detail.technician)?.name ||
      technicalUsers[0]?.name ||
      "";
    setCheckerSelection(technicalCheckedBy || preferred);
    setCheckerRemark(technicalCheckRemark || "");
    setCheckerRoute(completionRoute || "Prepare Quotation");
    setCheckerError("");
    setCheckerOpen(true);
  }
  async function confirmDiagnosisChecker() {
    if (!checkerSelection) {
      setCheckerError("Technical Checked By is required.");
      return;
    }
    const nextStatus =
      checkerRoute === "Bypass Quotation" ? "Repairing" : "Waiting Approval";
    try {
      await saveDiagnosisDraft({
        complete: true,
        checker: checkerSelection,
        remark: checkerRemark,
        route: checkerRoute,
      });
      setRepairStatus(nextStatus);
      onRepairUpdate?.({ ...detail, status: nextStatus });
      setCheckerOpen(false);
      moveWorkflowFocus(checkerRoute === "Bypass Quotation" ? 3 : 2);
    } catch (error) {
      setCheckerError(`SQL Server save failed: ${error.message}`);
    }
  }

  function selectQuotationItem(index,itemCode) {
    const selected=stockItems.find((item)=>item.code===itemCode);
    setLines((current)=>current.map((line,lineIndex)=>lineIndex===index?(selected?{...line,itemCode:selected.code,name:selected.description,price:Number(selected.price),minPrice:Number(selected.minPrice),itemType:selected.type,discount:Number(line.discount||0)}:{...line,itemCode:""}):line));
  }

  function renderTechnicianGuide() {
    return <div className="technician-guide-page technician-guide-modal-body">
      <div className="technician-guide-summary"><BookOpenText size={26} weight="duotone" /><span><b>{detail.deviceType || "Device"} repair reference</b><small>{computerRepair ? "Computer service points, safe disassembly and internal anatomy are shown automatically." : "Add reference diagrams and a video link for this device type."}</small></span></div>
      <div className="technician-guide-grid">
        {[
          ["serviceImageUrl", "Service Points", "Inspection and repair access locations", "service"],
          ["disassemblyImageUrl", "Disassembly", "Safe opening and component removal order", "disassembly"],
          ["anatomyImageUrl", "Internal Anatomy", "Internal components for identification and discussion", "anatomy"],
        ].map(([key, title, description, crop]) => {
          const customUrl = repairWorkflow.technicianGuide?.[key] || "";
          const imageSrc = customUrl || (computerRepair ? computerReferenceImage : "");
          const openImage = () => imageSrc && setEnlargedGuideImage({ src: imageSrc, title, crop: customUrl ? "custom" : crop });
          return <article className="technician-guide-card" key={key}><div className={`technician-guide-image-frame ${customUrl ? "custom" : crop}`} role={imageSrc ? "button" : undefined} tabIndex={imageSrc ? 0 : undefined} aria-label={imageSrc ? `Enlarge ${title} reference image` : undefined} onClick={openImage} onKeyDown={(event) => { if (imageSrc && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openImage(); } }}>{customUrl ? <img src={customUrl} alt={`${title} reference`} /> : computerRepair ? <img src={computerReferenceImage} alt={`${title} ${detail.deviceType || "computer"} repair reference`} /> : <span><BookOpenText size={30} /><small>Add an image URL below</small></span>}{imageSrc && <span className="technician-guide-zoom" aria-hidden="true"><MagnifyingGlassPlus size={19} /></span>}</div><div><b>{title}</b><small>{description}</small></div><label>Reference Image URL<input disabled={technicianGuideLocked || repairWorkflowBusy} type="url" placeholder="https://..." value={customUrl} onChange={(event) => updateTechnicianGuide(key, event.target.value)} /></label></article>;
        })}
      </div>
      <div className="technician-guide-inputs">
        <label>Executor Notes<textarea disabled={technicianGuideLocked || repairWorkflowBusy} placeholder="Safety notes, model-specific cautions, screw locations, tools or communication points..." value={repairWorkflow.technicianGuide?.note || ""} onChange={(event) => updateTechnicianGuide("note", event.target.value)} /></label>
        <label>YouTube Reference URL<div className="technician-youtube-input"><YoutubeLogo size={21} weight="fill" /><input disabled={technicianGuideLocked || repairWorkflowBusy} type="url" placeholder="https://www.youtube.com/watch?v=..." value={repairWorkflow.technicianGuide?.youtubeUrl || ""} onChange={(event) => updateTechnicianGuide("youtubeUrl", event.target.value)} /></div><small>Use a model-specific teardown or repair video that the technician can review before work.</small></label>
      </div>
      {guideVideoEmbed && <div className="technician-guide-video"><iframe src={guideVideoEmbed} title="Technician YouTube reference" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
      {!technicianGuideLocked && <div className="technician-guide-actions"><button type="button" onClick={saveTechnicianGuide} disabled={repairWorkflowBusy}><FloppyDisk size={17} /> {repairWorkflowBusy ? "Saving..." : "Save Technician Guide"}</button></div>}
      {repairWorkflowNotice && <div className="repair-workflow-notice">{repairWorkflowNotice}</div>}
    </div>;
  }

  const summary = [
    ["Customer", detail.customer, detail.phone || "—"],
    [
      "Device",
      detail.device,
      `${deviceIdentifierLabel}: ${recordedDeviceIdentifier}`,
    ],
    ["Received", receivedDate, "Counter 01"],
    ["Issue", detail.issue, repairStatus],
    ["Amount", detail.amount || "Pending", "Current repair amount"],
  ];

  return (
    <main className="repair-detail">
      <aside className="repair-side">
        <div className="rd-brand">
          <Wrench size={20} />
          <b>TechCare PC</b>
        </div>
        <nav>
          {can("Dashboard", "View")&&<button onClick={onDashboard}><ModuleNavIcon module="Dashboard"/><span>Dashboard</span></button>}
          {can("Repairs", "View")&&<button className="active" onClick={onBack}><ModuleNavIcon module="Repairs"/><span>Repairs</span></button>}
          {can("Ready for Collection", "View")&&<button onClick={onCollections}><ModuleNavIcon module="Ready for Collection"/><span>Ready for Collection</span></button>}
          {can("Warranty", "View")&&<button onClick={onWarranty}><ModuleNavIcon module="Warranty"/><span>Warranty</span></button>}
          {can("Onsite Service", "View")&&<button onClick={onOnsiteService}><ModuleNavIcon module="Onsite Service"/><span>Onsite Service</span></button>}
          {can("Service Contracts", "View")&&<button onClick={onContracts}><ModuleNavIcon module="Service Contracts"/><span>Service Contracts</span></button>}
          <MasterDataNav active="Repairs" />
          {[
            "General Maintenance",
            "Accounting Sync",
            "Reports",
          ]
            .filter((item) => can(item, "View"))
            .map((item) => (
              <button key={item}><ModuleNavIcon module={item}/><span>{item}</span></button>
            ))}
        </nav>
        <div className="rd-user">
          <User size={22} />
          <span>
            <b>{detail.technician || "Unassigned"}</b>
            <small>Technician</small>
          </span>
        </div>
      </aside>
      <section className="rd-main">
        <div className="rd-topline">
          <button onClick={onBack}>Repairs Listing</button>
          <span>› Repairs ›</span>
          <b>{detail.no}</b>
          <span className="connected">AutoCount Connected</span>
          <span>English</span>
        </div>
        <section className="rd-header">
          <h1>
            {detail.no} <span>{repairStatus}</span>
          </h1>
          <div className="due">
            <CalendarBlank size={19} />
            <small>Due Date</small>
            <b>{detail.due}</b>
          </div>
          <div className="due">
            <User size={19} />
            <small>Technician</small>
            <b>{detail.technician || "Unassigned"}</b>
          </div>
          {can("Warranty", "Create") && (
            <button
              className="rd-warranty-link"
              onClick={() =>
                onCreateWarranty?.({ ...detail, status: repairStatus })
              }
            >
              <Package size={17} /> Warranty Workflow
            </button>
          )}
          {can("Repairs", "Edit") && completionRoute === "Prepare Quotation" && repairStatus === "Waiting Approval" && (
            <button className="send" disabled={quotationBusy} onClick={sendQuotation}>
              <PaperPlaneTilt size={17} /> {quotationBusy?"Processing...":"Send Quotation"}
            </button>
          )}
          {can("Repairs", "Edit") && repairStatus === "Repairing" && repairReadyGate && (
            <button className="send rd-ready-button" disabled={quotationBusy} onClick={markReadyForCollection}>
              <CheckCircle size={17}/> {quotationBusy?"Posting...":"Repair Completed · Post to Collection"}
            </button>
          )}
        </section>
        <section className="rd-summary">
          {summary.map((item) => (
            <div key={item[0]}>
              <small>{item[0]}</small>
              <b>{item[1]}</b>
              <span>{item[2]}</span>
            </div>
          ))}
        </section>
        <section className="rd-stages">
          {stages.map((item, index) => (
            <div
              className={[
                index <= activeStage ? "done" : "",
                workflowFocus === index ? "track-selected" : "",
                index > maxAccessibleStage ? "track-locked" : "",
                diagnosisNeedsAttention && index === 1
                  ? "diagnosis-stage-attention"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={item}
              role="button"
              tabIndex={index <= maxAccessibleStage ? 0 : -1}
              aria-current={workflowFocus === index ? "step" : undefined}
              aria-disabled={index > maxAccessibleStage}
              onClick={() => focusWorkflowStage(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  focusWorkflowStage(index);
                }
              }}
            >
              <span>
                {index < activeStage ? <CheckCircle size={17} /> : index + 1}
              </span>
              <b>{item}</b>
              <small>
                {index === activeStage
                  ? repairStatus
                  : index < activeStage
                    ? receivedDate.slice(0, 5)
                    : "Pending"}
              </small>
            </div>
          ))}
        </section>
        <section className="rd-technician-guide-entry">
          <span className="rd-technician-guide-icon"><BookOpenText size={26} weight="duotone" /></span>
          <span><b>Technician Guide</b><small>{detail.deviceType || "Device"} · Service points · Disassembly · Internal anatomy · Video reference</small></span>
          <button type="button" onClick={() => setTechnicianGuideOpen(true)}>Open Guide</button>
        </section>
        {technicianGuideOpen && <div className="technician-guide-modal-bg" role="presentation" onMouseDown={() => setTechnicianGuideOpen(false)}><section className="technician-guide-modal" role="dialog" aria-modal="true" aria-labelledby="technician-guide-title" onMouseDown={(event) => event.stopPropagation()}><header><span><BookOpenText size={25} weight="duotone" /><span><h2 id="technician-guide-title">Technician Guide</h2><small>{detail.no} · Available at every repair stage</small></span></span><button type="button" aria-label="Close Technician Guide" onClick={() => setTechnicianGuideOpen(false)}><X size={20} /></button></header>{renderTechnicianGuide()}</section></div>}

        <div
          ref={workflowAnchor}
          className={`rd-work workflow-track workflow-focus-${workflowFocus}`}
        >
          <section className="workflow-stage-page workflow-received-page">
            <h2>Received · Intake Record</h2>
            <p>This completed intake information is read-only.</p>
            <div className="workflow-stage-summary">
              {summary.slice(0, 4).map((item) => (
                <span key={item[0]}>
                  <small>{item[0]}</small>
                  <b>{item[1]}</b>
                  <em>{item[2]}</em>
                </span>
              ))}
            </div>
          </section>
          <section
            className={`diagnosis${diagnosisNeedsAttention ? " diagnosis-attention" : ""}${diagnosisCompleted ? " workflow-readonly" : ""}`}
            inert={diagnosisCompleted ? true : undefined}
          >
            <h2>
              Diagnosis
              {diagnosisNeedsAttention && (
                <span className="diagnosis-action-required">Action Required</span>
              )}
              {diagnosisCompleted && (
                <span className="workflow-readonly-badge">Read Only</span>
              )}
            </h2>
            <div className="diag-grid">
              <label>
                Customer Symptom
                <textarea
                  value={symptom}
                  onChange={(event) => setSymptom(event.target.value)}
                />
              </label>
              <label>
                Customer Visible Explanation
                <textarea
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                />
              </label>
              <label>
                Root Cause
                <textarea
                  value={rootCause}
                  onChange={(event) => setRootCause(event.target.value)}
                />
              </label>
              <label>
                Internal Note
                <textarea
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                />
              </label>
            </div>
            <h3 className={`diagnosis-tests-heading${diagnosisNeedsAttention ? " attention" : ""}`}>Tests Performed</h3>
            <div className={`test-list test-ratings${diagnosisNeedsAttention ? " diagnosis-tests-attention" : ""}`}>
              {tests.map((item) => (
                <div className="test-rating-row" key={item}>
                  <span>{item}</span>
                  <div
                    className="test-stars"
                    role="radiogroup"
                    aria-label={`${item} rating`}
                  >
                    {[1, 2, 3, 4, 5, 6].map((score) => (
                      <button
                        type="button"
                        key={score}
                        className={score <= testRatings[item] ? "filled" : ""}
                        role="radio"
                        aria-checked={testRatings[item] === score}
                        aria-label={`${score} of 6 stars`}
                        onClick={() =>
                          setTestRatings((current) => ({
                            ...current,
                            [item]: current[item] === score ? 0 : score,
                          }))
                        }
                      >
                        <Star
                          size={17}
                          weight={
                            score <= testRatings[item] ? "fill" : "regular"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <b>
                    {testRatings[item]
                      ? `${testRatings[item]} / 6`
                      : "Not rated"}
                  </b>
                </div>
              ))}
            </div>
            <div className="diagnosis-followup-grid">
              <label className="tests-performed-remark">
                Tests Performed Remark
                <textarea
                  rows="3"
                  placeholder="Record test observations, intermittent results, error codes, or follow-up checks..."
                  value={testsPerformedRemark}
                  onChange={(event) =>
                    setTestsPerformedRemark(event.target.value)
                  }
                />
              </label>
              <label className="recommended-repair-field">
                Recommended Repair
                <select
                  value={recommendedRepair}
                  onChange={(event) => setRecommendedRepair(event.target.value)}
                >
                  <option>Inspection / diagnosis required</option>
                  <option>Replace keyboard module</option>
                  <option>Repair or replace affected component</option>
                </select>
              </label>
            </div>
            <div className="diagnosis-support-grid">
              <section className="diagnosis-evidence-panel">
                <div className="diagnosis-photo-heading">
                  <h3>Intake Condition Photos</h3>
                  <span>{repairPhotos.length} / 3</span>
                </div>
                {repairPhotos.length ? (
                  <div className="evidence diagnosis-evidence">
                    {repairPhotos.map((photo, index) => (
                      <figure
                        key={`${detail.no}-condition-${index}`}
                        tabIndex="0"
                        role="button"
                        aria-label={`Enlarge uploaded photo ${index + 1}`}
                        onDoubleClick={() => setEnlargedPhoto({ src: photo, index })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setEnlargedPhoto({ src: photo, index });
                          }
                        }}
                      >
                        <span className="diagnosis-photo-zoom"><MagnifyingGlassPlus size={15} /></span>
                        <img src={photo} alt={`${detail.no} intake condition photo ${index + 1}`} />
                        <figcaption>Uploaded Photo {index + 1} · Double-click to enlarge</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="diagnosis-no-photos">No condition photos were uploaded for this Repair.</div>
                )}
              </section>
              <section className="diagnosis-review-panel">
                <h3>Technical Review</h3>
                {technicalCheckedBy ? (
                  <div className="technical-checked">
                    <CheckCircle size={16} />
                    <span>
                      <small>Technical Checked By</small>
                      <b>{technicalCheckedBy}</b>
                      {technicalCheckedAt && <em>{technicalCheckedAt}</em>}
                      {completionRoute && <strong>{completionRoute}</strong>}
                      {technicalCheckRemark && <p>{technicalCheckRemark}</p>}
                    </span>
                  </div>
                ) : <div className="diagnosis-review-empty">Technical review has not been completed.</div>}
              </section>
            </div>
            {diagnosisHistory.length > 0 && (
              <details className="diagnosis-history">
                <summary>
                  Diagnosis Activity <b>{diagnosisHistory.length}</b>
                </summary>
                <div>
                  {diagnosisHistory.slice(0, 6).map((entry) => (
                    <article key={entry.id}>
                      <span className={entry.completed ? "completed" : "draft"}>
                        {entry.completed ? "Completed" : "Draft"}
                      </span>
                      <div>
                        <b>{entry.savedAt}</b>
                        <small>
                          {entry.completed
                            ? `${entry.checkedBy} · ${entry.route}`
                            : "Diagnosis progress saved"}
                        </small>
                        {entry.remark && <p>{entry.remark}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            )}
            <div className="diag-actions">
              <button
                type="button"
                disabled={diagnosisCompleted}
                onClick={() =>
                  saveDiagnosisDraft().catch((error) =>
                    setDiagnosisNotice(
                      `SQL Server save failed: ${error.message}`,
                    ),
                  )
                }
              >
                Save Draft
              </button>
              <button
                type="button"
                className={`primary ${diagnosisCompleted ? "completed" : ""}${diagnosisNeedsAttention ? " diagnosis-attention-button" : ""}`}
                disabled={diagnosisCompleted}
                aria-label={diagnosisCompleted ? "Diagnosis Completed" : "Complete Diagnosis"}
                onClick={openTechnicalChecker}
              >
                {diagnosisCompleted
                  ? "Diagnosis Completed"
                  : "Complete Diagnosis"}
              </button>
            </div>
          </section>

          <section
            className={`quotation${maxAccessibleStage > 2 ? " workflow-readonly" : ""}`}
            inert={maxAccessibleStage > 2 ? true : undefined}
          >
            <h2>
              Quotation
              {maxAccessibleStage > 2 && (
                <span className="workflow-readonly-badge">Read Only</span>
              )}
            </h2>
            {completionRoute === "Bypass Quotation" && (
              <div className="quotation-bypassed">
                <CheckCircle size={18} />
                <span>
                  <b>Quotation Bypassed</b>
                  <small>
                    Diagnosis was approved to move directly to the Repair step.
                  </small>
                </span>
              </div>
            )}
            <div className="quote-head">
              <span>#</span>
              <span>Item Code</span>
              <span>Description</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span>Discount</span>
              <span>Amount</span>
              <span>Action</span>
            </div>
            {lines.map((line, index) => (
              <div className="quote-row" key={`${line.name}-${index}`}>
                <span>{index + 1}</span>
                <label className="quotation-item-picker">
                  <select aria-label={`Quotation item ${index + 1}`} value={line.itemCode || ""} onChange={(event) => selectQuotationItem(index,event.target.value)}>
                    <option value="">Select Item Code</option>
                    {stockItems.map((item)=><option key={item.code} value={item.code}>{item.code}</option>)}
                  </select>
                </label>
                <span className="quotation-item-description" title={line.name||""}>{line.name||"—"}</span>
                <input
                  aria-label={`Quotation quantity ${index + 1}`}
                  type="number"
                  min="0"
                  step="1"
                  value={line.qty}
                  onChange={(event) =>
                    setLines(
                      lines.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, qty: +event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <span>{Number(line.price).toFixed(2)}</span>
                <input
                  aria-label={`Quotation discount ${index + 1}`}
                  className="quotation-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={Number(line.qty||0)*Number(line.price||0)}
                  value={Number(line.discount||0)}
                  onChange={(event)=>setLines((current)=>current.map((item,itemIndex)=>itemIndex===index?{...item,discount:Math.max(0,Number(event.target.value)||0)}:item))}
                />
                <strong>{Math.max(Number(line.qty) * Number(line.price)-Number(line.discount||0),0).toFixed(2)}</strong>
                <button type="button" className="quotation-delete-item" aria-label={`Delete quotation item ${index + 1}`} title="Delete Item" onClick={() => setLines((current) => current.filter((_,lineIndex) => lineIndex !== index))}><Trash size={15}/></button>
              </div>
            ))}
            <button
              className="add-line"
              onClick={() =>
                setLines([...lines, { itemCode: "", name: "", qty: 1, price: 0, discount: 0 }])
              }
            >
              <Plus size={15} /> Add Item
            </button>
            <div className="quotation-bottom-grid">
              <div className="quotation-customer-settings">
                <h3>Approval Method</h3>
                <div className="approval">
                  {["Email", "WhatsApp", "Counter"].map((item) => (
                    <label key={item}>
                      <input
                        type="radio"
                        checked={approval === item}
                        onChange={() => setApproval(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
                <label>
                  Valid Until
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(event) => setValidUntil(event.target.value)}
                  />
                </label>
                <label>
                  Message to Customer
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>
              </div>
              <div className="totals">
                <span>
                  Subtotal <b>RM {subtotal.toFixed(2)}</b>
                </span>
                <span>
                  Discount <b>RM {discount.toFixed(2)}</b>
                </span>
                <span>
                  SST (8%) <b>RM {sst.toFixed(2)}</b>
                </span>
                <strong>
                  Total <b>RM {total.toFixed(2)}</b>
                </strong>
              </div>
            </div>
            <div className="quote-actions">
              <button
                disabled={completionRoute === "Bypass Quotation"}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye size={16} /> Preview Quotation
              </button>
              <button
                className="send"
                disabled={completionRoute !== "Prepare Quotation" || quotationBusy || repairStatus === "Repairing"}
                onClick={sendQuotation}
              >
                <PaperPlaneTilt size={16} /> {quotationBusy?"Processing...":"Send Quotation"}
              </button>
            </div>
            {completionRoute==="Prepare Quotation"&&repairStatus==="Waiting Approval"&&<div className="quotation-approval-flow"><span><CheckCircle size={18}/><span><b>Waiting Customer Approval</b><small>Send or resend the quotation, then confirm approval to start Repair.</small></span></span><button type="button" disabled={quotationBusy} onClick={approveQuotation}><Wrench size={16}/> Customer Approved · Start Repair</button></div>}
            {repairStatus==="Repairing"&&completionRoute==="Prepare Quotation"&&<div className="quotation-repair-started"><CheckCircle size={18}/><span><b>Quotation Approved</b><small>Repair workflow is now active.</small></span></div>}
          </section>
          <section className="workflow-stage-page workflow-repair-page">
            <div className="repair-execution-heading">
              <span><Wrench size={24} weight="duotone" /><span><h2>Repair Execution</h2><small>Installation, retest and final quality confirmation</small></span></span>
              <b>{repairWorkflow.currentSubstage}</b>
            </div>
            <nav className="repair-subtrack" aria-label="Repair execution stages">
              {repairSubstages.map((stage, index) => (
                <button type="button" key={stage} className={`${stage === repairSubFocus ? "active" : ""} ${index < repairCurrentSubstageIndex ? "complete" : ""}`} disabled={index > repairCurrentSubstageIndex} onClick={() => setRepairSubFocus(stage)}>
                  <span>{index < repairCurrentSubstageIndex ? <CheckCircle size={17} weight="fill" /> : index + 1}</span><b>{repairSubstageLabels[stage] || stage}</b>
                </button>
              ))}
            </nav>
            {repairSubReadOnly && <div className="repair-readonly-note"><Eye size={17} /> Completed record · View only</div>}
            {repairWorkflowNotice && <div className="repair-workflow-notice">{repairWorkflowNotice}</div>}

            {repairSubFocus === "Preparation" && (
              <div className="repair-subpage">
                <header><span><h3>Technician Guide</h3><p>Review the same device reference available throughout this repair.</p></span><button type="button" className="technician-guide-inline-open" onClick={() => setTechnicianGuideOpen(true)}><BookOpenText size={17} /> Open Guide</button></header>
                <div className="technician-guide-readiness"><h4>Work Readiness</h4><p>Assign responsibility and verify parts before work begins.</p></div>
                <div className="repair-form-grid">
                  <label>Assigned Technician *<select disabled={repairSubReadOnly || repairWorkflowBusy} value={repairWorkflow.assignedTechnician} onChange={(event) => setRepairWorkflow((current) => ({ ...current, assignedTechnician: event.target.value }))}><option value="">Select technician</option>{technicalUsers.map((user) => <option key={user.id || user.name} value={user.name}>{user.name}</option>)}</select></label>
                </div>
                <label className="repair-check-card"><input type="checkbox" disabled={repairSubReadOnly || repairWorkflowBusy} checked={repairWorkflow.partsReady} onChange={(event) => setRepairWorkflow((current) => ({ ...current, partsReady: event.target.checked }))} /><span><b>Required parts and tools are ready</b><small>Verify model, quantity and compatibility before opening the device.</small></span></label>
                <details className="repair-optional-details"><summary>More Details <small>Old parts handling</small></summary><label>Old Parts Disposition<select disabled={repairSubReadOnly || repairWorkflowBusy} value={repairWorkflow.oldPartsDisposition} onChange={(event) => setRepairWorkflow((current) => ({ ...current, oldPartsDisposition: event.target.value }))}><option>Return to Customer</option><option>Dispose with Consent</option><option>Retain for Warranty</option><option>Not Applicable</option></select></label></details>
                {!repairSubReadOnly && <button type="button" className="workflow-stage-primary" disabled={repairWorkflowBusy} onClick={startRepairWork}><Wrench size={18} /> {repairWorkflowBusy ? "Starting..." : "Start Repair Work"}</button>}
              </div>
            )}

            {repairSubFocus === "Installation" && (
              <div className="repair-subpage repair-installation-simple">
                <header><h3>Repair</h3><p>Record who handled the repair and any important remark.</p></header>
                <div className="repair-installation-fields">
                  <label>Handled By *<select disabled={repairSubReadOnly || repairWorkflowBusy} value={repairWorkflow.assignedTechnician} onChange={(event) => updateRepairSummary("installedBy", event.target.value)}><option value="">Select technician</option>{technicalUsers.map((user) => <option key={user.id || user.name} value={user.name}>{user.name}</option>)}</select></label>
                  <label>Repair Remark<textarea disabled={repairSubReadOnly || repairWorkflowBusy} placeholder="Example: Reinstalled Windows, updated drivers and verified customer files." value={repairWorkRemark} onChange={(event) => updateRepairSummary("remark", event.target.value)} /></label>
                </div>
                {!repairSubReadOnly && <div className="repair-next-row"><button type="button" className="workflow-stage-primary" disabled={repairWorkflowBusy || !repairWorkflow.assignedTechnician} onClick={completeRepairWork}><CheckCircle size={18} /> {repairWorkflowBusy ? "Saving..." : "Repair Complete · Next Step"}</button></div>}
              </div>
            )}

            {repairSubFocus === "Testing" && (
              <div className="repair-subpage repair-testing-simple">
                <header><h3>Testing</h3><p>Tick each item after checking.</p></header>
                <div className="repair-compact-checker"><label>Tested By *<select disabled={repairSubReadOnly || repairWorkflowBusy} value={repairWorkflow.tests.find((test) => test.testedBy)?.testedBy || repairWorkflow.assignedTechnician || ""} onChange={(event) => updateAllTestsBy(event.target.value)}><option value="">Select technician</option>{technicalUsers.map((user) => <option key={user.id || user.name}>{user.name}</option>)}</select></label></div>
                <div className="repair-testing-grid">
                  {repairWorkflow.tests.map((test) => (
                    <label key={test.id} className="repair-condition-tile">
                      <input type="checkbox" disabled={repairSubReadOnly || repairWorkflowBusy} checked={["Pass", "N/A"].includes(test.result)} onChange={() => toggleRepairTestChecked(test)} />
                      <span>{test.name}</span>
                    </label>
                  ))}
                </div>
                <label className={`repair-check-card repair-issue-found ${testingIssueFound ? "issue" : ""}`}><input type="checkbox" disabled={repairSubReadOnly || repairWorkflowBusy} checked={testingIssueFound} onChange={(event) => setTestingIssueFound(event.target.checked)} /><span><b>Issue Found</b><small>Untick the failed check and return the job to Repair.</small></span></label>
                {testingIssueFound && <label className="repair-testing-remark">Issue Remark *<textarea disabled={repairSubReadOnly || repairWorkflowBusy} placeholder="Briefly describe the issue found..." value={testingRemark} onChange={(event) => setTestingRemark(event.target.value)} /></label>}
                {!testingIssueFound && !testingAllChecked && <div className="repair-incomplete-testing"><b>Testing not fully completed</b><span>Unchecked items will be recorded as N/A. Enter the reason before continuing.</span><label>Incomplete Testing Remark *<textarea disabled={repairSubReadOnly || repairWorkflowBusy} placeholder="Example: Customer did not provide the charger, so charging could not be tested." value={testingRemark} onChange={(event) => setTestingRemark(event.target.value)} /></label></div>}
                {!repairSubReadOnly && <div className="repair-next-row"><button type="button" className={`workflow-stage-primary ${testingIssueFound ? "repair-return-button" : ""}`} disabled={repairWorkflowBusy || (!testingAllChecked && !testingRemark.trim())} onClick={saveRepairTests}>{repairWorkflowBusy ? "Saving..." : testingIssueFound ? "Return to Repair" : "Testing Complete · Next Step"}</button></div>}
              </div>
            )}

            {repairSubFocus === "QA" && (
              <div className="repair-subpage">
                <header><h3>Final Quality Assurance</h3><p>An independent final check is required before collection.</p></header>
                <div className="repair-compact-checker"><label>QA Checked By *<select disabled={repairSubReadOnly} value={repairWorkflow.qa.checkedBy} onChange={(event) => updateRepairQa("checkedBy", event.target.value)}><option value="">Select checker</option>{technicalUsers.map((user) => <option key={user.id || user.name}>{user.name}</option>)}</select></label></div>
                <div className="repair-qa-grid">{[["issueResolved", "Original reported issue is resolved"], ["conditionVerified", "Device condition and functions verified"], ["accessoriesVerified", "Accessories and removed parts accounted for"], ["dataHandlingConfirmed", "Customer data handling requirement confirmed"]].map(([key, label]) => <label key={key} className="repair-check-card"><input type="checkbox" disabled={repairSubReadOnly} checked={repairWorkflow.qa[key]} onChange={(event) => updateRepairQa(key, event.target.checked)} /><span><b>{label}</b></span></label>)}</div>
                <details className="repair-optional-details"><summary>More Details <small>Optional QA remark</small></summary><label>QA Remark<input disabled={repairSubReadOnly} value={repairWorkflow.qa.remark || ""} onChange={(event) => updateRepairQa("remark", event.target.value)} /></label></details>
                {!repairSubReadOnly && <button type="button" className="workflow-stage-primary" disabled={repairWorkflowBusy} onClick={confirmRepairQa}><CheckCircle size={18} /> {repairWorkflowBusy ? "Confirming..." : "Confirm Final QA"}</button>}
              </div>
            )}

            {repairSubFocus === "Ready Gate" && (
              <div className="repair-subpage repair-ready-gate">
                <header><CheckCircle size={42} weight={repairReadyGate ? "fill" : "regular"} /><span><h3>{repairReadyGate ? "All repair checks completed" : "Ready gate is locked"}</h3><p>The repair can only move to Ready for Collection after every gate passes.</p></span></header>
                <div className="repair-gate-grid"><span className={repairItemsComplete ? "pass" : ""}><CheckCircle size={20} /><b>Work Items</b><small>{repairWorkflow.items.filter((item) => item.status === "Completed").length}/{repairWorkflow.items.length} completed</small></span><span className={repairTestsComplete ? "pass" : ""}><CheckCircle size={20} /><b>Post-Repair Tests</b><small>{repairWorkflow.tests.filter((test) => ["Pass", "N/A"].includes(test.result)).length}/{repairWorkflow.tests.length} cleared</small></span><span className={repairQaComplete ? "pass" : ""}><CheckCircle size={20} /><b>Final QA</b><small>{repairQaComplete ? "Confirmed" : "Pending"}</small></span></div>
                {repairStatus === "Repairing" && can("Repairs", "Edit") && <button type="button" className="workflow-stage-primary rd-ready-button" disabled={!repairReadyGate || quotationBusy} onClick={markReadyForCollection}><CheckCircle size={19} />{quotationBusy ? "Posting..." : "Repair Completed · Post to Collection"}</button>}
              </div>
            )}

            {repairWorkflow.activity.length > 0 && <details className="repair-activity"><summary>Repair Activity History ({repairWorkflow.activity.length})</summary>{repairWorkflow.activity.map((entry) => <div key={entry.id}><span><b>{entry.type}</b><small>{entry.details}</small></span><span>{entry.performedBy}<small>{entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-MY") : ""}</small></span></div>)}</details>}
          </section>
          <section className="workflow-stage-page workflow-ready-page">
            <div className="ready-summary-heading"><span><CheckCircle size={36} weight="fill" /><span><h2>Ready for Collection</h2><small>{detail.customer} · {detail.device}</small></span></span><div className={`ready-score score-${readyAssessment.rating.toLowerCase().replaceAll(" ", "-")}`}><strong>{readyAssessment.score}</strong><span><b>System Score</b><small>{readyAssessment.rating}</small></span></div></div>
            <div className="ready-assessment-metrics">
              <article><small>Received → Diagnosis</small><strong>{elapsedLabel(readyAssessment.receivedToDiagnosis)}</strong><span>{assessmentDate(readyAssessment.diagnosisCompletedAt)}</span></article>
              <article className={readyAssessment.diagnosisCoverage === 100 ? "complete" : "warning"}><small>Diagnosis Completion</small><strong>{readyAssessment.diagnosisChecked}/{readyAssessment.diagnosisTotal}</strong><span>{readyAssessment.diagnosisCoverage}% checks rated</span></article>
              <article className={readyAssessment.testingCoverage === 100 ? "complete" : "warning"}><small>Testing Coverage</small><strong>{readyAssessment.testPassed}/{readyAssessment.testTotal}</strong><span>{readyAssessment.testNotFullyChecked.length ? `${readyAssessment.testNotFullyChecked.length} marked N/A` : "Fully checked"}</span></article>
              <article><small>Total Turnaround</small><strong>{elapsedLabel(readyAssessment.totalTurnaround)}</strong><span>Received to Ready</span></article>
            </div>
            <div className="ready-assessment-layout">
              <section className="ready-timeline"><h3>Process Timeline</h3>{[
                ["Received", readyAssessment.receivedAt, null],
                ["Diagnosis Completed", readyAssessment.diagnosisCompletedAt, readyAssessment.receivedToDiagnosis],
                ["Repair Started", readyAssessment.repairStartedAt, readyAssessment.diagnosisToRepair],
                ["Testing Completed", readyAssessment.testingCompletedAt, null],
                ["Final QA", readyAssessment.qaConfirmedAt, null],
                ["Ready for Collection", readyAssessment.readyAt, readyAssessment.repairToReady],
              ].map(([label, date, duration], index) => <div key={label} className={date ? "recorded" : "missing"}><span>{date ? <CheckCircle size={17} weight="fill" /> : index + 1}</span><div><b>{label}</b><small>{assessmentDate(date)}</small></div>{duration !== null && <em>+ {elapsedLabel(duration)}</em>}</div>)}</section>
              <section className="ready-quality"><h3>Quality Assessment</h3><div className="ready-quality-row"><span><b>Diagnosis</b><small>Checked by {readyAssessment.diagnosisCheckedBy || "Not recorded"}</small></span><strong>{readyAssessment.diagnosisCoverage === 100 ? "Complete" : "Partial"}</strong></div><div className="ready-quality-row"><span><b>Post-Repair Testing</b><small>{readyAssessment.testPassed} passed · {readyAssessment.testNotFullyChecked.length} N/A</small></span><strong>{readyAssessment.testingCoverage === 100 ? "Complete" : "Partial"}</strong></div><div className="ready-quality-row"><span><b>Final QA</b><small>Checked by {repairWorkflow.qa.checkedBy || "Not recorded"}</small></span><strong>{repairQaComplete ? "Confirmed" : "Pending"}</strong></div><div className="ready-quality-row"><span><b>Repair Technician</b><small>{repairWorkflow.items[0]?.remark || "No repair remark"}</small></span><strong>{repairWorkflow.assignedTechnician || detail.technician || "Unassigned"}</strong></div>
                {readyAssessment.warnings.length ? <div className="ready-assessment-warnings"><b>System Notes</b>{readyAssessment.warnings.map((warning) => <span key={warning}>• {warning}</span>)}</div> : <div className="ready-assessment-clear"><CheckCircle size={19} /><span><b>Complete record</b><small>No missing quality checks detected.</small></span></div>}
              </section>
            </div>
          </section>
        </div>

        {previewOpen && (
          <div className="qp-overlay" onClick={() => setPreviewOpen(false)}>
            <section
              className="qp-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Quotation Preview"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <h2>Quotation Preview</h2>
                  <p>Review before printing or sending to customer.</p>
                </div>
                <button
                  aria-label="Close Quotation Preview"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>
              <article className="qp-paper">
                {!quotationIssued && (
                  <div className="qp-watermark" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, index) => (
                      <span key={index}>DRAFT · NOT ISSUED</span>
                    ))}
                  </div>
                )}
                <div className="qp-company">
                  {company.logo && (
                    <img src={company.logo} alt="Company logo" />
                  )}
                  <div>
                    <h1>{company.name}</h1>
                    <p>BRN: {company.registration}</p>
                    <span>{company.address}</span>
                    <b>
                      {company.phone} · {company.email}
                    </b>
                  </div>
                  <strong>QUOTATION</strong>
                </div>
                <div className="qp-meta">
                  <span>
                    <small>Quotation No.</small>
                    <b>{`QT-${detail.no.replace("SR-", "")}`}</b>
                  </span>
                  <span>
                    <small>Repair No.</small>
                    <b>{detail.no}</b>
                  </span>
                  <span>
                    <small>Date</small>
                    <b>{receivedDate}</b>
                  </span>
                  <span>
                    <small>Valid Until</small>
                    <b>{validUntil.split("-").reverse().join("/")}</b>
                  </span>
                </div>
                <section className="qp-customer">
                  <h3>Bill To</h3>
                  <b>{detail.customer}</b>
                  <span>{detail.phone || "—"}</span>
                  <span>
                    {detail.device} · {deviceIdentifierLabel}{" "}
                    {recordedDeviceIdentifier}
                  </span>
                </section>
                <div className="qp-lines">
                  <div className="qp-line-head">
                    <span>#</span>
                    <span>Item Code</span>
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Discount</span>
                    <span>Amount</span>
                  </div>
                  {lines.map((line, index) => (
                    <div className="qp-line" key={`${line.name}-${index}`}>
                      <span>{index + 1}</span>
                      <b>{line.itemCode||"—"}</b>
                      <span>{line.name||"—"}</span>
                      <span>{line.qty}</span>
                      <span>RM {Number(line.price).toFixed(2)}</span>
                      <span>RM {Number(line.discount||0).toFixed(2)}</span>
                      <strong>RM {Math.max(Number(line.qty) * Number(line.price)-Number(line.discount||0),0).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <div className="qp-totals">
                  <span>
                    Subtotal <b>RM {subtotal.toFixed(2)}</b>
                  </span>
                  <span>
                    Discount <b>RM {discount.toFixed(2)}</b>
                  </span>
                  <span>
                    SST (8%) <b>RM {sst.toFixed(2)}</b>
                  </span>
                  <strong>
                    Total <b>RM {total.toFixed(2)}</b>
                  </strong>
                </div>
                <div className="qp-message">
                  <small>Message to Customer</small>
                  <p>{message}</p>
                </div>
                <div className="qp-terms">
                  <b>Terms &amp; Conditions</b>
                  <p>
                    Quotation is valid until the date stated above. Repair work
                    will begin after customer approval. Additional faults found
                    during repair may require a revised quotation.
                  </p>
                </div>
                <div className="qp-signatures">
                  <span>Customer Approval</span>
                  <span>Prepared By</span>
                </div>
                <footer>
                  {company.name} · {company.phone} · {company.email}
                </footer>
              </article>
              <div className="qp-actions">
                <button onClick={() => setPreviewOpen(false)}>Close</button>
                <button className="send" onClick={printQuotation}>
                  <Printer size={17} />
                  {printCount ? "Reprint Quotation" : "Print Quotation"}
                </button>
              </div>
            </section>
          </div>
        )}
        {sent && (
          <div className="rd-toast" onClick={() => setSent(false)}>
            Quotation queued for {approval} · AutoCount sync pending
          </div>
        )}
        {checkerOpen && (
          <div
            className="technical-check-overlay"
            onClick={() => setCheckerOpen(false)}
          >
            <section
              className="technical-check-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="technical-check-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <h2 id="technical-check-title">Complete Diagnosis</h2>
                  <p>
                    Select the technician who checked and confirmed this
                    diagnosis.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setCheckerOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>
              <label>
                Technical Checked By <b>*</b>
                <select
                  value={checkerSelection}
                  onChange={(event) => {
                    setCheckerSelection(event.target.value);
                    setCheckerError("");
                  }}
                >
                  <option value="">Select technician</option>
                  {technicalUsers.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name} · {user.role}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Technical Check Remark
                <textarea
                  rows="4"
                  placeholder="Record checks performed, findings, intermittent symptoms, or follow-up notes..."
                  value={checkerRemark}
                  onChange={(event) => setCheckerRemark(event.target.value)}
                />
              </label>
              <fieldset className="diagnosis-route">
                <legend>After Diagnosis *</legend>
                {[
                  {
                    value: "Prepare Quotation",
                    title: "Prepare Quotation",
                    note: "Continue to Waiting Approval for customer quotation approval.",
                    tone: "quotation",
                    icon: <FileText size={25} weight="duotone" />,
                  },
                  {
                    value: "Bypass Quotation",
                    title: "Bypass Quotation",
                    note: "Skip quotation and move directly to the Repair step.",
                    tone: "bypass",
                    icon: <Wrench size={25} weight="duotone" />,
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`route-${option.tone}${checkerRoute === option.value ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="diagnosis-route"
                      checked={checkerRoute === option.value}
                      onChange={() => setCheckerRoute(option.value)}
                    />
                    <i className="diagnosis-route-icon" aria-hidden="true">
                      {option.icon}
                    </i>
                    <span>
                      <b>{option.title}</b>
                      <small>{option.note}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              {checkerError && (
                <p className="technical-check-error">{checkerError}</p>
              )}
              <div className="technical-check-actions">
                <button type="button" onClick={() => setCheckerOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={confirmDiagnosisChecker}
                >
                  Confirm Diagnosis
                </button>
              </div>
            </section>
          </div>
        )}
        {diagnosisNotice && (
          <div className="rd-toast" onClick={() => setDiagnosisNotice("")}>
            {diagnosisNotice}
          </div>
        )}
        {enlargedPhoto && (
          <div
            className="diagnosis-photo-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Enlarged intake condition photo ${enlargedPhoto.index + 1}`}
            onClick={() => setEnlargedPhoto(null)}
          >
            <section onClick={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <b>{detail.no}</b>
                  <span>
                    Intake Condition Photo {enlargedPhoto.index + 1} of{" "}
                    {repairPhotos.length}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close enlarged photo"
                  onClick={() => setEnlargedPhoto(null)}
                >
                  <X size={22} />
                </button>
              </header>
              <div className="diagnosis-photo-full">
                <img
                  src={enlargedPhoto.src}
                  alt={`${detail.no} enlarged intake condition photo ${enlargedPhoto.index + 1}`}
                />
              </div>
              <small>Press Esc or click outside the photo to close.</small>
            </section>
          </div>
        )}
        {enlargedGuideImage && (
          <div
            className="technician-guide-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Enlarged ${enlargedGuideImage.title} reference image`}
            onClick={() => setEnlargedGuideImage(null)}
          >
            <section onClick={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <b>{enlargedGuideImage.title}</b>
                  <span>{detail.deviceType || "Device"} · {detail.no}</span>
                </div>
                <button
                  type="button"
                  aria-label="Close enlarged technician guide image"
                  onClick={() => setEnlargedGuideImage(null)}
                >
                  <X size={22} />
                </button>
              </header>
              <div className={`technician-guide-full-image ${enlargedGuideImage.crop}`}>
                <img
                  src={enlargedGuideImage.src}
                  alt={`Enlarged ${enlargedGuideImage.title} reference`}
                />
              </div>
              <small>Press Esc or click outside the image to close.</small>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
