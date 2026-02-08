import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface ReplayControlsProps {
  onReplay: (percentage: number) => void;
  onReset: () => void;
  startTime: Date;
  endTime: Date;
  isPlaying?: boolean;
}

export function ReplayControls({ onReplay, onReset, startTime, endTime }: ReplayControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(100);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Note: Actual animation loop would be handled by parent or a dedicated effect hook
  // This is just UI state for the prototype

  return (
    <div className="w-full bg-card border-t border-border p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>{format(startTime, "yyyy-MM-dd HH:mm:ss")}</span>
          <span className="text-primary font-bold">LIVE</span>
          <span>{format(endTime, "yyyy-MM-dd HH:mm:ss")}</span>
        </div>
        
        <Slider 
          value={[progress]} 
          max={100} 
          step={1} 
          onValueChange={(vals) => {
            setProgress(vals[0]);
            onReplay(vals[0]);
          }}
          className="w-full"
        />

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={onReset} title="Reset Graph">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setProgress(0)} title="Jump to Start">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
