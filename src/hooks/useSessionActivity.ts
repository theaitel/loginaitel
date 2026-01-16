import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to track session activity and update last_activity_at for single-device enforcement.
 * Only tracks for main clients (not sub-users).
 */
export function useSessionActivity() {
  const { user, role, isSubUser } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only track for main clients (not sub-users)
    if (!user || role !== "client" || isSubUser) {
      return;
    }

    const updateActivity = async () => {
      try {
        await supabase
          .from("client_active_sessions" as any)
          .update({ last_activity_at: new Date().toISOString() })
          .eq("client_id", user.id)
          .eq("is_active", true);
      } catch (error) {
        console.error("Failed to update session activity:", error);
      }
    };

    // Update immediately on mount
    updateActivity();

    // Update every 5 minutes
    intervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

    // Also update on user interactions
    const handleActivity = () => {
      // Debounce: only update if last update was > 1 minute ago
      updateActivity();
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [user, role, isSubUser]);
}
