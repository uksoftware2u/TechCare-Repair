import { useMemo, useState } from "react";
import {
  Funnel,
  MagnifyingGlass,
  Plus,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react";
import { ConfigurableListing } from "./components/ConfigurableListing.jsx";
import { MasterDataNav } from "./components/MasterDataNav.jsx";
import { ModuleNavIcon } from "./components/ModuleNavIcon.jsx";
import { UserAccountButton } from "./components/UserAccountButton.jsx";
import { RepairBarcodeLookup } from "./components/RepairBarcodeLookup.jsx";
import "./repair-summary-cards.css";
import { useAccess } from "./access-control.jsx";
const baseRepairs = [
  {
    no: "SR-20260812-001",
    customer: "Ahmad Faizal",
    phone: "+60 12-345 6789",
    device: "Dell Inspiron 15",
    issue: "Laptop slow and overheating",
    technician: "Unassigned",
    status: "Waiting Approval",
    due: "14/08/2026",
    amount: "RM 250.00",
  },
  {
    no: "SR-20260812-002",
    customer: "Lim Wei Jie",
    phone: "+60 16-778 8990",
    device: "ASUS VivoBook 14",
    issue: "Keyboard not working",
    technician: "Rizal",
    status: "Repairing",
    due: "15/08/2026",
    amount: "RM 180.00",
  },
  {
    no: "SR-20260812-003",
    customer: "Siti Nurhidayah",
    phone: "+60 17-445 1102",
    device: "HP Pavilion 15",
    issue: "Blue screen issue",
    technician: "Aiman",
    status: "Repairing",
    due: "16/08/2026",
    amount: "RM 220.00",
  },
  {
    no: "SR-20260812-004",
    customer: "Farah Nadia",
    phone: "+60 11-2088 7741",
    device: "MacBook Air M1",
    issue: "Trackpad not responsive",
    technician: "Rizal",
    status: "Ready for Collection",
    due: "12/08/2026",
    amount: "RM 0.00",
  },
  {
    no: "SR-20260811-098",
    customer: "Tan Kok Leong",
    phone: "+60 12-882 4510",
    device: "Lenovo ThinkPad E14",
    issue: "Unable to power on",
    technician: "Aiman",
    status: "Diagnosis",
    due: "15/08/2026",
    amount: "Pending",
  },
  {
    no: "SR-20260811-097",
    customer: "Nur Izzati",
    phone: "+60 13-661 9082",
    device: "Acer Aspire 5",
    issue: "Broken display panel",
    technician: "Rizal",
    status: "Received",
    due: "17/08/2026",
    amount: "Pending",
  },
];
const repairColumns = [
  {
    id: "no",
    label: "Repair No.",
    width: 150,
    visible: true,
  },
  {
    id: "customer",
    label: "Customer",
    width: 175,
    visible: true,
  },
  {
    id: "device",
    label: "Device & Issue",
    width: 235,
    visible: true,
  },
  {
    id: "technician",
    label: "Technician",
    width: 120,
    visible: true,
  },
  {
    id: "status",
    label: "Status",
    width: 155,
    visible: true,
  },
  {
    id: "due",
    label: "Due Date",
    width: 120,
    visible: true,
  },
  {
    id: "amount",
    label: "Amount",
    width: 110,
    visible: true,
  },
];
function renderRepairCell(repair, column) {
  if (column.id === "no")
    return (
      <>
        <b>{repair.no}</b>
        <small>12 Aug 2026</small>
      </>
    );
  if (column.id === "customer")
    return (
      <>
        <b>{repair.customer}</b>
        <small>{repair.phone}</small>
      </>
    );
  if (column.id === "device")
    return (
      <>
        <b>{repair.device}</b>
        <small>{repair.issue}</small>
      </>
    );
  if (column.id === "status")
    return (
      <i
        className={`rp-status ${repair.status.toLowerCase().replaceAll(" ", "-")}`}
      >
        {repair.status}
      </i>
    );
  return column.id === "amount" ? <b>{repair.amount}</b> : repair[column.id];
}
export function Repairs({
  onDashboard,
  onWarranty,
  onCollections,
  onOnsiteService,
  onContracts,
  onCustomers,
  onSuppliers,
  onStockItems,
  onNewRepair,
  onOpenRepair,
  createdRepairs = [],
  repairRecords = [],
}) {
  const { can, user } = useAccess();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const allRepairs = useMemo(() => {
    const source = repairRecords.length ? repairRecords : baseRepairs;
    return [
      ...createdRepairs,
      ...source.filter(
        (repair) => !createdRepairs.some((created) => created.no === repair.no),
      ),
    ];
  }, [createdRepairs, repairRecords]);
  const repairs = allRepairs;
  const inProgressStatuses = [
    "Diagnosis",
    "Repairing",
    "Warranty Preparation",
    "Warranty - Sent to Supplier",
  ];
  const matchesStatus = (repair, currentStatus) =>
    currentStatus === "All Statuses" ||
    (currentStatus === "In Progress"
      ? inProgressStatuses.includes(repair.status)
      : currentStatus === "Ready"
        ? repair.status === "Ready for Collection"
        : currentStatus === "Warranty"
          ? repair.status.startsWith("Warranty")
          : repair.status === currentStatus);
  const isSummaryActive = (filter) =>
    filter === "In Progress"
      ? ["In Progress", "Diagnosis", "Repairing"].includes(status)
      : filter === "Ready"
        ? ["Ready", "Ready for Collection"].includes(status)
        : status === filter;
  const shown = useMemo(
    () =>
      allRepairs.filter((repair) => {
        const matchesQuery = Object.values(repair)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && matchesStatus(repair, status);
      }),
    [allRepairs, query, status],
  );
  const summaryCards = [
    { label: "All Repairs", filter: "All Statuses", value: allRepairs.length },
    {
      label: "Received",
      filter: "Received",
      value: allRepairs.filter((repair) => repair.status === "Received").length,
    },
    {
      label: "In Progress",
      filter: "In Progress",
      value: allRepairs.filter((repair) =>
        inProgressStatuses.includes(repair.status),
      ).length,
    },
    {
      label: "Waiting Approval",
      filter: "Waiting Approval",
      value: allRepairs.filter((repair) => repair.status === "Waiting Approval")
        .length,
    },
    {
      label: "Ready",
      filter: "Ready",
      value: allRepairs.filter(
        (repair) => repair.status === "Ready for Collection",
      ).length,
    },
  ];
  const listingToolbar = (
    <>
      <div className="rp-search">
        <MagnifyingGlass size={20} />
        <input
          aria-label="Search repair listing"
          placeholder="Search repair, customer, serial, asset tag, or internal device ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="rp-filter">
        <Funnel size={18} />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option>All Statuses</option>
          <option>Received</option>
          <option>In Progress</option>
          <option>Diagnosis</option>
          <option>Waiting Approval</option>
          <option>Repairing</option>
          <option>Ready</option>
          <option>Ready for Collection</option>
        </select>
      </div>
    </>
  );
  return (
    <main className="repairs-module">
      <aside className="repairs-side">
        <div className="rp-brand">
          <Wrench size={20} />
          <b>TechCare PC</b>
        </div>
        <nav>
          {can("Dashboard", "View") && (
            <button onClick={onDashboard}><ModuleNavIcon module="Dashboard"/><span>Dashboard</span></button>
          )}
          <button className="active"><ModuleNavIcon module="Repairs"/><span>Repairs</span></button>
          {can("Ready for Collection", "View") && <button onClick={onCollections}><ModuleNavIcon module="Ready for Collection"/><span>Ready for Collection</span></button>}
          {can("Warranty", "View") && <button onClick={onWarranty}><ModuleNavIcon module="Warranty"/><span>Warranty</span></button>}
          {can("Onsite Service", "View") && (
            <button onClick={onOnsiteService}><ModuleNavIcon module="Onsite Service"/><span>Onsite Service</span></button>
          )}
          {can("Service Contracts", "View") && (
            <button onClick={onContracts}><ModuleNavIcon module="Service Contracts"/><span>Service Contracts</span></button>
          )}
          <MasterDataNav active="Repairs" onNavigate={(item) => ({Customers:onCustomers,Suppliers:onSuppliers,"Stock Items":onStockItems}[item])?.()} />
          {can("General Maintenance", "View") && (
            <button><ModuleNavIcon module="General Maintenance"/><span>General Maintenance</span></button>
          )}
          {can("Accounting Sync", "View") && <button><ModuleNavIcon module="Accounting Sync"/><span>Accounting Sync</span></button>}
          {can("Reports", "View") && <button><ModuleNavIcon module="Reports"/><span>Reports</span></button>}
        </nav>
        <UserAccountButton className="rp-user"/>
      </aside>
      <section className="repairs-main">
        <header>
          <div className="rp-header-title">
            <h1>Repairs</h1>
            <p>Manage all repair jobs from intake to collection.</p>
          </div>
          <div className="rp-header-center">
            <RepairBarcodeLookup onOpenRepair={onOpenRepair} />
          </div>
          {can("Repairs", "Create") && (
            <button className="rp-new" onClick={onNewRepair}>
              <Plus size={18} /> New Repair
            </button>
          )}
        </header>
        <section className="rp-summary">
          {summaryCards.map((card) => (
            <button
              key={card.label}
              className={[
                isSummaryActive(card.filter) ? "active" : "",
                card.value > 0 &&
                ["Received", "In Progress", "Waiting Approval"].includes(
                  card.label,
                )
                  ? `queue-attention queue-${card.label.toLowerCase().replaceAll(" ", "-")}`
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={isSummaryActive(card.filter)}
              onClick={() => setStatus(card.filter)}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </button>
          ))}
        </section>
        <ConfigurableListing
          columns={repairColumns}
          rows={shown}
          rowKey={(repair) => repair.no}
          renderCell={renderRepairCell}
          onRowClick={onOpenRepair}
          storageKey="techcare-repair-list-layout-v1"
          toolbar={listingToolbar}
          emptyMessage="No repair records match your search."
          recordLabel="repair records"
          totalCount={repairs.length}
        />
      </section>
    </main>
  );
}
