import { useState, useEffect } from "react";

const VISITOR_ID_KEY = "songscript_visitor_id";

// Generate a random visitor ID
function generateVisitorId(): string {
  // Use crypto.randomUUID if available, otherwise fall back to Math.random
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "visitor_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get or create visitor ID from localStorage
function getOrCreateVisitorId(): string {
  // Check if we're on the client (localStorage is only available on client)
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existingId = localStorage.getItem(VISITOR_ID_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = generateVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, newId);
    return newId;
  } catch {
    // localStorage might not be available (e.g., private browsing)
    // Return a session-only ID
    return generateVisitorId();
  }
}

// Hook to get the visitor ID
export function useVisitorId(): string {
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    const id = getOrCreateVisitorId();
    setVisitorId(id);
  }, []);

  return visitorId;
}

// Export the getter for use outside of React components
export { getOrCreateVisitorId };
