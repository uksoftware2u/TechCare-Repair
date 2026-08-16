import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Barcode,
  Camera,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  MagnifyingGlass,
  Plus,
  Printer,
  UserCircle,
  Warning,
  X,
} from "@phosphor-icons/react";
import { AutoCountDebtorForm } from "./components/AutoCountDebtorForm.jsx";
import { RepairReceiptCopy } from "./components/RepairReceiptCopy.jsx";
import { databaseApi } from "./database-api.js";
import { useAccess } from "./access-control.jsx";
import "./repair-intake.css";
import "./repair-customer-picker.css";
import "./repair-intake-overrides.css";
import "./repair-customer-summary.css";
import "./repair-receipt.css";
import "./receipt-company-profile.css";
import "./repair-receipt-copies.css";
import "./receipt-terms.css";
import "./repair-condition-photos.css";
import "./repair-receipt-email.css";
import "./repair-customer-verification.css";
import "./repair-receipt-signature.css";
import "./repair-receipt-print-layout.css";
import "./repair-serial-history.css";
import "./repair-device-identifier.css";
import "./repair-warranty-claim.css";
import "./repair-email-after-print.css";

const steps = [
  "Customer",
  "Device & Condition",
  "Condition Details",
  "Confirm & Receipt",
];
const deviceIdentifierOptions = [
  {
    value: "Manufacturer Serial",
    label: "Manufacturer Serial Number",
    description: "Scan the original barcode or enter the serial manually.",
  },
  {
    value: "Customer Asset Tag",
    label: "Customer Asset Tag",
    description: "Use the customer's own asset label or barcode.",
  },
  {
    value: "Custom Built - No Serial",
    label: "Custom-built PC · No Serial Number",
    description: "The system will use its own Internal Device ID.",
  },
  {
    value: "Serial Label Missing",
    label: "Serial label missing or unreadable",
    description: "Record the reason and use an Internal Device ID.",
  },
];

function createInternalDeviceId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return `DEV-${date}-${random.toUpperCase()}`;
}
const initialCustomers = [
  {
    id: "CUST-000127",
    name: "Siti Nur Aisyah",
    phone: "+60 12-345 6789",
    email: "siti.aisyah@gmail.com",
    debtor: "380-S001",
  },
  {
    id: "CUST-000128",
    name: "Lim Wei Jie",
    phone: "+60 16-778 8990",
    email: "wei.jie.lim@gmail.com",
    debtor: "380-L001",
  },
  {
    id: "CUST-000125",
    name: "Farah Nadia",
    phone: "+60 11-2088 7741",
    email: "farah.nadia@gmail.com",
    debtor: "380-F001",
  },
];
const deviceConditionOptions = {
  Laptop: [
    "Screen OK",
    "Keyboard OK",
    "Touchpad OK",
    "Battery OK",
    "Casing OK",
    "Hinges OK",
    "Ports OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Liquid Mark",
  ],
  Desktop: [
    "Casing OK",
    "Power Button OK",
    "Front Ports OK",
    "Rear Ports OK",
    "Side Panel OK",
    "Feet / Stand OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Dusty",
    "Liquid Mark",
  ],
  "Mobile Phone": [
    "Screen OK",
    "Touch Screen OK",
    "Back Glass OK",
    "Camera Lens OK",
    "Buttons OK",
    "Charging Port OK",
    "SIM Tray Present",
    "Casing / Frame OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Liquid Mark",
  ],
  Tablet: [
    "Screen OK",
    "Touch Screen OK",
    "Back Cover OK",
    "Camera Lens OK",
    "Buttons OK",
    "Charging Port OK",
    "Casing / Frame OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Liquid Mark",
  ],
  Printer: [
    "Casing OK",
    "Control Panel OK",
    "Scanner Glass OK",
    "Paper Tray OK",
    "Output Tray OK",
    "Rear Cover OK",
    "Cable Port OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Ink / Toner Stain",
  ],
  Monitor: [
    "Display Panel OK",
    "Screen Surface OK",
    "Buttons OK",
    "Stand OK",
    "Base OK",
    "Ports OK",
    "Bezel OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Dead Pixel Visible",
  ],
  Server: [
    "Chassis OK",
    "Front Panel OK",
    "Drive Bays OK",
    "Rack Ears OK",
    "Power Supply OK",
    "Network Ports OK",
    "Fans OK",
    "Scratches",
    "Dents",
    "Dusty",
    "Liquid Mark",
  ],
  "Gaming Console": [
    "Casing OK",
    "Power Button OK",
    "Disc Drive OK",
    "HDMI Port OK",
    "USB Ports OK",
    "Ventilation OK",
    "Controller Port OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Liquid Mark",
  ],
  "Network Device": [
    "Casing OK",
    "Power Port OK",
    "Network Ports OK",
    "Antennas OK",
    "Reset Button OK",
    "Mounting Bracket OK",
    "Status Lights OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Burn Mark",
  ],
  "Storage / NAS": [
    "Casing OK",
    "Drive Bays OK",
    "Drive Trays OK",
    "Power Button OK",
    "Network Ports OK",
    "USB Ports OK",
    "Fans OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Dusty",
  ],
  "Other Device": [
    "Casing OK",
    "Power Button OK",
    "Ports OK",
    "Screen OK",
    "Scratches",
    "Dents",
    "Cracks",
    "Liquid Mark",
    "Other Condition",
  ],
};
const deviceAccessoryOptions = {
  Laptop: [
    "AC Adapter",
    "Power Cable",
    "Laptop Bag",
    "Sleeve",
    "Mouse",
    "USB Receiver",
    "Docking Station",
    "External Battery",
    "Original Box",
    "Others",
  ],
  Desktop: [
    "Power Cable",
    "Keyboard",
    "Mouse",
    "USB Receiver",
    "Wi-Fi Antenna",
    "Display Cable",
    "Side Panel Key",
    "Original Box",
    "Others",
  ],
  "Mobile Phone": [
    "Charger",
    "USB Cable",
    "Phone Case",
    "SIM Tray",
    "SIM Ejector Pin",
    "Screen Protector",
    "Earphones",
    "Memory Card",
    "Original Box",
    "Others",
  ],
  Tablet: [
    "Charger",
    "USB Cable",
    "Tablet Case",
    "Keyboard Cover",
    "Stylus / Pen",
    "SIM Ejector Pin",
    "Memory Card",
    "Original Box",
    "Others",
  ],
  Printer: [
    "Power Cable",
    "USB Cable",
    "Network Cable",
    "Ink Cartridge",
    "Toner Cartridge",
    "Print Head",
    "Paper Tray",
    "Original Box",
    "Others",
  ],
  Monitor: [
    "Power Cable",
    "Power Adapter",
    "HDMI Cable",
    "DisplayPort Cable",
    "USB-C Cable",
    "VGA Cable",
    "Stand",
    "Base",
    "Remote Control",
    "Original Box",
    "Others",
  ],
  Server: [
    "Power Cable",
    "Network Cable",
    "Rack Rails",
    "Rack Ears",
    "Drive Caddy",
    "Bezel Key",
    "Console Cable",
    "Original Box",
    "Others",
  ],
  "Gaming Console": [
    "Power Cable",
    "Power Adapter",
    "HDMI Cable",
    "Controller",
    "Controller Cable",
    "Dock",
    "Game Disc",
    "Memory Card",
    "Carrying Case",
    "Original Box",
    "Others",
  ],
  "Network Device": [
    "Power Adapter",
    "Power Cable",
    "Network Cable",
    "Antennas",
    "Mounting Bracket",
    "Console Cable",
    "PoE Injector",
    "Original Box",
    "Others",
  ],
  "Storage / NAS": [
    "Power Adapter",
    "Power Cable",
    "Network Cable",
    "Drive Caddy",
    "Drive Tray Key",
    "USB Cable",
    "External Drive",
    "Original Box",
    "Others",
  ],
  "Other Device": [
    "Power Adapter",
    "Power Cable",
    "USB Cable",
    "Bag / Case",
    "Remote Control",
    "Original Box",
    "Others",
  ],
};
const deviceIssueCategories = {
  Laptop: [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Slow / Performance",
    "Overheating",
    "Screen / Display",
    "Keyboard / Touchpad",
    "Battery / Charging",
    "Storage / Data",
    "Memory / RAM",
    "Ports / Connectivity",
    "Software / OS",
    "Data Recovery",
    "Physical Damage",
    "Liquid Damage",
  ],
  Desktop: [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Slow / Performance",
    "Overheating",
    "Display Output",
    "Storage / Data",
    "Memory / RAM",
    "Motherboard / Power Supply",
    "Ports / Connectivity",
    "Software / OS",
    "Data Recovery",
    "Physical Damage",
    "Liquid Damage",
  ],
  "Mobile Phone": [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Screen / Touch",
    "Battery / Charging",
    "Camera",
    "Speaker / Microphone",
    "Network / Signal",
    "Buttons / Charging Port",
    "Software / OS",
    "Data Recovery",
    "Physical Damage",
    "Liquid Damage",
  ],
  Tablet: [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Screen / Touch",
    "Battery / Charging",
    "Camera",
    "Speaker / Microphone",
    "Wi-Fi / Mobile Network",
    "Buttons / Charging Port",
    "Keyboard / Stylus",
    "Software / OS",
    "Data Recovery",
    "Physical Damage",
    "Liquid Damage",
  ],
  Printer: [
    "General Check / Diagnosis",
    "No Power",
    "Cannot Print",
    "Print Quality",
    "Paper Jam / Paper Feed",
    "Ink / Toner",
    "Print Head",
    "Scanner / Copier",
    "Network / Connectivity",
    "Driver / Software",
    "Noise / Mechanical",
    "Physical Damage",
  ],
  Monitor: [
    "General Check / Diagnosis",
    "No Power",
    "No Display / Signal",
    "Flickering",
    "Lines / Colour Issue",
    "Dead Pixel",
    "Backlight",
    "Ports / Connectivity",
    "Buttons / Menu",
    "Stand / Physical Damage",
    "Liquid Damage",
  ],
  Server: [
    "General Check / Diagnosis",
    "No Power / Boot Failure",
    "Performance",
    "Overheating",
    "Storage / RAID",
    "Memory / RAM",
    "Network / Connectivity",
    "Power Supply",
    "Operating System",
    "Data Recovery",
    "Hardware Failure",
    "Physical Damage",
  ],
  "Gaming Console": [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "No Display / HDMI",
    "Overheating",
    "Disc Drive",
    "Controller / Pairing",
    "Storage",
    "Network / Online",
    "Software / Firmware",
    "Physical Damage",
    "Liquid Damage",
  ],
  "Network Device": [
    "General Check / Diagnosis",
    "No Power",
    "No Internet / Connection",
    "Intermittent Connection",
    "Slow Network",
    "Wi-Fi / Signal",
    "Network Ports",
    "Configuration / Firmware",
    "PoE Issue",
    "Physical Damage",
    "Burn / Surge Damage",
  ],
  "Storage / NAS": [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Drive Not Detected",
    "Storage / RAID",
    "Network / Connectivity",
    "Slow Performance",
    "Data Recovery",
    "Fan / Overheating",
    "Firmware / Configuration",
    "Physical Damage",
    "Liquid Damage",
  ],
  "Other Device": [
    "General Check / Diagnosis",
    "No Power / Cannot Start",
    "Performance Issue",
    "Hardware Repair",
    "Software / Configuration",
    "Connectivity",
    "Data Recovery",
    "Physical Damage",
    "Liquid Damage",
    "Other Issue",
  ],
};
const deviceBrands = {
  Laptop: [
    "Acer",
    "Alienware",
    "Apple",
    "ASUS",
    "Dell",
    "Dynabook",
    "Fujitsu",
    "Gigabyte",
    "Honor",
    "HP",
    "Huawei",
    "Lenovo",
    "LG",
    "Microsoft Surface",
    "MSI",
    "Razer",
    "Samsung",
    "VAIO",
    "Xiaomi",
    "Others",
  ],
  Desktop: [
    "Acer",
    "Alienware",
    "Apple",
    "ASUS",
    "Dell",
    "HP",
    "Lenovo",
    "MSI",
    "Intel NUC",
    "Custom Built",
    "Others",
  ],
  "Mobile Phone": [
    "Apple",
    "Samsung",
    "Google Pixel",
    "Huawei",
    "Honor",
    "Xiaomi",
    "Redmi",
    "POCO",
    "OPPO",
    "vivo",
    "realme",
    "OnePlus",
    "Sony",
    "Motorola",
    "Nokia",
    "ASUS ROG",
    "Nothing",
    "ZTE",
    "Infinix",
    "TECNO",
    "Others",
  ],
  Tablet: [
    "Apple",
    "Samsung",
    "Microsoft Surface",
    "Huawei",
    "Honor",
    "Xiaomi",
    "Lenovo",
    "Amazon Fire",
    "OPPO",
    "vivo",
    "OnePlus",
    "Google Pixel",
    "Others",
  ],
  Printer: [
    "Brother",
    "Canon",
    "Epson",
    "HP",
    "Ricoh",
    "FujiFilm Business Innovation",
    "Konica Minolta",
    "Kyocera",
    "Lexmark",
    "Pantum",
    "Zebra",
    "Others",
  ],
  Monitor: [
    "Acer",
    "AOC",
    "Apple",
    "ASUS",
    "BenQ",
    "Dell",
    "Gigabyte",
    "HP",
    "LG",
    "MSI",
    "Philips",
    "Samsung",
    "ViewSonic",
    "Others",
  ],
  Server: [
    "Dell EMC",
    "HPE",
    "IBM",
    "Lenovo",
    "Supermicro",
    "Fujitsu",
    "ASUS",
    "Others",
  ],
  "Gaming Console": [
    "Sony PlayStation",
    "Microsoft Xbox",
    "Nintendo",
    "Valve Steam Deck",
    "ASUS ROG",
    "Lenovo Legion",
    "Others",
  ],
  "Network Device": [
    "Cisco",
    "TP-Link",
    "D-Link",
    "ASUS",
    "Netgear",
    "Ubiquiti",
    "MikroTik",
    "Huawei",
    "Ruijie",
    "Aruba",
    "Fortinet",
    "Others",
  ],
  "Storage / NAS": [
    "Synology",
    "QNAP",
    "Western Digital",
    "Seagate",
    "Buffalo",
    "ASUSTOR",
    "TerraMaster",
    "Others",
  ],
  "Other Device": ["Others"],
};
deviceConditionOptions["Desktop PC"] = deviceConditionOptions.Desktop;
deviceAccessoryOptions["Desktop PC"] = deviceAccessoryOptions.Desktop;
deviceIssueCategories["Desktop PC"] = deviceIssueCategories.Desktop;
deviceBrands["Desktop PC"] = deviceBrands.Desktop;
const fallbackCompany = {
  name: "TechCare PC Sdn. Bhd.",
  registration: "202601012345",
  address:
    "12, Jalan Kuchai Maju 8\nKuchai Entrepreneurs Park\n58200 Kuala Lumpur",
  phone: "+60 3-7981 8800",
  email: "service@techcare.my",
  logo: "",
};
const fallbackEmailConfiguration = {
  method: "Default Email App (mailto)",
  senderName: "",
  replyTo: "",
  defaultCc: "",
  subjectPrefix: "[Service Centre]",
  signature: "Thank you.\nService Team",
};
function loadReceiptCompany() {
  return fallbackCompany;
}

function normalizedSerial(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
function repairDateFromNumber(repairNo) {
  const match = String(repairNo || "").match(/^SR-(\d{4})(\d{2})(\d{2})-/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Date not recorded";
}

export function RepairIntake({
  onBackListing,
  onCreate,
  onComplete,
  customerRecords = [],
  repairRecords = [],
  onCustomerCreate,
  companyProfile,
  receiptOptions = {},
  emailConfiguration = fallbackEmailConfiguration,
}) {
  const { user: currentUser } = useAccess();
  const configuredFee = Number(receiptOptions.defaultFee);
  const defaultDiagnosticFee =
    Number.isFinite(configuredFee) && configuredFee >= 0
      ? configuredFee.toFixed(2)
      : "50.00";
  const [stage, setStage] = useState(1);
  const [localCustomers, setLocalCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [query, setQuery] = useState("");
  const [changeCustomerOpen, setChangeCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [printCount, setPrintCount] = useState(0);
  const photoInput = useRef(null);
  const cameraVideo = useRef(null);
  const cameraStream = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const serialScannerVideo = useRef(null);
  const serialScannerControls = useRef(null);
  const [serialScannerOpen, setSerialScannerOpen] = useState(false);
  const [serialScannerStatus, setSerialScannerStatus] = useState("");
  const [serialScannerError, setSerialScannerError] = useState("");
  const [scannerTorchOn, setScannerTorchOn] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [supplementEmailOpen, setSupplementEmailOpen] = useState(false);
  const [supplementEmailSending, setSupplementEmailSending] = useState(false);
  const [supplementEmailConfirmed, setSupplementEmailConfirmed] =
    useState(false);
  const [supplementEmailPrepared, setSupplementEmailPrepared] = useState(false);
  const signatureCanvas = useRef(null);
  const signatureDrawing = useRef(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState("Signature");
  const [verificationValue, setVerificationValue] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [completedVerification, setCompletedVerification] = useState(null);
  const receiptCompany = {
    ...(companyProfile || loadReceiptCompany()),
    termsConditions: receiptOptions.termsConditions,
  };
  const [form, setForm] = useState(() => ({
    deviceType: "Laptop",
    brand: "ASUS",
    otherBrand: "",
    model: "VivoBook 15 (X515EA)",
    identifierType: "Manufacturer Serial",
    identifierSource: "Manual",
    serial: "",
    customerAssetTag: "",
    serialUnavailableReason: "",
    internalDeviceId: createInternalDeviceId(),
    purchaseDate: "",
    warranty: "In Warranty",
    warrantyClaim: false,
    password: "",
    issueCategory: "General Check / Diagnosis",
    issue: "",
    conditions: [],
    accessories: [],
    photos: [],
    delivery: "Print",
    sync: true,
    diagnosticFee: defaultDiagnosticFee,
  }));
  const issueCategoryOptions =
    deviceIssueCategories[form.deviceType] ||
    deviceIssueCategories["Other Device"];
  useEffect(() => {
    setForm((current) =>
      current.diagnosticFee === defaultDiagnosticFee
        ? current
        : { ...current, diagnosticFee: defaultDiagnosticFee },
    );
  }, [defaultDiagnosticFee]);
  useEffect(() => {
    setForm((current) => {
      const options =
        deviceIssueCategories[current.deviceType] ||
        deviceIssueCategories["Other Device"];
      return options.includes(current.issueCategory)
        ? current
        : { ...current, issueCategory: options[0] };
    });
  }, [form.deviceType]);
  useEffect(() => {
    if (cameraOpen && cameraVideo.current && cameraStream.current) {
      cameraVideo.current.srcObject = cameraStream.current;
      cameraVideo.current.play().catch(() => {});
    }
  }, [cameraOpen]);
  useEffect(
    () => () => {
      cameraStream.current?.getTracks().forEach((track) => track.stop());
      serialScannerControls.current?.stop?.();
    },
    [],
  );
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const brandOptions =
    deviceBrands[form.deviceType] || deviceBrands["Other Device"];
  const conditionOptions =
    deviceConditionOptions[form.deviceType] ||
    deviceConditionOptions["Other Device"];
  const accessoryOptions =
    deviceAccessoryOptions[form.deviceType] ||
    deviceAccessoryOptions["Other Device"];
  const resolvedBrand =
    form.brand === "Others" ? form.otherBrand.trim() || "Others" : form.brand;
  const identifierLabel =
    form.identifierType === "Customer Asset Tag"
      ? "Customer Asset Tag"
      : form.identifierType === "Manufacturer Serial"
        ? "Serial Number"
        : "Internal Device ID";
  const identifierValue =
    form.identifierType === "Customer Asset Tag"
      ? form.customerAssetTag
      : form.identifierType === "Manufacturer Serial"
        ? form.serial
        : form.internalDeviceId;
  function changeDeviceType(deviceType) {
    const brands = deviceBrands[deviceType] || deviceBrands["Other Device"];
    setForm((current) => ({
      ...current,
      deviceType,
      brand: brands[0],
      otherBrand: "",
      model: "",
      issueCategory: (
        deviceIssueCategories[deviceType] ||
        deviceIssueCategories["Other Device"]
      ).includes(current.issueCategory)
        ? current.issueCategory
        : "General Check / Diagnosis",
      conditions: current.conditions.filter((item) =>
        (
          deviceConditionOptions[deviceType] ||
          deviceConditionOptions["Other Device"]
        ).includes(item),
      ),
      accessories: current.accessories.filter((item) =>
        (
          deviceAccessoryOptions[deviceType] ||
          deviceAccessoryOptions["Other Device"]
        ).includes(item),
      ),
    }));
    setError("");
  }
  const customers = useMemo(() => {
    const shared = customerRecords.length
      ? customerRecords.map((item) => ({
          id: item.id,
          name: item.name || item.company,
          phone: item.mobile || item.phone || "—",
          email: item.email || "—",
          debtor: item.debtor || "—",
        }))
      : initialCustomers;
    return [
      ...localCustomers,
      ...shared.filter(
        (item) => !localCustomers.some((local) => local.id === item.id),
      ),
    ];
  }, [customerRecords, localCustomers]);
  const matches = useMemo(
    () =>
      customers.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [customers, query],
  );
  const previousIdentifierRepairs = useMemo(() => {
    const identifier = normalizedSerial(identifierValue);
    if (identifier.length < 4) return [];
    return repairRecords
      .filter((repair) =>
        [repair.serial, repair.customerAssetTag, repair.internalDeviceId].some(
          (value) => normalizedSerial(value) === identifier,
        ),
      )
      .slice(0, 5);
  }, [repairRecords, identifierValue]);
  const [repairNo, setRepairNo] = useState("");

  function toggle(key, value) {
    update(
      key,
      form[key].includes(value)
        ? form[key].filter((item) => item !== value)
        : [...form[key], value],
    );
  }
  function changeIdentifierType(identifierType) {
    const serialUnavailableReason =
      identifierType === "Custom Built - No Serial"
        ? "Custom-built device has no manufacturer serial number"
        : identifierType === "Serial Label Missing"
          ? "Serial label is missing, damaged or unreadable"
          : "";
    setForm((current) => ({
      ...current,
      identifierType,
      identifierSource: identifierType.includes("No Serial") || identifierType.includes("Missing")
        ? "Generated"
        : "Manual",
      serialUnavailableReason,
      internalDeviceId: current.internalDeviceId || createInternalDeviceId(),
    }));
    setSerialScannerError("");
  }
  function stopSerialScanner() {
    serialScannerControls.current?.stop?.();
    serialScannerControls.current = null;
    const stream = serialScannerVideo.current?.srcObject;
    stream?.getTracks?.().forEach((track) => track.stop());
    if (serialScannerVideo.current) serialScannerVideo.current.srcObject = null;
    setScannerTorchOn(false);
    setSerialScannerOpen(false);
  }
  async function openSerialScanner() {
    setSerialScannerError("");
    setSerialScannerStatus("Starting rear camera...");
    if (!navigator.mediaDevices?.getUserMedia) {
      setSerialScannerError(
        "Camera scanning is unavailable. Open the system through HTTPS on the phone or tablet, or enter the identifier manually.",
      );
      return;
    }
    setSerialScannerOpen(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      serialScannerControls.current = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        serialScannerVideo.current,
        (result) => {
          if (!result) return;
          const value = result.getText().trim();
          if (!value) return;
          setForm((current) => ({
            ...current,
            [current.identifierType === "Customer Asset Tag"
              ? "customerAssetTag"
              : "serial"]: value,
            identifierSource: "Camera Scan",
          }));
          stopSerialScanner();
          setNotice(`${identifierLabel} scanned: ${value}`);
        },
      );
      setSerialScannerStatus("Point the barcode or QR code inside the frame.");
    } catch (error) {
      stopSerialScanner();
      setSerialScannerError(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in the browser, then try again."
          : "Unable to start the scanner. Check the camera permission or enter the identifier manually.",
      );
    }
  }
  async function toggleScannerTorch() {
    const track = serialScannerVideo.current?.srcObject?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      const next = !scannerTorchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setScannerTorchOn(next);
    } catch {
      setSerialScannerStatus("Torch is not supported by this camera.");
    }
  }
  function stopCamera() {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    setCameraOpen(false);
  }
  async function openConditionCamera() {
    if (form.photos.length >= 3) {
      setNotice("Maximum 3 condition photos reached");
      return;
    }
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("No camera was detected on this device or browser.");
      return;
    }
    try {
      cameraStream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Camera is unavailable or permission was not granted. Use Upload Photo if needed.",
      );
    }
  }
  function addPhotoData(dataUrl) {
    setForm((current) =>
      current.photos.length >= 3
        ? current
        : { ...current, photos: [...current.photos, dataUrl].slice(0, 3) },
    );
  }
  function resizeImage(source, maxWidth = 2560, maxHeight = 1920) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(
            1,
            maxWidth / image.width,
            maxHeight / image.height,
          ),
          canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/webp", 0.94);
        resolve(compressed.length < source.length ? compressed : source);
      };
      image.onerror = reject;
      image.src = source;
    });
  }
  async function chooseConditionPhotos(event) {
    const files = [...(event.target.files || [])]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 3 - form.photos.length);
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        setNotice(`${file.name} is larger than 8 MB`);
        continue;
      }
      const source = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      addPhotoData(await resizeImage(source));
    }
    event.target.value = "";
  }
  function captureConditionPhoto() {
    const video = cameraVideo.current;
    if (!video?.videoWidth) return;
    const scale = Math.min(
        1,
        2560 / video.videoWidth,
        1920 / video.videoHeight,
      ),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    addPhotoData(canvas.toDataURL("image/webp", 0.94));
    stopCamera();
    setNotice("Condition photo captured and optimized in high quality");
  }
  function removeConditionPhoto(index) {
    setForm((current) => ({
      ...current,
      photos: current.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
  }
  function validate(currentStage) {
    if (currentStage === 1 && !customer)
      return "Select a customer before continuing.";
    if (
      currentStage === 2 &&
      (!form.deviceType ||
        !resolvedBrand ||
        (form.brand === "Others" && !form.otherBrand.trim()) ||
        !form.model ||
        (form.identifierType === "Manufacturer Serial" &&
          !form.serial.trim()) ||
        (form.identifierType === "Customer Asset Tag" &&
          !form.customerAssetTag.trim()) ||
        !form.internalDeviceId.trim())
    )
      return "Complete the Device details and selected Device Identifier.";
    if (currentStage === 3 && !form.issue.trim())
      return "Issue Description is required before continuing.";
    return "";
  }
  function next() {
    const message = validate(stage);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStage((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goTo(target) {
    if (target < stage) {
      setError("");
      setStage(target);
    }
  }
  async function saveDraft() {
    try {
      await databaseApi.saveDraft("repair-intake-current", {
        stage,
        customer,
        form,
      });
      setNotice("Repair draft saved to SQL");
    } catch {
      setNotice("Unable to save repair draft");
    }
  }
  function openCustomerVerification() {
    setVerificationMethod("Signature");
    setVerificationValue(customer.phone === "—" ? "" : customer.phone);
    setSignatureData("");
    setVerificationError("");
    setVerificationOpen(true);
  }
  function signaturePoint(event) {
    const canvas = signatureCanvas.current,
      rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  function startSignature(event) {
    const canvas = signatureCanvas.current,
      point = signaturePoint(event),
      context = canvas.getContext("2d");
    signatureDrawing.current = true;
    canvas.setPointerCapture?.(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }
  function drawSignature(event) {
    if (!signatureDrawing.current) return;
    const point = signaturePoint(event),
      context = signatureCanvas.current.getContext("2d");
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#173c30";
    context.lineTo(point.x, point.y);
    context.stroke();
  }
  function finishSignature() {
    if (!signatureDrawing.current) return;
    signatureDrawing.current = false;
    setSignatureData(signatureCanvas.current.toDataURL("image/png"));
    setVerificationError("");
  }
  function clearSignature() {
    const canvas = signatureCanvas.current;
    canvas?.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  }
  async function confirmCustomerVerification() {
    if (verificationMethod === "Signature" && !signatureData) {
      setVerificationError("Customer signature is required.");
      return;
    }
    if (
      verificationMethod === "Mobile Number" &&
      verificationValue.replace(/\D/g, "").length < 7
    ) {
      setVerificationError("Enter a valid Mobile Number.");
      return;
    }
    if (
      verificationMethod === "IC / Passport" &&
      verificationValue.trim().length < 6
    ) {
      setVerificationError("Enter a valid IC or Passport Number.");
      return;
    }
    const verification = {
      method: verificationMethod,
      value:
        verificationMethod === "Signature"
          ? "Signed by customer"
          : verificationValue.trim(),
      signature: verificationMethod === "Signature" ? signatureData : "",
      verifiedAt: new Date().toISOString(),
    };
    setCompletedVerification(verification);
    setVerificationOpen(false);
    await submitRepair(verification);
  }
  async function submitRepair(verification) {
    if (
      form.delivery === "Email" &&
      !/^\S+@\S+\.\S+$/.test(customer.email || "")
    ) {
      setError("A valid Customer Email is required for email delivery.");
      return;
    }
    const preparedEmailWindow =
      form.delivery === "Email" &&
      emailConfiguration.method === "Gmail Web Link"
        ? window.open("about:blank", "_blank")
        : null;
    const repair = {
      customerId: customer.id,
      customer: customer.name,
      phone: customer.phone,
      device: `${resolvedBrand} ${form.model}`,
      deviceType: form.deviceType,
      brand: resolvedBrand,
      model: form.model,
      identifierType: form.identifierType,
      identifierSource: form.identifierSource,
      serial: form.serial,
      customerAssetTag: form.customerAssetTag,
      serialUnavailableReason: form.serialUnavailableReason,
      internalDeviceId: form.internalDeviceId,
      purchaseDate: form.purchaseDate,
      warrantyStatus: form.warranty,
      warrantyClaim: form.warrantyClaim,
      devicePassword: form.password,
      conditions: form.conditions,
      accessories: form.accessories,
      photos: form.photos,
      receiptDelivery: form.delivery,
      autoCountSync: form.sync,
      issueCategory: form.issueCategory,
      issue: form.issue,
      customerVerificationMethod: verification.method,
      customerVerificationValue: verification.value,
      customerSignature: verification.signature,
      customerVerifiedAt: verification.verifiedAt,
      createdBy: currentUser?.name || currentUser?.username || "Unknown User",
      technician: "Unassigned",
      status: "Received",
      due: "19/08/2026",
      dueDate: "2026-08-19",
      diagnosticFee: form.diagnosticFee,
      amount: `RM ${form.diagnosticFee}`,
    };
    let savedNumber = "";
    try {
      const savedRepair = await onCreate?.(repair);
      savedNumber = savedRepair?.no || repair.no;
      setRepairNo(savedNumber);
    } catch (error) {
      preparedEmailWindow?.close();
      setError(`SQL Server save failed: ${error.message}`);
      return;
    }
    setForm((current) => ({
      ...current,
      createdBy: currentUser?.name || currentUser?.username || "Unknown User",
      createdAt: verification.verifiedAt,
    }));
    setSubmitted(true);
    if (form.delivery === "Email")
      await sendReceiptEmail(savedNumber, preparedEmailWindow, verification);
    else
      setNotice(
        form.sync
          ? "Repair created · AutoCount invoice queued"
          : "Repair created successfully",
      );
  }
  function verificationDateTime(verification) {
    return verification?.verifiedAt
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kuala_Lumpur",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date(verification.verifiedAt))
      : "—";
  }
  async function createReceiptPdf(
    repairNumber,
    verification = completedVerification,
    alreadyPrinted = false,
  ) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = 18;
    const write = (value, size = 10, style = "normal") => {
      pdf.setFont("helvetica", style);
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(String(value || "—"), 174);
      pdf.text(lines, 18, y);
      y += lines.length * (size * 0.42) + 2;
    };
    const section = (title, rows) => {
      if (y > 250) {
        pdf.addPage();
        y = 18;
      }
      pdf.setDrawColor(205, 220, 213);
      pdf.line(18, y, 192, y);
      y += 7;
      write(title, 12, "bold");
      rows.forEach(([label, value]) => write(`${label}: ${value || "—"}`, 9));
      y += 3;
    };
    write(receiptCompany.name, 18, "bold");
    write(receiptCompany.address, 9);
    write(`${receiptCompany.phone} · ${receiptCompany.email}`, 9);
    y += 4;
    write("REPAIR INTAKE RECEIPT", 15, "bold");
    write(`Repair No: ${repairNumber}`, 11, "bold");
    section("Customer", [
      ["Name", customer.name],
      ["Phone", customer.phone],
      ["Email", customer.email],
      ["AutoCount Debtor", customer.debtor],
    ]);
    section("Device & Condition", [
      ["Device", `${resolvedBrand} ${form.model}`],
      ["Type", form.deviceType],
      [identifierLabel, identifierValue],
      ["Internal Device ID", form.internalDeviceId],
      ...(form.serialUnavailableReason
        ? [["No Serial Reason", form.serialUnavailableReason]]
        : []),
      ["Warranty", form.warranty],
      ["Warranty Claim", form.warrantyClaim ? "Yes" : "No"],
      ["Issue Category", form.issueCategory],
      ["Reported Issue", form.issue],
      [
        "Condition / Accessories",
        [...form.conditions, ...form.accessories].join(" · ") ||
          "None recorded",
      ],
    ]);
    if (form.photos.length) {
      if (y > 205) {
        pdf.addPage();
        y = 18;
      }
      pdf.setDrawColor(205, 220, 213);
      pdf.line(18, y, 192, y);
      y += 7;
      write("Condition Photos", 12, "bold");
      const toJpeg = (source) =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const canvas = document.createElement("canvas"),
              ratio = Math.min(
                1,
                1200 / Math.max(image.naturalWidth, image.naturalHeight),
              );
            canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
            canvas.height = Math.max(
              1,
              Math.round(image.naturalHeight * ratio),
            );
            canvas
              .getContext("2d")
              .drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          };
          image.onerror = reject;
          image.src = source;
        });
      const photos = form.photos.slice(0, 3),
        photoWidth = 54,
        photoHeight = 36;
      for (let index = 0; index < photos.length; index += 1) {
        try {
          const jpeg = await toJpeg(photos[index]),
            x = 18 + index * 59;
          pdf.addImage(jpeg, "JPEG", x, y, photoWidth, photoHeight);
          pdf.setFontSize(7);
          pdf.text(
            `Photo ${index + 1}`,
            x + photoWidth / 2,
            y + photoHeight + 3,
            { align: "center" },
          );
        } catch {}
      }
      y += photoHeight + 9;
    }
    section("Charges & Delivery", [
      ["Diagnostic Fee", `RM ${form.diagnosticFee}`],
      [
        "Receipt Delivery",
        form.delivery === "Email" ? "Email PDF" : "Printed Receipt",
      ],
    ]);
    section("Customer Verification", [
      ["Verification Method", verification?.method],
      ["Verified Detail", verification?.value],
      ["Date / Time", verificationDateTime(verification)],
    ]);
    section("Created By", [
      [
        "Login User",
        currentUser?.name || currentUser?.username || "Unknown User",
      ],
      ["Date / Time", verificationDateTime(verification)],
    ]);
    if (verification?.method === "Signature" && verification.signature) {
      pdf.addImage(verification.signature, "PNG", 18, y, 65, 19);
      y += 20;
      pdf.setDrawColor(90, 110, 102);
      pdf.line(18, y, 88, y);
      y += 4;
      pdf.setFontSize(8);
      pdf.text("Customer Signature", 53, y, { align: "center" });
      y += 7;
    }
    section("Terms & Conditions", [
      [
        "",
        receiptCompany.termsConditions?.trim() ||
          "Device received subject to inspection. Please present this receipt when collecting the device.",
      ],
    ]);
    pdf.setFontSize(8);
    pdf.text(
      `${receiptCompany.name} · BRN ${receiptCompany.registration || "—"}`,
      18,
      287,
    );
    if (alreadyPrinted) {
      const pages = pdf.getNumberOfPages();
      for (let page = 1; page <= pages; page += 1) {
        pdf.setPage(page);
        pdf.setTextColor(205, 215, 211);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(34);
        pdf.text("ALREADY PRINTED", 105, 150, { align: "center", angle: 35 });
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.text(
          "Email copy issued after the original receipt was printed",
          105,
          278,
          { align: "center" },
        );
      }
    }
    return pdf.output("blob");
  }
  function emailLink(repairNumber, alreadyPrinted = false) {
    const subject =
      `${emailConfiguration.subjectPrefix || ""} ${alreadyPrinted ? "[PRINTED COPY] " : ""}Repair Receipt ${repairNumber}`.trim();
    const body = `Dear ${customer.name},\n\nPlease find your repair intake receipt attached.${alreadyPrinted ? " This email copy was issued after the original receipt had already been printed." : ""}\n\nRepair No: ${repairNumber}\nDevice: ${resolvedBrand} ${form.model}\n${identifierLabel}: ${identifierValue}\nInternal Device ID: ${form.internalDeviceId}\n\n${emailConfiguration.signature || ""}`;
    const cc = emailConfiguration.defaultCc
      ? `&cc=${encodeURIComponent(emailConfiguration.defaultCc)}`
      : "";
    return emailConfiguration.method === "Gmail Web Link"
      ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customer.email)}${cc}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(subject)}${cc}&body=${encodeURIComponent(body)}`;
  }
  async function sendReceiptEmail(
    repairNumber,
    preparedWindow = null,
    verification = completedVerification,
    alreadyPrinted = false,
  ) {
    const blob = await createReceiptPdf(
        repairNumber,
        verification,
        alreadyPrinted,
      ),
      file = new File(
        [blob],
        `${repairNumber}-${alreadyPrinted ? "Printed-Email-Copy" : "Repair-Receipt"}.pdf`,
        { type: "application/pdf" },
      );
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        preparedWindow?.close();
        await navigator.share({
          title: `Repair Receipt ${repairNumber}`,
          text: `Repair receipt for ${customer.name}`,
          files: [file],
        });
        setEmailStatus(`Receipt PDF shared to ${customer.email}`);
        setNotice("Repair created · email share opened with PDF attachment");
        return true;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        preparedWindow?.close();
        setEmailStatus("Email sharing was cancelled");
        return false;
      }
    }
    const download = document.createElement("a");
    download.href = URL.createObjectURL(blob);
    download.download = file.name;
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(download.href), 1000);
    const link = emailLink(repairNumber, alreadyPrinted);
    if (preparedWindow) preparedWindow.location.href = link;
    else window.location.href = link;
    setEmailStatus(
      `PDF downloaded; email compose opened for ${customer.email}`,
    );
    setNotice(
      "Repair created · attach the downloaded PDF if your email app did not add it automatically",
    );
    return true;
  }
  function printReceipt() {
    setReceiptOpen(true);
    setPrintCount((count) => count + 1);
    window.setTimeout(() => window.print(), 120);
  }
  function requestSupplementEmail() {
    if (!/^\S+@\S+\.\S+$/.test(customer.email || "")) {
      setEmailStatus("A valid customer email is required before sending.");
      return;
    }
    setSupplementEmailConfirmed(false);
    setSupplementEmailOpen(true);
  }
  async function confirmSupplementEmail() {
    setSupplementEmailSending(true);
    try {
      const prepared = await sendReceiptEmail(
        repairNo,
        null,
        completedVerification,
        true,
      );
      if (prepared) {
        setSupplementEmailPrepared(true);
        setSupplementEmailOpen(false);
      }
    } finally {
      setSupplementEmailSending(false);
    }
  }
  async function addCustomer(data) {
    const id = `CUST-${String(129 + customers.length).padStart(6, "0")}`;
    const created = {
      id,
      name: data.attention || data.company,
      phone: data.mobile || "—",
      email: data.email || "—",
      debtor: data.debtor,
    };
    const record = {
      id,
      debtor: data.debtor,
      name: created.name,
      company: data.company,
      mobile: created.phone,
      email: created.email,
      tin: "—",
      type: "RETAIL",
      area: data.area || "—",
      balance: "RM 0.00",
      synced: true,
      last: "Synced just now",
    };
    Object.assign(record, data, {
      name: created.name,
      mobile: created.phone,
      email: created.email,
    });
    if (onCustomerCreate) await onCustomerCreate(record);
    else setLocalCustomers((current) => [created, ...current]);
    setCustomer(created);
    setNewCustomer(false);
    setChangeCustomerOpen(false);
    setQuery("");
    setNotice(`${created.name} created and selected`);
  }
  function chooseReplacementCustomer(item) {
    setCustomer(item);
    setChangeCustomerOpen(false);
    setQuery("");
    setError("");
    setNotice(`${item.name} selected · current progress kept`);
  }

  if (submitted)
    return (
      <main className="ri-shell ri-success-page">
        <section className="ri-success">
          <div>
            <CheckCircle size={54} weight="fill" />
          </div>
          <p>
            {form.delivery === "Email"
              ? "Repair created and email prepared"
              : "Repair successfully created"}
          </p>
          <h1>{repairNo}</h1>
          <span>
            {customer.name} · {resolvedBrand} {form.model}
          </span>
          {emailStatus && (
            <div className="ri-email-status">
              <EnvelopeSimple size={17} />
              {emailStatus}
            </div>
          )}
          <section>
            <b>Receipt: {form.delivery}</b>
            <b>AutoCount: {form.sync ? "Queued" : "Not requested"}</b>
            <b>Diagnostic Fee: RM {form.diagnosticFee}</b>
          </section>
          <div className="ri-success-actions">
            <button onClick={() => setReceiptOpen(true)}>
              <Eye size={17} /> Preview Receipt
            </button>
            {form.delivery === "Email" ? (
              <button onClick={() => sendReceiptEmail(repairNo)}>
                <EnvelopeSimple size={17} /> Send Email Again
              </button>
            ) : (
              <button onClick={printReceipt}>
                <Printer size={17} />{" "}
                {printCount ? "Reprint Receipt" : "Print Receipt"}
              </button>
            )}
            {form.delivery === "Print" && printCount > 0 && (
              <button
                className="ri-email-after-print"
                disabled={supplementEmailPrepared}
                onClick={requestSupplementEmail}
              >
                <EnvelopeSimple size={17} />{" "}
                {supplementEmailPrepared
                  ? "Email Copy Prepared"
                  : "Send Email Copy"}
              </button>
            )}
            <button className="ri-primary" onClick={onComplete}>
              View Repair in Listing
            </button>
          </div>
        </section>
        {receiptOpen && (
          <div className="rr-overlay" onClick={() => setReceiptOpen(false)}>
            <section
              className="rr-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Repair Intake Receipt Preview"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="rr-preview-head">
                <div>
                  <h2>Repair Intake Receipt</h2>
                  <p>Preview before printing</p>
                </div>
                <button
                  aria-label="Close Receipt Preview"
                  onClick={() => setReceiptOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>
              <div className="rr-copies">
                <RepairReceiptCopy
                  company={receiptCompany}
                  customer={customer}
                  form={form}
                  verification={completedVerification}
                  repairNo={repairNo}
                  copyType="Customer Copy"
                />
                <RepairReceiptCopy
                  company={receiptCompany}
                  customer={customer}
                  form={form}
                  verification={completedVerification}
                  repairNo={repairNo}
                  copyType="Service Copy"
                />
              </div>
              <div className="rr-actions">
                <button onClick={() => setReceiptOpen(false)}>Close</button>
                <button className="ri-primary" onClick={printReceipt}>
                  <Printer size={17} />{" "}
                  {printCount ? "Reprint Receipt" : "Print Receipt"}
                </button>
              </div>
            </section>
          </div>
        )}
        {supplementEmailOpen && (
          <div
            className="ri-verification-overlay"
            onClick={() => setSupplementEmailOpen(false)}
          >
            <section
              className="ri-verification-modal ri-email-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="supplement-email-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <h2 id="supplement-email-title">Confirm Email Copy</h2>
                  <p>
                    Verify the customer carefully before opening the email
                    composer.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close Email Confirmation"
                  onClick={() => setSupplementEmailOpen(false)}
                >
                  <X size={20} />
                </button>
              </header>
              <div className="ri-email-confirm-warning">
                <Warning size={21} weight="fill" />
                <span>
                  <b>The original receipt has already been printed.</b>
                  <small>
                    The PDF will show an ALREADY PRINTED watermark to prevent
                    duplicate use.
                  </small>
                </span>
              </div>
              <dl className="ri-email-confirm-details">
                <div>
                  <dt>Repair No.</dt>
                  <dd>{repairNo}</dd>
                </div>
                <div>
                  <dt>Customer</dt>
                  <dd>{customer.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{customer.email}</dd>
                </div>
                <div>
                  <dt>Device / Identifier</dt>
                  <dd>
                    {resolvedBrand} {form.model} · {identifierValue}
                  </dd>
                </div>
              </dl>
              <label className="ri-email-confirm-check">
                <input
                  type="checkbox"
                  checked={supplementEmailConfirmed}
                  onChange={(event) =>
                    setSupplementEmailConfirmed(event.target.checked)
                  }
                />
                <span>
                  I have verified this Repair No., customer and email address.
                </span>
              </label>
              <div className="ri-verification-actions">
                <button
                  type="button"
                  onClick={() => setSupplementEmailOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ri-primary"
                  disabled={!supplementEmailConfirmed || supplementEmailSending}
                  onClick={confirmSupplementEmail}
                >
                  <EnvelopeSimple size={18} />
                  {supplementEmailSending
                    ? "Preparing PDF..."
                    : "Confirm & Send Email Copy"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    );

  return (
    <main className="ri-shell">
      <header className="ri-header">
        <div>
          <div className="ri-breadcrumb">
            <button type="button" onClick={onBackListing}>
              Repairs Listing
            </button>
            <span>/</span>
            <b>Create New Repair</b>
          </div>
          <h1>New Repair Intake</h1>
          <p>Capture accurate details to serve your customer better.</p>
        </div>
        <div className="ri-meta">
          <b>English</b>
          <span>12/08/2026 (Wed)</span>
          <span>10:15 AM</span>
          <span>Counter: 01</span>
        </div>
      </header>
      <section className="ri-workspace">
        <aside className="ri-sidebar">
          <nav>
            {steps.map((label, index) => {
              const number = index + 1;
              return (
                <button
                  type="button"
                  key={label}
                  className={
                    number === stage ? "active" : number < stage ? "done" : ""
                  }
                  onClick={() => goTo(number)}
                >
                  <span className="ri-step-no">
                    {number < stage ? (
                      <Check size={16} weight="bold" />
                    ) : (
                      number
                    )}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="ri-content">
          {customer && stage > 1 && (
            <section className="ri-customer-summary ri-customer-summary-top">
              <div className="ri-customer-summary-heading">
                <UserCircle size={28} weight="duotone" />
                <h3>Customer Summary</h3>
              </div>
              <div>
                <label>Name</label>
                <strong>{customer.name}</strong>
              </div>
              <div>
                <label>Phone</label>
                <strong>{customer.phone}</strong>
              </div>
              <div>
                <label>AutoCount Debtor</label>
                <strong>{customer.debtor}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setChangeCustomerOpen(true);
                }}
              >
                Change Customer
              </button>
            </section>
          )}
          {stage === 1 && (
            <section className="ri-stage ri-customer-stage">
              <div className="ri-stage-title">
                <div>
                  <h2>Select Customer</h2>
                  <p>
                    Search existing customer records or create a new customer.
                  </p>
                </div>
                <button
                  className="ri-outline"
                  type="button"
                  onClick={() => setNewCustomer(true)}
                >
                  <Plus size={17} /> New Customer
                </button>
              </div>
              <div className="ri-search">
                <MagnifyingGlass size={20} />
                <input
                  autoFocus
                  aria-label="Search customers"
                  placeholder="Search name, phone, email or Debtor Account"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="ri-customer-list">
                {matches.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={customer?.id === item.id ? "selected" : ""}
                    onClick={() => {
                      setCustomer(item);
                      setError("");
                    }}
                  >
                    <UserCircle size={32} weight="duotone" />
                    <span>
                      <b>{item.name}</b>
                      <small>
                        {item.phone} · {item.email}
                      </small>
                    </span>
                    <i>{item.debtor}</i>
                    {customer?.id === item.id && (
                      <CheckCircle size={22} weight="fill" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}
          {stage === 2 && (
            <section className="ri-stage">
              <div className="ri-stage-title">
                <div>
                  <h2>Device &amp; Condition</h2>
                  <p>
                    Identify the device and record its warranty information.
                  </p>
                </div>
              </div>
              <div className="ri-form-grid">
                <label>
                  Device Type *
                  <select
                    value={form.deviceType}
                    onChange={(event) => changeDeviceType(event.target.value)}
                  >
                    <option>Laptop</option>
                    <option>Desktop PC</option>
                    <option>Mobile Phone</option>
                    <option>Tablet</option>
                    <option>Printer</option>
                    <option>Monitor</option>
                    <option>Server</option>
                    <option>Gaming Console</option>
                    <option>Network Device</option>
                    <option>Storage / NAS</option>
                    <option>Other Device</option>
                  </select>
                </label>
                <label>
                  Brand *
                  <select
                    value={form.brand}
                    onChange={(event) => update("brand", event.target.value)}
                  >
                    {brandOptions.map((brand) => (
                      <option key={brand}>{brand}</option>
                    ))}
                  </select>
                </label>
                {form.brand === "Others" && (
                  <label>
                    Other Brand *
                    <input
                      autoFocus
                      value={form.otherBrand}
                      placeholder="Enter brand name"
                      onChange={(event) =>
                        update("otherBrand", event.target.value)
                      }
                    />
                  </label>
                )}
                <label>
                  Model *
                  <input
                    value={form.model}
                    onChange={(event) => update("model", event.target.value)}
                  />
                </label>
                <fieldset className="ri-identifier-field ri-full">
                  <legend>Device Identification *</legend>
                  <div className="ri-identifier-options">
                    {deviceIdentifierOptions.map((option) => (
                      <label
                        key={option.value}
                        className={
                          form.identifierType === option.value ? "selected" : ""
                        }
                      >
                        <input
                          type="radio"
                          name="device-identifier-type"
                          checked={form.identifierType === option.value}
                          onChange={() => changeIdentifierType(option.value)}
                        />
                        <span>
                          <b>{option.label}</b>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {["Manufacturer Serial", "Customer Asset Tag"].includes(
                    form.identifierType,
                  ) ? (
                    <label className="ri-identifier-entry">
                      {identifierLabel} *
                      <div className="ri-input-action">
                        <input
                          aria-label={identifierLabel}
                          placeholder={`Enter or scan ${identifierLabel.toLowerCase()}`}
                          value={identifierValue}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [current.identifierType === "Customer Asset Tag"
                                ? "customerAssetTag"
                                : "serial"]: event.target.value,
                              identifierSource: "Manual",
                            }))
                          }
                        />
                        <button type="button" onClick={openSerialScanner}>
                          <Barcode size={17} /> Open Camera Scanner
                        </button>
                      </div>
                    </label>
                  ) : (
                    <section className="ri-generated-device-id" role="status">
                      <CheckCircle size={20} weight="fill" />
                      <span>
                        <small>{form.serialUnavailableReason}</small>
                        <b>{form.internalDeviceId}</b>
                        <em>
                          This Internal Device ID will identify the device in future repairs.
                        </em>
                      </span>
                    </section>
                  )}
                  <small className="ri-internal-id-note">
                    Internal Device ID: <b>{form.internalDeviceId}</b>
                  </small>
                </fieldset>
                {previousIdentifierRepairs.length > 0 && (
                  <section className="ri-serial-history" role="status">
                    <header>
                      <Warning size={20} weight="fill" />
                      <span>
                        <b>Previous Repair History Found</b>
                        <small>
                          {previousIdentifierRepairs.length} repair record
                          {previousIdentifierRepairs.length === 1 ? "" : "s"} found
                          for {identifierLabel} {identifierValue.trim()}
                        </small>
                      </span>
                    </header>
                    <div>
                      {previousIdentifierRepairs.map((repair, index) => (
                        <article key={repair.no}>
                          <span className="ri-serial-index">
                            {index === 0 ? "Latest" : `#${index + 1}`}
                          </span>
                          <div>
                            <b>{repair.no}</b>
                            <small>
                              {repairDateFromNumber(repair.no)} ·{" "}
                              {repair.customer}
                            </small>
                          </div>
                          <div>
                            <b>{repair.issue || "Issue not recorded"}</b>
                            <small>{repair.device}</small>
                          </div>
                          <i className="lm-badge info">{repair.status}</i>
                        </article>
                      ))}
                    </div>
                    <p>
                      Review the previous issue before continuing with this new
                      repair.
                    </p>
                  </section>
                )}
                <label>
                  Purchase Date
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(event) =>
                      update("purchaseDate", event.target.value)
                    }
                  />
                </label>
                <label>
                  Warranty Status
                  <select
                    value={form.warranty}
                    onChange={(event) => update("warranty", event.target.value)}
                  >
                    <option>In Warranty</option>
                    <option>Out of Warranty</option>
                    <option>Unknown</option>
                  </select>
                </label>
                <label className="ri-full">
                  Device Password
                  <input
                    type="password"
                    placeholder="If applicable (e.g. BIOS or Windows)"
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                  />
                </label>
              </div>
            </section>
          )}
          {stage === 3 && (
            <section className="ri-stage">
              <div className="ri-stage-title">
                <div>
                  <h2>Condition Details</h2>
                  <p>
                    Document the reported issue, body condition and received
                    accessories.
                  </p>
                </div>
              </div>
              <label>
                Issue Category *
                <select
                  value={form.issueCategory}
                  onChange={(event) =>
                    update("issueCategory", event.target.value)
                  }
                >
                  {issueCategoryOptions.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label
                className={`ri-warranty-claim${form.warrantyClaim ? " selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={form.warrantyClaim}
                  onChange={(event) =>
                    update("warrantyClaim", event.target.checked)
                  }
                />
                <span>
                  <b>Warranty Claim</b>
                  <small>
                    Tick if this repair should be handled as a warranty claim.
                  </small>
                </span>
              </label>
              <label>Body Condition</label>
              <div className="ri-condition-grid">
                {conditionOptions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={form.conditions.includes(item) ? "selected" : ""}
                    onClick={() => toggle("conditions", item)}
                  >
                    <span>
                      {form.conditions.includes(item) && (
                        <Check size={13} weight="bold" />
                      )}
                    </span>
                    {item}
                  </button>
                ))}
              </div>
              <label>Accessories Received</label>
              <div className="ri-chips">
                {accessoryOptions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={
                      form.accessories.includes(item) ? "selected" : ""
                    }
                    onClick={() => toggle("accessories", item)}
                  >
                    {form.accessories.includes(item) && <Check size={14} />}
                    {item}
                  </button>
                ))}
              </div>
              <label>
                Issue Description *
                <textarea
                  rows="5"
                  placeholder="Describe the customer's issue and any observations..."
                  value={form.issue}
                  onChange={(event) => update("issue", event.target.value)}
                />
              </label>
              <div className="ri-photo-field">
                <label>
                  Condition Photos <small>(Maximum 3 photos)</small>
                </label>
                <input
                  ref={photoInput}
                  className="ri-photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={chooseConditionPhotos}
                />
                {form.photos.length > 0 && (
                  <div className="ri-photo-grid">
                    {form.photos.map((photo, index) => (
                      <figure key={`${photo.slice(-24)}-${index}`}>
                        <img src={photo} alt={`Condition ${index + 1}`} />
                        <button
                          type="button"
                          aria-label={`Remove condition photo ${index + 1}`}
                          onClick={() => removeConditionPhoto(index)}
                        >
                          <X size={16} />
                        </button>
                        <figcaption>Photo {index + 1}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                {form.photos.length < 3 && (
                  <div className="ri-photo-actions">
                    <button
                      type="button"
                      className="ri-upload"
                      onClick={openConditionCamera}
                    >
                      <Camera size={19} /> Take Photo
                    </button>
                    <button
                      type="button"
                      className="ri-upload"
                      onClick={() => photoInput.current?.click()}
                    >
                      <Plus size={19} /> Upload Photo
                    </button>
                  </div>
                )}
                <small className="ri-photo-count">
                  {form.photos.length} / 3 photos
                </small>
              </div>
            </section>
          )}
          {stage === 4 && (
            <section className="ri-stage">
              <div className="ri-stage-title">
                <div>
                  <h2>
                    {form.delivery === "Email"
                      ? "Confirm & Send Email"
                      : "Confirm & Receipt"}
                  </h2>
                  <p>
                    {form.delivery === "Email"
                      ? "Confirm the repair, generate the Receipt PDF and open the configured email method."
                      : "Review the repair intake before creating the record."}
                  </p>
                </div>
              </div>
              <div className="ri-review">
                <article>
                  <h3>Customer</h3>
                  <b>{customer.name}</b>
                  <span>{customer.phone}</span>
                  <span>{customer.email}</span>
                  <span>{customer.debtor}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setChangeCustomerOpen(true);
                    }}
                  >
                    Edit
                  </button>
                </article>
                <article>
                  <h3>Device</h3>
                  <b>
                    {resolvedBrand} {form.model}
                  </b>
                  <span>
                    {form.deviceType} · {identifierLabel}: {identifierValue}
                  </span>
                  <span>Internal ID: {form.internalDeviceId}</span>
                  <span>{form.warranty}</span>
                  <button type="button" onClick={() => setStage(2)}>
                    Edit
                  </button>
                </article>
                <article className="ri-review-wide">
                  <h3>Issue &amp; Condition</h3>
                  <b>{form.issueCategory}</b>
                  {form.warrantyClaim && <span>Warranty Claim</span>}
                  <span>{form.issue}</span>
                  <span>
                    {[...form.conditions, ...form.accessories].join(" · ") ||
                      "No condition or accessories selected"}
                  </span>
                  <button type="button" onClick={() => setStage(3)}>
                    Edit
                  </button>
                </article>
              </div>
              <div className="ri-confirm-grid ri-confirm-grid-compact">
                <section>
                  <h3>Receipt Delivery *</h3>
                  <div className="ri-delivery">
                    <button
                      type="button"
                      className={form.delivery === "Print" ? "selected" : ""}
                      onClick={() => update("delivery", "Print")}
                    >
                      <Printer size={24} />
                      <b>Print</b>
                      <small>Printed receipt at counter</small>
                    </button>
                    <button
                      type="button"
                      className={form.delivery === "Email" ? "selected" : ""}
                      onClick={() => update("delivery", "Email")}
                    >
                      <EnvelopeSimple size={24} />
                      <b>Email</b>
                      <small>
                        Generate PDF and open email for {customer.email}
                      </small>
                    </button>
                  </div>
                </section>
                <section className="ri-fee">
                  <span>Diagnostic Fee</span>
                  <strong>RM {form.diagnosticFee}</strong>
                  <small>Payable upon intake</small>
                </section>
              </div>
            </section>
          )}
          {error && (
            <div className="ri-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </section>
      <footer className="ri-footer">
        <button
          type="button"
          className="ri-back-dashboard"
          onClick={onBackListing}
        >
          <ArrowLeft size={16} /> Back to Repair Listing
        </button>
        <div>
          <button type="button" onClick={saveDraft}>
            Save Draft
          </button>
          {stage > 1 && (
            <button
              type="button"
              onClick={() => setStage((current) => current - 1)}
            >
              <ArrowLeft size={16} /> Previous
            </button>
          )}
          {stage < 4 ? (
            <button type="button" className="ri-primary" onClick={next}>
              Next Stage <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="ri-primary"
              onClick={openCustomerVerification}
            >
              {form.delivery === "Email" ? (
                <EnvelopeSimple size={18} />
              ) : (
                <CheckCircle size={18} />
              )}{" "}
              {form.delivery === "Email"
                ? "Confirm & Send Email"
                : "Confirm, Issue Receipt & Sync"}
            </button>
          )}
        </div>
      </footer>
      {notice && (
        <div className="ri-toast" onClick={() => setNotice("")}>
          {notice}
        </div>
      )}
      {changeCustomerOpen && (
        <div
          className="ri-customer-picker-overlay"
          onClick={() => {
            setChangeCustomerOpen(false);
            setQuery("");
          }}
        >
          <section
            className="ri-customer-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-customer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="change-customer-title">Change Customer</h2>
                <p>Your current repair details and stage will be kept.</p>
              </div>
              <button
                type="button"
                aria-label="Close customer picker"
                onClick={() => {
                  setChangeCustomerOpen(false);
                  setQuery("");
                }}
              >
                <X size={20} />
              </button>
            </header>
            <div className="ri-customer-picker-actions">
              <div className="ri-search">
                <MagnifyingGlass size={20} />
                <input
                  autoFocus
                  aria-label="Search customers"
                  placeholder="Search name, phone, email or Debtor Account"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button
                className="ri-outline"
                type="button"
                onClick={() => setNewCustomer(true)}
              >
                <Plus size={17} /> New Customer
              </button>
            </div>
            <div className="ri-customer-list">
              {matches.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={customer?.id === item.id ? "selected" : ""}
                  onClick={() => chooseReplacementCustomer(item)}
                >
                  <UserCircle size={32} weight="duotone" />
                  <span>
                    <b>{item.name}</b>
                    <small>
                      {item.phone} · {item.email}
                    </small>
                  </span>
                  <i>{item.debtor}</i>
                  {customer?.id === item.id && (
                    <CheckCircle size={22} weight="fill" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {newCustomer && (
        <AutoCountDebtorForm
          existingCustomers={customers}
          onCancel={() => setNewCustomer(false)}
          onSave={addCustomer}
        />
      )}
      {verificationOpen && (
        <div
          className="ri-verification-overlay"
          onClick={() => setVerificationOpen(false)}
        >
          <section
            className="ri-verification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-verification-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="customer-verification-title">Customer Verification</h2>
                <p>
                  Verify customer acknowledgement before confirming this repair.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close Customer Verification"
                onClick={() => setVerificationOpen(false)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="ri-verification-methods">
              {["Signature", "Mobile Number", "IC / Passport"].map((method) => (
                <button
                  type="button"
                  key={method}
                  className={verificationMethod === method ? "selected" : ""}
                  onClick={() => {
                    setVerificationMethod(method);
                    setVerificationError("");
                    if (method === "Mobile Number")
                      setVerificationValue(
                        customer.phone === "—" ? "" : customer.phone,
                      );
                    else if (method === "IC / Passport")
                      setVerificationValue("");
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
            {verificationMethod === "Signature" ? (
              <div className="ri-signature-wrap">
                <div>
                  <b>Customer Signature *</b>
                  <button type="button" onClick={clearSignature}>
                    Clear
                  </button>
                </div>
                <canvas
                  ref={signatureCanvas}
                  width="760"
                  height="220"
                  aria-label="Customer Signature Pad"
                  onPointerDown={startSignature}
                  onPointerMove={drawSignature}
                  onPointerUp={finishSignature}
                  onPointerCancel={finishSignature}
                  onPointerLeave={finishSignature}
                />
                <small>Ask the customer to sign inside the box.</small>
              </div>
            ) : (
              <label className="ri-verification-input">
                {verificationMethod} *
                <input
                  autoFocus
                  value={verificationValue}
                  placeholder={
                    verificationMethod === "Mobile Number"
                      ? "e.g. +60 12-345 6789"
                      : "Enter IC or Passport Number"
                  }
                  onChange={(event) => {
                    setVerificationValue(event.target.value);
                    setVerificationError("");
                  }}
                />
              </label>
            )}
            {verificationError && (
              <div className="ri-verification-error" role="alert">
                {verificationError}
              </div>
            )}
            <div className="ri-verification-actions">
              <button type="button" onClick={() => setVerificationOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="ri-primary"
                onClick={confirmCustomerVerification}
              >
                <CheckCircle size={18} /> Verify & Continue
              </button>
            </div>
          </section>
        </div>
      )}
      {cameraOpen && (
        <div className="ri-camera-overlay" onClick={stopCamera}>
          <section
            className="ri-camera-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Condition Photo Camera"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>Condition Photo Camera</h2>
                <p>Position the device clearly, then capture the photo.</p>
              </div>
              <button
                type="button"
                aria-label="Close Camera"
                onClick={stopCamera}
              >
                <X size={20} />
              </button>
            </header>
            <video ref={cameraVideo} autoPlay playsInline muted />
            <div className="ri-camera-actions">
              <button type="button" onClick={stopCamera}>
                Cancel
              </button>
              <button
                type="button"
                className="ri-primary"
                onClick={captureConditionPhoto}
              >
                <Camera size={18} /> Capture Photo
              </button>
            </div>
          </section>
        </div>
      )}
      {serialScannerOpen && (
        <div className="ri-camera-overlay" onClick={stopSerialScanner}>
          <section
            className="ri-camera-modal ri-serial-scanner-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${identifierLabel} Scanner`}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2>{identifierLabel} Scanner</h2>
                <p>Use the rear camera on a phone or tablet.</p>
              </div>
              <button
                type="button"
                aria-label="Close Scanner"
                onClick={stopSerialScanner}
              >
                <X size={20} />
              </button>
            </header>
            <div className="ri-scanner-preview">
              <video ref={serialScannerVideo} autoPlay playsInline muted />
              <div className="ri-scanner-frame" aria-hidden="true" />
            </div>
            <p className="ri-scanner-status" role="status">
              {serialScannerStatus}
            </p>
            <div className="ri-camera-actions">
              <button type="button" onClick={toggleScannerTorch}>
                {scannerTorchOn ? "Turn Light Off" : "Turn Light On"}
              </button>
              <button type="button" onClick={stopSerialScanner}>
                Cancel & Enter Manually
              </button>
            </div>
          </section>
        </div>
      )}
      {cameraError && (
        <div
          className="ri-camera-error"
          role="status"
          onClick={() => setCameraError("")}
        >
          {cameraError}
        </div>
      )}
      {serialScannerError && (
        <div
          className="ri-camera-error"
          role="alert"
          onClick={() => setSerialScannerError("")}
        >
          {serialScannerError}
        </div>
      )}
    </main>
  );
}
