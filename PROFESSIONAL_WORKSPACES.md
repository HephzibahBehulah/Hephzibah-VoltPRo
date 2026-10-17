# VoltProPLC and professional workspaces

VoltProPLC lives at `voltpro-plc/`, linked in the existing Design & simulation group. The source is in `apps/voltpro-plc/`: React, strict TypeScript, Vite, Tailwind, React Flow, Zustand and Lucide. Install with `npm ci`, test with `npm test`, build with `npm run build` inside that source folder. The Pages deployment workflow builds the site and includes dependency licenses before publishing; generated bundles and installed packages are excluded from Git. No third-party application source or branded artwork was copied.

## Industrial control

The library includes control/three-phase supplies, PE and neutral, one/three-pole breakers, overload power and NC/NO contacts, pushbuttons, selector, auxiliary contacts, coils, indicator lamps, motor, TON/TOF and AND/OR/NOT gates. Advanced tools carry a PRO badge but have no paywall.

The canvas supports snap-to-grid placement, terminal connections, multi-select, properties, delete, duplicate, undo/redo, zoom, minimap, panel collapse, New, device save and JSON import/export. Run uses a module Web Worker with a 20 ms logical scan. Closed contacts join terminal nets; a coil requires switched supply **and a neutral return**. Auxiliary contacts read the previous scan. The DOL example demonstrates start/stop and seal-in. Phase/neutral and phase/phase shorts inhibit outputs. This is a digital control teaching model, not a motor electromagnetic model, a fault-current solver or a certified protection study. Live wire colour denotes supply reachability or Boolean signal.

FBD supports acyclic Boolean gates and timers. Cycles report a diagnostic; use ladder auxiliaries for scan-memory feedback. Arduino export supports digital contacts, auxiliary contacts, coils, lamps and gates with unique Uno I/O pins. It explicitly refuses power devices/timers rather than exporting misleading code. The exported sketch uses pull-up inputs and a 20 ms loop; real loads need suitable isolated driver hardware.

## Existing workspaces

Breadboard Clear canvas and New project save a recoverable copy before changing the drawing. Undo restores the board. Left/right chevrons, reopen controls and Focus mode preserve the canvas. The existing simulator also gains editable FBD logic, scope triggers/cursors/phase metrics, nondestructive circuit review, and solar-position/cooling calculations in Engineering Tools.

The workbench reuses its section links as a grouped, searchable, collapsible sidebar. Virtual Labs adds 10,000 numerical variants across 20 formula families. Tools & Equipment adds 10,000 accuracy exercises across 20 instrument families, alongside the existing tool reference. These counts are **not** claims of 10,000 unique products or laboratory topologies. Component Learning links the library and AI explanations. The dashboard circuit gallery uses the existing 10,000 wired variants, MNA results, family selection and optional 15-second rotation. Its original adjustable RC experiment remains intact.

## Accounts and cloud projects

The public Supabase project URL and publishable key are in `platform/account-config.js`. Never put a secret/service-role key there. `server/accounts.sql` creates owner-only project storage, immutable ownership and version history. Anonymous access is revoked. `server/accounts-verify.sql` tests owner updates, version capture, cross-user isolation and spoof rejection inside a transaction that rolls back its temporary fixtures. Cloud archives are reversible; project revisions are retained.

Email confirmation and password recovery use Supabase Auth. Production email delivery requires a configured SMTP service; Supabase's default sender restricts recipients and is unsuitable for public signup. Configure the production Site URL and allowlisted account callback, then verify signup, confirmation, sign-in and recovery with a real user before setting `required:true`. Until that verification, local simulator access stays available to prevent a lockout. Passwords are never saved in application storage; sessions are validated against the account service. The AI Worker has an optional authenticated gate, disabled until the full account flow is verified.

Public accounts save schematic, breadboard and PLC projects explicitly; existing local work is never uploaded automatically. Cloud updates use revision checks to reject stale overwrites. Current/archived projects, download and historical revision copies are available on the Account page.
