# Engineering reference, board targets and panel review

The shared reference workspace opens from the existing simulator Reference mode and Component Library button, the academy Reference Library and the practical workbench. The existing Project Library menu also opens application templates. Formula and standards libraries, custom symbol drawing, old demo projects and the 10,000-variant experiment catalogue remain available.

## Real records and explicit capability

The bundled core now contains 52 curated definitions on a clean browser, plus optional legacy catalogue records. Custom browser definitions can increase that count. The manufacturer additions include onsemi 2N3904 in TO-92, ADI MAX485 PDIP-8, TI SN65HVD230 SOIC-8, Microchip MCP2515 PDIP-18 and ATECC608B SOIC-8. Each records a specific package and source, separate from model maturity. The 2N3904 uses the sourced E/B/C order and an explicitly simplified switching model; protocol and security ICs remain reference-only.

Search supports manufacturers, part numbers, functions, pins, domain, category and capability. Results are paginated. Numeric instance parameters can be edited before placement. Compatible leaded parts can be armed for placement on the breadboard; packages requiring an adapter are labelled accordingly. Reference-only parts never silently gain electrical behavior.

This release does not claim 100 million real components or 10 million complete applications. Those require authoritative licensed data ingestion, part/package deduplication, a hosted indexed catalogue, source/version tracking and a model qualification pipeline. A giant number of fabricated catalogue names would not meet that requirement.

## Additional MCU targets

Arduino Nano classic, Raspberry Pi Pico, Pico 2 and ESP32-DevKitC V4 WROOM-32E execute the bounded teaching sketch subset, with board-specific pin maps, voltage rails, ADC ranges and unavailable/input-only GPIO checks. Generated example circuits are adapted to each profile and solve through the canonical topology adapter. GPIO inputs outside the model voltage range report an error.

Raspberry Pi 5 is a 40-pin header reference. No Linux, Python process, RP1, Wi-Fi, Bluetooth, native CPU, PIO or peripheral protocol emulation is claimed. PWM remains an average-voltage model. Exact board variants matter; these profiles must not be applied to differently wired clones or board families.

## Eight complete application templates

Traffic sequence, crossing beacons, fire-alarm threshold trainer, car-park entry/exit counter, dusk lighting, temperature hysteresis, PLC pump-starter control and conveyor delayed start contain actual editable components, connections and programs. Adjustable voltage sources represent analog sensors; LEDs and resistive indicators represent controlled loads. They are educational control circuits, not certified alarm/traffic systems, calibrated field sensors, motor dynamics or safety controllers.

Opening an application saves the current simulator project first. Projects remain editable and exportable through existing project controls.

## Industrial panel improvements

The existing panel workspace gains rail-reserve metrics, entered device-loss estimates, assumed cabinet-loss budget comparison, placement review, source links, panel BOM CSV and terminal-labelled wire schedule CSV. Device losses and budget assumptions persist in the existing panel project data. The 24 V control project connects panel work to a runnable PLC schematic.

These checks do not certify IEC 60204-1, IEC 61439, IEC 60947, UL 508A, NFPA 79 or DIN/VDE conformity. Clearances, short-circuit ratings, temperature rise, protective bonding and current editions need appropriate engineering evidence. Aerospace study tags indicate relevant learning topics, not flight-qualified hardware.

## Verification

Regression tests cover all earlier experiments and models. Additional tests exercise four targets times six wired examples, ADC/PWM rails, input-only/flash GPIO rejection, overvoltage rejection, sourced transistor terminal mapping, all application solves, wired PLC start/hold/stop behavior, reference filters and panel documentation calculations. Browser checks cover library search and sources, actual breadboard terminal placement and undo, Pico 2 GPIO, application loading and panel budgets.
