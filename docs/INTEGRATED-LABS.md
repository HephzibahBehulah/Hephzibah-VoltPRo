# Integrated live laboratories

This release extends the existing navigation rather than replacing it.

- Experiments contains 10,000 distinct, editable parameter variants across 20 circuit topologies. Search, filter, open, download and direct experiment links work in the simulator and academy workbench. These are not 10,000 different circuit topologies.
- The academy dashboard computes an RC circuit response, displays voltage/current and plots its response. Its controls open the same circuit in the simulator. Learning Path, Knowledge Checks, Exam Practice and Reference connect to the practical tools in English.
- Default schematic view uses original vector symbols. Device view remains an explicit alternative. Power resistor resistance and wattage rating are separate properties.
- Wire drawing accepts successive waypoints, Tab changes the first routing axis, Backspace removes the last waypoint, and double-click finishes at an explicit junction. Selected wire properties support free-direction routes, endpoint reconnection and draggable bend handles. Geometric crossings alone do not make an electrical connection.
- Live DC wire displays use solved node voltage and signed branch current with KCL at junctions. Ideal-wire loops with non-unique current division are marked indeterminate. Reactive/AC animation is labelled RESPONSE REPLAY and replays a newly calculated transient capture when circuit parameters change.
- PLC Logic supports OR branches, editable contacts/coils, edges, analog comparisons, timers, counters, program storage and JSON interchange. Applying a program uses the existing physical PLC model's three inputs and four outputs.
- The MCU editor runs a bounded parsed Arduino teaching subset: variables, arithmetic, conditional logic, ADC, PWM average voltage, millis, delay and Serial. Six projects create actual resistor/LED/button/sensor connections on the schematic. This does not emulate full AVR firmware, interrupts, external libraries or peripheral buses. Unsupported instructions report an error.
- Breadboard includes three-terminal transistor switch models, a five-terminal changeover relay and a four-terminal tactile button, with terminal tables and editable parameters. Transistors use educational switching models, not manufacturer analog models. Reference-only IC packages remain explicitly marked.
- New, Clear canvas, named browser projects, imports and exports remain in the existing project controls. Export files for portable storage; browser projects are local to the browser.
- All six reference websites are available in the external resources section.

Validation includes all 10,000 variant solves, circuit round trips, transient captures, signed current direction, route persistence, PLC state and comparisons, MCU timing/ADC/PWM, and all six wired MCU projects through canonical net collapse. Browser checks cover live DC, MCU full-scale ADC, wired PWM current, PLC seal-in, breadboard pin placement and the English dashboard.
