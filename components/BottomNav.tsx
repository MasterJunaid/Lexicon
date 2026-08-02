'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookmarkIcon, ChartIcon, FeedIcon, PracticeIcon, SunIcon } from './Icons';

const TABS = [
  { href: '/', label: 'Feed', Icon: FeedIcon, exact: true },
  { href: '/word-of-the-day', label: 'Daily', Icon: SunIcon },
  { href: '/practice', label: 'Practice', Icon: PracticeIcon },
  { href: '/lexicon', label: 'Lexicon', Icon: BookmarkIcon },
  { href: '/stats', label: 'Stats', Icon: ChartIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t rule backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg) 88%, transparent)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex h-[62px] flex-col items-center justify-center gap-1 transition-opacity"
                style={{ color: active ? 'var(--ink)' : 'var(--faint)' }}
              >
                <Icon size={21} />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ opacity: active ? 1 : 0.85 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
