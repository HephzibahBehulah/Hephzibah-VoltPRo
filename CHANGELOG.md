# Changelog

## 2026-10-18 — Live Workbench studies
- Added 10,000 wired healthy/fault comparisons: 25 fault patterns with 400 physical parameter sets, shared circuit solving, live voltage/current paths, terminal probes, controls and editable simulator export. Industrial equivalents and thermal assumptions are explicitly labeled.
- Expanded the linked index to 10,000 entries: 401 existing references plus 9,599 worked parameter studies, with relevant reading and practical circuit links. Checked the protected admin library and incorporated its engineering documentation sources.
- Verified every definition pair is distinct and every wire endpoint exists; all 25 families solve at parameter boundaries. Browser checks cover fault toggling, desktop/mobile layout and simulator import/run.

## 2026-10-18 — VoltProPLC and connected professional workspaces
- Added the typed React industrial ladder/FBD workstation, Web Worker scan engine, terminal-aware motor starter, project files and bounded Arduino export.
- Added recoverable breadboard Clear/New controls, collapsible simulator panels, FBD editing, scope cursor/trigger/phase measurements and circuit review.
- Connected Supabase Auth and owner-only versioned cloud projects, including PLC projects; public email sender setup remains in progress.
- Added searchable workbench navigation, 10,000 calculation variants, 10,000 instrument exercises, component-to-AI explanations and a solved dashboard circuit gallery.
- Added explicit solar-position/PV and cooling energy teaching calculations.

## 2026-10-17 — Breadboard Studio
- Reworked the dedicated breadboard page around a physical canvas, searchable parts, select/wire/probe tools and wired experiments.
- Connected real breadboard strips to the shared DC/transient engine, including capacitors, inductors, diodes, sine sources and switches.
- Added measured scope traces, playback cursor, CSV export, local auto-save, undo/redo and live value controls.
- Retained accessible grid controls and existing project import, and documented firmware/peripheral limits.

## 2026-10-17 — Analysis Studio
- Fixed simulator startup collection bindings and missing running-wire activity helper.
- Added two-channel time captures, Bode magnitude/phase, XY, spectrum, DC sweeps and CSV export.
- Corrected capacitor and inductor transient history; added sinusoidal source sampling and convergence reporting.
- Added wired experiments, live component controls, voltage colors, energized-path animation and schematic/device view switching.
- Kept panel, PLC, MCU, Academy and breadboard workspaces; documented the analysis scope and limitations.
- Advanced offline asset caching and added analytical regression coverage.

## Engineering rebuild
- Added terminal-first project contracts.
- Added deterministic topology and net resolution.
- Added executable device-model registry.
- Added contactor, relay, protection, overload, three-phase and motor models.
- Added fault injection, measurement and simulation state services.
- Added CAD symbol, device-face, panel-footprint and orthogonal-wire services.
- Added panel, PLC, engineering calculation, instrument and training services.

## Connected engineering systems · 2026-10-18
- Shared native schematic, PLC, breadboard and worksheet documents, local revision checks, linked tags, JSON transfer, cloud envelope and parameter-linked evidence.
- Motor starter showcase with a 400 V winding equivalent, 24 V PLC control and separately identified 5 V Nano functional trainer.
- PLC commissioning HMI, I/O watch, bounded transition history, six injected fault controls, seven isolated acceptance scenarios, retentive timers, counters, edge detectors and set/reset latches.
- Net annotations, explicit-junction inspection, DC terminal probes and five-point resistor tolerance study; breadboard lead-hole/strip checks and generated wiring steps.
- Correct schematic cloud snapshot serialization; preserve all existing workspace tools and local save paths.
- Notification sender configured separately in Supabase using a domain-restricted sending credential. Secrets are never included in client assets.

## Shared system compatibility fix · 2026-10-18
- Preserve linked device tags when the schematic editor saves its native version 5 document, including reference designators and parameter tags.
- Rebuild derived links for existing saved systems without altering their workspace documents.
- Apply motor-showcase supply parameters to both legacy component documents and native device documents without changing coil ratings or wire routes.

## Shared workspaces, identity and conversations · 2026-10-18

- Shared fixed workspace navigation and account controls on Academy, Simulator, Breadboard, Engineering Tools, Workbench, Account and VoltProPLC. Signed-in users can edit display name, profile username and a compressed picture. Supabase verifies identity; usernames are labels, not unique login credentials.
- Fresh assistant/tutor sessions on reload, with explicit device-local conversation history, New chat, rename, deletion and JSON export. Circuit proposals remain attached to the saved conversation. Limits: 40 conversations, 60 messages each and 4 MB per device. Legacy tutor transcripts migrate into history.
- Simulator controls reuse their existing actions inside File, Draw, Analyse, Examples and View menus; Run, Step, Stop, Save, wiring, Undo/Redo and Fit remain accessible.
- PLC projects support up to 100 named drawing sheets within the existing 300-device / 1,000-wire project limits. Added a 20-drive/40-sheet plant study (280 devices, 460 wires), interlocked forward/reverse control and 100,000 selectable parameter variants across 10 timer/counter templates. These are original executable learning models, not certified vendor programs or 100,000 independently engineered installations. Existing System project tools retain native PLC data alongside the other workspace views.
- Account profiles remain in Supabase authentication metadata. Existing Cloudflare AI routing is preserved; profile metadata never grants authorization.
