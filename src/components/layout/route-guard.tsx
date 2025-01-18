'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings-store';

const routes = ['/chat', '/templates', '/settings', '/functions'] as const;
type ValidRoute = typeof routes[number];

function isValidRoute(path: string): path is ValidRoute {
  return routes.some(route => path.startsWith(route));
}

const PUBLIC_PATHS = ['/settings', '/functions'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { apiKey } = useSettingsStore();

  useEffect(() => {
    if (pathname === '/') {
      router.replace('/chat');
      return;
    }

    if (!isValidRoute(pathname)) {
      router.replace('/chat');
    }

    if (!apiKey && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/settings');
    }
  }, [pathname, router, apiKey]);

  return <>{children}</>;
} 