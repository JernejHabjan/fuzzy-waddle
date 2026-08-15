import { Test } from "@nestjs/testing";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import type { ProbableWafflePlayerPreferences } from "@fuzzy-waddle/probable-waffle-protocol";
import { PlayerPreferencesService } from "./player-preferences.service";

const preferences: ProbableWafflePlayerPreferences = {
  version: 1,
  lockToScreen: false,
  enabledMouseCornerMovement: false,
  enableSceneLightingEffects: true,
  homeScreenBackground: "ashfall",
  automaticallySaveReplays: false,
  profanityFilter: true,
  showPing: false,
  showActionsPerMinute: false,
  showFps: false,
  showTimeElapsed: false,
  defaultCameraDistance: 1,
  maximumCameraDistance: 0.5,
  enableSubtitles: true,
  defaultSinglePlayerSpeed: "normal"
};

describe("PlayerPreferencesService", () => {
  it("loads a valid preference document", async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlayerPreferencesService,
        {
          provide: SupabaseProviderService,
          useValue: {
            supabaseClient: {
              from: () => ({
                select: () => ({
                  eq: () => ({
                    maybeSingle: () =>
                      Promise.resolve({ data: { probable_waffle_preferences: preferences }, error: null })
                  })
                })
              })
            }
          }
        }
      ]
    }).compile();

    await expect(module.get(PlayerPreferencesService).get("user-1")).resolves.toEqual(preferences);
  });

  it("persists the complete versioned document for the authenticated user", async () => {
    const update = jest.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
    const module = await Test.createTestingModule({
      providers: [
        PlayerPreferencesService,
        { provide: SupabaseProviderService, useValue: { supabaseClient: { from: () => ({ update }) } } }
      ]
    }).compile();

    await expect(module.get(PlayerPreferencesService).save("user-1", preferences)).resolves.toEqual(preferences);
    expect(update).toHaveBeenCalledWith({ probable_waffle_preferences: preferences });
  });
});
