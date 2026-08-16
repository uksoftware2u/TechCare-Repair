import { useState } from "react";
import { Barcode } from "@phosphor-icons/react";
import { databaseApi } from "../database-api.js";
import "./RepairBarcodeLookup.css";

function normalizeBarcode(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function RepairBarcodeLookup({ onOpenRepair, className = "" }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    const scanned = value.trim();
    if (!scanned || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const repairs = await databaseApi.repairs();
      const barcode = normalizeBarcode(scanned);
      const matches = repairs.filter((repair) =>
        [repair.no, repair.serial, repair.customerAssetTag, repair.internalDeviceId].some(
          (candidate) => candidate && normalizeBarcode(candidate) === barcode,
        ),
      );
      if (matches.length === 1) {
        setValue("");
        onOpenRepair?.(matches[0]);
      } else if (matches.length > 1) {
        setNotice("Multiple repairs use this ID. Scan the Repair No. barcode.");
      } else {
        setNotice("No repair found for this barcode.");
      }
    } catch {
      setNotice("Unable to check repairs. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`repair-barcode-lookup ${notice ? "has-error" : ""} ${className}`.trim()} onSubmit={submit}>
      <Barcode size={19} aria-hidden="true" />
      <label>
        <input
          aria-label="Scan repair barcode"
          autoComplete="off"
          placeholder="Scan repair barcode"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (notice) setNotice("");
          }}
        />
      </label>
      <button type="submit" disabled={!value.trim() || busy}>{busy ? "Checking..." : "Track"}</button>
      {notice && <small role="alert">{notice}</small>}
    </form>
  );
}
