export const ThemeScript = () => {
  const script = `
    (function() {
      function getTheme() {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          return stored;
        }
        return 'system';
      }
      
      function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      function applyTheme() {
        const theme = getTheme();
        const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
        
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      applyTheme();
    })();
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because we control the script content
  return <script dangerouslySetInnerHTML={script} />;
};
