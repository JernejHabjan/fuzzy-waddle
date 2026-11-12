import { fileURLToPath } from "node:url";

/** Repository paths shared by direct Node entry points; independent of the caller's working directory. */
export const workspaceRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

/** All manifests resolve scenario data relative to this checked-in test-data root. */
export const fixtureDirectory = fileURLToPath(new URL("../testing/fixtures/", import.meta.url));
