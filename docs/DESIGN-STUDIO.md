# Engineering design studio and AI deployment

The Tutor and Adigun use the same design/import actions. The dedicated Cloudflare Worker serves open-ended requests with Workers AI (@cf/openai/gpt-oss-120b); local tools cover checked calculations and supported sketches. Settings permits a custom endpoint and connection testing. The default service is https://voltpro-engineering-ai.hephzibah-behulah.workers.dev/chat. GET /health reports configuration availability; a successful health response alone does not test inference.

## Review and revision

Ask for an LM317 regulator, preview its actual connected schematic, inspect engineering checks, connections and SPICE, revise input/output/load values and import to either workspace. Existing work is saved before assistant replacement. Other connected AI designs are parsed as data and validated against known component contracts and terminal indexes. Unknown models are rejected; unsupported breadboard conversion is disabled. Think deeper forwards the previous design and supported part contracts to the connected AI service. Generated designs still require electrical review and measurements.

The LM317 template has 15 components, 25 explicit connections, correct TO-220 pin order (1 ADJ, 2 OUT/tab, 3 IN), named nets and protection diode orientations. The model regulates OUT–ADJ, conserves pass current and limits output by configured headroom. It does not implement thermal shutdown, SOA or current limiting. A 12 V input after a series diode cannot guarantee 10 V at 1 A with conservative 3 V regulator headroom. A free 5 kohm adjustment with 240 ohm R1 exceeds the requested adjustment range. The 12 ohm / 5 W load is overloaded at 10 V. These constraints are visible in the proposal review.

SPICE export uses standard R/C/L/V/I/diode devices and an explicitly educational behavioral LM317 subcircuit. Unsupported device models produce a clear export error. Node names and numbered component pins are exported separately. Structural and model tests run in Node; this release has not been numerically certified with an external ngspice installation.

## Canvas and physical workspaces

The existing toolbar now has a Draw menu for educational components, routed wires and custom-symbol drawing. Choose a part and click or drag on the canvas to place/orient it. Existing wire waypoints, selection and undo remain available. Live view controls voltage glow, signed current particles, hover values and particle speed. Reactive captures remain marked RESPONSE REPLAY; DC paths use solved voltages and currents. Reduced-motion preferences suppress animation.

Breadboard categories include five interpreted board targets: Uno R3 virtual header adapter, Nano, Pico, Pico 2 and ESP32 DevKitC. Original vector PCB drawings show the mapped terminals; they do not claim manufacturer-exact artwork. The Uno adapter's two-row jumper layout is virtual, not the physical shield header geometry. The legacy Arduino footprint remains available. GPIO code, serial output and DC network scans operate through the bounded teaching interpreter; native CPU binaries, PIO, wireless stacks, USB peripherals and full SDKs are not emulated. Raspberry Pi 5 remains a reference header.

The Code toolbar opens the selected board's firmware editor; Serial displays interpreted print output. Running a supported MCU uses retained 60 ms GPIO/network scans, with the most recent 600 scope samples. Passive circuits retain transient capture playback. Reset clears interpreted state. Components can be dragged from the parts list onto tie points. File groups the existing New, Import and Export actions; Save and Projects remain visible.

## Cloudflare deployment

The Worker source is server/voltpro-ai-worker.mjs. Root wrangler.jsonc and server/wrangler.toml configure the same service, AI binding and API_LIMITER binding (six requests / minute). Deploy from the repository root with Wrangler using the root configuration. The actual service was deployed into the user's Cloudflare account and tested with a non-template Wheatstone bridge inference request. No model API key is required by this configuration, and no credentials belong in browser settings or source control.

The backend checks allowed origins, JSON/body/message limits and the per-IP limiter. Model output is returned as text, without running generated code or privileged tools. Availability depends on Cloudflare's service/account quotas; a CORS origin allowlist and rate limiter are not user authentication. GitHub Pages serves the browser application independently of Worker availability.

Cloudflare Builds is connected to HephzibahBehulah/Hephzibah-VoltPRo, production branch main, repository root /. Its build command is npm test and deployment command is npx wrangler deploy. Preview builds and build caching are disabled. The existing Cloudflare GitHub connection and build token are reused. GitHub Pages continues through the existing GitHub Actions workflows.
