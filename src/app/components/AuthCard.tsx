// Shared wrapper for all auth pages — consistent card + branding

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm">
      {children}
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">{title}</h1>
      <p className="text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

export function AuthInput({
  id, label, type = "text", value, onChange, placeholder, required = true, hint, disabled,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-50"
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function AuthButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {message}
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-zinc-100" />
      <span className="text-xs font-semibold text-zinc-400">{label}</span>
      <div className="flex-1 h-px bg-zinc-100" />
    </div>
  );
}
