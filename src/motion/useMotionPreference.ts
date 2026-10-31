import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const snapshot = () => window.matchMedia(query).matches;
export function useSystemReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
export function isConstrainedDevice() {
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return Boolean(
    device.connection?.saveData ||
      (device.hardwareConcurrency && device.hardwareConcurrency <= 2) ||
      (device.deviceMemory && device.deviceMemory <= 2),
  );
}
