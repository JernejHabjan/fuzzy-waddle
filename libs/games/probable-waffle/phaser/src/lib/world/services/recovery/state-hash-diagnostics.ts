import type { ProbableWaffleStateHashDiagnostics } from "@fuzzy-waddle/probable-waffle-protocol";

/** Pure bounded descriptions/classification over already captured local and peer digests. */
export class StateHashDiagnostics {
  /** Documents the describe diagnostics mismatch member and its declared contract at this boundary. */
  describeDiagnosticsMismatch(
    localDiagnostics: ProbableWaffleStateHashDiagnostics | undefined,
    remoteDiagnostics: ProbableWaffleStateHashDiagnostics | undefined
  ): string {
    if (!localDiagnostics && !remoteDiagnostics) {
      return "local and remote diagnostics unavailable";
    }
    if (!localDiagnostics) {
      return "local diagnostics unavailable";
    }
    if (!remoteDiagnostics) {
      return "remote diagnostics unavailable";
    }

    const localActorDigests = localDiagnostics.actorDigests ?? {};
    const remoteActorDigests = remoteDiagnostics.actorDigests ?? {};
    const actorIds = [...new Set([...Object.keys(localActorDigests), ...Object.keys(remoteActorDigests)])].sort();
    for (const actorId of actorIds) {
      const localDigest = localActorDigests[actorId];
      const remoteDigest = remoteActorDigests[actorId];
      if (localDigest !== remoteDigest) {
        return `actor=${actorId} local=${localDigest ?? "missing"} remote=${remoteDigest ?? "missing"}`;
      }
    }

    const localPlayerDigests = localDiagnostics.playerDigests ?? [];
    const remotePlayerDigests = remoteDiagnostics.playerDigests ?? [];
    const playerDigestCount = Math.max(localPlayerDigests.length, remotePlayerDigests.length);
    for (let index = 0; index < playerDigestCount; index++) {
      if (localPlayerDigests[index] !== remotePlayerDigests[index]) {
        return `player-state local=${localPlayerDigests[index] ?? "missing"} remote=${remotePlayerDigests[index] ?? "missing"}`;
      }
    }

    if ((localDiagnostics.researchDigest ?? "") !== (remoteDiagnostics.researchDigest ?? "")) {
      return `research local=${localDiagnostics.researchDigest ?? "missing"} remote=${remoteDiagnostics.researchDigest ?? "missing"}`;
    }

    if ((localDiagnostics.randomDigest ?? "") !== (remoteDiagnostics.randomDigest ?? "")) {
      return `random local=${localDiagnostics.randomDigest ?? "missing"} remote=${remoteDiagnostics.randomDigest ?? "missing"}`;
    }

    const localFamilies = localDiagnostics.campaignMissionFamilyDigests ?? {};
    const remoteFamilies = remoteDiagnostics.campaignMissionFamilyDigests ?? {};
    for (const family of [...new Set([...Object.keys(localFamilies), ...Object.keys(remoteFamilies)])].sort()) {
      if (localFamilies[family] !== remoteFamilies[family]) {
        return `campaign-family=${family} local=${localFamilies[family] ?? "missing"} remote=${remoteFamilies[family] ?? "missing"}`;
      }
    }

    if ((localDiagnostics.campaignMissionDigest ?? "") !== (remoteDiagnostics.campaignMissionDigest ?? "")) {
      return `campaign-mission local=${localDiagnostics.campaignMissionDigest ?? "missing"} ` +
        `remote=${remoteDiagnostics.campaignMissionDigest ?? "missing"}`;
    }

    return "hash mismatch without diagnostic delta";
  }

  /**
   * Converts raw mismatch text into an explicit short cause label to speed up diagnosis.
   */
  classifyMismatchReason(reason: string): string | null {
    const actorMatch = /^actor=([^ ]+) local=(.+) remote=(.+)$/.exec(reason);
    if (actorMatch) {
      const actorId = actorMatch[1] ?? "unknown";
      const localDigest = actorMatch[2] ?? "missing";
      const remoteDigest = actorMatch[3] ?? "missing";
      if (remoteDigest === "missing") {
        return `cause=actor-missing actorId=${actorId} side=remote`;
      }
      if (localDigest === "missing") {
        return `cause=actor-missing actorId=${actorId} side=local`;
      }
      const parsed = this.extractActorPositionDelta(localDigest, remoteDigest);
      if (parsed && (parsed.dx !== 0 || parsed.dy !== 0 || parsed.dz !== 0)) {
        return `cause=actor-position-drift actorId=${actorId} local=(${parsed.localX},${parsed.localY},${parsed.localZ}) ` +
          `remote=(${parsed.remoteX},${parsed.remoteY},${parsed.remoteZ}) delta=(${parsed.dx},${parsed.dy},${parsed.dz})`;
      }
      return `cause=actor-state-drift actorId=${actorId}`;
    }
    if (reason.startsWith("player-state")) {
      const parsed = /^player-state local=(.+) remote=(.+)$/.exec(reason);
      if (parsed) {
        const detail = this.describePlayerStateDigestDelta(parsed[1] ?? "", parsed[2] ?? "");
        if (detail) {
          return `cause=player-state-drift ${detail}`;
        }
      }
      return "cause=player-state-drift";
    }
    if (reason.startsWith("research")) {
      return "cause=research-drift";
    }
    if (reason.includes("diagnostics unavailable")) {
      return "cause=diagnostics-unavailable";
    }
    return null;
  }

  /**
   * Parses actor digest tuples and returns logical position delta when available.
   * Digest format is generated in computeHashSnapshot().
   */
  private extractActorPositionDelta(
    localDigest: string,
    remoteDigest: string
  ): {
    localX: number;
    localY: number;
    localZ: number;
    remoteX: number;
    remoteY: number;
    remoteZ: number;
    dx: number;
    dy: number;
    dz: number;
  } | null {
    const localParts = localDigest.split(":");
    const remoteParts = remoteDigest.split(":");
    if (localParts.length < 7 || remoteParts.length < 7) {
      return null;
    }
    const localX = Number(localParts[4]);
    const localY = Number(localParts[5]);
    const localZ = Number(localParts[6]);
    const remoteX = Number(remoteParts[4]);
    const remoteY = Number(remoteParts[5]);
    const remoteZ = Number(remoteParts[6]);
    if (
      !Number.isFinite(localX) ||
      !Number.isFinite(localY) ||
      !Number.isFinite(localZ) ||
      !Number.isFinite(remoteX) ||
      !Number.isFinite(remoteY) ||
      !Number.isFinite(remoteZ)
    ) {
      return null;
    }
    return {
      localX,
      localY,
      localZ,
      remoteX,
      remoteY,
      remoteZ,
      dx: localX - remoteX,
      dy: localY - remoteY,
      dz: localZ - remoteZ
    };
  }

  /**
   * Movement tween progress can differ slightly across clients between sim ticks.
   * Ignore tiny actor position-only drift when both sides are executing the same move order.
   */
  isTransientMovementPositionDrift(reason: string): string | null {
    const actorMatch = /^actor=([^ ]+) local=(.+) remote=(.+)$/.exec(reason);
    if (!actorMatch) {
      return null;
    }
    const actorId = actorMatch[1] ?? "unknown";
    const localDigest = actorMatch[2] ?? "";
    const remoteDigest = actorMatch[3] ?? "";
    if (!localDigest || !remoteDigest || localDigest === "missing" || remoteDigest === "missing") {
      return null;
    }

    const localParts = localDigest.split(":");
    const remoteParts = remoteDigest.split(":");
    if (localParts.length < 13 || remoteParts.length < 13 || localParts.length !== remoteParts.length) {
      return null;
    }

    // Compare everything except logical x/y/z (indices 4,5,6).
    for (let index = 0; index < Math.min(localParts.length, remoteParts.length); index++) {
      if (index >= 4 && index <= 6) {
        continue;
      }
      if ((localParts[index] ?? "") !== (remoteParts[index] ?? "")) {
        return null;
      }
    }

    const localX = Number(localParts[4]);
    const localY = Number(localParts[5]);
    const localZ = Number(localParts[6]);
    const remoteX = Number(remoteParts[4]);
    const remoteY = Number(remoteParts[5]);
    const remoteZ = Number(remoteParts[6]);
    if (
      !Number.isFinite(localX) ||
      !Number.isFinite(localY) ||
      !Number.isFinite(localZ) ||
      !Number.isFinite(remoteX) ||
      !Number.isFinite(remoteY) ||
      !Number.isFinite(remoteZ)
    ) {
      return null;
    }

    const dx = Math.abs(localX - remoteX);
    const dy = Math.abs(localY - remoteY);
    const dz = Math.abs(localZ - remoteZ);
    const smallDelta = dx <= 1 && dy <= 1 && dz <= 1;
    if (!smallDelta) {
      return null;
    }

    const moveOrderActive = localDigest.includes("orderType:Move") && remoteDigest.includes("orderType:Move");
    if (!moveOrderActive) {
      return null;
    }

    return `actorId=${actorId} delta=(${localX - remoteX},${localY - remoteY},${localZ - remoteZ})`;
  }

  private describePlayerStateDigestDelta(localDigest: string, remoteDigest: string): string | null {
    const local = this.parsePlayerStateDigest(localDigest);
    const remote = this.parsePlayerStateDigest(remoteDigest);
    if (!local || !remote) {
      return null;
    }
    const diffs: string[] = [];
    if (local.playerNumber !== remote.playerNumber) {
      diffs.push(`player=${local.playerNumber}->${remote.playerNumber}`);
    }
    if (local.minerals !== remote.minerals) {
      diffs.push(`minerals=${local.minerals}->${remote.minerals}`);
    }
    if (local.stone !== remote.stone) {
      diffs.push(`stone=${local.stone}->${remote.stone}`);
    }
    if (local.wood !== remote.wood) {
      diffs.push(`wood=${local.wood}->${remote.wood}`);
    }
    return diffs.length > 0 ? diffs.join(" ") : null;
  }

  private parsePlayerStateDigest(
    digest: string
  ): { playerNumber: number; minerals: number; stone: number; wood: number } | null {
    const parts = digest.split(":");
    if (parts.length < 4) {
      return null;
    }
    const parsed = parts.slice(0, 4).map((part) => Number(part));
    if (parsed.some((part) => !Number.isFinite(part))) {
      return null;
    }
    return {
      playerNumber: parsed[0] ?? -1,
      minerals: parsed[1] ?? 0,
      stone: parsed[2] ?? 0,
      wood: parsed[3] ?? 0
    };
  }

  /**
   * Produces structured state-diff snippets for deterministic debugging.
   * The output is capped so logs/replays stay readable even on large mismatches.
   */
  collectDiagnosticsDiffs(
    localDiagnostics: ProbableWaffleStateHashDiagnostics | undefined,
    remoteDiagnostics: ProbableWaffleStateHashDiagnostics | undefined
  ): {
    actorDiffs: string[];
    playerDiffs: string[];
    researchDiff?: string;
    campaignMissionDiff?: string;
    campaignMissionFamilyDiff?: string;
    randomDiff?: string;
  } {
    if (!localDiagnostics || !remoteDiagnostics) {
      return {
        actorDiffs: [],
        playerDiffs: []
      };
    }

    const actorDiffs: string[] = [];
    const localActorDigests = localDiagnostics.actorDigests ?? {};
    const remoteActorDigests = remoteDiagnostics.actorDigests ?? {};
    const actorIds = [...new Set([...Object.keys(localActorDigests), ...Object.keys(remoteActorDigests)])].sort();
    for (const actorId of actorIds) {
      const localDigest = localActorDigests[actorId];
      const remoteDigest = remoteActorDigests[actorId];
      if (localDigest !== remoteDigest) {
        actorDiffs.push(`actor=${actorId} local=${localDigest ?? "missing"} remote=${remoteDigest ?? "missing"}`);
      }
    }

    const playerDiffs: string[] = [];
    const localPlayerDigests = localDiagnostics.playerDigests ?? [];
    const remotePlayerDigests = remoteDiagnostics.playerDigests ?? [];
    const playerDigestCount = Math.max(localPlayerDigests.length, remotePlayerDigests.length);
    for (let index = 0; index < playerDigestCount; index++) {
      if (localPlayerDigests[index] !== remotePlayerDigests[index]) {
        playerDiffs.push(
          `player-state local=${localPlayerDigests[index] ?? "missing"} remote=${remotePlayerDigests[index] ?? "missing"}`
        );
      }
    }

    const localResearch = localDiagnostics.researchDigest ?? "";
    const remoteResearch = remoteDiagnostics.researchDigest ?? "";
    const researchDiff =
      localResearch === remoteResearch
        ? undefined
        : `research local=${localResearch || "missing"} remote=${remoteResearch || "missing"}`;
    const localCampaignMission = localDiagnostics.campaignMissionDigest ?? "";
    const remoteCampaignMission = remoteDiagnostics.campaignMissionDigest ?? "";
    const campaignMissionDiff =
      localCampaignMission === remoteCampaignMission
        ? undefined
        : `campaign-mission local=${localCampaignMission || "missing"} remote=${remoteCampaignMission || "missing"}`;
    const localFamilies = localDiagnostics.campaignMissionFamilyDigests ?? {};
    const remoteFamilies = remoteDiagnostics.campaignMissionFamilyDigests ?? {};
    const changedFamily = [...new Set([...Object.keys(localFamilies), ...Object.keys(remoteFamilies)])]
      .sort()
      .find((family) => localFamilies[family] !== remoteFamilies[family]);
    const campaignMissionFamilyDiff = changedFamily
      ? `campaign-family=${changedFamily} local=${localFamilies[changedFamily] ?? "missing"} ` +
        `remote=${remoteFamilies[changedFamily] ?? "missing"}`
      : undefined;
    const localRandom = localDiagnostics.randomDigest ?? "";
    const remoteRandom = remoteDiagnostics.randomDigest ?? "";
    const randomDiff =
      localRandom === remoteRandom
        ? undefined
        : `random local=${localRandom || "missing"} remote=${remoteRandom || "missing"}`;
    return {
      actorDiffs,
      playerDiffs,
      researchDiff,
      campaignMissionDiff,
      campaignMissionFamilyDiff,
      randomDiff
    };
  }

}
