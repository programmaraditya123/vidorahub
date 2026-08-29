import type { ReactNode } from "react";
import Link from "next/link";

import { StructuredData } from "@/components/seo/StructuredData";
import { vidoraProducts } from "@/config/products";
import { socialLinks } from "@/config/social";
import { createVibeHref, VidoraVibeNav } from "./VidoraVibeNav";

const sources = [
  {
    name: "YouTube",
    description: "Bring your long-form YouTube videos.",
  },
  {
    name: "VidoraHub",
    description: "Turn your existing VidoraHub videos into Vibes.",
  },
  {
    name: "Video URL",
    description: "Process supported direct video URLs and cloud-hosted videos.",
  },
];

const meaningfulTypes = [
  "Strong hooks",
  "Valuable insights",
  "Key lessons",
  "Funny moments",
  "Emotional moments",
  "Smart discussions",
  "Complete stories",
  "Surprising moments",
];

const workSteps = [
  {
    title: "Add Your Video",
    body: "Paste a supported YouTube, VidoraHub, or direct video URL.",
  },
  {
    title: "VidoraVibe Understands It",
    body: "The system processes the video, extracts the audio, transcribes the content, and analyzes the context.",
  },
  {
    title: "Find the Moments That Matter",
    body: "VidoraVibe identifies meaningful, engaging, and context-complete moments.",
  },
  {
    title: "Create Your Vibes",
    body: "Selected moments become short-form videos with focused formatting and captions.",
  },
  {
    title: "Share Everywhere",
    body: "Preview and download your Vibes. Publishing back to VidoraHub is marked in-product when available.",
  },
];

const audiences = [
  {
    title: "Creators",
    body: "Turn podcasts, interviews, streams, and long videos into multiple short-form pieces.",
  },
  {
    title: "Educators",
    body: "Turn lectures and educational content into focused learning moments.",
  },
  {
    title: "Podcasters",
    body: "Turn long conversations into discoverable clips.",
  },
  {
    title: "Businesses",
    body: "Repurpose webinars, interviews, presentations, and events.",
  },
  {
    title: "VidoraHub Creators",
    body: "Turn your existing VidoraHub library into more content and prepare Vibes for the ecosystem.",
  },
];

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const internal = href.startsWith("/") || href.startsWith("#");
  if (internal) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function ProductVisualizer() {
  return (
    <div className="hero-visual" aria-label="Long video transformed into meaningful short Vibes">
      <div className="visual-top">
        <span>Long video</span>
        <div className="timeline" aria-hidden="true">
          <span className="moment moment-a" />
          <span className="moment moment-b" />
          <span className="moment moment-c" />
        </div>
      </div>
      <div className="ai-core">
        <span>AI understands context</span>
      </div>
      <div className="vibe-stack" aria-hidden="true">
        <div className="phone-card rose">
          <span>Hook</span>
          <strong>0:34</strong>
        </div>
        <div className="phone-card teal">
          <span>Insight</span>
          <strong>1:12</strong>
        </div>
        <div className="phone-card amber">
          <span>Story</span>
          <strong>0:58</strong>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-zinc-950">
      <StructuredData />
      <VidoraVibeNav />

      <section className="section hero-section">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="reveal space-y-7">
            <p className="w-fit rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-bold text-teal-800">
              From YouTube to VidoraHub. From long-form to short-form.
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
                Turn Long Videos Into Meaningful Vibes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-600">
                VidoraVibe finds the moments that matter, transforms them into engaging short videos, and helps you share them anywhere - or prepare them for VidoraHub.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={createVibeHref} className="inline-flex min-h-12 items-center justify-center rounded-md bg-teal-700 px-6 text-sm font-black text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
                Create Your First Vibe
              </Link>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-sm font-black text-zinc-900 transition hover:border-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
                See How It Works
              </a>
            </div>
          </div>
          <ProductVisualizer />
        </div>
      </section>

      <section id="sources" className="section border-y border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-teal-800">Source support</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal">One platform. Multiple sources.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-zinc-600">
              VidoraVibe works whether your best content lives on YouTube, inside VidoraHub, or behind a supported cloud video URL.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sources.map((source) => (
              <article key={source.name} className="reveal rounded-lg border border-zinc-200 bg-[#fbfbf9] p-6 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
                <h3 className="text-xl font-black">{source.name}</h3>
                <p className="mt-3 leading-7 text-zinc-600">{source.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <div className="reveal">
            <p className="text-sm font-black uppercase text-teal-800">What is VidoraVibe?</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">AI video repurposing for the moments people remember.</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">
              VidoraVibe is built for creators, educators, podcasters, businesses, and anyone sitting on hours of long-form video. Instead of manually watching an entire video and searching for clips, VidoraVibe analyzes the content, understands the conversation, identifies meaningful moments, and turns those moments into short-form videos.
            </p>
          </div>
          <div className="flow-panel reveal">
            {["Long-form content", "AI-powered understanding", "Meaningful moments", "Short-form Vibes"].map((item, index) => (
              <div key={item} className="flow-row">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="section bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-amber-300">Why VidoraVibe</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">Your best moments are buried inside your longest videos.</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-300">
              Creators spend hours watching, clipping, captioning, resizing, exporting, and uploading. VidoraVibe compresses that workflow into a focused path from long video to preview-ready Vibes.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="contrast-card border-rose-400/30 bg-rose-950/20">
              <h3>Without VidoraVibe</h3>
              <ol>
                {["2-hour video", "Watch everything", "Find moments", "Cut clips", "Caption", "Resize", "Export", "Upload"].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
            <article className="contrast-card border-teal-300/40 bg-teal-950/30">
              <h3>With VidoraVibe</h3>
              <ol>
                {["2-hour video", "VidoraVibe", "Meaningful Vibes", "Preview", "Download"].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-teal-800">Meaningful, not random</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">Not just clips. Meaningful Vibes.</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">
              VidoraVibe looks for context and meaning instead of blindly slicing videos into fixed time intervals.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {meaningfulTypes.map((type) => (
              <div key={type} className="reveal rounded-lg border border-zinc-200 bg-white p-5 font-bold shadow-sm transition hover:-translate-y-1 hover:border-amber-300">
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-black uppercase text-teal-800">Process</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">How VidoraVibe Works</h2>
          </div>
          <ol className="timeline-steps">
            {workSteps.map((step, index) => (
              <li key={step.title} className="reveal">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-black uppercase text-teal-800">Built for creators</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">Repurpose the content you already worked hard to make.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {audiences.map((audience) => (
              <article key={audience.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <h3 className="font-black">{audience.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{audience.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="section bg-[#ecefed]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-black uppercase text-teal-800">VidoraHub ecosystem</p>
            <h2 className="mt-3 text-4xl font-black tracking-normal">One Ecosystem. Built for Video.</h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600">
              VidoraVibe is one part of the VidoraHub ecosystem - built to help creators create, manage, discover, and grow with video.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {vidoraProducts.map((product) => (
              <article key={product.name} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
                <h3 className="text-xl font-black">{product.name}</h3>
                <p className="mt-3 min-h-24 text-sm leading-6 text-zinc-600">{product.description}</p>
                {product.current || product.url ? (
                  <ExternalLink href={product.current ? createVibeHref : product.url || ""} className="mt-5 inline-flex min-h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-black text-zinc-900 transition hover:border-teal-700 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
                    {product.cta}
                  </ExternalLink>
                ) : (
                  <span className="mt-5 inline-flex min-h-10 items-center rounded-md border border-zinc-200 px-4 text-sm font-black text-zinc-400">
                    URL not configured
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-teal-800 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black tracking-normal">Your next great short might already be inside your longest video.</h2>
            <p className="mt-4 text-lg leading-8 text-teal-50">
              Stop searching through hours of footage. Let VidoraVibe find the moments worth sharing.
            </p>
          </div>
          <Link href={createVibeHref} className="inline-flex min-h-12 shrink-0 items-center rounded-md bg-white px-6 text-sm font-black text-teal-900 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Create Your First Vibe
          </Link>
        </div>
      </section>

      <footer className="bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <h2 className="text-xl font-black">VIDORAVIBE</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Turn long videos into meaningful Vibes.</p>
          </div>
          <FooterColumn title="Products" items={vidoraProducts.filter((product) => product.current || product.url).map((product) => ({ name: product.name, href: product.current ? "/" : product.url || "" }))} />
          <FooterColumn
            title="VidoraVibe"
            items={[
              { name: "Create Vibes", href: createVibeHref },
              { name: "How It Works", href: "#how-it-works" },
              { name: "Supported Sources", href: "#sources" },
              { name: "FAQ", href: "#why" },
            ]}
          />
          <div>
            <h3 className="text-sm font-black uppercase text-zinc-300">Connect</h3>
            {socialLinks.length ? (
              <ul className="mt-4 space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <ExternalLink href={link.url} className="text-sm text-zinc-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                      {link.name}
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-zinc-500">Social links appear here when configured.</p>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
          Copyright 2026 VidoraHub. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, items }: { title: string; items: Array<{ name: string; href: string }> }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase text-zinc-300">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <ExternalLink href={item.href} className="text-sm text-zinc-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {item.name}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
