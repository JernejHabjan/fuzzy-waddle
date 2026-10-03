import { createClient, type Session } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

const localUrl = "http://127.0.0.1:54321";

export interface MultiplayerTestIdentity {
  readonly userId: string;
  readonly session: Session;
}

/** Provision two distinct real local users; service credentials stay in the Node test runner. */
export async function createMultiplayerTestIdentities(): Promise<{
  readonly identities: readonly [MultiplayerTestIdentity, MultiplayerTestIdentity];
  readonly dispose: () => Promise<void>;
}> {
  const publicKey = process.env.AI_MULTIPLAYER_SUPABASE_PUBLIC_KEY;
  const serviceKey = process.env.AI_MULTIPLAYER_SUPABASE_SERVICE_KEY;
  if (!publicKey || !serviceKey) throw new Error("local_multiplayer_supabase_keys_required");
  const admin = createClient(localUrl, serviceKey, { auth: { persistSession: false } });
  const userClient = createClient(localUrl, publicKey, { auth: { persistSession: false } });
  const created: string[] = [];
  try {
    const identities: MultiplayerTestIdentity[] = [];
    for (let index = 0; index < 2; index += 1) {
      const suffix = `${Date.now()}-${randomUUID()}-${index}`;
      const email = `ai-relay-${suffix}@example.invalid`;
      const password = randomUUID() + randomUUID();
      const provisioned = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (provisioned.error || !provisioned.data.user) throw new Error("local_multiplayer_user_creation_failed");
      created.push(provisioned.data.user.id);
      const signedIn = await userClient.auth.signInWithPassword({ email, password });
      if (signedIn.error || !signedIn.data.session) throw new Error("local_multiplayer_sign_in_failed");
      identities.push({ userId: provisioned.data.user.id, session: signedIn.data.session });
    }
    return {
      identities: identities as [MultiplayerTestIdentity, MultiplayerTestIdentity],
      dispose: async () => {
        for (const userId of created) {
          const result = await admin.auth.admin.deleteUser(userId);
          if (result.error) throw new Error(`local_multiplayer_user_cleanup_failed:${userId}`);
        }
      }
    };
  } catch (error) {
    await Promise.all(created.map((userId) => admin.auth.admin.deleteUser(userId)));
    throw error;
  }
}

/** Install actual Supabase sessions before Angular initializes; no test-side AI state is injected. */
export async function installMultiplayerIdentity(
  context: BrowserContext, identity: MultiplayerTestIdentity
): Promise<void> {
  const publicKey = process.env.AI_MULTIPLAYER_SUPABASE_PUBLIC_KEY;
  if (!publicKey) throw new Error("local_multiplayer_public_key_required");
  await context.addInitScript(({ key, session }) => {
    if (window.location.origin !== "http://127.0.0.1:4200") return;
    window.sessionStorage.setItem("fuzzy-waddle:multiplayer-e2e-auth-v1", JSON.stringify({
      schemaVersion: 1, url: "http://127.0.0.1:54321", publicAnonKey: key
    }));
    window.sessionStorage.setItem("fuzzy-waddle:ai-runtime-browser-test-v1", "map-only");
    window.sessionStorage.setItem("fuzzy-waddle:ai-multiplayer-browser-test-v1", "1");
    window.localStorage.setItem("sb-127-auth-token", JSON.stringify(session));
  }, { key: publicKey, session: identity.session });
}
