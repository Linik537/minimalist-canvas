/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))', muted: 'hsl(var(--muted))', border: 'hsl(var(--border))',
      primary: 'hsl(var(--primary))', accent: 'hsl(var(--accent))'
    },
    fontFamily: { display: ['Syne', 'sans-serif'], body: ['Inter', 'sans-serif'] }
  } },
  plugins: []
}
