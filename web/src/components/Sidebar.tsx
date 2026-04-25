import { NavLink } from "react-router-dom";
import { FaHouse, FaFilm, FaTv, FaMusic, FaGear } from "react-icons/fa6";
import { cn } from "../lib/utls";

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function Sidebar({ open, setOpen }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed z-50 flex h-full w-64 flex-col bg-card border-r transition-transform
          lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 text-lg font-black">MediaPlay</div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          <SidebarItem to="/" label="Home" icon={<FaHouse />} />
          <SidebarItem to="/movies" label="Movies" icon={<FaFilm />} />
          <SidebarItem to="/series" label="Series" icon={<FaTv />} />
          <SidebarItem to="/music" label="Music" icon={<FaMusic />} />
        </nav>

        <div className="border-t p-2">
          <SidebarItem to="/admin" label="Admin" icon={<FaGear />} />
        </div>
      </aside>
    </>
  );
}

type Props = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

export function SidebarItem({ to, label, icon }: Props) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
