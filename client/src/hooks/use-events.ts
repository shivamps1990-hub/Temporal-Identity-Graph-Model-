import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type NormalizedEvent } from "@shared/schema";

export function useInjectEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: NormalizedEvent) => {
      const validated = api.events.inject.input.parse(event);
      const res = await fetch(api.events.inject.path, {
        method: api.events.inject.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to inject event");
      return api.events.inject.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.graph.snapshot.path] });
    },
  });
}

export function useReplayEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { events?: NormalizedEvent[], scenario?: string, reset?: boolean }) => {
      const res = await fetch(api.events.replay.path, {
        method: api.events.replay.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to replay events");
      return api.events.replay.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.graph.snapshot.path] });
    },
  });
}
