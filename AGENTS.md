# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

Use English as the single language for all interface labels, messages, placeholders, generated repair records, and navigation. Do not add bilingual labels or language switchers unless the user explicitly requests localization again.

The Repairs module must open on the repair listing first. Users create a repair through the listing's `New Repair` action, while selecting a listing row opens the repair detail.

The repair listing must support a column chooser, drag-to-reorder column headers, resizable column widths, and a user-controlled saved layout that restores on future visits.

Build listing screens with the shared `ConfigurableListing` component in `src/components/`; module screens should supply their data, column definitions, filters, cell rendering, storage key, and row action instead of duplicating listing behavior.

Customers, Warranty, and Suppliers are listing-first modules and must use the same shared configurable listing behavior as Repairs.

General Maintenance contains Company Profile, User Maintenance, and Options. User Maintenance uses the shared configurable listing component; Company Profile and Options use editable settings forms.

In Repair Intake, changing the selected customer from Device & Condition or a later stage must preserve the current stage and all entered repair details. Use an in-place customer picker instead of navigating back to the Customer step.

In Repair Intake, when Warranty Status is Out of Warranty, hide Issue Category in Condition Details and clear any previously selected category so a hidden stale value cannot be saved. Restore the default category only when the status changes back to In Warranty or Unknown.

Show the selected Customer Summary as a horizontal bar above the active Repair Intake form from Device & Condition onward, rather than at the bottom of the left step navigation.

Access Rights must support both role-wide permissions and per-user overrides. Individual users inherit their assigned role until custom user permissions are saved, and must be able to reset back to role inheritance.

Company Profile must never render old demo or previously cached company details while SQL Server data is loading. Show an explicit loading or error state and prevent saving until the current SQL-backed profile is available.

General Maintenance Options must include configurable Receipt Footer Terms & Conditions stored in SQL Server. New Repair Intake customer receipts must print the saved text and preserve line breaks.

General Maintenance includes a Configuration tab for Email settings. Support simple Default Email App (mailto) and Gmail Web Link methods; both prefill recipients, CC, subject and signature without storing a mailbox password, Google password or API key. Gmail Web Link uses the Google account already signed in to the browser. Store display name, reply-to, default CC, subject prefix, signature and selected method in SQL AppSettings.

AutoCount API Settings must keep the On-Premises connection form simple. Show Local Network or Custom Host, server address, AutoCount Server port (default 19500), SQL Server, Account Book and AutoCount credentials; allow users to find an available Account Book or manually attach one by database name; hide cloud URL/token fields while On-Premises is selected, and require a successful connection test before saving.

Accounting Sync includes an API Usage view that separately identifies AutoCount Web API, Cloud Accounting and On-Premises operations. It reports locally tracked business sync operations, success/failure/pending counts and usage by data type; never present locally counted operations as an official provider billing quota.

Warranty Preparation supports optional Batch to Supplier routing. Batch Preparation may combine only items for the same supplier into one outbound batch, but every Warranty Claim must keep its own claim reference, status, processing timeline, and independently recorded return date.

When a Preparation item is ticked Batch to Supplier, hide Send Individually and reject individual-send API attempts. The individual action becomes available only after Batch to Supplier is unticked.

Every completed Warranty supplier batch must retain a printable Sent Confirmation listing. The document must prominently show each item's Serial No. together with Warranty No., Repair No., device and claim reference, and Batch History must support reprinting the same sent confirmation later.

Warranty Batch Sent Confirmation must use the current SQL-backed Company Profile for its company name, registration, address, contact details and logo. Each detail row must print a scannable barcode encoded with its Serial No., with the Serial No. also visible for manual entry, plus printable checkboxes for Serial Verified, Device Checked and Packed.

Do not allow a Warranty item without a Serial No. to be batch sent to a Supplier, because the Sent Confirmation requires a Serial No. barcode. Historical batches with missing Serial No. must explicitly print No Serial Barcode rather than inventing a tracking value.

Service Contracts is a listing-first module for recurring IT agreements such as Onsite Support, Preventive Maintenance, Remote Support, Hosting, Domain, SSL and managed cloud services. Contracts progress from Draft to signed Active status, retain recurring service/SLA line items, generate a Company Profile-backed printable agreement, derive expiry and renewal alerts from each contract's notice period, and create renewal versions linked to the previous contract instead of overwriting history.

Warranty Claims must always have a valid linked Repair rather than a manually typed Repair No. Repair Detail links into a prefilled Warranty creation flow. For Service Center walk-ins without an existing Repair, Direct Warranty Intake atomically creates a lightweight Repair service case and its Warranty Claim. Both entry paths share supplier batching and status synchronization, and an individual supplier return resumes the linked Repair at Diagnosis with a direct Open Linked Repair action.

The New Warranty Claim Linked Repair selector must omit Repairs that already have an active Warranty Claim. Do not show them as disabled options. A Repair becomes selectable again only after its previous Warranty Claim is Returned from Supplier.

An individually sent Warranty Claim must support a confirmed Back to Preparation action to recover from an accidental send. Undoing clears the individual Sent Date and Claim Reference and restores the linked Repair to Warranty Preparation. Batch-sent items cannot use this individual undo action.

Onsite Service is a listing-first module for customer call-ins, advice, on-site visits, workshop pickups and customer drop-offs. A Service Request owns enquiry, address snapshot, appointment, dispatch, pickup and return coordination; Repairs owns diagnosis, quotation and repair work. Each Service Request may create at most one linked Repair, and on-site-to-workshop handoff must continue that same Repair rather than creating another record.

Commission is configured once per user in User Maintenance as None, Item Rate, or Item Amount. Commission Report includes only quotation items from completed, collected, or ready-for-collection repairs assigned to that user's full name. Item Rate calculates line sales multiplied by the configured percentage; Item Amount calculates item quantity multiplied by the configured fixed amount.

Database Backup may be started from any connected client without interrupting the frontend or other users. Stream backup files from disk, allow only one backup generation at a time, clean up temporary files after completion or client disconnect, and keep the development file watcher away from the backup staging directory.

Repair Execution begins with one Technician Guide concept instead of a separate or duplicated Plan. The guide follows the selected device type, shows relevant service-point, disassembly and internal-anatomy references for computer repairs, and lets technicians save custom diagram image URLs, an executor note and a YouTube reference URL for repair guidance and team communication.

Device Type includes Desktop PC for computer towers and custom-built PCs. Desktop PC uses the desktop-specific condition, accessory, issue-category and brand lists, and automatically receives the computer Technician Guide references.

Technician Guide imagery must match the selected computer form factor. Desktop PC uses tower-case service points, desktop disassembly and ATX internal anatomy; Laptop uses notebook-specific imagery and must never be shown for a Desktop PC repair.

Technician Guide reference images open in a large lightbox when clicked. Keyboard users can open an image with Enter or Space, and the lightbox closes with Escape, its close button, or the surrounding backdrop. Preserve the selected service-point, disassembly or anatomy crop when enlarging built-in triptych imagery, and support the same behavior for custom image URLs.

Ready for Collection is a separate SQL-backed module positioned directly after Repairs in primary navigation. Completing the Repair Ready Gate must record Repair Completed and Posted to Collection activities, create the collection record automatically, and move the Repair to Ready for Collection. Collection staff manage pickup notifications, scheduled pickup, payment status and balance, collector details, collection remarks, customer signature or proof photo, and the final Collected status. Collection overdue timing is seven days by default and Dashboard metrics show Ready for Collection, Overdue Collection, Collected Today, and Outstanding Payment from the same collection records.

Dashboard has a dedicated hardware barcode-scanner field in the header. Pressing Enter after a scan refreshes Repairs from SQL Server and exact-matches Repair No., Serial No., Customer Asset Tag or Internal Device ID before immediately opening Repair Detail. Unknown or ambiguous identifiers must show a clear message and never open an unrelated repair.

Repairs, Ready for Collection and Warranty also show the same Repair barcode scanner centered in their page header. Each scanner refreshes SQL Repairs, uses the same exact identifier matching rules and opens Repair Detail immediately after a unique scan.

Keep the Repair barcode scanner at the same centered header position and dimensions across Dashboard, Repairs, Ready for Collection and Warranty by using the shared RepairBarcodeLookup component and matching three-column header layouts.

Keep the shared header barcode scanner visually compact: approximately 340px wide and 42px high on desktop, with a small Track button, so it remains a utility control rather than dominating the page title area.

The shared header barcode scanner uses a tidy single-line layout: barcode icon, one input with the Scan repair barcode placeholder, and an aligned Track button. Do not reintroduce a stacked micro-label above the input.

The shared barcode input must explicitly reset inherited label margins and the global input focus ring so no inner rounded box or vertical overflow appears inside the scanner container.
