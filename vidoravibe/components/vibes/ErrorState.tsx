export function ErrorState({ title = "Something needs attention", message }: { title?: string; message: string }) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900" role="alert">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
    </section>
  );
}
