import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Mic2, Pause, Share2, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "AI writes your script", text: "Pick a topic and tone, get a ready-to-record episode." },
  { icon: Mic2, title: "6 natural studio voices", text: "Warm, expressive voices with American and British accents." },
  { icon: ImageIcon, title: "Cover art in one click", text: "Generate artwork with AI, or upload your own." },
  { icon: Share2, title: "Publish and share", text: "Every episode gets a link that previews nicely in chats and social feeds." },
];

// Deterministic bar heights for the decorative waveform
const BARS = Array.from({ length: 36 }, (_, i) => 30 + Math.round(Math.abs(Math.sin(i * 1.7) * 55 + Math.cos(i * 0.6) * 15)));

function NowPlayingCard() {
  return (
    <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-black-1/70 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_60%)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-12 font-semibold uppercase tracking-wider text-violet-300">Now playing</p>
          <p className="truncate text-16 font-bold text-white-1">The Curious History of Coffee</p>
          <p className="text-12 text-white-3">Thalia · AI voice</p>
        </div>
        <span className="flex-center size-10 shrink-0 rounded-full bg-white-1 text-black-3">
          <Pause className="size-4" fill="currentColor" />
        </span>
      </div>
      <div className="mt-5 flex h-12 items-center gap-[3px]" aria-hidden>
        {BARS.map((height, i) => (
          <span
            key={i}
            className={`w-full origin-center rounded-full ${i < 15 ? "bg-violet-400" : "bg-white/20"} animate-equalizer`}
            style={{ height: `${height}%`, animationDelay: `${(i % 7) * 0.12}s`, animationDuration: `${1 + (i % 5) * 0.15}s` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-12 tabular-nums text-white-3">
        <span>0:58</span>
        <span>2:14</span>
      </div>
    </div>
  );
}

/** Brand panel on the left of the sign-in and sign-up pages (desktop only). */
export default function AuthShowcase() {
  return (
    <aside className="relative hidden overflow-hidden bg-black-1 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Background glow and grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 right-0 size-[420px] rounded-full bg-orange-1/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <Link href="/" className="relative flex w-fit items-center gap-2.5">
        <Image src="/icons/Logo.jpeg" alt="" width={36} height={36} className="rounded-lg" />
        <span className="text-24 font-extrabold text-white-1">Groei</span>
      </Link>

      <div className="relative flex flex-col gap-10">
        <div className="flex max-w-lg flex-col gap-4">
          <h2 className="text-[44px] font-extrabold leading-[1.1] tracking-tight text-white-1">
            Turn ideas into{" "}
            <span className="bg-gradient-to-r from-violet-400 to-orange-1 bg-clip-text text-transparent">
              podcasts
            </span>{" "}
            with AI.
          </h2>
          <p className="text-18 text-white-2">
            Write, voice and publish a full episode in minutes. No microphone, no editing, no cost.
          </p>
        </div>

        <ul className="grid max-w-xl grid-cols-2 gap-x-8 gap-y-6">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-2">
              <span className="flex-center size-10 rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                <Icon className="size-5 text-violet-300" />
              </span>
              <p className="text-14 font-bold text-white-1">{title}</p>
              <p className="text-12 leading-relaxed text-white-3">{text}</p>
            </li>
          ))}
        </ul>

        <NowPlayingCard />
      </div>

      <p className="relative text-12 text-white-3">© {new Date().getFullYear()} Groei · Made with Next.js, Convex & Clerk</p>
    </aside>
  );
}
