'use client'

/**
 * Renders a blocking inline <script> as the very first child of <html>
 * so the dark class is applied before any paint — zero FOUC.
 *
 * The provider wrapper itself is a no-op; all real logic runs in the script.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/**
 * Tiny inline script to inject into <head> from the root layout.
 * Must stay as a plain string so it can be passed to dangerouslySetInnerHTML
 * without being processed by the React tree.
 */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch(e){}
})();
`

