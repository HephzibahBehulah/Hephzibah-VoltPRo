# Component and assistant integration

## Qualified catalogue

The original 52 built-in contracts are joined by 92 specifically qualified catalogue records (144 built-in definitions total, before locally saved custom parts). These include 20 single-pole B/C/D MCBs, passive values, sources, switching devices, relay coils, semiconductor approximations and resistive loads. Each promoted record has a vector symbol, explicit terminals, editable parameters and documented model limits. They appear in the default reference results and can be imported into the schematic. Supported small electronic parts can also be placed on the breadboard with electrical parameters retained in project files.

The other legacy records are still searchable with Include legacy records. Existing educational records can be placed in the schematic; unqualified pin maps stay marked for review. No fictional manufacturer validation, million-part database or certified device curves are claimed. Generic MCB trip thresholds are illustrative instantaneous models, without thermal timing or breaking-capacity qualification. Industrial breakers do not pretend to have solderless breadboard footprints.

## Shared Tutor and Adigun tools

Both assistants share deterministic local calculation and project tools. Try:

- Draw a 3-way switch circuit
- Build a traffic light circuit
- Build a pump control circuit
- Make a voltage divider
- Build a low pass filter
- Calculate current at 24 V through 120 ohm
- Calculate RC cutoff for 1 kohm and 100 nF

Three-way lighting uses two actual SPDT changeovers, two travelers, a 5 V source, 330 ohm resistor and LED. Matching switch states light the indicator; opposite states open the path. This is a low-voltage teaching circuit, not an installation drawing.

Proposals have preview, download, schematic import and compatible breadboard import actions. Existing workspace content is saved to its project library before import. Generated structured projects are validated against known component types and terminal ranges; assistant JavaScript is never executed. Local project tools use supported templates; they do not synthesize arbitrary engineering systems or infer every requested design parameter.

## Connected AI service

Open-ended reasoning uses the existing HTTPS chat service, configurable under Settings. The service did not return an AI answer in the browser connection test on 17 October 2026. Offline calculations, sketches, component data and supported concept explanations remain available, and the interface labels fallback responses. A working server-side AI service is still required for broader answers; this static GitHub Pages repository contains no such backend or provider credentials.

The client posts JSON containing messages and siteContext, with content-type application/json and x-hb-session. The server must allow the deployed Pages origin through CORS (including POST and both headers), call its provider server-side, and return JSON with an answer string. Optional fenced JSON projects in the answer are parsed as data, validated, then offered as user-selected actions. Never publish provider keys in the repository or browser settings.

## Academy navigation and preferences

Existing destinations are grouped into Study & assessment, Design & simulation, Practical workshop, Reference & safety and AI assistance dropdowns. External resources contains all six reference sites and the existing portfolio links. Dashboard, progress and Settings remain directly accessible. Navigation remembers open sections. Settings offers profile, compact navigation, contrast, reduced motion, AI connection testing, timeout, learning/settings export/import and separate conversation/progress controls. Circuit project libraries retain their existing controls.

A persisted Reference view previously triggered a render before formula data initialized. Startup now waits until the script has initialized that data. The reference workspace also calls the academy renderer explicitly rather than its own local results renderer when restoring that view.

## Verification

Regression coverage includes all 20 promoted MCB conduct/trip/reset cases, every promoted two-terminal model solving, four three-way switch combinations with matching schematic/breadboard currents, unit-aware calculations, malformed assistant proposal rejection, preference validation and qualified breadboard parameter persistence. Browser checks cover actual Tutor-to-schematic and Adigun-to-breadboard import, live measurements, MCB placement, edited resistor placement, dropdowns and the AI service status.
