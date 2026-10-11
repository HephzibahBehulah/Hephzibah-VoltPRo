# VoltPRo Simulator

VoltPRo Simulator is the interactive simulation workspace for VoltPRo Academy.

## Current capabilities
- Browser-only schematic canvas with drag/drop components.
- Pin-to-pin wiring and editable component properties.
- DC educational engine with live current/voltage/resistance/continuity readings.
- Switch, source, resistor, lamp, LED, motor, heater, fuse and breaker models. Breakers and fuses use configurable simplified instantaneous overcurrent pickup and latch open after a trip; this is educational behavior, not an IEC time-current curve.
- Balanced three-phase AC source with L1/L2/L3/N terminals, complex phasor MNA analysis, phase-neutral motor winding currents, and voltage-driven contactor poles.
- Ideal single-phase transformer with galvanically isolated windings and configurable turns ratio / primary-secondary voltage ratings. Winding resistance, magnetizing current, losses, saturation and inrush are not modeled; a 1 GΩ solver reference stabilizes floating secondary common-mode voltage.
- DC direct-on-line control circuits with normally-open/normally-closed pushbuttons, contactor auxiliary seal-in contacts, and stop-button drop-out.
- Three-phase thermal overload relay with current-threshold trip, latched 95/96 NC and 97/98 NO auxiliary contacts, and contactor drop-out through the control circuit.
- Four-pole automatic transfer switch with normal-source priority, voltage monitoring, emergency-source transfer, and break-before-make output paths.
- Executable PLC ladder logic with NO/NC contacts, parallel branches, seal-in circuits, SET/RESET coils, on-delay/off-delay/pulse timers, and up/down counters.
- A wired PLC controller with 24 V supply sensing, three electrically sensed digital inputs, four isolated relay outputs, and ladder scan co-simulation with the MNA engine.
- Run mode re-solves the circuit on a live 250 ms tick; Stop halts the loop. PLC timers advance with simulation ticks, and changing inputs can update relay outputs and contactor state without restarting analysis.
- Undo/redo, project persistence, `.voltpro` JSON export/import.
- Component registry designed for progressive expansion; two-terminal catalog motor variants resolve to a resistive electrical equivalent, and catalog MCB/MCCB/RCBO/fuse IDs resolve to protective paths with ratings inferred from their model IDs when generic defaults are present. Generic catalog motors do not calculate speed, torque, back-EMF, mechanical load or starting current; RCD leakage detection is not modeled.
- Explicit 1P/2P/3P/4P breaker pole paths and an ABB AUX-CB-11 front auxiliary contact block (1NO + 3NC).
- Arduino Uno R3 terminal map with shared GND, RESET, 5 V/ICSP VCC and I²C aliases.
- BB400 breadboard representation with 400 individually addressable holes, five-hole strips and four continuous power rails.
- Arduino `pinMode`, `digitalWrite`, `analogWrite` (DC-equivalent PWM), 5 V and 3.3 V rails drive real MNA branches. This is a deterministic static I/O interpreter, not a native compiler: conditional control flow, timed `loop()` execution, peripherals and full AVR behavior remain unsupported.
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
