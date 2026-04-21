"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/core/i18n";

/**
 * OfflineDetector — toast persistent buat network status.
 *
 * Design pattern: **discriminated state machine**, semua transisi state
 * terjadi DI DALAM callback function (event handler / timer). Effect body
 * cuma register listener — tidak ada setState sync di dalamnya.
 *
 * State transitions:
 *   - hidden      → offline   (window 'offline' event atau initial page load offline)
 *   - offline     → reconnected (window 'online' event, SETELAH pernah offline)
 *   - reconnected → hidden    (auto-hide setelah 5 detik)
 *   - any         → hidden    (user klik X)
 *
 * Kenapa pattern ini?
 *   Rule `react-hooks/set-state-in-effect` (React 19) melarang setState
 *   sync di effect body — termasuk conditional setState. Cuma boleh dari
 *   callback (event handler, setTimeout, promise .then). Dengan state
 *   machine yang diupdate via event listener, kita comply + code lebih
 *   ekspresif.
 */

type AlertState =
  | { kind: "hidden" }
  | { kind: "offline" }
  | { kind: "reconnected" };

export function OfflineDetector() {
  const [state, setState] = useState<AlertState>({ kind: "hidden" });

  useEffect(() => {
    // Local state yang gak perlu trigger render. Cukup closure variable.
    let wasOffline = false;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHideTimer = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    // --- Event handlers (setState di sini OK — ini callback) ---

    const handleOffline = () => {
      wasOffline = true;
      clearHideTimer();
      setState({ kind: "offline" });
    };

    const handleOnline = () => {
      // Kalau belum pernah offline (e.g. initial page load online normal),
      // skip — ga usah tampilin banner hijau yang spurious.
      if (!wasOffline) return;

      setState({ kind: "reconnected" });
      hideTimer = setTimeout(() => {
        wasOffline = false;
        setState({ kind: "hidden" });
      }, 5000);
    };

    // --- Register listeners (no setState here) ---

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync: kalau page ke-load dalam keadaan offline, tampilkan
    // banner. Dispatched via microtask biar setState-nya dieksekusi dari
    // promise callback, bukan sync dari effect body.
    Promise.resolve().then(() => {
      if (!navigator.onLine) {
        handleOffline();
      }
    });

    return () => {
      clearHideTimer();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (state.kind === "hidden") return null;

  const isOnline = state.kind === "reconnected";

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-5 duration-300">
      <div
        className="flex items-center justify-between px-4 py-3 rounded-lg shadow-2xl border-2"
        style={{
          backgroundColor: isOnline ? "#dcfce7" : "#fee2e2",
          borderColor: isOnline ? "#86efac" : "#fca5a5",
        }}
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-700 flex-shrink-0" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-700 flex-shrink-0" />
          )}
          <p
            className={`text-sm font-semibold ${isOnline ? "text-green-900" : "text-red-900"
              }`}
          >
            {isOnline ? t("offline.reconnected") : t("offline.disconnected")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setState({ kind: "hidden" })}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}