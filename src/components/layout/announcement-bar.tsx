import Link from "next/link";
import { Megaphone } from "lucide-react";
import { getSettings } from "@/lib/queries";

export async function AnnouncementBar() {
  const { announcement } = await getSettings();
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const inner = (
    <div className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-on-accent">
      {announcement.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={announcement.image}
          alt=""
          className="h-6 w-6 shrink-0 rounded object-cover"
        />
      ) : (
        <Megaphone size={15} className="shrink-0" />
      )}
      <span className="flex-1 text-center">{announcement.text}</span>
    </div>
  );

  return (
    <div className="bg-accent">
      {announcement.href ? (
        <Link href={announcement.href} className="block hover:opacity-90">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
