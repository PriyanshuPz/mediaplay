import { useState } from "react";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const [started, setStarted] = useState(false);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
      <div className="relative aspect-video bg-black">
        <ReactPlayer
          src={src}
          controls
          playing={started}
          light={poster || false}
          width="100%"
          height="100%"
          playsInline
          onPlay={() => setStarted(true)}
          onPause={() => setStarted(false)}
          style={{ position: "absolute", inset: 0 }}
        />

        {!started && title ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-6 py-5">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Now Playing
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                {title}
              </h2>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
