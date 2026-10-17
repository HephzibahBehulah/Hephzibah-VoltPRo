# Component engineering architecture

Released 2026-10-17. Original VoltPRo implementation informed by CircuitLab's documented model distinctions, Falstad's editable circuit elements, breadboard.build's physical parts workflow, and manufacturer pin tables. No reference application's source, artwork, or commercial component database was copied.

## One definition, several views

`src/core/component-contracts.js` owns curated stable component IDs, named/numbered terminals, local terminal coordinates, category, default parameters, explicit electrical model, limitations, source URL, and optional physical package and bounded drawing geometry. The schematic palette, wire hit points, terminal graph, library preview, package preview, and inspector consume this contract. Unknown parts no longer acquire two invented schematic pins.

The initial curated set contains 32 definitions: 27 educational models and five reference packages. These are definitions, not 32 manufacturer-qualified SPICE models. Functional gate/transistor symbols are explicitly distinct from physical IC packages. A transistor symbol's B/C/E order must not be used as a manufacturer's TO-92 pinout.

Ten manufacturer PDIP pin maps are included: TI NE555, LM358, LM324, ULN2003A, SN74HC00/04/08/32/86/595. Pin order is counterclockwise in top view; pin one and orientation notch are drawn. Pin tables include the power pins. Datasheet links are attached to individual records. Only the five combinational logic packages currently have electrical models; timer, amplifier, driver and shift-register packages remain references.

## Real multi-terminal models

- Three-terminal potentiometer: two track segments meet at a separately wired wiper. Position zero moves the wiper toward terminal 1. Segment resistance is bounded at 1 µΩ at an endpoint for numerical stability.
- SPDT: COM, NC, NO are separate nodes. A 1 mΩ closed contact and 1 TΩ open contact select one throw.
- DPDT relay: A1/A2 coil and two separate COM/NC/NO sets. Coil/contact paths retain named identities through export. The catalogue's SPDT relay maps to five pins, rather than inheriting a DPDT's eight.
- NPN/PNP and N/P MOSFET symbols expose three distinct control/load terminals. Their existing threshold teaching models are clearly labelled; they are not analog gain or switching-loss models.
- Powered SN74HC00/04/08/32/86: all four/six channels use the package pin map. Inputs of connected outputs and both supply pins must be wired. Input loads are 1 TΩ; output resistance defaults to 25 Ω; input threshold is half the supply. Outputs are disabled below 2 V and supply above 6 V is rejected. No propagation delay, protection, hysteresis, supply quiescent current, or manufacturer electrical qualification is claimed. AC small-signal analysis is blocked. DC and transient calculation are supported for combinational networks.

## Breadboard

The breadboard offers the same ten PDIP packages plus a three-leg potentiometer and SPDT. PDIP pins run along opposite sides of the centre trench, retain counterclockwise numbering, and expose an inspector table mapping every signal to its exact hole. Upper/lower hole row separation is corrected to 7.62 mm for narrow DIP packages. Project files store all terminal coordinates, validate the expected pin count, and keep the existing version-2 format.

The old two-terminal variable resistance part remains compatible and is honestly labelled a rheostat. A reference IC can be placed and inspected but blocks electrical analysis. Arduino remains a reference footprint on this breadboard; this release does not add firmware or peripheral emulation.

## Legacy catalogue audit

All 768 original family records remain accessible for compatibility and inspection. The runtime adapter normalizes category names, uses canonical named terminals when available, removes inherited template parameters/ratings/mounting claims, and separates educational, reference, and review records. Unsupported families are not called working electrical models. Review records are excluded from the placement palette; reference-only legacy diagrams are retained in the library browser. The raw historical JSON is retained, but its template fields are not presented as verified specifications.

The library browser supports search by name/function/pin, category and capability filters, pagination, pin tables, model limitations, and individual definition export. Schematic symbols replace unrelated palette photos for curated parts; package view is explicit.

## Draw and share a component

The library's creator supports named pins, lines, rectangles, undo/clear, live preview, local persistence, JSON import/export and schematic placement. Schema validation rejects duplicate pin IDs, overlapping pins, non-finite/out-of-bounds coordinates, unsupported shape kinds and excessive geometry. Text is escaped; arbitrary SVG/JavaScript is not executed. Imported/custom components are always reference-only. Drawing a symbol does not invent its electrical behavior.

Custom definitions used by a schematic are embedded in its exported project and restored before terminal conversion. Built-in IDs cannot be replaced by imported custom definitions. Custom geometry presently supports a maximum of 400 pins, 100 shapes and coordinates within ±500 schematic units. User-defined electrical behavior and arbitrary SPICE import are not implemented.

## Validation and remaining scale work

Behavior tests cover potentiometer ratios, SPDT throw isolation, every input combination of four powered gate ICs, missing supply rejection, fourteen-pin breadboard simulation, transient output, pin order, relay paths, reference-model rejection, quarantine behavior and unsafe geometry. Existing circuit, project, MCU, topology and breadboard tests remain part of the release checks.

This is not a ten-million-part database. Millions of genuine parts require licensed/sourced catalogue ingestion, versioned manufacturer/package identities, provenance review, server-side indexed search/paging, package-specific mappings and automated model qualification. The retained 768-record adapter still loads its small legacy catalogue eagerly. Do not scale that loader to millions or inflate the displayed count with parameter permutations. Next priorities are tested NE555 and amplifier models, manufacturer transistor packages, richer physical component artwork, package-aware custom pin positioning and additional sourced devices.
