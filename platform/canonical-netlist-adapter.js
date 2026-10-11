/* Canonical topology adapter for the legacy MNA engine.
 * External connectivity is collapsed once by VoltProCanonicalProject.resolveNets().
 * The engine receives stable net IDs as pin identities and no external wires, so it
 * cannot independently infer a different wire topology.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VoltProCanonicalNetlistAdapter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function toSolverProject(project, canonicalApi) {
    const P = canonicalApi || (typeof globalThis !== "undefined" && globalThis.VoltProCanonicalProject);
    if (!P || typeof P.validate !== "function" || typeof P.resolveNets !== "function") {
      throw new Error("Canonical project API is required to build the solver input");
    }

    const validation = P.validate(project);
    if (!validation.valid) {
      const error = new Error("Cannot build solver input from an invalid canonical project");
      error.validation = validation;
      throw error;
    }

    const nets = P.resolveNets(project);
    const terminalToNet = new Map();
    for (const net of nets) {
      for (const key of net.members) terminalToNet.set(key, net.id);
    }

    const components = project.devices.map(device => {
      const pins = device.terminals.map(terminal => {
        const key = P.terminalKey(device.id, terminal.id);
        const netId = terminalToNet.get(key);
        if (!netId) throw new Error("Resolved net missing for terminal " + key);
        return netId;
      });
      return {
        id: device.id,
        type: device.type,
        model: device.type,
        name: device.label || device.id,
        pins,
        props: clone(device.parameters || {}),
        parameters: clone(device.parameters || {}),
        state: clone(device.operatingState || {}),
        modelVersion: device.modelVersion,
        canonicalTerminalKeys: device.terminals.map(t => P.terminalKey(device.id, t.id))
      };
    });

    return {
      components,
      // All external wire connectivity is already represented by shared net IDs.
      // An empty wire list prevents the MNA engine from performing a second union.
      wires: [],
      topology: {
        source: "canonical-project",
        formatVersion: project.formatVersion,
        nets: clone(nets),
        terminalToNet: Object.fromEntries(terminalToNet)
      }
    };
  }

  return { toSolverProject };
});
