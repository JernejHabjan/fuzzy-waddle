import { AppUserRole } from "@fuzzy-waddle/api-interfaces";
import { faCrown, faShieldHalved, type IconDefinition } from "@fortawesome/free-solid-svg-icons";

export function getRoleIcon(role: AppUserRole | null | undefined): IconDefinition | null {
  if (role === AppUserRole.Admin) {
    return faCrown;
  }

  if (role === AppUserRole.Moderator) {
    return faShieldHalved;
  }

  return null;
}

export function getRoleLabel(role: AppUserRole | null | undefined): string | null {
  if (role === AppUserRole.Admin) {
    return "Admin";
  }

  if (role === AppUserRole.Moderator) {
    return "Moderator";
  }

  return null;
}
