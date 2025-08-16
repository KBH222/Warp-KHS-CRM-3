/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Override default font sizes with 15% increase
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 13.8px (12px * 1.15)
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 16.1px (14px * 1.15)
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 18.4px (16px * 1.15)
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 20.7px (18px * 1.15)
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 23px (20px * 1.15)
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 27.6px (24px * 1.15)
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 34.5px (30px * 1.15)
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 41.4px (36px * 1.15)
        '5xl': ['3rem', { lineHeight: '1' }],           // 55.2px (48px * 1.15)
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 69px (60px * 1.15)
        '7xl': ['4.5rem', { lineHeight: '1' }],         // 82.8px (72px * 1.15)
        '8xl': ['6rem', { lineHeight: '1' }],           // 110.4px (96px * 1.15)
        '9xl': ['8rem', { lineHeight: '1' }],           // 147.2px (128px * 1.15)
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      minHeight: {
        'touch': '48px', // Minimum touch target size
      },
      minWidth: {
        'touch': '48px', // Minimum touch target size
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'check': 'check 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        check: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
  },
  plugins: [],
}