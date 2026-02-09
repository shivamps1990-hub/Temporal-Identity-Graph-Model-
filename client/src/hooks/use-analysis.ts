import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useReachability(source: string, target: string, k: number = 5, enabled: boolean = false, timestamp?: string | null) {
  return useQuery({
    queryKey: [api.analysis.reachability.path, source, target, k, timestamp ?? 'live'],
    enabled: enabled && !!source && !!target,
    queryFn: async () => {
      let url = `${api.analysis.reachability.path}?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}&k=${k}`;
      if (timestamp) url += `&timestamp=${encodeURIComponent(timestamp)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to analyze reachability");
      return res.json();
    },
  });
}

export function useThreats() {
  return useQuery({
    queryKey: [api.analysis.threats.path],
    queryFn: async () => {
      const res = await fetch(api.analysis.threats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch threats");
      return api.analysis.threats.responses[200].parse(await res.json());
    },
  });
}

export function useBlastRadius(source: string, k: number = 3, enabled: boolean = false, timestamp?: string | null) {
  return useQuery({
    queryKey: [api.analysis.blastRadius.path, source, k, timestamp ?? 'live'],
    enabled: enabled && !!source,
    queryFn: async () => {
      let url = `${api.analysis.blastRadius.path}?source=${encodeURIComponent(source)}&k=${k}`;
      if (timestamp) url += `&timestamp=${encodeURIComponent(timestamp)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to calculate blast radius");
      return res.json();
    },
  });
}
