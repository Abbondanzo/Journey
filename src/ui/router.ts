import { useEffect, useState } from 'react';

/** Tiny hash router: works on static hosting with no rewrites, and offline. */
export const href = (path: string) => `#${path}`;

export function navigate(path: string, replace = false) {
  if (replace) window.location.replace(href(path));
  else window.location.hash = path;
}

export function currentPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function usePath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const on = () => {
      setPath(currentPath());
      window.scrollTo?.(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}
