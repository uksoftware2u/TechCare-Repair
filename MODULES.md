# TechCare Repair System — Module Record

Last updated: 13 August 2026  
Application: TechCareRepair  
Database: Microsoft SQL Server / `TechCareRepair`

This file is the central functional record for every module in the system. Update the relevant section whenever a workflow, field, permission, API, report, database migration, or business rule changes.

## Module Map

| Module | Purpose | Main Record | Access Control |
| --- | --- | --- | --- |
| Dashboard | Operational overview and global repair search | Repair / Warranty / Contract summaries | View |
| Repairs | Repair intake, diagnosis, quotation and repair lifecycle | Repair No. | View, Create, Edit, Delete, Approve, Print |
| Warranty | Supplier claim preparation, individual/batch sending and returns | Warranty Claim No. | View, Create, Edit, Approve, Print |
| Service Contracts | Recurring onsite, support and hosting agreements | Contract No. | View, Create, Edit, Delete, Approve, Print |
| Master Data — Customers | Customer and AutoCount debtor information | Customer ID | View, Create, Edit, Delete |
| Master Data — Suppliers | Supplier contacts, terms and warranty support | Supplier ID | View, Create, Edit, Delete |
| Master Data — Stock Items | Service and inventory items used in quotations | Item Code | View, Create, Edit, Delete |
| General Maintenance | Company, user, permissions, audit, options and configuration | Setting / User ID | Administrator-controlled |
| Accounting Sync | AutoCount synchronization status and retry operations | Sync ID | View, Edit, Sync |
| Reports | Operational, financial, warranty and contract reporting | Report Type | View, Print |

## 1. Dashboard

Purpose:

- Shows Received, Repairing, Ready, Warranty Due and Contract Renewal summaries.
- Displays the current work queue, supplier follow-up reminders and AutoCount status.
- Global search supports repair number, customer phone and serial number.
- Summary cards open the matching filtered listing.

Primary source: `src/App.jsx`

## 2. Repairs

### Intake

- Creates a unique Repair No. without duplicate primary keys.
- Customer Summary remains visible near the top of the intake workflow.
- Changing the customer does not discard the current Device & Condition work.
- Duplicate customers are detected by name or mobile number and require confirmation.
- Duplicate serial numbers show previous repair history.
- Device Type controls Brand, Body Condition, Accessories Received and Issue Category options.
- When Warranty Status is `Out of Warranty`, only `Claim Warranty` is hidden.
- Condition Photos provide separate `Take Photo` and `Upload Photo` actions, maximum three photos, image compression and enlarged preview.
- Customer confirmation supports signature, mobile number or IC verification.
- Signature and verification date/time appear under Customer Signature.
- Print and email receipt delivery generate the same PDF record; email opens the configured mail method with the PDF workflow.
- Intake Receipt includes condition photos, `Created By`, login user and date/time.
- A printed receipt can later be emailed with a Printed watermark to prevent duplicate handling.
- Default Diagnostic Fee comes from General Maintenance Options.

### Diagnosis

- Supports Pending and Save Draft states.
- Complete Diagnosis requires `Technical Checked By` and allows a technical remark.
- Diagnosis may be completed across multiple days.
- Diagnosis photos are stored separately from intake photos.
- Supports Tests Performed and Tests Performed Remark.
- Can proceed to quotation or bypass quotation to the next repair stage.

### Quotation and Repair

- Quotation lines can select a Stock Item Code.
- Items may be added or deleted and totals are recalculated.
- Approval/rejection actions move the repair to the correct next workflow state.
- Repair and Warranty remain linked so a warranty return can continue the original repair workflow.

Primary sources:

- `src/RepairIntake.jsx`
- `src/Repairs.jsx`
- `src/RepairDetail.jsx`
- `server/index.mjs`

Primary APIs: `/api/repairs`, `/api/diagnosis/:repairNo`, `/api/repairs/:repairNo/quotation-action`, `/api/drafts/:id`

## 3. Warranty

### Claim Creation

- A claim can be linked from an existing Repair.
- Repairs already in the Warranty workflow are excluded from the linked-repair selector.
- Service-centre customers may create a direct warranty claim without a previous repair; the system creates and links the required repair record.
- Foreign-key linkage always uses an existing Repair No.

### Preparation and Sending

- Preparation includes a `Batch to Supplier` option.
- Batch-ready lines are highlighted light yellow.
- When Batch to Supplier is selected, individual-send actions are hidden.
- Batch Preparation allows eligible items to be picked and sent together to one supplier.
- Individual sending records delivery method: self-delivery, supplier pickup, Lalamove or other logistics.
- Individual sending supports evidence photos, printing and email confirmation.
- An incorrectly sent individual item can be returned to Preparation.

### Supplier Tracking and Return

- Sent-to-supplier age is displayed in days.
- Overdue claims can prepare a supplier reminder email containing the overdue duration.
- Sent Confirmation includes company details, item listing, Serial No. barcode and checklist.
- Confirmations can be reprinted.
- Batch-sent items can return individually because supplier completion dates may differ.
- Individual Return records replacement details, rejection reason, external charges and the resulting claim outcome.

Primary source: `src/Warranty.jsx`

Primary APIs: `/api/warranty`, `/api/warranty/direct`, `/api/warranty/batch-send`, `/api/warranty/:id/undo-send`, `/api/warranty/:id/supplier-reminder`, `/api/warranty/:id/sent-confirmation`, `/api/warranty/:id/return`

## 4. Service Contracts

- Opens on a contract listing screen.
- Supports recurring services including onsite service, maintenance/support and hosting service.
- Generates a contract with customer, service lines, billing cycle, value, terms and site details.
- Records signed/unsigned status, signer, position, signature method and signed time.
- Calculates Active, Expiring Soon, Renewal Due and Expired status.
- Renewal creates a linked follow-on contract and preserves the previous Contract No.
- Contract renewal reminders appear on the Dashboard and in reports.
- Repair navigation must preserve Service Contract records and state.

Primary source: `src/ServiceContracts.jsx`

Primary APIs: `/api/service-contracts`, `/api/service-contracts/:id/sign`, `/api/service-contracts/:id/renew`

## 5. Master Data

Master Data appears below Service Contracts in navigation and contains Customers, Suppliers and Stock Items. Each module has its own icon.

### Customers

- Maintains customer/company, contact, mobile, email, TIN, registration, addresses and AutoCount debtor data.
- Warns and requests confirmation when a similar name or mobile number already exists.
- Customer listing supports search, filters and configurable columns.

Primary source: `src/Customers.jsx`  
API: `/api/customers`

### Suppliers

- Maintains supplier contact, category, credit terms, warranty terms, open claims and status.
- Used by warranty preparation, sending, reminders and return tracking.

Primary source: `src/Suppliers.jsx`  
API: `/api/suppliers`

### Stock Items

- AutoCount sync fields: Item Code, Description, Desc2, UOM, UOM Rate, Item Group, Item Type, Price1, Price2, Price and Status.
- Saving an item marks it Pending Sync; Stock Items and Accounting Sync can push pending records to the configured AutoCount connection.
- Item Type and Item Group codes are read from the configured AutoCount Account Book SQL database and cached locally for Stock Item dropdowns; their maintenance descriptions are not copied.
- Item Type is either `Service Item` or `Stock Item`.
- Items are selectable in Repair quotations.

Primary source: `src/StockItems.jsx`  
API: `/api/stock-items`

## 6. General Maintenance

### Company Profile

- Stores company name, registration, TIN, SST, phone, email, website, address, currency, timezone and logo.
- SQL Server is the authoritative source; stale local company data cannot overwrite a failed load.
- Company information is used on receipts, quotations, invoices, contracts and warranty confirmations.

### User Maintenance

- Creates and edits users with photo, name, username, email, role, branch and status.
- New users require Password and Confirm Password with a minimum of eight characters.
- Passwords are stored as salted hashes, never plain text.
- Editing a user can set a new password; a blank password keeps the current one.
- Login validates the database password and blocks inactive accounts.
- Clicking the user area at the bottom-left opens My Profile.
- Users may update their own Full Name, Email and profile photo, and may change Password after entering the current password.
- Username, Access Role and Branch are read-only in My Profile and remain controlled by User Maintenance.

### Access Rights

- Permissions can be assigned by Role or individual User.
- Available roles: Administrator, Manager, Supervisor, Counter Staff and Technician.
- Manager receives all standard operational permissions except Delete by default; permissions remain configurable in Access Rights.
- Actions: View, Create, Edit, Delete, Approve, Print and Sync.
- A user override takes priority over inherited role permissions.
- Reset to Role removes the individual override.
- Administrator permissions for General Maintenance are protected and cannot be disabled through individual checkboxes, Clear All or the API.

### Audit Trail

- Automatically records data-changing API operations.
- Captures user/user ID, module, action, reference, date/time, result, severity, HTTP method/path, changed fields, duration, IP, session and browser/device.
- Request and response details are sanitized; passwords, tokens, signatures and image data are redacted.
- Supports search, module/user/severity/result/date filters, configurable columns, details, refresh and CSV export.

### Backup & Restore

- Provides one simple `Backup Now` action.
- Creates a full SQL Server `.bak` backup using COPY_ONLY and CHECKSUM.
- Downloads the backup through the browser so the user can save it to USB, an external hard disk or another safe location.
- Restore accepts a selected TechCare SQL Server `.bak` file.
- Restore is Administrator-only, requires typing `RESTORE`, verifies the file through SQL Server and creates a pre-restore safety backup.
- Backup downloads and restores are recorded in Audit Trail; Backup History is not displayed.

### Options

- Repair number prefix and next number.
- Default diagnostic fee, warranty period, SST rate and receipt copies.
- Workflow and AutoCount switches.
- Receipt footer Terms & Conditions.

### Configuration

- Email method: Default Email App (`mailto`) or Gmail Web Link.
- Sender name, reply-to, CC, subject prefix and signature.
- No mailbox password is stored.

Primary source: `src/GeneralMaintenance.jsx`

Primary APIs: `/api/company-profile`, `/api/users`, `/api/auth/login`, `/api/access-rights`, `/api/audit-trail`, `/api/backups`, `/api/settings/:key`

## 7. Accounting Sync

- Displays all, synced, pending and failed AutoCount synchronization records.
- Supports manual synchronization/retry and API connection settings.
- Tracks source reference, AutoCount target/reference, last sync time, status and result message.
- Sensitive API keys are redacted from Audit Trail details.

Primary source: `src/AccountingSync.jsx`  
API: `/api/accounting-sync`

## 8. Reports

- Report Centre reads operational data from SQL Server.
- Supports date range, status and text filters.
- Supports print and CSV export when the user has Reports Print permission.
- Report actions are recorded in Audit Trail.
- Report categories cover repair operations, revenue/quotation data, warranty supplier aging, service-contract renewal and stock item pricing.

Primary source: `src/Reports.jsx`  
API: `/api/reports`

## Cross-Module Business Flow

```text
Customer
  -> Repair Intake
  -> Diagnosis
  -> Quotation or Bypass Quotation
  -> Repair / Warranty Claim
  -> Supplier Individual or Batch Processing
  -> Individual Return
  -> Repair Completion
  -> Receipt / Email / Reporting / Accounting Sync
```

Service Contracts are a parallel recurring workflow linked to Customers and renewal reporting.

## Shared Technical Rules

- SQL Server is the authoritative persistent store.
- Record numbers and foreign keys must be generated and validated on the server.
- Data-changing operations must be auditable.
- Access Rights must be checked before displaying or performing protected actions.
- Printed and emailed documents use the current Company Profile.
- Photos and signatures must not be exposed in audit payloads.
- Destructive actions require an explicit confirmation and a recoverable path when possible.

## Database Migration Record

Database changes are stored in `database/` and executed in numeric order. Current feature migrations include customer/repair details, diagnosis and quotation, condition photos, customer verification, warranty reminders and returns, stock items, delivery confirmation, Audit Trail details, user passwords, and Backup & Restore.

Latest migrations:

- `018-audit-trail-details.sql` — extended Audit Trail fields.
- `019-user-password.sql` — salted password hash and salt columns.
- `020-backup-restore.sql` — least-privilege SQL backup listing, verification and restore procedures.

## Change Record Template

Add entries below when a module changes:

```text
Date:
Module:
Requested change:
Implemented behaviour:
Database/API changes:
Permissions affected:
Verification completed:
Migration/file references:
```

## Change Log

### 13 August 2026

- Created this central module record.
- Documented current Repair, Warranty, Service Contract, Master Data, General Maintenance, Accounting Sync and Report functionality.
- Added current Audit Trail, password authentication and Backup & Restore behaviour.
- Removed the stored/default administrator username and password from the Login screen, disabled login autofill and removed `Remember this counter`.
- Simplified Backup & Restore to a single downloadable `Backup Now` action and removed Backup History from the interface.
- Added the Manager access role with configurable permissions and safe defaults excluding Delete.
- Added Restore from Backup File with `.bak` selection, Administrator protection, confirmation and automatic safety backup.
- Added the bottom-left My Profile function for basic information and secure self-service password changes.
- Protected Administrator General Maintenance permissions to prevent administrative lockout.
