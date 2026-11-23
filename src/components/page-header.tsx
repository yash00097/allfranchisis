export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{kicker}</p>
      <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </header>
  );
}

export const PAGE_MAIN_CLASS =
  "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10";
