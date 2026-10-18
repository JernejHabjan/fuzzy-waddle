import { webcrypto } from "node:crypto";
import { TestBed } from "@angular/core/testing";
import type { ProbableWaffleGameInstanceData } from "@fuzzy-waddle/probable-waffle-protocol";
import { GameSaveCodecService } from "./game-save-codec.service";

describe("GameSaveCodecService", () => {
  const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");

  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto as unknown as Crypto
    });
  });

  afterAll(() => {
    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", originalCrypto);
    }
  });

  it("round-trips game instance data", async () => {
    const service = TestBed.inject(GameSaveCodecService);
    const data = { players: [] } as unknown as ProbableWaffleGameInstanceData;

    const encoded = await service.encode(data);

    await expect(service.decode(encoded)).resolves.toEqual(data);
  });
});
