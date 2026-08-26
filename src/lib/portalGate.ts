export const PORTAL_EMAIL = "login@gmail.com";
export const PORTAL_PASSWORD = "login26!";
const KEY = "portal-unlocked";

export function unlockPortal() {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, "1");
}

export function isPortalUnlocked() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}

export function lockPortal() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}
