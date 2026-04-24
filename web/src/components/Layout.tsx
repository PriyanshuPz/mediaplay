import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
