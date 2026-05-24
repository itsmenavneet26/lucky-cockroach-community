import { Users, MapPin, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

const stats = [
  { icon: Users, value: "100K", label: "Cockroaches strong" },
  { icon: MapPin, value: "29 States", label: "One movement" },
  { icon: ShieldCheck, value: "Safe Space", label: "Support, not politics" },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />

      <div className="flex flex-1">
        {/* Left — hero panel (always dark) */}
        <div className="relative hidden w-1/2 shrink-0 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/auth/hero.webp)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-[#0d0b0a]/55 to-[#0d0b0a]/80" />

          <div className="relative flex h-full flex-col justify-center gap-12 p-10 xl:p-14">
            <div>
              <h1 className="text-[44px] font-semibold leading-[1.05] tracking-tight text-white xl:text-[52px]">
                For students.
                <br />
                By students.
                <br />
                <span className="text-accent-light">For change.</span>
              </h1>
              <div className="mt-4 h-1 w-14 rounded-full bg-accent" />
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
                The community of the Lucky Cockroach movement — 100,000 students
                and unemployed youth standing against paper leaks, recruitment
                delays, and exam fraud. Share your fight. You are not alone.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-accent/20 text-accent-light">
                    <Icon size={17} />
                  </span>
                  <p className="mt-2 text-[14px] font-semibold text-white">
                    {value}
                  </p>
                  <p className="text-[11px] text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form panel (theme-aware) */}
        <main className="flex w-full flex-col bg-surface lg:w-1/2">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12 sm:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
