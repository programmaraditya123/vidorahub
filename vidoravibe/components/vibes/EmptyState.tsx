export function EmptyState({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
      {message}
    </section>
  );
}
