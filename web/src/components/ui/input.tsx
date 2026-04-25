type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function Input({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-input px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
