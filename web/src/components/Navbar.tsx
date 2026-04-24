import { Link } from "react-router-dom";
import { FaFilm, FaHouse, FaMusic, FaPenNib, FaBars } from "react-icons/fa6";

export function Navbar() {
  return (
    <nav className="border-b border-zinc-200/80 bg-[#f5f5f2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-4 lg:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-zinc-900"
        >
          <span className="hidden sm:inline font-mono tracking-wide">
            MediaPlay
          </span>
        </Link>

        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <NavLink
            to="/"
            label="Home"
            icon={<FaHouse className="h-3.5 w-3.5" />}
          />
          <NavLink
            to="/movies"
            label="Movies"
            icon={<FaFilm className="h-3.5 w-3.5" />}
          />
          <NavLink
            to="/music"
            label="Music"
            icon={<FaMusic className="h-3.5 w-3.5" />}
          />
          <NavLink
            to="/series"
            label="Series"
            icon={<FaBars className="h-3.5 w-3.5" />}
          />
          <NavLink
            to="/manage/media"
            label="Library"
            icon={<FaPenNib className="h-3.5 w-3.5" />}
            accent
          />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  to,
  label,
  icon,
  accent = false,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  const baseClassName = accent
    ? "inline-flex items-center gap-1.5 border border-zinc-900 px-2.5 py-1.5 text-zinc-50"
    : "inline-flex items-center gap-1.5 border border-transparent px-2.5 py-1.5 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-900";

  return (
    <Link to={to} className={baseClassName}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
