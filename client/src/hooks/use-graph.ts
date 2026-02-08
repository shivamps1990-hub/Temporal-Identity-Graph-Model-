import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGraphSnapshot(timestamp?: string) {
  return useQuery({
    queryKey: [api.graph.snapshot.path, timestamp],
    queryFn: async () => {
      const url = timestamp 
        ? `${api.graph.snapshot.path}?timestamp=${timestamp}` 
        : api.graph.snapshot.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch graph snapshot");
      return api.graph.snapshot.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Poll for updates
  });
}

export function useResetGraph() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.graph.reset.path, {
        method: api.graph.reset.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset graph");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.graph.snapshot.path] });
    },
  });
}
