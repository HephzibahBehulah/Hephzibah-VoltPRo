# Changelog

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
