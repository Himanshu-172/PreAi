type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase text-slate-500">PrepAI</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
    </section>
  );
}
