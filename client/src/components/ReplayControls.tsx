import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { format } from "date-fns";

interface ReplayControlsProps {
  onTimestampChange: (timestamp: string | null) => void;
  onReset: () => void;
  events: { event_id: string; timestamp: string }[];
}

const SPEEDS = [
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "5x", value: 5 },
  { label: "10x", value: 10 },
];

export function ReplayControls({ onTimestampChange, onReset, events }: ReplayControlsProps) {
  const safeEvents = events || [];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(safeEvents.length);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sorted = [...safeEvents].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const totalSteps = sorted.length;

  const updateTimestamp = useCallback((idx: number) => {
    if (idx >= totalSteps || idx < 0) {
      onTimestampChange(null);
    } else {
      onTimestampChange(sorted[idx].timestamp);
    }
  }, [sorted, totalSteps, onTimestampChange]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next > totalSteps) {
            setIsPlaying(false);
            return totalSteps;
          }
          updateTimestamp(next);
          return next;
        });
      }, 500 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, totalSteps, updateTimestamp]);

  useEffect(() => {
    setCurrentIndex(safeEvents.length);
  }, [safeEvents.length]);

  const handleSliderChange = (vals: number[]) => {
    const idx = vals[0];
    setCurrentIndex(idx);
    setIsPlaying(false);
    updateTimestamp(idx);
  };

  const stepForward = () => {
    const next = Math.min(currentIndex + 1, totalSteps);
    setCurrentIndex(next);
    setIsPlaying(false);
    updateTimestamp(next);
  };

  const stepBackward = () => {
    const prev = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prev);
    setIsPlaying(false);
    updateTimestamp(prev);
  };

  const jumpToStart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
    updateTimestamp(0);
  };

  const jumpToEnd = () => {
    setCurrentIndex(totalSteps);
    setIsPlaying(false);
    onTimestampChange(null);
  };

  const togglePlay = () => {
    if (currentIndex >= totalSteps) {
      setCurrentIndex(0);
      updateTimestamp(0);
    }
    setIsPlaying(!isPlaying);
  };

  const startTs = sorted.length > 0 ? sorted[0].timestamp : null;
  const endTs = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : null;
  const currentTs = currentIndex < totalSteps ? sorted[currentIndex]?.timestamp : endTs;

  return (
    <div className="w-full p-4" data-testid="replay-controls">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Move through time to observe how identity relationships appear, evolve, and disappear.
          </p>
          <span className="font-mono text-xs text-primary font-medium">
            {currentIndex >= totalSteps ? "LIVE" : `Event ${currentIndex + 1} / ${totalSteps}`}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>{startTs ? format(new Date(startTs), "yyyy-MM-dd HH:mm") : "--"}</span>
          <span>{endTs ? format(new Date(endTs), "yyyy-MM-dd HH:mm") : "--"}</span>
        </div>
        
        <Slider 
          value={[currentIndex]} 
          max={totalSteps} 
          step={1} 
          onValueChange={handleSliderChange}
          className="w-full"
          data-testid="replay-slider"
        />

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" onClick={onReset} title="Reset Graph" data-testid="button-reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={jumpToStart} title="Jump to Start" data-testid="button-jump-start">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={stepBackward} title="Step Back" data-testid="button-step-back">
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button 
            size="icon" 
            onClick={togglePlay}
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={stepForward} title="Step Forward" data-testid="button-step-forward">
            <SkipForward className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="icon" onClick={jumpToEnd} title="Jump to Live" data-testid="button-jump-end">
            <SkipForward className="w-4 h-4" />
          </Button>
          <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
            <SelectTrigger className="w-20 font-mono text-xs" data-testid="select-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map(s => (
                <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentTs && (
          <div className="text-center font-mono text-[10px] text-muted-foreground">
            {format(new Date(currentTs), "yyyy-MM-dd HH:mm:ss.SSS")}
          </div>
        )}
      </div>
    </div>
  );
}
