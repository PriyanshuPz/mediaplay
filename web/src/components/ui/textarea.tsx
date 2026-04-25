type TextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function Textarea({ label, value, onChange }: TextareaProps) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-md border bg-input px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
