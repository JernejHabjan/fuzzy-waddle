/** Frozen workload authoring/dispatch; this module never starts a browser or infers expected results from a candidate. */
export function calibrationJobs(specification, seeds, phase, revision = "candidate") {
  const declared = specification.pairedRuns;
  if (!declared || declared.factions?.length !== 2 || declared.mapLabels?.length !== 2 || declared.opponentProfiles?.length !== 5 ||
      declared.minimumCompletedPairCountPerComparison !== 20 || declared.maximumPairCountWhenUncertain !== 100)
    throw new Error("calibration_declared_workload_drift");
  return seeds.flatMap((seed, index) => {
    const cell = phase === "holdout" ? specification.execution.holdoutCells[index] : index % 20;
    const faction = declared.factions[Math.floor(cell / 10)], mapLabel = declared.mapLabels[Math.floor(cell / 5) % 2];
    const opponentArchetype = declared.opponentProfiles[cell % 5];
    return [1, 2].flatMap((targetPlayerNumber) => (revision === "candidate" ? ["Easy", "Normal", "Hard"] : ["Legacy"])
      .map((difficulty) => ({ id: `${revision}-${phase}-${seed}-${targetPlayerNumber}-${difficulty.toLowerCase()}`,
        revision, phase, seed, faction, mapLabel, opponentArchetype, targetPlayerNumber, difficulty,
        maximumTick: specification.execution.maximumMatchTick })));
  });
}

/** Holdout never enters adaptive tuning. Extension seeds are declared before execution and cannot collide with either set. */
export function calibrationSeedRounds(specification) {
  const base = specification.pairedRuns.seeds, holdout = specification.pairedRuns.holdoutSeeds;
  const extension = specification.execution.uncertaintyExtension;
  if (base.length !== 20 || holdout.length !== 5 || extension.seedCount !== 80 || extension.batchSize !== 20 ||
      !Number.isSafeInteger(extension.firstSeed)) throw new Error("calibration_seed_declaration_drift");
  const extras = Array.from({ length: extension.seedCount }, (_, index) => extension.firstSeed + index);
  const all = [...base, ...holdout, ...extras];
  if (new Set(all).size !== all.length || all.some((seed) => !Number.isSafeInteger(seed) || seed < 0))
    throw new Error("calibration_seeds_overlap_or_invalid");
  const cells = specification.execution.holdoutCells;
  if (!Array.isArray(cells) || cells.length !== 5 || cells.some((cell) => !Number.isSafeInteger(cell) || cell < 0 || cell >= 20) ||
      new Set(cells.map((cell) => cell % 5)).size !== 5 || new Set(cells.map((cell) => Math.floor(cell / 10))).size !== 2 ||
      new Set(cells.map((cell) => Math.floor(cell / 5) % 2)).size !== 2) throw new Error("calibration_holdout_cells_incomplete");
  return [base, ...Array.from({ length: 4 }, (_, index) => extras.slice(index * 20, (index + 1) * 20))];
}

export function calibrationSoakJobs(specification) {
  return specification.execution.soaks.map((soak, index) => ({ id: `candidate-soak-${soak.seed}`, revision: "candidate",
    phase: "soak", seed: soak.seed, faction: specification.pairedRuns.factions[index % 2],
    mapLabel: specification.pairedRuns.mapLabels[index % 2], opponentArchetype: "balanced", targetPlayerNumber: 2,
    difficulty: ["Easy", "Normal", "Hard"][index], maximumTick: soak.simulationTicks }));
}
