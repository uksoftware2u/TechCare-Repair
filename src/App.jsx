import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Check,
  EnvelopeSimple,
  MagnifyingGlass,
  Printer,
  ShieldCheck,
  SignOut,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react";
import { RepairDetail } from "./RepairDetail.jsx";
import { Customers, initialCustomerRecords } from "./Customers.jsx";
import { Repairs } from "./Repairs.jsx";
import { ReadyForCollection } from "./ReadyForCollection.jsx";
import { Warranty } from "./Warranty.jsx";
import { ServiceContracts } from "./ServiceContracts.jsx";
import { OnsiteService } from "./OnsiteService.jsx";
import { Suppliers } from "./Suppliers.jsx";
import { StockItems } from "./StockItems.jsx";
import { GeneralMaintenance } from "./GeneralMaintenance.jsx";
import { RepairIntake } from "./RepairIntake.jsx";
import { AccountingSync } from "./AccountingSync.jsx";
import { Reports } from "./Reports.jsx";
import { databaseApi } from "./database-api.js";
import { AccessProvider, useAccess } from "./access-control.jsx";
import { MasterDataNav } from "./components/MasterDataNav.jsx";
import { ModuleNavIcon } from "./components/ModuleNavIcon.jsx";
import { UserAccountButton } from "./components/UserAccountButton.jsx";
import { RepairBarcodeLookup } from "./components/RepairBarcodeLookup.jsx";
import "./dashboard-summary-cards.css";
import "./user-account-dashboard.css";
const steps = [
  "Customer",
  "Device & Condition",
  "Condition Details",
  "Confirm & Receipt",
];
const conditions = [
  "Screen OK",
  "Keyboard OK",
  "Touchpad OK",
  "Battery OK",
  "Casing OK",
  "Hinges OK",
  "Scratches",
  "Dents",
  "Cracks",
];
const screenModules = {
  dashboard: "Dashboard",
  repairs: "Repairs",
  collection: "Ready for Collection",
  "repair-detail": "Repairs",
  intake: "Repairs",
  customers: "Customers",
  warranty: "Warranty",
  "onsite-service": "Onsite Service",
  "service-contracts": "Service Contracts",
  suppliers: "Suppliers",
  "stock-items": "Stock Items",
  maintenance: "General Maintenance",
  accounting: "Accounting Sync",
  reports: "Reports",
};
function mergePermissions(roleMatrix = {}, userMatrix) {
  const modules={...roleMatrix};
  if(!modules["Onsite Service"]&&modules.Repairs)modules["Onsite Service"]={...modules.Repairs};
  return Object.fromEntries(
    Object.keys(modules).map((module) => [
      module,
      { ...modules[module], ...(userMatrix?.[module] || {}) },
    ]),
  );
}
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn,setSigningIn] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim())
      return setError("Enter username and password");
    setSigningIn(true);setError("");
    try { await onLogin(username.trim(),password); }
    catch(error) { setError(error.message); }
    finally { setSigningIn(false); }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">
          <Wrench size={34} />
        </div>
        <p>TechCare PC · Malaysia</p>
        <h1>
          Repair records,
          <br />
          without the paperwork.
        </h1>
        <p className="brand-copy">
          Keep repair records, warranty follow-ups, customer receipts, and
          AutoCount sync together in one simple, secure workspace.
        </p>
        <div className="security-note">
          <ShieldCheck size={22} />
          <span>
            Local deployment · SQL Server Express ready
            <br />
            Company data stays on your local computer
          </span>
        </div>
      </section>
      <section className="login-panel">
        <form onSubmit={submit} autoComplete="off">
          <div className="login-heading">
            <span>English</span>
          </div>
          <div className="user-icon">
            <UserCircle size={34} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to continue to the repair workspace.</p>
          <label>Username</label>
          <input
            name="techcare-login-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
          <label>Password</label>
          <input
            type="password"
            name="techcare-login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error && <div className="login-error">{error}</div>}
          <button className="login-button" type="submit" disabled={signingIn}>
            {signingIn ? "Signing In..." : "Sign In"}
          </button>
          <small>Counter 01 · Kuala Lumpur · 12/08/2026</small>
        </form>
      </section>
    </main>
  );
}
const jobs = [
  [
    "SR-20260812-001",
    "Ahmad Faizal",
    "Dell Inspiron 15",
    "Laptop slow, overheat",
    "Waiting Approval",
    "RM 250.00",
  ],
  [
    "SR-20260812-002",
    "Lim Wei Jie",
    "ASUS VivoBook 14",
    "Keyboard not working",
    "Repairing",
    "RM 180.00",
  ],
  [
    "SR-20260812-003",
    "Siti Nurhidayah",
    "HP Pavilion 15",
    "Blue screen issue",
    "Repairing",
    "RM 220.00",
  ],
  [
    "SR-20260812-004",
    "Farah Nadia",
    "MacBook Air M1",
    "Trackpad not responsive",
    "Ready for Collection",
    "RM 0.00",
  ],
];
function DashboardPage({ onNewRepair, onOpenRepair, onCustomers, onLogout }) {
  const [query, setQuery] = useState("");
  const filtered = jobs.filter((j) =>
    j.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="dashboard-page">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span>
            <Wrench size={21} />
          </span>
          <b>TechCare PC</b>
        </div>
        <nav>
          <button className="active">Dashboard</button>
          <button>Repairs</button>
          <button onClick={onCustomers}>Customers</button>
          <button>Warranty</button>
          <button>Suppliers</button>
          <button>General Maintenance</button>
          <button>Accounting Sync</button>
          <button>Reports</button>
        </nav>
        <div className="staff">
          <UserCircle size={30} />
          <span>
            <b>Nur Aisyah</b>
            <small>Counter Staff</small>
          </span>
          <button onClick={onLogout} aria-label="Logout">
            <SignOut size={19} />
          </button>
        </div>
      </aside>
      <section className="dash-content">
        <header className="dash-header">
          <div>
            <h1>Dashboard</h1>
            <p>Wednesday, 12 August 2026 · Kuala Lumpur</p>
          </div>
          <div className="dash-status">
            <span className="connected">AutoCount Connected</span>
            <span>English</span>
          </div>
        </header>
        <div className="dash-actions">
          <div className="dash-search">
            <MagnifyingGlass size={21} />
            <input
              aria-label="Search repairs"
              placeholder="Search repair number, phone, or serial number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="new-repair" onClick={onNewRepair}>
            + New Repair
          </button>
        </div>
        <div className="summary-row">
          <article>
            <span>Received</span>
            <strong>8</strong>
            <small>3 awaiting assignment</small>
          </article>
          <article>
            <span>Repairing</span>
            <strong>12</strong>
            <small>2 due today</small>
          </article>
          <article>
            <span>Ready</span>
            <strong>5</strong>
            <small>Notify customers</small>
          </article>
          <article className="warning">
            <span>Warranty Due</span>
            <strong>3</strong>
            <small>Supplier follow-up</small>
          </article>
        </div>
        <section className="work-queue">
          <div className="section-title">
            <div>
              <h2>Today's Work Queue</h2>
              <p>Latest active repairs requiring attention</p>
            </div>
            <button>View All Repairs</button>
          </div>
          <div className="repair-table">
            <div className="table-head">
              <span>Repair No.</span>
              <span>Customer</span>
              <span>Device</span>
              <span>Issue</span>
              <span>Status</span>
              <span>Amount</span>
            </div>
            {filtered.map((j) => (
              <button className="table-row" key={j[0]} onClick={onOpenRepair}>
                {j.map((x, i) => (
                  <span
                    key={x}
                    className={
                      i === 4
                        ? `status ${x.toLowerCase().replaceAll(" ", "-")}`
                        : ""
                    }
                  >
                    {x}
                  </span>
                ))}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state">No matching repair records</div>
            )}
          </div>
        </section>
        <div className="dash-bottom">
          <section>
            <div className="section-title">
              <div>
                <h2>Warranty Returns Due</h2>
                <p>Supplier items requiring follow-up</p>
              </div>
              <button>View Listing</button>
            </div>
            <ul>
              <li>
                <span>ASUS Malaysia · R-260701-045</span>
                <b>2 days overdue</b>
              </li>
              <li>
                <span>SNS Network · R-260702-047</span>
                <b>Due in 5 days</b>
              </li>
            </ul>
          </section>
          <section>
            <div className="section-title">
              <div>
                <h2>AutoCount Sync</h2>
                <p>Last sync 12/08/2026 10:12</p>
              </div>
              <span className="connected">Connected</span>
            </div>
            <div className="sync-list">
              <span>
                Customers <b>24</b>
              </span>
              <span>
                Invoices <b>8</b>
              </span>
              <span>
                Payments <b>5</b>
              </span>
              <span>
                Stock Items <b>12</b>
              </span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

const dashboardJobs = [
  {
    no: "SR-20260812-001",
    customer: "Ahmad Faizal",
    phone: "+60 12-345 6789",
    device: "Dell Inspiron 15",
    issue: "Laptop slow, overheat",
    status: "Waiting Approval",
    due: "14/08/2026",
    amount: "RM 250.00",
    technician: "Unassigned",
  },
  {
    no: "SR-20260812-002",
    customer: "Lim Wei Jie",
    phone: "+60 16-778 8990",
    device: "ASUS VivoBook 14",
    issue: "Keyboard not working",
    status: "Repairing",
    due: "15/08/2026",
    amount: "RM 180.00",
    technician: "Rizal",
  },
  {
    no: "SR-20260812-003",
    customer: "Siti Nurhidayah",
    phone: "+60 17-445 1102",
    device: "HP Pavilion 15",
    issue: "Blue screen issue",
    status: "Repairing",
    due: "16/08/2026",
    amount: "RM 220.00",
    technician: "Aiman",
  },
  {
    no: "SR-20260812-004",
    customer: "Farah Nadia",
    phone: "+60 11-2088 7741",
    device: "MacBook Air M1",
    issue: "Trackpad not responsive",
    status: "Ready for Collection",
    due: "12/08/2026",
    amount: "RM 0.00",
    technician: "Nur Aisyah",
  },
  {
    no: "SR-20260811-098",
    customer: "Tan Kok Leong",
    phone: "+60 12-882 4510",
    device: "Lenovo ThinkPad E14",
    issue: "Unable to power on",
    status: "Diagnosis",
    due: "15/08/2026",
    amount: "Pending",
    technician: "Unassigned",
  },
  {
    no: "SR-20260811-097",
    customer: "Nur Izzati",
    phone: "+60 13-661 9082",
    device: "Acer Aspire 5",
    issue: "Broken display panel",
    status: "Received",
    due: "17/08/2026",
    amount: "Pending",
    technician: "Unassigned",
  },
];

function normalizeRepairSearch(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\s\-+()./]/g, "");
}

function DashboardPageV2({
  onNewRepair,
  onNewWarranty,
  onOpenRepair,
  onCustomers,
  onSuppliers,
  onStockItems,
  onLogout,
  onWarranty,
  onCollections,
  onContracts,
  onOnsiteService,
  contracts = [],
  collections = [],
  jobs = [],
}) {
  const { can, user } = useAccess();
  const [query, setQuery] = useState("");
  const [summaryFilter, setSummaryFilter] = useState("All");
  const sourceJobs = jobs.length ? jobs : dashboardJobs;
  const shown = sourceJobs.filter((job) => {
    const normalizedQuery = normalizeRepairSearch(query.trim());
    const searchableText = normalizeRepairSearch(
      Object.values(job).flat().join(" "),
    );
    const matchesQuery =
      !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCard =
      Boolean(normalizedQuery) ||
      summaryFilter === "All" ||
      (summaryFilter === "Ready"
        ? job.status === "Ready for Collection"
        : job.status === summaryFilter);
    return matchesQuery && matchesCard;
  });
  const cards = [
    {
      label: "Received",
      value: sourceJobs.filter((job) => job.status === "Received").length,
      note: "Awaiting assignment",
      filter: "Received",
    },
    {
      label: "Repairing",
      value: sourceJobs.filter((job) => job.status === "Repairing").length,
      note: "Active repair work",
      filter: "Repairing",
    },
    {label:"Ready for Collection",value:collections.filter((record)=>record.status==="Ready for Collection").length,note:"Notify customers",onClick:onCollections},
    {label:"Overdue Collection",value:collections.filter((record)=>record.overdue).length,note:"Customer follow-up",onClick:onCollections,warning:true},
    {label:"Collected Today",value:collections.filter((record)=>record.status==="Collected"&&record.collectedAt&&new Date(record.collectedAt).toDateString()===new Date().toDateString()).length,note:"Completed handovers",onClick:onCollections},
    {label:"Outstanding Payment",value:`RM ${collections.reduce((sum,record)=>sum+Number(record.balance||0),0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`,note:"Collection balances",onClick:onCollections,warning:true},
  ];
  const renewalCount = contracts.filter((contract) =>
    ["Expiring Soon", "Renewal Due"].includes(contract.status),
  ).length;
  function toggleCard(filter) {
    setSummaryFilter((current) => (current === filter ? "All" : filter));
  }
  return (
    <main className="dashboard-page">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span>
            <Wrench size={21} />
          </span>
          <b>TechCare PC</b>
        </div>
        <nav>
          <button className="active"><ModuleNavIcon module="Dashboard"/><span>Dashboard</span></button>
          {can("Repairs", "View") && <button><ModuleNavIcon module="Repairs"/><span>Repairs</span></button>}
          {can("Ready for Collection", "View") && <button onClick={onCollections}><ModuleNavIcon module="Ready for Collection"/><span>Ready for Collection</span></button>}
          {can("Warranty", "View") && (
            <button onClick={onWarranty}><ModuleNavIcon module="Warranty"/><span>Warranty</span></button>
          )}
          {can("Onsite Service", "View") && (
            <button onClick={onOnsiteService}><ModuleNavIcon module="Onsite Service"/><span>Onsite Service</span></button>
          )}
          {can("Service Contracts", "View") && (
            <button onClick={onContracts}><ModuleNavIcon module="Service Contracts"/><span>Service Contracts</span></button>
          )}
          <MasterDataNav active="Dashboard" onNavigate={(item) => ({Customers:onCustomers,Suppliers:onSuppliers,"Stock Items":onStockItems}[item])?.()} />
          {can("General Maintenance", "View") && (
            <button><ModuleNavIcon module="General Maintenance"/><span>General Maintenance</span></button>
          )}
          {can("Accounting Sync", "View") && <button><ModuleNavIcon module="Accounting Sync"/><span>Accounting Sync</span></button>}
          {can("Reports", "View") && <button><ModuleNavIcon module="Reports"/><span>Reports</span></button>}
        </nav>
        <div className="staff">
          <UserAccountButton className="staff-profile"/>
          <button onClick={onLogout} aria-label="Logout">
            <SignOut size={19} />
          </button>
        </div>
      </aside>
      <section className="dash-content">
        <header className="dash-header">
          <div className="dash-heading">
            <h1>Dashboard</h1>
            <p>Wednesday, 12 August 2026 · Kuala Lumpur</p>
          </div>
          <div className="dash-header-center">
            <RepairBarcodeLookup onOpenRepair={onOpenRepair} />
          </div>
          <div className="dash-status">
            <span className="connected">AutoCount Connected</span>
            <span>English</span>
          </div>
        </header>
        <div className="dash-actions">
          <div className="dash-search">
            <MagnifyingGlass size={21} />
            <input
              aria-label="Search repairs"
              placeholder="Search repair number, phone, or serial number"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {can("Warranty", "Create") && (
            <button
              className="new-repair warranty-intake"
              onClick={onNewWarranty}
            >
              + Warranty Claim
            </button>
          )}
          {can("Repairs", "Create") && (
            <button className="new-repair" onClick={onNewRepair}>
              + New Repair
            </button>
          )}
        </div>
        <div className="summary-row">
          {cards.map((card) => (
            <button
              key={card.label}
              className={`${summaryFilter === card.filter ? "active" : ""} ${card.warning ? "warning" : ""}`}
              aria-pressed={Boolean(card.filter&&summaryFilter === card.filter)}
              onClick={card.onClick||(()=>toggleCard(card.filter))}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </button>
          ))}
        </div>
        <section className="work-queue">
          <div className="section-title">
            <div>
              <h2>
                {query.trim()
                  ? "Search Results"
                  : summaryFilter === "All"
                    ? "Today's Work Queue"
                    : `${summaryFilter} Repairs`}
              </h2>
              <p>
                {query.trim()
                  ? `${shown.length} matching repair record${shown.length === 1 ? "" : "s"}`
                  : summaryFilter === "All"
                    ? "Latest active repairs requiring attention"
                    : `Filtered by ${summaryFilter}`}
              </p>
            </div>
            {summaryFilter !== "All" && !query.trim() && (
              <button onClick={() => setSummaryFilter("All")}>
                Clear Filter
              </button>
            )}
          </div>
          <div className="repair-table">
            <div className="table-head">
              <span>Repair No.</span>
              <span>Customer</span>
              <span>Device</span>
              <span>Issue</span>
              <span>Status</span>
              <span>Amount</span>
            </div>
            {shown.map((job) => (
              <button
                className="table-row"
                key={job.no}
                onClick={() => onOpenRepair(job)}
              >
                <span>{job.no}</span>
                <span>{job.customer}</span>
                <span>{job.device}</span>
                <span>{job.issue}</span>
                <span
                  className={`status ${job.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {job.status}
                </span>
                <span>{job.amount}</span>
              </button>
            ))}
            {shown.length === 0 && (
              <div className="empty-state">No matching repair records</div>
            )}
          </div>
        </section>
        <div className="dash-bottom">
          <section>
            <div className="section-title">
              <div>
                <h2>Warranty Returns Due</h2>
                <p>Supplier items requiring follow-up</p>
              </div>
              <button onClick={onWarranty}>View Listing</button>
            </div>
            <ul>
              <li>
                <span>ASUS Malaysia · R-260701-045</span>
                <b>2 days overdue</b>
              </li>
              <li>
                <span>SNS Network · R-260702-047</span>
                <b>Due in 5 days</b>
              </li>
            </ul>
          </section>
          <section>
            <div className="section-title">
              <div>
                <h2>AutoCount Sync</h2>
                <p>Last sync 12/08/2026 10:12</p>
              </div>
              <span className="connected">Connected</span>
            </div>
            <div className="sync-list">
              <span>
                Customers <b>24</b>
              </span>
              <span>
                Invoices <b>8</b>
              </span>
              <span>
                Payments <b>5</b>
              </span>
              <span>
                Stock Items <b>12</b>
              </span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [screen, setScreen] = useState("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [authenticatedUser,setAuthenticatedUser] = useState(null);
  const [delivery, setDelivery] = useState("Print");
  const [sync, setSync] = useState(true);
  const [settings, setSettings] = useState(false);
  const [saved, setSaved] = useState("");
  const [createdRepairs, setCreatedRepairs] = useState([]);
  const [customerRecords, setCustomerRecords] = useState(
    initialCustomerRecords,
  );
  const [databaseRepairs, setDatabaseRepairs] = useState([]);
  const [collectionRecords,setCollectionRecords] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [maintenanceOptions, setMaintenanceOptions] = useState({});
  const [emailConfiguration, setEmailConfiguration] = useState({
    method: "Default Email App (mailto)",
    senderName: "",
    replyTo: "",
    defaultCc: "",
    subjectPrefix: "[Service Centre]",
    signature: "Thank you.\nService Team",
  });
  const [systemUsers, setSystemUsers] = useState([]);
  const [roleAccessRights, setRoleAccessRights] = useState({});
  const [userAccessRights, setUserAccessRights] = useState({});
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [warrantySeedRepair, setWarrantySeedRepair] = useState(null);
  const [warrantyDirectRequest, setWarrantyDirectRequest] = useState(0);
  const [serviceContracts, setServiceContracts] = useState([]);
  const [selected, setSelected] = useState(["Scratches", "Dents"]);
  const [accessories, setAccessories] = useState(["Charger", "Bag"]);
  const [form, setForm] = useState({
    serial: "N7N0CV16X123456",
    remarks:
      "Laptop slow and often hangs.\nSometimes restarts automatically.\nNo liquid damage.",
  });
  useEffect(() => {
    function openRepairModule(event) {
      const button = event.target.closest("button");
      if (!button) return;
      const destination = {
        Repairs: "repairs",
        "Ready for Collection": "collection",
        "View All Repairs": "repairs",
        Customers: "customers",
        Warranty: "warranty",
        "Onsite Service": "onsite-service",
        "Service Contracts": "service-contracts",
        Suppliers: "suppliers",
        "Stock Items": "stock-items",
        "General Maintenance": "maintenance",
        "Accounting Sync": "accounting",
        Reports: "reports",
      }[button.textContent.trim()];
      if (destination) setScreen(destination);
    }
    document.addEventListener("click", openRepairModule);
    return () => document.removeEventListener("click", openRepairModule);
  }, []);
  useEffect(() => {
    databaseApi
      .serviceContracts()
      .then(setServiceContracts)
      .catch(() => {});
  }, []);
  useEffect(() => {
    Promise.all([
      databaseApi.customers(),
      databaseApi.repairs(),
      databaseApi.collections().catch(() => []),
      databaseApi.companyProfile(),
      databaseApi.setting("maintenance-options").catch(() => ({})),
      databaseApi.setting("email-configuration").catch(() => ({})),
      databaseApi.users(),
      databaseApi.accessRights(),
      databaseApi.setting("user-access-rights").catch(() => ({})),
    ])
      .then(
        ([
          customers,
          repairs,
          collections,
          company,
          optionValues,
          emailValues,
          userValues,
          roleRights,
          userRights,
        ]) => {
          if (customers.length) setCustomerRecords(customers);
          if (repairs.length) setDatabaseRepairs(repairs);
          setCollectionRecords(collections);
          setCompanyProfile(company);
          setMaintenanceOptions(optionValues);
          setEmailConfiguration((current) => ({ ...current, ...emailValues }));
          setSystemUsers(userValues);
          setRoleAccessRights(roleRights);
          setUserAccessRights(userRights);
        },
      )
      .catch((error) =>
        console.warn(
          "SQL Server API unavailable; using local fallback data.",
          error,
        ),
      );
  }, []);
  const currentUser = useMemo(() => {
    const key = loginUsername.toLowerCase();
    return (
      authenticatedUser || systemUsers.find((user) => user.username?.toLowerCase() === key) ||
      (key === "admin"
        ? systemUsers.find((user) => user.role === "Administrator")
        : null) ||
      systemUsers[0] || { id: "", name: "Loading...", role: "Administrator" }
    );
  }, [loginUsername, systemUsers,authenticatedUser]);
  useEffect(()=>{databaseApi.setAuditContext({userId:currentUser.id,userName:currentUser.name,role:currentUser.role});},[currentUser.id,currentUser.name,currentUser.role]);
  const effectiveAccess = useMemo(
    () =>
      mergePermissions(
        roleAccessRights[currentUser.role] || {},
        userAccessRights[currentUser.id],
      ),
    [roleAccessRights, userAccessRights, currentUser],
  );
  const canAccess = (module, action = "View") =>
    Boolean(effectiveAccess?.[module]?.[action]);
  const updateCurrentProfile=(updated)=>{setAuthenticatedUser(updated);setSystemUsers((current)=>current.map((item)=>item.id===updated.id?updated:item));};
  const withAccess = (content) => (
    <AccessProvider value={{ can: canAccess, user: currentUser, updateProfile:updateCurrentProfile }}>
      {content}
    </AccessProvider>
  );
  const markdown = useMemo(
    () =>
      `---\nrecord_type: repair\nrepair_no: SR-20260812-0001\nstatus: received\nreceived_at: 2026-08-12T10:15:00+08:00\n---\n\n# Repair SR-20260812-0001\n\n- Customer: Siti Nur Aisyah\n- Phone: +60 12-345 6789\n- Device: ASUS VivoBook 15 (X515EA)\n- Serial Number: ${form.serial}\n- Accessories: ${accessories.join(", ")}\n- Condition: ${selected.join(", ")}\n- Remarks: ${form.remarks.replaceAll("\n", " ")}\n- AutoCount Sync: ${sync ? "Enabled" : "Disabled"}\n`,
    [form, accessories, selected, sync],
  );
  function toggle(list, setList, value) {
    setList(
      list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    );
  }
  function downloadMd() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([markdown], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    a.download = "SR-20260812-0001.md";
    a.click();
    URL.revokeObjectURL(a.href);
    setSaved("Repair record generated · AutoCount queued");
  }
  if (screen === "login")
    return (
      <LoginPage
        onLogin={async (username,password) => {
          const user=await databaseApi.login(username,password);
          setAuthenticatedUser(user);
          setLoginUsername(user.username);
          setScreen("dashboard");
        }}
      />
    );
  const requiredModule = screenModules[screen];
  if (screen === "intake" && !canAccess("Repairs", "Create"))
    return withAccess(
      <main className="access-denied">
        <ShieldCheck size={52} />
        <h1>Access Denied</h1>
        <p>{currentUser.name} does not have Create permission for Repairs.</p>
        <button onClick={() => setScreen("repairs")}>Back to Repairs</button>
        <button onClick={() => setScreen("login")}>Logout</button>
      </main>,
    );
  if (requiredModule && !canAccess(requiredModule, "View"))
    return withAccess(
      <main className="access-denied">
        <ShieldCheck size={52} />
        <h1>Access Denied</h1>
        <p>
          {currentUser.name} does not have View permission for {requiredModule}.
        </p>
        <button onClick={() => setScreen("dashboard")}>
          Back to Dashboard
        </button>
        <button onClick={() => setScreen("login")}>Logout</button>
      </main>,
    );
  if (screen === "dashboard")
    return withAccess(
      <DashboardPageV2
        jobs={databaseRepairs}
        contracts={serviceContracts}
        collections={collectionRecords}
        onNewRepair={() => setScreen("intake")}
        onNewWarranty={() => {
          setWarrantySeedRepair(null);
          setWarrantyDirectRequest(Date.now());
          setScreen("warranty");
        }}
        onOpenRepair={(repair) => {
          setSelectedRepair(repair);
          setScreen("repair-detail");
        }}
        onCustomers={() => setScreen("customers")}
        onSuppliers={() => setScreen("suppliers")}
        onStockItems={() => setScreen("stock-items")}
        onWarranty={() => {
          setWarrantyDirectRequest(0);
          setScreen("warranty");
        }}
        onCollections={() => setScreen("collection")}
        onContracts={() => setScreen("service-contracts")}
        onOnsiteService={() => setScreen("onsite-service")}
        onLogout={() => setScreen("login")}
      />,
    );
  if (screen === "repairs")
    return withAccess(
      <Repairs
        repairRecords={databaseRepairs}
        createdRepairs={createdRepairs}
        onDashboard={() => setScreen("dashboard")}
        onOnsiteService={() => setScreen("onsite-service")}
        onContracts={() => setScreen("service-contracts")}
        onCustomers={() => setScreen("customers")}
        onWarranty={() => setScreen("warranty")}
        onCollections={() => setScreen("collection")}
        onSuppliers={() => setScreen("suppliers")}
        onStockItems={() => setScreen("stock-items")}
        onNewRepair={() => setScreen("intake")}
        onOpenRepair={(repair) => {
          setSelectedRepair(repair);
          setScreen("repair-detail");
        }}
      />,
    );
  if (screen === "collection")
    return withAccess(
      <ReadyForCollection
        onNavigate={(item) => {
          const destination={Dashboard:"dashboard",Repairs:"repairs","Ready for Collection":"collection",Warranty:"warranty","Onsite Service":"onsite-service","Service Contracts":"service-contracts",Customers:"customers",Suppliers:"suppliers","Stock Items":"stock-items","General Maintenance":"maintenance","Accounting Sync":"accounting",Reports:"reports"}[item];
          if(destination)setScreen(destination);
        }}
        onOpenRepair={async (repairNo) => {
          let repair=databaseRepairs.find((item)=>item.no===repairNo);
          if(!repair){const repairs=await databaseApi.repairs();setDatabaseRepairs(repairs);repair=repairs.find((item)=>item.no===repairNo);}
          if(repair){setSelectedRepair(repair);setScreen("repair-detail");}
        }}
        onRepairStatusChange={(repairNo,status)=>setDatabaseRepairs((current)=>current.map((repair)=>repair.no===repairNo?{...repair,status}:repair))}
        onCollectionsChange={setCollectionRecords}
      />,
    );
  if (screen === "repair-detail")
    return withAccess(
      <RepairDetail
        repair={selectedRepair}
        companyProfile={companyProfile}
        onRepairUpdate={(updated) => {
          setSelectedRepair(updated);
          setDatabaseRepairs((current) =>
            current.map((item) => (item.no === updated.no ? updated : item)),
          );
          if(updated.status==="Ready for Collection"||updated.status==="Collected")databaseApi.collections().then(setCollectionRecords).catch(()=>{});
        }}
        onCreateWarranty={(repair) => {
          setWarrantySeedRepair(repair);
          setScreen("warranty");
        }}
        onDashboard={() => setScreen("dashboard")}
        onWarranty={() => setScreen("warranty")}
        onCollections={() => setScreen("collection")}
        onOnsiteService={() => setScreen("onsite-service")}
        onContracts={() => setScreen("service-contracts")}
        onBack={() => setScreen("repairs")}
      />,
    );
  if (screen === "customers")
    return withAccess(
      <Customers
        customers={customerRecords}
        setCustomers={setCustomerRecords}
        onBack={() => setScreen("dashboard")}
        onNewRepair={() => setScreen("intake")}
      />,
    );
  if (screen === "warranty")
    return withAccess(
      <Warranty
        companyProfile={companyProfile}
        repairRecords={databaseRepairs}
        customerRecords={customerRecords}
        initialRepair={warrantySeedRepair}
        onInitialRepairConsumed={() => setWarrantySeedRepair(null)}
        startDirectClaim={warrantyDirectRequest}
        onDirectClaimConsumed={() => setWarrantyDirectRequest(0)}
        onRepairCreated={(repair) => {
          setDatabaseRepairs((current) =>
            current.some((item) => item.no === repair.no)
              ? current
              : [repair, ...current],
          );
          setCreatedRepairs((current) =>
            current.some((item) => item.no === repair.no)
              ? current
              : [repair, ...current],
          );
        }}
        onOpenRepair={(repair) => {
          setSelectedRepair(repair);
          setScreen("repair-detail");
        }}
        onRepairStatusChange={(repairNo, status) => {
          setDatabaseRepairs((current) =>
            current.map((repair) =>
              repair.no === repairNo ? { ...repair, status } : repair,
            ),
          );
          setCreatedRepairs((current) =>
            current.map((repair) =>
              repair.no === repairNo ? { ...repair, status } : repair,
            ),
          );
        }}
        onDashboard={() => setScreen("dashboard")}
        onRepairs={() => setScreen("repairs")}
        onCustomers={() => setScreen("customers")}
        onSuppliers={() => setScreen("suppliers")}
      />,
    );
  if (screen === "onsite-service")
    return withAccess(
      <OnsiteService
        customerRecords={customerRecords}
        onNavigate={(item) => {
          const destination={Dashboard:"dashboard",Repairs:"repairs",Warranty:"warranty","Onsite Service":"onsite-service","Service Contracts":"service-contracts",Customers:"customers",Suppliers:"suppliers","Stock Items":"stock-items","General Maintenance":"maintenance","Accounting Sync":"accounting",Reports:"reports"}[item];
          if(destination)setScreen(destination);
        }}
        onOpenRepair={async (repairNo) => {
          const repairs=await databaseApi.repairs();
          setDatabaseRepairs(repairs);
          const repair=repairs.find((item)=>item.no===repairNo);
          if(repair){setSelectedRepair(repair);setScreen("repair-detail");}
        }}
      />,
    );
  if (screen === "service-contracts")
    return withAccess(
      <ServiceContracts
        customerRecords={customerRecords}
        companyProfile={companyProfile}
        onContractChange={() =>
          databaseApi
            .serviceContracts()
            .then(setServiceContracts)
            .catch(() => {})
        }
        onDashboard={() => setScreen("dashboard")}
        onRepairs={() => setScreen("repairs")}
        onCustomers={() => setScreen("customers")}
        onWarranty={() => setScreen("warranty")}
        onSuppliers={() => setScreen("suppliers")}
      />,
    );
  if (screen === "suppliers")
    return withAccess(
      <Suppliers
        onDashboard={() => setScreen("dashboard")}
        onRepairs={() => setScreen("repairs")}
        onCustomers={() => setScreen("customers")}
        onWarranty={() => setScreen("warranty")}
      />,
    );
  if (screen === "stock-items")
    return withAccess(<StockItems onDashboard={() => setScreen("dashboard")} />);
  if (screen === "maintenance")
    return withAccess(
      <GeneralMaintenance
        onDashboard={() => setScreen("dashboard")}
        onOptionsChange={setMaintenanceOptions}
        onEmailConfigurationChange={setEmailConfiguration}
        onAccessRightsChange={({
          roleAccessRights: roles,
          userAccessRights: users,
        }) => {
          setRoleAccessRights(roles);
          setUserAccessRights(users);
        }}
      />,
    );
  if (screen === "accounting")
    return withAccess(
      <AccountingSync onDashboard={() => setScreen("dashboard")} />,
    );
  if (screen === "reports")
    return withAccess(
      <Reports
        companyProfile={companyProfile}
        onNavigate={(item) => {
          const destination={Dashboard:"dashboard",Repairs:"repairs",Warranty:"warranty","Onsite Service":"onsite-service","Service Contracts":"service-contracts",Customers:"customers",Suppliers:"suppliers","Stock Items":"stock-items","General Maintenance":"maintenance","Accounting Sync":"accounting",Reports:"reports"}[item];
          if(destination)setScreen(destination);
        }}
      />,
    );
  if (screen === "intake")
    return withAccess(
      <RepairIntake
        companyProfile={companyProfile}
        receiptOptions={maintenanceOptions}
        emailConfiguration={emailConfiguration}
        customerRecords={customerRecords}
        repairRecords={databaseRepairs}
        onCustomerCreate={async (record) => {
          await databaseApi.createCustomer(record);
          setCustomerRecords((current) =>
            current.some((item) => item.id === record.id)
              ? current
              : [record, ...current],
          );
        }}
        onBackListing={() => setScreen("repairs")}
        onCreate={async (repair) => {
          const savedRepair = await databaseApi.createRepair(repair);
          setCreatedRepairs((current) =>
            current.some((item) => item.no === savedRepair.no)
              ? current
              : [savedRepair, ...current],
          );
          setDatabaseRepairs((current) =>
            current.some((item) => item.no === savedRepair.no)
              ? current
              : [savedRepair, ...current],
          );
          return savedRepair;
        }}
        onComplete={() => setScreen("repairs")}
      />,
    );
  return (
    <main className="app-shell">
      <header>
        <div>
          <h1>New Repair Intake</h1>
          <p>Capture accurate details to serve your customer better.</p>
        </div>
        <div className="header-meta">
          <b>English</b>
          <i></i>
          <span>12/08/2026 (Wed)</span>
          <span>10:15 AM</span>
          <span>Counter: 01</span>
        </div>
      </header>
      <section className="workspace">
        <aside>
          <nav>
            {steps.map((step, i) => (
              <button
                key={step}
                className={i === 1 ? "active" : i === 0 ? "done" : ""}
              >
                <span className="step-no">{i + 1}</span>
                <span>{step}</span>
              </button>
            ))}
          </nav>
          <div className="customer-card">
            <h3>Customer Summary</h3>
            <label>Name</label>
            <strong>Siti Nur Aisyah</strong>
            <label>Phone</label>
            <strong>+60 12-345 6789</strong>
            <label>Email</label>
            <strong>siti.aisyah@gmail.com</strong>
          </div>
        </aside>
        <div className="form-area">
          <section className="column">
            <h2>Device Information</h2>
            <label>Device Type *</label>
            <select defaultValue="Laptop">
              <option>Laptop</option>
              <option>Desktop PC</option>
              <option>Mobile</option>
            </select>
            <div className="row">
              <div>
                <label>Brand *</label>
                <select defaultValue="ASUS">
                  <option>ASUS</option>
                  <option>Acer</option>
                  <option>Lenovo</option>
                </select>
              </div>
              <div>
                <label>Model *</label>
                <select>
                  <option>VivoBook 15 (X515EA)</option>
                </select>
              </div>
            </div>
            <label>Serial Number *</label>
            <div className="serial">
              <input
                value={form.serial}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serial: e.target.value,
                  })
                }
              />
              <button onClick={() => setSaved("Barcode scanner ready")}>
                <Barcode size={18} /> Scan
              </button>
            </div>
            <div className="row">
              <div>
                <label>Purchase Date</label>
                <input type="date" defaultValue="2023-06-15" />
              </div>
              <div>
                <label>Warranty Status</label>
                <select>
                  <option>In Warranty</option>
                  <option>Out of Warranty</option>
                </select>
              </div>
            </div>
            <label>Password</label>
            <input
              placeholder="If applicable (e.g. BIOS or Windows)"
              type="password"
            />
            <label>Accessories with Device</label>
            <div className="chips">
              {["Charger", "Bag", "Adapter", "Others"].map((x) => (
                <button
                  key={x}
                  className={accessories.includes(x) ? "selected" : ""}
                  onClick={() => toggle(accessories, setAccessories, x)}
                >
                  {accessories.includes(x) && <Check size={15} />} {x}
                </button>
              ))}
            </div>
          </section>
          <section className="column condition-column">
            <h2>Condition & Issues</h2>
            <label>Issue Category *</label>
            <select>
              <option>General Check / Diagnosis</option>
              <option>Hardware Repair</option>
            </select>
            <label>Body Condition</label>
            <div className="condition-grid">
              {conditions.map((x) => (
                <button
                  key={x}
                  className={selected.includes(x) ? "checked" : ""}
                  onClick={() => toggle(selected, setSelected, x)}
                >
                  <span>{selected.includes(x) && <Check size={13} />}</span>
                  {x}
                </button>
              ))}
            </div>
            <label>Issue Description *</label>
            <textarea
              rows="4"
              value={form.remarks}
              onChange={(e) =>
                setForm({
                  ...form,
                  remarks: e.target.value,
                })
              }
            />
            <label>
              Upload Photos <small>(Maximum 6 photos)</small>
            </label>
            <div className="photo-strip">
              {[
                "device-overview.png",
                "device-keyboard.png",
                "device-hinge.png",
                "device-ports.png",
              ].map((x, i) => (
                <button
                  className="photo"
                  key={x}
                  onClick={() => setSaved(`Photo ${i + 1} selected`)}
                >
                  <img src={`/assets/${x}`} alt={`Device condition ${i + 1}`} />
                  <span>×</span>
                </button>
              ))}
            </div>
          </section>
          <section className="integration">
            <div className="delivery">
              <h3>Receipt Delivery *</h3>
              <button
                className={delivery === "Print" ? "selected" : ""}
                onClick={() => setDelivery("Print")}
              >
                <Printer size={22} />
                <b>Print</b>
                <small>Customer receives a printed receipt</small>
              </button>
              <button
                className={delivery === "Email" ? "selected" : ""}
                onClick={() => setDelivery("Email")}
              >
                <EnvelopeSimple size={22} />
                <b>Email</b>
                <small>Send receipt to customer email</small>
              </button>
            </div>
            <div className="autocount">
              <div className="integration-head">
                <h3>AutoCount Accounting</h3>
                <span className="connected">Connected</span>
                <button onClick={() => setSettings(true)}>API Settings</button>
              </div>
              <label className="sync-toggle">
                <input
                  type="checkbox"
                  checked={sync}
                  onChange={(e) => setSync(e.target.checked)}
                />{" "}
                Create debtor and invoice after confirmation
              </label>
              <div className="mapping">
                <span>Customer → Debtor</span>
                <span>Repair charges → Service Item</span>
                <span>Parts → Stock Item</span>
                <span>Payment → Receipt</span>
              </div>
            </div>
            <div className="fee">
              <span>Diagnostic Fee</span>
              <strong>RM 50.00</strong>
              <small>Payable upon intake</small>
            </div>
          </section>
        </div>
      </section>
      <footer>
        <button className="back" onClick={() => setScreen("dashboard")}>
          Back to Dashboard
        </button>
        <button onClick={() => setSaved("Draft saved locally")}>
          Save Draft
        </button>
        <button className="primary" onClick={downloadMd}>
          Review, Issue Receipt & Sync →
        </button>
      </footer>
      {saved && (
        <div className="toast" onClick={() => setSaved("")}>
          {saved}
        </div>
      )}
      {settings && (
        <div className="modal-backdrop" onClick={() => setSettings(false)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>AutoCount API Settings</h2>
            <label>Connection Type</label>
            <select>
              <option>AutoCount Accounting On-Premises</option>
              <option>AutoCount Cloud Accounting</option>
            </select>
            <label>Base URL</label>
            <input defaultValue="http://127.0.0.1:8090/api/autocount" />
            <label>Company / Account Book</label>
            <input defaultValue="TechCare PC Sdn. Bhd." />
            <div className="connection">
              <span className="connected">Connected</span>
              <span>Last checked: 12/08/2026 10:12</span>
            </div>
            <div className="modal-actions">
              <button onClick={() => setSaved("Connection successful")}>
                Test Connection
              </button>
              <button className="primary" onClick={() => setSettings(false)}>
                Save Settings
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
