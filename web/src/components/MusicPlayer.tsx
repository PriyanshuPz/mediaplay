import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FaPlay,
  FaPause,
  FaBackward,
  FaForward,
  FaVolumeHigh,
  FaListUl,
} from "react-icons/fa6";
import { FaVolumeMute } from "react-icons/fa";
import { api, getMediaStreamUrl, API_ORIGIN } from "../lib/api";
import type { Media } from "../lib/types";
import { formatTime } from "../lib/utls";
import { BiArrowBack } from "react-icons/bi";

export function MusicPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMediaById(id!),
    enabled: !!id,
  });

  const { data: playlist = [] } = useQuery({
    queryKey: ["playlist", media?.type, media?.series_id],
    queryFn: async () => {
      if (!media) return [];

      if (media.type === "music") {
        return api.listMedia("music");
      }

      if (media.type === "series") {
        const items = await api.listMedia("series");
        return media.series_id
          ? items.filter((i) => i.series_id === media.series_id)
          : items;
      }

      return [];
    },
    enabled: !!media,
  });

  const currentTrack = playlist[currentIndex];

  // --- sync index with route ---
  useEffect(() => {
    if (!playlist.length || !id) return;

    const index = playlist.findIndex((t) => t.id.toString() === id);
    setCurrentIndex(index >= 0 ? index : 0);
  }, [playlist, id]);

  // --- bind audio events (IMPORTANT: depends on currentTrack) ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => next();

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [currentTrack]); // ✅ FIX

  // --- load + play track ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const url = getMediaStreamUrl(currentTrack.id.toString());

    audio.src = url;
    audio.load();

    // fallback: ensure duration is set
    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.play().catch((e) => {
      console.warn("Playback failed:", e);
    });

    navigate(`/listen/${currentTrack.id}`, { replace: true });

    setTime(0);
  }, [currentTrack]);

  // --- controls ---
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    a.paused ? a.play() : a.pause();
  };

  const next = () => {
    setCurrentIndex((i) => (i + 1) % playlist.length);
  };

  const prev = () => {
    setCurrentIndex((i) => (i - 1 + playlist.length) % playlist.length);
  };

  const seek = (v: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = v;
    }
    setTime(v);
  };

  const changeVolume = (v: number) => {
    if (!audioRef.current) return;

    audioRef.current.volume = v;
    setVolume(v);

    if (v > 0) setMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (muted) {
      audioRef.current.volume = volume || 0.5;
      setMuted(false);
    } else {
      audioRef.current.volume = 0;
      setMuted(true);
    }
  };

  const getThumb = (t: Media) =>
    t.thumbnail?.startsWith("http")
      ? t.thumbnail
      : `${API_ORIGIN}${t.thumbnail}`;

  if (!currentTrack) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading player...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <audio ref={audioRef} />

      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <BiArrowBack />
        </button>
        <span className="text-sm text-foreground truncate">
          {currentTrack.title}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-4 py-6">
        <div className="flex flex-col items-center text-center gap-4 mt-4">
          <div className="w-64 h-64 md:w-80 md:h-80">
            <img
              src={getThumb(currentTrack) || "/placeholder.png"}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h2 className="text-base text-foreground">{currentTrack.title}</h2>
            <p className="text-sm text-muted-foreground">
              {currentTrack.description || "Unknown"}
            </p>
          </div>
        </div>
        <div className="w-full max-w-md flex flex-col gap-4">
          <div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-5 bg-muted"
            />

            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>{formatTime(time)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button
              onClick={prev}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaBackward size={18} />
            </button>

            <button
              onClick={togglePlay}
              className="text-foreground hover:text-primary"
            >
              {isPlaying ? <FaPause size={28} /> : <FaPlay size={28} />}
            </button>

            <button
              onClick={next}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaForward size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground"
            >
              {muted ? <FaVolumeMute /> : <FaVolumeHigh />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="flex-1 h-5 bg-muted"
            />

            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaListUl />
            </button>
          </div>
        </div>
      </div>

      {showPlaylist && (
        <div className="border-t border-border bg-background max-h-64 overflow-y-auto">
          {playlist.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-full text-left px-4 py-3 text-sm ${
                i === currentIndex
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
