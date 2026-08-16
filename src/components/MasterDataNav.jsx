import { useEffect, useState } from "react";
import { CaretDown, CaretRight, Database } from "@phosphor-icons/react";
import { useAccess } from "../access-control.jsx";
import { ModuleNavIcon } from "./ModuleNavIcon.jsx";
import "./MasterDataNav.css";

export function MasterDataNav({ active, onNavigate }) {
  const { can } = useAccess();
  const items = ["Customers", "Suppliers", "Stock Items"].filter((item) => can(item, "View"));
  const childActive = items.includes(active);
  const [open, setOpen] = useState(childActive);
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);
  if (!items.length) return null;
  return (
    <div className={`master-data-nav ${childActive ? "active" : ""}`}>
      <button
        type="button"
        className="master-data-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Database size={16} />
        <span>Master Data</span>
        {open ? <CaretDown size={14} /> : <CaretRight size={14} />}
      </button>
      {open && (
        <div className="master-data-sub">
          {items.map((item) => (
            <button
              type="button"
              key={item}
              className={item === active ? "active" : ""}
              onClick={() => onNavigate?.(item)}
            >
              <ModuleNavIcon module={item} size={14} />
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
