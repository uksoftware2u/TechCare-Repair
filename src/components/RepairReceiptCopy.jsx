import "./RepairReceiptPhotos.css";

export function RepairReceiptCopy({
  company,
  customer,
  form,
  verification,
  repairNo,
  copyType,
  createdBy = "—",
  createdAt,
}) {
  const serviceCopy = copyType === "Service Copy";
  const conditionPhotos = (form.photos || []).slice(0, 3);
  const displayedBrand=form.brand==="Others"?(form.otherBrand?.trim()||"Others"):form.brand;
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
  const verifiedAt = verification?.verifiedAt
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
  const creatorName =
    createdBy === "—" ? form.createdBy || createdBy : createdBy;
  const createdDateTime =
    createdAt || form.createdAt
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kuala_Lumpur",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(new Date(createdAt || form.createdAt))
      : verifiedAt;
  return (
    <article className="rr-paper">
      <div className="rr-copy-label">{copyType}</div>
      <div className="rr-brand">
        <div className="rr-company-brand">
          {company.logo && <img src={company.logo} alt="Company logo" />}
          <div>
            <b>{company.name}</b>
            <span>BRN: {company.registration || "—"}</span>
          </div>
        </div>
        <strong>REPAIR INTAKE RECEIPT</strong>
      </div>
      <div className="rr-company-details">
        <span>{company.address}</span>
        <b>
          {company.phone} · {company.email}
        </b>
      </div>
      <div className="rr-meta">
        <span>
          <small>Repair No.</small>
          <b>{repairNo}</b>
        </span>
        <span>
          <small>Received Date</small>
          <b>12/08/2026 10:15 AM</b>
        </span>
        <span>
          <small>Counter</small>
          <b>01</b>
        </span>
      </div>
      <div className="rr-barcode">
        <img
          src="/assets/barcode-sr-20260812-005.svg"
          alt={`Barcode for ${repairNo}`}
        />
        <b>{repairNo}</b>
        <small>Scan to track this repair job</small>
      </div>
      <div className="rr-section">
        <h3>Customer</h3>
        <div className="rr-grid">
          <span>
            <small>Name</small>
            <b>{customer.name}</b>
          </span>
          <span>
            <small>Phone</small>
            <b>{customer.phone}</b>
          </span>
          <span>
            <small>AutoCount Debtor</small>
            <b>{customer.debtor}</b>
          </span>
        </div>
      </div>
      <div className="rr-section">
        <h3>Device &amp; Condition</h3>
        <div className="rr-grid">
          <span>
            <small>Device</small>
            <b>
              {displayedBrand} {form.model}
            </b>
          </span>
          <span>
            <small>Type</small>
            <b>{form.deviceType}</b>
          </span>
          <span>
            <small>{identifierLabel}</small>
            <b>{identifierValue || "—"}</b>
          </span>
          <span>
            <small>Warranty</small>
            <b>{form.warranty}</b>
          </span>
          {identifierLabel !== "Internal Device ID" && (
            <span>
              <small>Internal Device ID</small>
              <b>{form.internalDeviceId || "—"}</b>
            </span>
          )}
          <span className="wide">
            <small>Reported Issue</small>
            <b>{form.issue}</b>
          </span>
          <span className="wide">
            <small>Condition / Accessories</small>
            <b>
              {[...form.conditions, ...form.accessories].join(" · ") ||
                "None recorded"}
            </b>
          </span>
        </div>
      </div>
      {conditionPhotos.length > 0 && (
        <div className="rr-condition-photos">
          <h3>
            Condition Photos <span>{conditionPhotos.length} / 3</span>
          </h3>
          <div>
            {conditionPhotos.map((photo, index) => (
              <figure key={`${photo.slice(-24)}-${index}`}>
                <img src={photo} alt={`Device condition photo ${index + 1}`} />
                <figcaption>Photo {index + 1}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
      {serviceCopy && (
        <div className="rr-internal">
          <h3>Internal Job Tracking</h3>
          <span>
            <small>Job Status</small>
            <b>Received</b>
          </span>
          <span>
            <small>Technician</small>
            <b>Unassigned</b>
          </span>
          <span>
            <small>AutoCount</small>
            <b>{form.sync ? "Queued" : "Not requested"}</b>
          </span>
        </div>
      )}
      <div className="rr-total">
        <span>
          <small>Receipt Delivery</small>
          <b>{form.delivery}</b>
        </span>
        <span>
          <small>Diagnostic Fee</small>
          <strong>RM {form.diagnosticFee}</strong>
        </span>
      </div>
      <div className="rr-terms">
        <b>{serviceCopy ? "Internal Note" : "Terms & Conditions"}</b>
        <p>
          {serviceCopy
            ? "Internal copy — retain with the device or job file until collection."
            : company.termsConditions?.trim() ||
              "Device received subject to inspection. Please present this receipt when collecting the device."}
        </p>
      </div>
      <div className="rr-signatures">
        <div className="rr-customer-signature">
          <div className="rr-signature-mark">
            {verification?.signature ? (
              <img src={verification.signature} alt="Customer signature" />
            ) : (
              <strong>{verification?.value || "—"}</strong>
            )}
          </div>
          <span>Customer Signature</span>
          <small>
            {verification?.method || "Not verified"} · {verifiedAt}
          </small>
        </div>
        {serviceCopy ? (
          <div className="rr-staff-signature">
            <div></div>
            <span>Technician / Completed By</span>
          </div>
        ) : (
          <div className="rr-staff-signature rr-created-by">
            <div>
              <strong>{creatorName}</strong>
            </div>
            <span>Created By</span>
            <small>{createdDateTime}</small>
          </div>
        )}
      </div>
      <footer>
        {company.name} · BRN {company.registration} · {company.phone} ·{" "}
        {company.email}
      </footer>
    </article>
  );
}
