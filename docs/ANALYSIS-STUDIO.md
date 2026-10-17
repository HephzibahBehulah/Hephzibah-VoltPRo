# Analysis Studio

This release extends VoltPRo's original browser-native MNA engine. No source code,
screenshots, device models or assets from the four commercial/reference products
were copied into this release. Existing third-party asset credits remain in place.

## Using the workbench

- Select **Experiments** for a wired voltage divider, RC charging circuit,
  low-pass filter or switched LED. Replacing an occupied canvas requires confirmation.
- **Run** updates the operating point every 250 ms. **Stop** freezes these updates;
  **Step** stops continuous updates and solves one operating point. K toggles Run/Stop.
- Choose **Device view** to switch basic schematic symbols to the existing device views.
- Select a source or resistor to adjust its value with an inspector slider. Select a
  switch for an Open/Close control. Editing remains part of the undo history.
- Open **Analysis** to select a two-terminal probe and secondary channel. Both channels
  measure voltage across the component's terminals, not arbitrary numbered solver nodes.
- **Time** captures 512 backward-Euler intervals, starting with zero reactive energy.
  Change the time window to study a different timescale. Captures are recomputed after
  circuit changes; they are not a continuously advancing oscilloscope acquisition.
- **Bode** plots voltage transfer magnitude in dB and phase in degrees relative to one
  independent voltage source. It is intended for linear RLC networks; the UI rejects
  several nonlinear device families rather than presenting their result as small-signal analysis.
- **XY** plots primary probe voltage against secondary probe voltage.
- **Spectrum** uses a single-sided Hann-windowed DFT with DC removed (up to 128 bins).
  Bin spacing and Nyquist frequency are shown. This is a sampled spectrum, not an
  assertion that the source frequency can be resolved below the capture's bin spacing.
- **DC sweep** varies a selected resistor or source and plots total source current.
- Move over a plot to inspect its nearest sample. **CSV** exports the displayed primary
  trace; **Reset state** clears component runtime states and captures from zero energy.

## Electrical visualization

While Run is active, wires use solved terminal voltage: positive green, negative red,
ground grey. Animated dots mark a path connected to a conducting branch. Individual
ideal-wire currents are not uniquely measured by this visualization; dot speed and
direction are decorative and do not report amperage. Reduced-motion preferences disable
the animation. DC colors represent the operating point, not transient snapshot values.

## Engine corrections and scope

The transient capacitor stamp now includes its previous voltage; the inductor history
stores accumulated current with the correct Norton-source orientation. AC voltage
sources are sampled at circuit time during transient runs. Nonlinear transient solves
re-linearize without advancing reactive history and report failure to converge.

The engine still uses educational simplified models. This release does not add full
SPICE compatibility, firmware emulation, universal nonlinear AC linearization, adaptive
time stepping, acquisition triggers, arbitrary differential terminal probes, a complete
19-language translation set, or manufacturer-certified component models. Existing panel,
PLC, MCU and breadboard capabilities remain their separate workspaces. Catalogue size
does not imply that every catalogue item supports every analysis.

## Verification

`npm test` includes analytic RC/RL transient comparisons, signed sinusoidal samples,
low-pass cutoff magnitude/phase, terminal voltage mapping, invalid transient options,
DFT peak amplitude, CSV export and the simulator startup regression. Browser checks cover
the integrated workbench and existing linked workspaces. The GitHub Pages deployment
continues through the existing main-branch workflow.

Project round-trip conversion now prioritizes exact terminal IDs over displayed pin
labels, removes canonical endpoint aliases from legacy wires, and avoids double-mapping
numeric IDs. Repeated save/load regression checks run with the real terminal graph.
