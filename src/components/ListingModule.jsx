import { Wrench } from "@phosphor-icons/react";
import "./ListingModule.css";
import { useAccess } from "../access-control.jsx";
import { MasterDataNav } from "./MasterDataNav.jsx";
import { ModuleNavIcon } from "./ModuleNavIcon.jsx";
import { UserAccountButton } from "./UserAccountButton.jsx";

const navigationBeforeMaster = [
  "Dashboard",
  "Repairs",
  "Ready for Collection",
  "Warranty",
  "Onsite Service",
  "Service Contracts",
];
const navigationAfterMaster = [
  "General Maintenance",
  "Accounting Sync",
  "Reports",
];

function NavigationButton({ item, active, onNavigate }) {
  return (
    <button
      className={item === active ? "active" : ""}
      onClick={() => onNavigate?.(item)}
    >
      <ModuleNavIcon module={item} />
      <span>{item}</span>
    </button>
  );
}

export function ListingModule({
  active,
  title,
  description,
  headerCenter,
  primaryAction,
  onNavigate,
  summary,
  children,
}) {
  const { can, user } = useAccess();
  const showPrimaryAction =
    active === "General Maintenance"
      ? can(active, "Edit")
      : active === "Accounting Sync"
        ? can(active, "Sync")
        : can(active, "Create");
  return (
    <main className="listing-module">
      <aside className="lm-side">
        <div className="lm-brand">
          <Wrench size={20} />
          <b>TechCare PC</b>
        </div>
        <nav>
          {navigationBeforeMaster
            .filter((item) => can(item, "View"))
            .map((item) => (
              <NavigationButton
                key={item}
                item={item}
                active={active}
                onNavigate={onNavigate}
              />
            ))}
          <MasterDataNav active={active} onNavigate={onNavigate} />
          {navigationAfterMaster
            .filter((item) => can(item, "View"))
            .map((item) => (
              <NavigationButton
                key={item}
                item={item}
                active={active}
                onNavigate={onNavigate}
              />
            ))}
        </nav>
        <UserAccountButton className="lm-user"/>
      </aside>
      <section className="lm-main">
        <header>
          <div className="lm-header-title">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {headerCenter && <div className="lm-header-center">{headerCenter}</div>}
          <div className="lm-header-action">{showPrimaryAction && primaryAction}</div>
        </header>
        {summary && (
          <section className="lm-summary">
            {summary.map((item) =>
              item.onClick ? (
                <button
                  key={item.label}
                  className={item.active ? "active" : ""}
                  aria-pressed={Boolean(item.active)}
                  onClick={item.onClick}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </button>
              ) : (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ),
            )}
          </section>
        )}
        {children}
      </section>
    </main>
  );
}
