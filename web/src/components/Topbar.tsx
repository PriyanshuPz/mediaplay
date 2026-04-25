type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="lg:hidden flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 hover:bg-accent"
        >
          ☰
        </button>
      </div>

      <div className="flex items-center gap-3 font-black">MediaPlay</div>
    </header>
  );
}
