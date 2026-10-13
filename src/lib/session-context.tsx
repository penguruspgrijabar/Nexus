"use client";

import { createContext, useContext } from "react";
import type { SessionInfo } from "./types";

const SessionCtx = createContext<SessionInfo | null>(null);

export const SessionProvider = SessionCtx.Provider;

export function useSession(): SessionInfo | null {
  return useContext(SessionCtx);
}
