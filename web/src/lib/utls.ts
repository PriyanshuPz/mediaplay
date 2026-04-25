import { API_ORIGIN } from "./api";

export function resolveAssetUrl(path?: string) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  let p = path.startsWith("/") ? path : `/${path}`;

  if (p.startsWith("/media/")) {
    p = p.replace("/media/", "/m/");
  }

  if (p.startsWith("/media/meta/") || p.startsWith("/meta/")) {
    p = p.replace("/media/meta/", "/meta/");
  }

  return `${API_ORIGIN}${p}`;
}

export function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString();
}

export function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}
