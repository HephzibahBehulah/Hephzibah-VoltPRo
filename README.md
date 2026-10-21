# VoltPRo Academy

VoltPRo Academy is a free, open-source, browser-based electrical and electronics learning and simulation laboratory.

The project is being developed as a local-first alternative to subscription-based electrical training and control-panel simulation tools. The goal is to let students, technicians, engineers, makers, and educators build circuits, wire components, explore control logic, run simulations, study component behaviour, practise fault diagnosis, and save their work without requiring an account or subscription.

Project repository: https://github.com/HephzibahBehulah/Hephzibah-VoltPRo

Canonical production workspace: https://engineering.hephzibahbehulah.com/

- Simulator: https://engineering.hephzibahbehulah.com/simulator
- VoltProPLC: https://engineering.hephzibahbehulah.com/voltpro-plc/
- Breadboard Electronics: https://engineering.hephzibahbehulah.com/breadboard
- VoltPro ElectCAD: https://engineering.hephzibahbehulah.com/voltPro-ElectCAD/

The canonical production workspaces are served by the shared engineering platform. The legacy GitHub Pages URL is not the production source of truth; the repository's Pages workflow requires repository-level Pages enablement before its standalone deployment can succeed.

## Project status

VoltPRo is an active development project.

The current application already includes a browser-based simulation workspace, a structured component registry, schematic and panel workflows, a PLC learning workspace, a microcontroller workspace, component reference tools, project save/load/export, engineering calculations, challenges, fault-learning infrastructure, and offline/PWA support.

The component catalogue currently contains 768 structured records across 24 component families.

Important: the 768 catalogue records do not mean that 768 individual devices already have complete manufacturer-accurate electrical simulation models. VoltPRo deliberately distinguishes between catalogue/reference data and validated simulation behaviour. The core simulation engine and the most important device behaviours are being expanded incrementally.

## What VoltPRo is designed to provide

### Electrical and electronics simulation

VoltPRo provides a browser-based environment for creating and analysing educational electrical and electronic circuits.

Current simulation foundations include:

- DC operating-point analysis
- AC frequency-sweep analysis
- Backward-Euler transient analysis for supported RLC circuits
- Modified nodal analysis (MNA) based solving
- Voltage and current source handling
- Dependent sources
- Resistance and power calculations
- Component parameters
- Netlist and event information
- Local browser execution

The simulator is intended for education, experimentation, and engineering study. It is not a replacement for certified engineering software, manufacturer documentation, commissioning procedures, or electrical safety verification.

## Simulator workspaces

VoltPRo currently provides several connected workspaces:

| Workspace | Purpose |
| --- | --- |
| Schematic | Build and simulate electrical/electronic circuits |
| Panel | Arrange control-panel devices and DIN-rail equipment |
| PLC Logic | Practise ladder-style control logic |
| Microcontroller | Explore digital and microcontroller-oriented concepts |
| Reference | Search and study component information |

The interface is designed around one application rather than a collection of disconnected tools.

## Component library

VoltPRo uses a versioned component manifest and family-based databases under `components/`.

The current catalogue contains:

- 24 component families
- 768 structured component records
- Searchable component metadata
- Component categories
- Terminals
- Editable parameters
- Ratings
- Symbol metadata
- Panel metadata
- Electrical model metadata
- Behaviour metadata
- Fault-mode metadata
- Documentation metadata

Current component families include:

- Protection
- Switching
- Contactors
- Relays
- Motors
- Transformers
- Sensors
- Lighting
- Measurement
- Semiconductors
- Electronics
- PLC
- Automation
- Renewable energy
- KNX
- Industrial components
- Communication
- Wires
- Power
- Grounding
- Panel components
- Microcontrollers
- Loads
- Logic

The component registry loads the family databases into the browser and makes them available to the simulator and reference workbench.

## Component data and reference images

The repository also contains a collection of component datasets originating from Digi-Key catalogue exports. These datasets include structured CSV information and references to component images.

The current media integration covers datasets including:

- Capacitors
- Resistors
- Inductors
- Diodes
- Transistors
- Relays
- Circuit breakers
- Fuses and fuseholders
- Motors
- Stepper motors
- Transformers
- Power supplies
- Batteries
- Switches
- Potentiometers
- Multimeters
- LEDs
- Solar cells
- Sensors
- Cables
- Connectors
- Instrumentation and amplifiers
- Other electronic and electrical component categories

VoltPRo uses this information to improve component discovery and reference workflows.

Third-party catalogue data and images remain subject to their original terms and applicable rights. VoltPRo does not treat third-party catalogue material as VoltPRo-owned content.

## Control-panel and automation direction

A major development goal is a complete electrical control-panel simulation workflow.

The target architecture includes:

- MCBs and other protection devices
- RCD and RCBO concepts
- Fuses
- Isolators
- Emergency stops
- Pushbuttons
- Selector switches
- Limit switches
- Relays
- Contactors
- Auxiliary contacts
- Overload protection
- Motors
- Transformers
- Terminal blocks
- Busbars
- Power supplies
- Lamps and indicators
- Sensors
- Solenoids
- PLC inputs and outputs
- Measurement instruments

The panel workspace is being developed around real terminal relationships and electrical state propagation rather than simply displaying static component pictures.

## Component editing

Components can be inspected and edited from the simulator.

For supported component definitions, the inspector can expose parameters such as:

- Rated voltage
- Frequency
- Coil voltage
- Coil resistance
- Number of poles
- Auxiliary contacts
- Resistance
- Component-specific values
- Enabled/disabled state

Parameter values are stored with the project component instance.

As device models become more complete, these parameters are connected to the corresponding electrical and behavioural simulation logic.

## Wiring and topology

The simulator is designed around actual component terminals and circuit topology.

The development roadmap includes increasingly complete support for:

- Terminal-to-terminal wiring
- Multi-pin devices
- Electrical nets
- L1/L2/L3/N/PE concepts
- Wire labels and numbering
- DIN-rail placement
- Orthogonal wire routing
- Live electrical path indication
- Control-circuit and power-circuit separation

## Fault diagnosis and training

VoltPRo includes infrastructure for educational fault scenarios and guided troubleshooting.

The target fault-training environment covers cases such as:

- Open circuit
- Short circuit
- Open neutral
- Earth fault
- Phase loss
- Overload
- Blown fuse
- Tripped breaker
- Failed contact
- Stuck contact
- Contactor failure
- Sensor failure

The long-term objective is to let a learner observe symptoms, measure the circuit, identify the fault, repair it, reset the system, and receive a score or explanation.

## Guided learning

VoltPRo is intended to be more than a circuit drawing tool.

Planned and developing learning exercises include:

1. Basic DC circuits
2. Series and parallel circuits
3. Voltage and current measurement
4. Relay control
5. Contactor control
6. Direct-on-line motor starter
7. Emergency-stop circuits
8. Forward/reverse motor control
9. Star-delta concepts
10. Lighting control
11. Pump control
12. Transformer circuits
13. PLC motor control
14. Sensor-based automation
15. Fault diagnosis
16. Semiconductor and electronics experiments
17. Microcontroller experiments
18. Renewable-energy concepts
19. KNX and building-automation concepts

## PLC and digital development

The PLC workspace provides an educational environment for learning control logic.

The project is also developing digital and microcontroller capabilities, including:

- Digital inputs and outputs
- Logic states
- Timers
- PWM concepts
- ADC concepts
- Microcontroller-oriented experiments
- Automation logic

The PLC workspace should not be interpreted as a replacement for programming or executing proprietary PLC firmware.

## Project management

VoltPRo supports local project workflows including:

- New project
- Save
- Load
- Export
- Project persistence
- Component parameter persistence
- SVG export
- Browser-local operation

The project format is designed to make circuits portable and inspectable rather than locking users into an online service.

## Offline and PWA support

VoltPRo is designed as a Progressive Web App.

The simulator includes:

- Service-worker caching
- Local browser execution
- Offline-oriented assets
- Installable web-app architecture
- No mandatory account
- No subscription requirement

The exact availability of individual features while offline depends on whether their required assets have already been cached.

## Architecture

At a high level, VoltPRo follows this model:

```
Component Library
       |
       v
Schematic / Panel / PLC / Microcontroller Workspaces
       |
       v
Typed Terminals and Circuit Topology
       |
       v
Netlist
       |
       v
Simulation Engine and Device Models
       |
       v
Electrical State and Behaviour
       |
       +----> Measurements
       |
       +----> Fault Analysis
       |
       +----> Visual Feedback
       |
       +----> Learning Challenges
       |
       +----> Project Export
```

The application is intentionally modular so that the component catalogue, simulation engine, UI, learning systems, panel tools, and future advanced simulation backends can evolve independently.

## Technology

VoltPRo is primarily built with browser-native technologies:

- HTML
- CSS
- JavaScript
- SVG
- JSON
- Progressive Web App technologies
- Node.js for validation and automated tests

The project does not require a heavy frontend framework for the current simulator.

## Quality and validation

The repository includes automated validation for:

- JavaScript syntax
- Simulation-engine behaviour
- Platform functionality
- Component database structure
- Component media integration
- Project-format validation
- PWA manifest validation

The standard test command is:

```bash
npm test
```

The repository currently targets Node.js 22 or newer for development validation.

## Open-source and licensing approach

VoltPRo Academy is distributed under the Apache License 2.0.

The project may evaluate or integrate compatible open-source technologies when they provide meaningful simulation capabilities. Each external dependency or borrowed implementation must be reviewed for licence compatibility before incorporation.

Potential technologies for future evaluation include:

- Circuit simulation engines
- WebAssembly simulation backends
- SPICE-compatible approaches
- Digital logic engines
- Microcontroller and processor emulation

Open-source projects are not copied into VoltPRo simply because they provide useful functionality. Their licences and attribution requirements must be respected.

## WireONa-inspired product direction

WireONa has been used as a functional reference for the type of user experience VoltPRo is intended to achieve, particularly:

- Control-panel design
- Component arrangement
- Terminal wiring
- Electrical simulation
- PLC logic
- Practical learning workflows

VoltPRo is not intended to copy WireONa's proprietary implementation, private APIs, protected assets, or commercial service.

The objective is to independently implement comparable educational workflows while keeping VoltPRo free, open source, local-first, and under the project's own architecture and licensing.

## Current development priorities

The major engineering priorities are:

1. Expand real electrical behaviour for contactors, relays, switches, protection devices, motors, sensors, and loads.
2. Connect component contacts and terminals directly to circuit topology.
3. Improve live electrical-state visualisation.
4. Add complete panel wiring workflows.
5. Add automatic wire routing and terminal numbering.
6. Improve measurement instruments.
7. Expand fault injection and diagnostic scenarios.
8. Build complete guided control-panel laboratories.
9. Improve AC and transient visualisation.
10. Expand validated component models.
11. Evaluate advanced simulation backends where licence-compatible.
12. Improve digital, PLC, microcontroller, and automation simulation.
13. Expand responsive and offline support.
14. Continue automated regression testing across the simulator.

## Safety and engineering disclaimer

VoltPRo is an educational simulator.

Simulation results must not be treated as proof that a real electrical installation, control panel, machine, component, or protection system is safe.

For real installations:

- Follow applicable electrical regulations and standards.
- Use manufacturer specifications and datasheets.
- Apply appropriate protection and isolation procedures.
- Have qualified personnel verify designs and installations.
- Perform the required physical tests and measurements.

VoltPRo does not provide electrical certification or safety approval.

## Contributing

Contributions are welcome.

Before submitting changes:

1. Understand the existing simulator architecture.
2. Keep component definitions structured and consistent.
3. Do not add third-party assets without checking their rights and licence.
4. Add or update tests when changing behaviour.
5. Run the validation suite.
6. Document significant architectural changes.
7. Avoid claiming that an educational model is manufacturer-accurate unless it has been properly validated.

See `CONTRIBUTING.md` and the documentation under `docs/` for project-specific guidance.

## Documentation

Important project documentation includes:

- `docs/WIREONA-PARITY-PLAN.md`
- `docs/COMPONENT_DEVELOPMENT.md`
- `docs/SIMULATION_MODEL_GUIDE.md`
- `docs/SYMBOL_GUIDE.md`
- `docs/PLATFORM-INTEGRATION.md`
- `docs/PHASE-1-STABILISATION-REPORT.md`
- `docs/DEMO-PROJECT-LIBRARY.md` — 100 guided educational demo variants

## Quick start

### Use the hosted simulator

Open:

https://hephzibahbehulah.github.io/VoltPRo-Academy/simulator.html

No account or subscription is required.

### Run locally

Clone the repository and open `simulator.html` in a local web environment.

For development validation:

```bash
npm install
npm test
```

A local HTTP server is recommended when testing service-worker and PWA behaviour.

## Project vision

VoltPRo Academy is being built toward one clear goal:

> A free, open-source, practical electrical and electronics laboratory that lets people build, simulate, measure, troubleshoot, learn, and experiment directly in the browser.

The long-term product is not simply a schematic editor and not simply a component catalogue. It is intended to become a complete learning and experimentation environment covering electrical circuits, electronics, industrial control, automation, PLC logic, microcontrollers, renewable energy, building automation, measurement, and fault diagnosis.

VoltPRo remains under active development, and individual component models should be considered educational until their behaviour has been independently validated.
