type SectionHeadingProps = {
  /** Section number in the home order, e.g. 2 → "02 / 06". */
  index: number;
  total?: number;
  label: string;
  title: string;
  id?: string;
};

/** Mono index label (scrambles in from binary) + H2 (lines slide up from a mask). */
export function SectionHeading({ index, total = 6, label, title, id }: SectionHeadingProps) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <header className="mb-10 flex flex-col gap-3 lg:mb-14">
      <p className="label text-dim">
        <span className="text-cyan">{pad(index)}</span> / {pad(total)} ·{" "}
        <span data-scramble>{label}</span>
      </p>
      <h2 id={id} className="text-h2 font-semibold" data-reveal="split">
        {title}
      </h2>
    </header>
  );
}
