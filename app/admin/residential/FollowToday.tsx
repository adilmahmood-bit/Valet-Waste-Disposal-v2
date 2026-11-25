"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const todaySD = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

// Keeps the admin tabs on the current San Diego day. A tab left open overnight (or reopened
// on a phone the next morning) would otherwise keep showing yesterday's ?date=. When the day
// changes, a page sitting on a past date jumps to today (old ?msg/?err notes are dropped);
// one without a date, or looking ahead on purpose, just reloads its data.
export default function FollowToday() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let day = todaySD();
    const check = () => {
      if (document.visibilityState !== "visible") return;
      const now = todaySD();
      if (now === day) return;
      day = now;
      const url = new URL(window.location.href);
      const date = url.searchParams.get("date");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < now) {
        url.searchParams.delete("date");
        url.searchParams.delete("msg");
        url.searchParams.delete("err");
        router.replace(`${url.pathname}${url.search}`, { scroll: false });
      } else {
        router.refresh();
      }
    };
    const timer = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [router, pathname]);

  return null;
}
