import { Howl } from "howler";
import { GameAudio } from "./game-audio";

jest.mock("./asset-paths", () => ({ assetUrl: (path: string) => path }));
jest.mock("howler", () => ({
  Howl: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockReturnValue(1),
    volume: jest.fn(),
    stereo: jest.fn(),
    mute: jest.fn(),
    pause: jest.fn(),
    unload: jest.fn(),
    stop: jest.fn(),
    playing: jest.fn().mockReturnValue(false)
  }))
}));

describe("Trump Defense positional audio", () => {
  beforeEach(() => jest.mocked(Howl).mockClear());

  it("does not play entry spawn cues while the camera is away from the entry", () => {
    const audio = new GameAudio();
    audio.play({ kind: "spawn", worldX: 0 }, 64);
    expect(Howl).not.toHaveBeenCalled();
    audio.play({ kind: "spawn", worldX: 0 }, 0);
    expect(Howl).toHaveBeenCalledTimes(1);
  });

  it("pans world sounds toward their map position", () => {
    const audio = new GameAudio();
    audio.play({ kind: "cash", worldX: 40 }, 0);
    const howl = jest.mocked(Howl).mock.results[0]?.value as jest.Mocked<Howl>;
    expect(howl.stereo).toHaveBeenCalledWith(40 / 55, 1);
  });
});
