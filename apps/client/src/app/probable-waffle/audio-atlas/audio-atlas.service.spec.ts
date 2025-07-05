import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AudioAtlasService } from "./audio-atlas.service";
import { provideHttpClient } from "@angular/common/http";

// Mock Howler to avoid actual audio playback during tests
jest.mock("howler", () => {
  const mockPlay = jest.fn().mockReturnValue(123); // Return a mock sound ID
  const mockStop = jest.fn();
  const mockState = jest.fn().mockReturnValue("loaded");
  const mockOnce = jest.fn((event, callback) => {
    if (event === "load") {
      callback();
    }
    return this;
  });

  return {
    Howl: jest.fn().mockImplementation(() => ({
      play: mockPlay,
      stop: mockStop,
      state: mockState,
      once: mockOnce
    }))
  };
});

describe("AudioAtlasService", () => {
  let service: AudioAtlasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [provideHttpClient(), provideHttpClientTesting()],
      providers: [AudioAtlasService]
    });
    service = TestBed.inject(AudioAtlasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("loadAudioAtlas", () => {
    it("should load the audio atlas data and initialize Howl", async () => {
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          },
          "button click": {
            start: 5,
            end: 5.04,
            loop: false
          }
        }
      };

      const loadPromise = service.loadAudioAtlas();

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      await loadPromise;

      expect(service.isLoaded()).toBe(true);
    });

    it("should not reload if already loaded", async () => {
      // First load
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          }
        }
      };

      const loadPromise = service.loadAudioAtlas();

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      await loadPromise;

      // Second load should not make another HTTP request
      await service.loadAudioAtlas();

      // No additional HTTP requests should be made
      httpMock.expectNone("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
    });
  });

  describe("playSound", () => {
    it("should play a sound after loading the atlas", async () => {
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          }
        }
      };

      const playPromise = service.playSound("achievement");

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      const soundId = await playPromise;

      expect(soundId).toBe(123); // This is the mock value we set up
    });

    it("should warn if sprite name does not exist", async () => {
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          }
        }
      };

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const loadPromise = service.loadAudioAtlas();

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      await loadPromise;

      const soundId = await service.playSound("nonexistent");

      expect(consoleSpy).toHaveBeenCalledWith("Sound sprite not found: nonexistent");
      expect(soundId).toBe(-1);

      consoleSpy.mockRestore();
    });
  });

  describe("stopSound", () => {
    it("should stop a specific sound", async () => {
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          }
        }
      };

      const loadPromise = service.loadAudioAtlas();

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      await loadPromise;

      const soundId = await service.playSound("achievement");
      service.stopSound(soundId);

      // Verification happens through the mocked Howl
    });
  });

  describe("stopAllSounds", () => {
    it("should stop all sounds", async () => {
      const mockAtlasData = {
        resources: ["assets/probable-waffle/sfx/ui-feedback/ui-feedback.mp3"],
        spritemap: {
          achievement: {
            start: 0,
            end: 2,
            loop: false
          }
        }
      };

      const loadPromise = service.loadAudioAtlas();

      const req = httpMock.expectOne("/assets/probable-waffle/sfx/ui-feedback/ui-feedback.json");
      expect(req.request.method).toBe("GET");
      req.flush(mockAtlasData);

      await loadPromise;

      service.stopAllSounds();

      // Verification happens through the mocked Howl
    });
  });
});
