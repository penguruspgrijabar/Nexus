"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import { unwrap } from "@/lib/action-result";
import type { UserRow } from "@/lib/types";
import { createUserAction, toggleUserAction, updateUserAction } from "@/server/actions/user.action";
import { listUsersAction } from "@/server/actions/query.action";

export function useUserList(enabled = true) {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => unwrap<UserRow[]>(await listUsersAction({})),
    enabled,
  });
}

export function useCreateUser(onDone?: () => void) {
  const qc = useQueryClient();
  return useAction(createUserAction, {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onDone?.();
    },
  });
}

export function useUpdateUser(onDone?: () => void) {
  const qc = useQueryClient();
  return useAction(updateUserAction, {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onDone?.();
    },
  });
}

export function useToggleUser() {
  const qc = useQueryClient();
  return useAction(toggleUserAction, {
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
