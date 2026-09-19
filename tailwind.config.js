/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
      card: 'hsl(var(--card))', muted: 'hsl(var(--muted))', border: 'hsl(var(--border))',
      primary: 'hsl(var(--primary))', accent: 'hsl(var(--accent))',
      positive: 'hsl(var(--positive))', 'positive-bg': 'hsl(var(--positive-bg))',
      inverse: 'hsl(var(--inverse))', 'inverse-foreground': 'hsl(var(--inverse-foreground))',
      'logo-badge': 'hsl(var(--logo-badge))', 'brand-tint': 'hsl(var(--brand-tint))',
      whatsapp: 'hsl(var(--whatsapp))'
    },
    fontFamily: { display: ['Syne', 'sans-serif'], body: ['Inter', 'sans-serif'] }
  } },
  plugins: []
}
