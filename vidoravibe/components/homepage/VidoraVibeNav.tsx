import Link from "next/link";

export const createVibeHref = "/vibes/create";

export function VidoraVibeNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#f7f8f6]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-base font-black tracking-normal text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          VidoraVibe
        </Link>
        <div className="hidden items-center gap-6 text-sm font-semibold text-zinc-700 md:flex">
          <Link
            href="/#how-it-works"
            className="transition hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            How It Works
          </Link>
          <Link
            href="/#why"
            className="transition hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            Why VidoraVibe
          </Link>
          <Link
            href="/#ecosystem"
            className="transition hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            VidoraHub
          </Link>
        </div>
        <Link
          href={createVibeHref}
          className="rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          Create Vibes
        </Link>
      </div>
    </nav>
  );
}
