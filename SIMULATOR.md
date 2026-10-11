# VoltPRo Simulator

VoltPRo Simulator is the interactive simulation workspace for VoltPRo Academy.

## Current capabilities
- Browser-only schematic canvas with drag/drop components.
- Pin-to-pin wiring and editable component properties.
- DC educational engine with live current/voltage/resistance/continuity readings.
- Switch, source, resistor, lamp, LED, motor, heater, fuse and breaker models. PT100/PT1000 RTDs use an IEC-style linear resistance approximation when temperature is set; NTC thermistors use a beta equation; LDRs use a configurable inverse light-level curve. Without a physical stimulus, their configured fixed resistance remains in effect. Breakers and fuses use configurable simplified instantaneous overcurrent pickup and latch open after a trip; this is educational behavior, not an IEC time-current curve. Catalog resistor/potentiometer, capacitor and inductor IDs use their encoded nominal values rather than generic placeholders; catalog silicon/Schottky diodes, LEDs and bridge rectifiers map to the engine diode branch. Passive NTCs use a beta curve and passive PTCs use a configurable thermal transition when temperature is supplied.
- Balanced three-phase AC source with L1/L2/L3/N terminals, complex phasor MNA analysis, phase-neutral motor winding currents, and voltage-driven contactor poles.
- Ideal single-phase transformer with galvanically isolated windings and configurable turns ratio / primary-secondary voltage ratings; 17 single-phase catalog transformer variants now expose four primary/secondary terminals. Selected 3-phase 400 V wye-wye catalog transformers now expose three secondary phases and an optional isolated 24 V auxiliary winding. Delta/vector-group shifts, VA limits, winding resistance, magnetizing current, losses, saturation and inrush are not modeled; a 1 GΩ solver reference stabilizes floating secondary common-mode voltage.
- DC direct-on-line control circuits with normally-open/normally-closed pushbuttons, contactor auxiliary seal-in contacts, and stop-button drop-out. Catalog contactor/relay coil pickup voltage is inferred from model IDs when no explicit coil voltage is configured; explicit ratings take precedence.
- Three-phase thermal overload relay with current-threshold trip, latched 95/96 NC and 97/98 NO auxiliary contacts, and contactor drop-out through the control circuit.
- Four-pole automatic transfer switch with normal-source priority, voltage monitoring, emergency-source transfer, and break-before-make output paths.
- Executable PLC ladder logic with NO/NC contacts, parallel branches, seal-in circuits, SET/RESET coils, on-delay/off-delay/pulse timers, and up/down counters.
- A wired PLC controller with 24 V supply sensing, three electrically sensed digital inputs, four isolated relay outputs, and ladder scan co-simulation with the MNA engine.
- Run mode re-solves the circuit on a live 250 ms tick; Stop halts the loop. PLC timers advance with simulation ticks, and changing inputs can update relay outputs and contactor state without restarting analysis.
- Undo/redo, project persistence, `.voltpro` JSON export/import.
- Component registry now includes functional multi-pole and auxiliary-only NO/NC contactor variants, selected relay variants, protective devices, NO/NC pushbuttons, emergency stops, 27 rated load variants, three rated fluorescent lamp variants, five color-specific catalog LEDs, and 22 configured sensor variants. RTD/NTC/LDR models support configured temperature/light-dependent resistance; selected discrete sensors can switch from state inputs or measured distance, pressure, flow, level and vibration thresholds. Sensors remain educational two-terminal models without general analog outputs, 3-wire powered output terminals, calibration/tolerance models or real-world response timing. Catalog BJT-NPN/PNP, N/P MOSFET, IGBT and JFET variants now expose three control/current terminals with simplified voltage-controlled switching behavior. The six two-input combinational gates and NOT now expose proper input/output terminals and drive electrical output voltages from solved logic-level inputs. Analog comparator and Schmitt-trigger variants also expose A/B/Y pins; the Schmitt model retains its previous output inside the configured hysteresis window. RS/D latches and D/T/JK flip-flops now expose true control/clock pins and Q/QB outputs; state persists across simulation ticks, with flip-flops triggered on rising clock edges.
- Catalog power modules include functional 5/12/24/48 V DC sources, selected single-phase AC sources, balanced 400/415 V three-phase sources with L1/L2/L3/N terminals, and pass-through DC/AC/neutral/earth bus components. Model-specific voltage values override generic catalog placeholders.
- Explicit 1P/2P/3P/4P breaker pole paths and an ABB AUX-CB-11 front auxiliary contact block (1NO + 3NC).
- Arduino Uno R3 terminal map with shared GND, RESET, 5 V/ICSP VCC and I²C aliases.
- BB400 breadboard representation with 400 individually addressable holes, five-hole strips and four continuous power rails.
- Arduino `pinMode`, `digitalWrite`, `analogWrite` (DC-equivalent PWM), 5 V and 3.3 V rails drive real MNA branches. A deterministic subset interpreter now advances sequential `digitalWrite`/`analogWrite` plus `delay()` loops across live simulation ticks. It is not a native compiler; nested/general C++ control flow, conditionals mixed with timed loops, interrupts, `analogRead`, peripherals and full AVR behavior remain unsupported.
- Schematic / Panel / Microcontroller workspace modes.
- No account, server or paid dependency is required.

## Project format
A `.voltpro` project contains `format`, `version`, `metadata`, `mode`, `components`, `wires` and `simulation`. Future versions must remain backward-compatible.

## Engineering boundary
This is an educational simulator. It is not a substitute for current IEC/DIN/VDE/NEC requirements, manufacturer instructions, design verification, inspection or qualified electrical work.

## Development roadmap
1. Expand the component registry into executable models.
2. Add full nodal/MNA analog solving and AC/transient analysis.
3. Add digital event simulation and MCU execution.
4. Add panel/DIN-rail layout, cable sizing and BOM.
5. Add SVG/PDF exports, PWA offline shell and multilingual content.
