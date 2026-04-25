import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaExpand, FaArrowLeft } from "react-icons/fa6";
import { formatTime } from "../lib/utls";

interface VideoPlayerProps {
  src: string;
  title?: string;
  onBack?: () => void;
}

export function VideoPlayer({ src, title, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      if (e.code === "Space") {
        e.preventDefault();
        video.paused ? video.play() : video.pause();
      }

      if (e.code === "ArrowRight") video.currentTime += 10;
      if (e.code === "ArrowLeft") video.currentTime -= 10;
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    let timeout: any;

    const reset = () => {
      setShowControls(true);

      if (videoRef.current?.paused) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 2000);
    };

    window.addEventListener("mousemove", reset);
    reset();

    return () => {
      window.removeEventListener("mousemove", reset);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      if (!seeking) setProgress(video.currentTime);
    };

    video.addEventListener("timeupdate", update);
    return () => video.removeEventListener("timeupdate", update);
  }, [seeking]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen bg-background overflow-hidden"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        autoPlay
        playsInline
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <div
        className={`absolute inset-x-0 top-0 transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-linear-to-b from-black/80 via-black/40 to-transparent px-3 py-2 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack?.() || window.history.back();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaArrowLeft size={14} />
          </button>

          <span className="text-[12px] text-foreground truncate">
            {title || "Untitled"}
          </span>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 transition-opacity duration-200 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-linear-to-t from-black/90 via-black/40 to-transparent px-3 py-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={(e) => {
              const time = Number((e.target as HTMLInputElement).value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
              setSeeking(false);
            }}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="
              w-full h-0.5 appearance-none bg-muted
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary
              hover:[&::-webkit-slider-thumb]:scale-110
              transition-all
            "
          />

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-foreground hover:text-primary transition-colors"
              >
                {playing ? <FaPause size={12} /> : <FaPlay size={12} />}
              </button>

              <span>
                {formatTime(progress)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <FaExpand size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
