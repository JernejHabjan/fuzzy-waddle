import { Howl } from "howler";
import { GameAudio } from "./game-audio";

jest.mock("./asset-paths", () => ({ assetUrl: (path: string) => path }));
jest.mock("howler", () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockReturnValue(1),
    volume: jest.fn().mockReturnValue(0.3),
    fade: jest.fn(),
    once: jest.fn(),
    stereo: jest.fn(),
    mute: jest.fn(),
    pause: jest.fn(),
    unload: jest.fn(),
    stop: jest.fn(),
    state: jest.fn().mockReturnValue("loaded"),
    playing: jest.fn().mockReturnValue(true)
  }))
}));

describe("Trump Defense positional audio", () => {
  beforeEach(() => jest.mocked(Howl).mockClear());

  it("keeps entry spawn cues audible from the default whole-map view", () => {
    const audio = new GameAudio();
    audio.play({ kind: "spawn", worldX: 0 }, 90);
    expect(Howl).not.toHaveBeenCalled();
    audio.play({ kind: "spawn", worldX: 0 }, 64);
    expect(Howl).toHaveBeenCalledTimes(1);
    const howl = jest.mocked(Howl).mock.results[0]?.value as jest.Mocked<Howl>;
    expect(howl.volume).toHaveBeenLastCalledWith(0.18, 1);
  });

  it("uses the original ground spawn and victory samples", () => {
    const audio = new GameAudio();
    audio.play({ kind: "spawn", worldX: 0 }, 0);
    audio.play({ kind: "victory" }, 64);
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ src: ["sfx/firepop2.wav"] }));
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ src: ["sfx/cheer2.wav"] }));
  });

  it("uses the original enemy hit and projectile flight samples", () => {
    const audio = new GameAudio();
    audio.play({ kind: "enemyHit", worldX: 20 }, 20);
    audio.play({ kind: "projectileTravel", worldX: 20 }, 20);
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ src: ["sfx/hit_01.wav"] }));
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ src: ["sfx/flamearrow_03.wav"] }));
  });

  it("keeps entry, weapon, projectile, and upgrade cues audible at their source", () => {
    const audio = new GameAudio();
    audio.play({ kind: "spawn", worldX: 0 }, 0);
    audio.play({ kind: "cannon", worldX: 20 }, 20);
    audio.play({ kind: "projectileTravel", worldX: 30 }, 30);
    audio.play({ kind: "upgrade", worldX: 40 }, 40);

    const expectedGains = [0.5, 0.48, 0.32, 0.55];
    for (const [index, expectedGain] of expectedGains.entries()) {
      const howl = jest.mocked(Howl).mock.results[index]?.value as jest.Mocked<Howl>;
      expect(howl.volume).toHaveBeenLastCalledWith(expectedGain, 1);
    }
  });

  it.each([
    ["hammer.wav", 130, 64, 200],
    ["buildWall.wav", 170, 64, 1000],
    ["mexicoChatter.wav", -30, 64, 1000]
  ])("fades %s when leaving its camera area", (file, inside, outside, duration) => {
    const audio = new GameAudio();
    audio.updateCameraArea(inside as number, 128);
    const call = jest.mocked(Howl).mock.calls.findIndex(([options]) => options.src?.[0] === `sfx/${file}`);
    expect(call).toBeGreaterThanOrEqual(0);
    const howl = jest.mocked(Howl).mock.results[call]?.value as jest.Mocked<Howl>;
    audio.updateCameraArea(outside as number, 128);
    expect(howl.fade).toHaveBeenCalledWith(0.3, 0, duration, 1);
    const onFade = howl.once.mock.calls[0]?.[1];
    if (typeof onFade === "function") onFade(1, "");
    expect(howl.stop).toHaveBeenCalledWith(1);
  });

  it("updates active ambience when panning and zooming", () => {
    const audio = new GameAudio();
    audio.updateCameraArea(-40, 128, 50);
    const howl = jest.mocked(Howl).mock.results[0]?.value as jest.Mocked<Howl>;
    howl.volume.mockClear();
    audio.updateCameraArea(-30, 128, 100);
    expect(howl.stereo).toHaveBeenLastCalledWith(-10 / 55, 1);
    expect(howl.volume.mock.calls.at(-1)?.[0]).toBeCloseTo(0.45 * (1 - 10 / 100) * 0.5);
  });

  it("pans world sounds toward their map position", () => {
    const audio = new GameAudio();
    audio.play({ kind: "cash", worldX: 40 }, 0);
    const howl = jest.mocked(Howl).mock.results[0]?.value as jest.Mocked<Howl>;
    expect(howl.stereo).toHaveBeenCalledWith(40 / 55, 1);
  });

  it("keeps tower fire prominent and prevents the same cannon sound stacking", () => {
    const audio = new GameAudio();
    audio.play({ kind: "cannon", worldX: 20 }, 20);
    audio.play({ kind: "cannon", worldX: 20 }, 20);

    const howl = jest.mocked(Howl).mock.results[0]?.value as jest.Mocked<Howl>;
    expect(howl.play).toHaveBeenCalledTimes(1);
    expect(Howl).toHaveBeenCalledWith(expect.objectContaining({ pool: 1, volume: 0.48 }));
    expect(howl.stop).toHaveBeenCalledTimes(1);
    expect(howl.volume).toHaveBeenCalledWith(0.48, 1);
  });
});
