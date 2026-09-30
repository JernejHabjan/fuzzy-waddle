import type { TestInfo } from "@playwright/test";
import type { MultiplayerPeerObservation } from "./skirmish-ai-multiplayer-observation";

/** Credential-free, bounded failure record; browser storage and bearer tokens are never serialized. */
export async function attachMultiplayerEvidence(
  testInfo: TestInfo,
  evidence: {
    readonly lobbyName: string;
    readonly host: MultiplayerPeerObservation | null;
    readonly peer: MultiplayerPeerObservation | null;
    readonly peerBeforeTransfer?: MultiplayerPeerObservation | null;
    readonly checkpointComparisons: readonly { tick: number; agrees: boolean }[];
  }
): Promise<void> {
  await testInfo.attach("skirmish-multiplayer-peers.json", {
    body: Buffer.from(JSON.stringify({
      schemaVersion: 1,
      lobbyName: evidence.lobbyName,
      host: evidence.host,
      peer: evidence.peer,
      peerBeforeTransfer: evidence.peerBeforeTransfer,
      checkpointComparisons: evidence.checkpointComparisons.slice(-16)
    })),
    contentType: "application/json"
  });
}
