/** @type {import('tailwindcss').Config} */

// Paleta ZELO — baseada nas cores da logo (#3DCF74 verde, #2F86C9 azul).
//
// As escalas `emerald` e `blue` são sobrescritas de propósito: o app já usa
// essas famílias como cor de destaque e de ação, então o rebrand acontece sem
// precisar editar dezenas de componentes. Os tons 600/700 foram escurecidos em
// relação à cor "pura" da marca para manter contraste AA com texto branco.
const zeloGreen = {
  50: '#EAF6EF',
  100: '#D2ECDD',
  200: '#A6D9BB',
  300: '#6FC394',
  400: '#46B077',
  500: '#34A65F',
  600: '#157A4C',
  700: '#0F5F3B',
  800: '#0B4A2E',
  900: '#083823',
  950: '#042417',
};

const zeloBlue = {
  50: '#EAF4FB',
  100: '#D2E8F7',
  200: '#A6D1EF',
  300: '#74B6E4',
  400: '#4E9FD9',
  500: '#3E93C9',
  600: '#1F6FA8',
  700: '#1A5C8B',
  800: '#14496E',
  900: '#0F3754',
  950: '#082338',
};

// Neutros com leve viés verde, derivados de `zelo-surface`, `zelo-mist`,
// `zelo-muted` e `zelo-ink`. A escala `slate` do Tailwind é sobrescrita para
// que modais, painel administrativo e formulários já existentes deixem de ter
// cinza-azulado e passem a conversar com a identidade ZELO — sem precisar
// reescrever cada classe neutra do app.
const zeloNeutral = {
  50: '#F4F7F5',
  100: '#E9F0EC',
  200: '#DCE4E1',
  300: '#C4D2CB',
  400: '#74887D',
  500: '#62766C',
  600: '#4A5A61',
  700: '#384740',
  800: '#28342E',
  900: '#16241E',
  950: '#0A1511',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Breakpoint extra para celulares muito estreitos (iPhone SE etc.):
        // abaixo de 400px escondemos itens secundários da barra do topo.
        xs: '400px',
      },
      colors: {
        emerald: zeloGreen,
        blue: zeloBlue,
        slate: zeloNeutral,
        zelo: {
          green: '#1B8E5A',
          'green-bright': '#34A65F',
          'green-dark': '#0B3D28',
          blue: '#2F86C9',
          'blue-bright': '#3E93C9',
          navy: '#06365D',
          ink: '#0F172A',
          muted: '#4A5A61',
          surface: '#F4F7F5',
          mist: '#DCE4E1',
          risk: '#E8A33D',
        },
      },
      backgroundImage: {
        // Borda em gradiente dos formulários (identidade ZELO).
        'zelo-gradient': 'linear-gradient(100deg, #3E93C9 0%, #1B6B3E 100%)',
      },
      boxShadow: {
        zelo: '0 12px 32px -14px rgba(11, 61, 40, 0.45)',
      },
    },
  },
  plugins: [],
};
