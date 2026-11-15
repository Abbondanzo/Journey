import { useJourney } from './ui/data';
import { usePath } from './ui/router';
import { Home } from './ui/screens/Home';
import { lazy, Suspense } from 'react';
import type { SourceFactory } from './ui/screens/ImportFlow';
import { Patches, Trails } from './ui/screens/Lists';
import { TrailView } from './ui/screens/TrailView';

// Screens that need the airport and city tables load them on demand.
const ImportFlow = lazy(() => import('./ui/screens/ImportFlow').then((m) => ({ default: m.ImportFlow })));
const Pin = lazy(() => import('./ui/screens/Pin').then((m) => ({ default: m.Pin })));
const Settings = lazy(() => import('./ui/screens/Settings').then((m) => ({ default: m.Settings })));

const loading = <p style={{ padding: 24 }}>Opening your atlas…</p>;

export function App({ sourceFactory }: { sourceFactory?: SourceFactory }) {
  return (
    <Suspense fallback={loading}>
      <Routes sourceFactory={sourceFactory} />
    </Suspense>
  );
}

function Routes({ sourceFactory }: { sourceFactory?: SourceFactory }) {
  const path = usePath();
  const j = useJourney();
  if (path === '/import') return <ImportFlow factory={sourceFactory} />;
  if (!j) return loading;
  if (path === '/pin') return <Pin j={j} />;
  if (path === '/trails') return <Trails j={j} />;
  if (path === '/patches') return <Patches j={j} />;
  if (path === '/settings') return <Settings j={j} />;
  const trail = /^\/trail\/(.+)$/.exec(path);
  if (trail) return <TrailView j={j} id={decodeURIComponent(trail[1])} />;
  return <Home j={j} />;
}
