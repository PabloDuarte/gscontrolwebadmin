export function PageHeader({
  titulo,
  descripcion,
  acciones,
  imagen,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
  imagen?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex min-w-0 items-start gap-4">
        {imagen}
        <div className="min-w-0 space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">{titulo}</h1>
          {descripcion ? (
            <p className="text-base text-muted-foreground">{descripcion}</p>
          ) : null}
        </div>
      </div>
      {acciones ? <div className="flex shrink-0 items-center gap-2">{acciones}</div> : null}
    </div>
  );
}
