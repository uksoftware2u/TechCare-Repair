import {
  ArrowsClockwise,
  ChartBar,
  Cube,
  FileText,
  Gear,
  House,
  Package,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "@phosphor-icons/react";

const icons = {
  Dashboard: House,
  Repairs: Wrench,
  "Ready for Collection": Package,
  Customers: Users,
  Warranty: ShieldCheck,
  "Service Contracts": FileText,
  "Onsite Service": Truck,
  Suppliers: Truck,
  "Stock Items": Cube,
  "General Maintenance": Gear,
  "Accounting Sync": ArrowsClockwise,
  Reports: ChartBar,
};

export function ModuleNavIcon({ module, size = 16 }) {
  const Icon = icons[module] || FileText;
  return <Icon size={size} />;
}
