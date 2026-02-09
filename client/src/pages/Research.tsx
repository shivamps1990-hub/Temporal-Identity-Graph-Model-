import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { Upload, CheckCircle2, XCircle, Clock, ShieldCheck, ChevronDown, AlertTriangle, Info, Loader2 } from "lucide-react";

interface UploadResult {
  dataset_id: string;
  events_processed: number;
  graph_hash: string;
  nodes: number;
  edges: number;
}

interface StructuralResult {
  validated_paths: { path: string[]; status: string }[];
  missing_paths: { path: string[]; missing_segment: { from: string; to: string } }[];
  unexpected_paths: string[];
}

interface TemporalResult {
  path: string[];
  expected_windows: { start: string; end: string }[];
  observed_windows: { start: string; end: string }[];
  edge_details: { from: string; to: string; first_seen: string; last_seen: string }[];
  matches: boolean;
}

interface DeterminismResult {
  deterministic: boolean;
  graph_hash: string;
  replay_count: number;
  events_replayed: number;
}

export default function Research() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [structuralInput, setStructuralInput] = useState("");
  const [structuralResult, setStructuralResult] = useState<StructuralResult | null>(null);
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [structuralError, setStructuralError] = useState<string | null>(null);

  const [temporalPathInput, setTemporalPathInput] = useState("");
  const [temporalWindowsInput, setTemporalWindowsInput] = useState("");
  const [temporalResult, setTemporalResult] = useState<TemporalResult | null>(null);
  const [temporalLoading, setTemporalLoading] = useState(false);
  const [temporalError, setTemporalError] = useState<string | null>(null);

  const [determinismResult, setDeterminismResult] = useState<DeterminismResult | null>(null);
  const [determinismLoading, setDeterminismLoading] = useState(false);
  const [determinismError, setDeterminismError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const text = await file.text();
      const lines = text.trim().split("\n").filter(l => l.trim());
      const events = lines.map(line => JSON.parse(line));

      const res = await apiRequest("POST", "/api/research/upload-dataset", {
        events,
        acknowledge_no_accuracy: acknowledged
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleStructuralValidation = async () => {
    setStructuralLoading(true);
    setStructuralResult(null);
    setStructuralError(null);
    try {
      const paths = JSON.parse(structuralInput);
      const res = await apiRequest("POST", "/api/research/validate-structure", {
        expected_paths: paths
      });
      setStructuralResult(await res.json());
    } catch (err: any) {
      setStructuralError(err.message || "Structural validation failed");
    } finally {
      setStructuralLoading(false);
    }
  };

  const handleTemporalValidation = async () => {
    setTemporalLoading(true);
    setTemporalResult(null);
    setTemporalError(null);
    try {
      const path = JSON.parse(temporalPathInput);
      const windows = JSON.parse(temporalWindowsInput);
      const res = await apiRequest("POST", "/api/research/validate-temporal", {
        path,
        expected_windows: windows
      });
      setTemporalResult(await res.json());
    } catch (err: any) {
      setTemporalError(err.message || "Temporal validation failed");
    } finally {
      setTemporalLoading(false);
    }
  };

  const handleDeterminismCheck = async () => {
    setDeterminismLoading(true);
    setDeterminismResult(null);
    setDeterminismError(null);
    try {
      const res = await apiRequest("POST", "/api/research/verify-determinism", {});
      setDeterminismResult(await res.json());
    } catch (err: any) {
      setDeterminismError(err.message || "Determinism verification failed");
    } finally {
      setDeterminismLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="max-w-4xl mx-auto w-full py-10 px-8 space-y-8 animate-in fade-in duration-500">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider" data-testid="badge-research">
              Identity Graph Validation
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-research-title">
            Researcher Dataset Upload
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Upload a normalized identity event dataset to evaluate structural
            and temporal properties of the identity graph.
            This system does not measure detection or classification metrics.
          </p>
        </header>

        <Alert className="border-primary/20 bg-primary/5" data-testid="alert-non-claims">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-sm">
            This system does not evaluate detection or classification metrics, identify attacks,
            or measure security effectiveness.
            It evaluates identity structure and timing only.
          </AlertDescription>
        </Alert>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Dataset Upload</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a normalized identity event dataset in NDJSON format (one JSON event per line).
                Events must conform to the normalized event schema with valid node types, edge labels, and timestamps.
              </p>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={(v) => setAcknowledged(v === true)}
                  data-testid="checkbox-acknowledge"
                />
                <label htmlFor="acknowledge" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I understand this system evaluates structure and timing, not detection or classification metrics.
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  disabled={!acknowledged || uploading}
                  onClick={() => document.getElementById("file-upload")?.click()}
                  data-testid="button-upload"
                >
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Processing..." : "Upload NDJSON File"}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".ndjson,.jsonl,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-file-upload"
                />
              </div>

              {uploadError && (
                <Alert className="border-destructive/30" data-testid="alert-upload-error">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm">{uploadError}</AlertDescription>
                </Alert>
              )}

              {uploadResult && (
                <div className="p-4 rounded-md bg-muted/50 border border-border space-y-2" data-testid="panel-upload-result">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Dataset uploaded and replayed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono">
                    <span className="text-muted-foreground">Events processed</span>
                    <span>{uploadResult.events_processed}</span>
                    <span className="text-muted-foreground">Nodes created</span>
                    <span>{uploadResult.nodes}</span>
                    <span className="text-muted-foreground">Edges created</span>
                    <span>{uploadResult.edges}</span>
                    <span className="text-muted-foreground">Graph hash</span>
                    <span className="text-xs truncate">{uploadResult.graph_hash}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Structural Validation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Structural validation checks whether identity paths implied by the dataset
            are reconstructed correctly by the graph model.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Paths (JSON array of node ID arrays)</label>
                <textarea
                  className="w-full h-24 p-3 rounded-md border border-border bg-background font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`[["node_a", "node_b", "node_c"], ["node_x", "node_y"]]`}
                  value={structuralInput}
                  onChange={(e) => setStructuralInput(e.target.value)}
                  data-testid="input-structural-paths"
                />
              </div>
              <Button
                onClick={handleStructuralValidation}
                disabled={!structuralInput.trim() || structuralLoading}
                data-testid="button-validate-structure"
              >
                {structuralLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Validate Structure
              </Button>

              {structuralError && (
                <Alert className="border-destructive/30" data-testid="alert-structural-error">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm">{structuralError}</AlertDescription>
                </Alert>
              )}

              {structuralResult && (
                <div className="space-y-4 pt-2" data-testid="panel-structural-result">
                  {structuralResult.validated_paths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Paths Reconstructed
                      </h4>
                      {structuralResult.validated_paths.map((p, i) => (
                        <div key={i} className="font-mono text-xs p-2 bg-muted/50 rounded-md">
                          {p.path.join(" -> ")}
                        </div>
                      ))}
                    </div>
                  )}
                  {structuralResult.missing_paths.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        Paths Not Reconstructed
                      </h4>
                      {structuralResult.missing_paths.map((p, i) => (
                        <div key={i} className="font-mono text-xs p-2 bg-muted/50 rounded-md space-y-1">
                          <div>{p.path.join(" -> ")}</div>
                          <div className="text-destructive">Missing: {p.missing_segment.from} {"->"} {p.missing_segment.to}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {structuralResult.unexpected_paths.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronDown className="w-3 h-3" />
                        {structuralResult.unexpected_paths.length} additional edges not in expected paths
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="space-y-1">
                          {structuralResult.unexpected_paths.map((p, i) => (
                            <div key={i} className="font-mono text-xs text-muted-foreground">{p}</div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Temporal Validation</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Temporal validation verifies that identity paths appear and disappear
            only when the required relationships overlap in time.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Path (JSON array of node IDs)</label>
                <textarea
                  className="w-full h-16 p-3 rounded-md border border-border bg-background font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`["node_a", "node_b", "node_c"]`}
                  value={temporalPathInput}
                  onChange={(e) => setTemporalPathInput(e.target.value)}
                  data-testid="input-temporal-path"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Time Windows (JSON array)</label>
                <textarea
                  className="w-full h-16 p-3 rounded-md border border-border bg-background font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`[{"start": "2025-01-01T00:00:00Z", "end": "2025-01-02T00:00:00Z"}]`}
                  value={temporalWindowsInput}
                  onChange={(e) => setTemporalWindowsInput(e.target.value)}
                  data-testid="input-temporal-windows"
                />
              </div>
              <Button
                onClick={handleTemporalValidation}
                disabled={!temporalPathInput.trim() || !temporalWindowsInput.trim() || temporalLoading}
                data-testid="button-validate-temporal"
              >
                {temporalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                Validate Temporal Correctness
              </Button>

              {temporalError && (
                <Alert className="border-destructive/30" data-testid="alert-temporal-error">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm">{temporalError}</AlertDescription>
                </Alert>
              )}

              {temporalResult && (
                <div className="space-y-3 pt-2" data-testid="panel-temporal-result">
                  <div className="flex items-center gap-2">
                    {temporalResult.matches ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">
                      {temporalResult.matches ? "Temporal windows overlap as expected" : "Temporal windows do not match expected overlap"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Windows</h4>
                      {temporalResult.expected_windows.map((w, i) => (
                        <div key={i} className="font-mono text-xs p-2 bg-muted/50 rounded-md">
                          {w.start} - {w.end}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observed Windows</h4>
                      {temporalResult.observed_windows.length > 0 ? (
                        temporalResult.observed_windows.map((w, i) => (
                          <div key={i} className="font-mono text-xs p-2 bg-muted/50 rounded-md">
                            {w.start} - {w.end}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground italic">No valid temporal overlap found</div>
                      )}
                    </div>
                  </div>
                  {temporalResult.edge_details.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ChevronDown className="w-3 h-3" />
                        Edge-level temporal details
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-1">
                        {temporalResult.edge_details.map((ed, i) => (
                          <div key={i} className="font-mono text-xs p-2 bg-muted/50 rounded-md flex justify-between gap-4">
                            <span>{ed.from} {"->"} {ed.to}</span>
                            <span className="text-muted-foreground">{ed.first_seen} to {ed.last_seen}</span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Deterministic Replay Verification</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deterministic replay ensures the same dataset always produces the same graph,
            paths, and analysis results.
          </p>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Button
                onClick={handleDeterminismCheck}
                disabled={determinismLoading}
                data-testid="button-verify-determinism"
              >
                {determinismLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Verify Determinism
              </Button>

              {determinismError && (
                <Alert className="border-destructive/30" data-testid="alert-determinism-error">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-sm">{determinismError}</AlertDescription>
                </Alert>
              )}

              {determinismResult && (
                <div className="space-y-2 pt-2" data-testid="panel-determinism-result">
                  <div className="flex items-center gap-2">
                    {determinismResult.deterministic ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-sm font-medium">
                      {determinismResult.deterministic
                        ? "Replay is deterministic"
                        : "Replay produced different results"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-mono">
                    <span className="text-muted-foreground">Replays performed</span>
                    <span>{determinismResult.replay_count}</span>
                    <span className="text-muted-foreground">Events replayed</span>
                    <span>{determinismResult.events_replayed}</span>
                    <span className="text-muted-foreground">Graph hash</span>
                    <span className="text-xs truncate">{determinismResult.graph_hash}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
