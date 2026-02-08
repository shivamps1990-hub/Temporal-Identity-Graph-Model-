import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useReachability(source: string, target: string, k: number = 5, enabled: boolean = false) {
  return useQuery({
    queryKey: [api.analysis.reachability.path, source, target, k],
    enabled: enabled && !!source && !!target,
    queryFn: async () => {
      const url = `${api.analysis.reachability.path}?source=${source}&target=${target}&k=${k}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to analyze reachability");
      return api.analysis.reachability.responses[200].parse(await res.json());
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

export function useBlastRadius(source: string, k: number = 3, enabled: boolean = false) {
  return useQuery({
    queryKey: [api.analysis.blastRadius.path, source, k],
    enabled: enabled && !!source,
    queryFn: async () => {
      const url = `${api.analysis.blastRadius.path}?source=${source}&k=${k}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to calculate blast radius");
      return api.analysis.blastRadius.responses[200].parse(await res.json());
    },
  });
}
