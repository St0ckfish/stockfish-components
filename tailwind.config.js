/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(-50%, -50%) scale(1)',
          },
          '33%': {
            transform: 'translate(-55%, -45%) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-45%, -55%) scale(0.9)',
          },
          '100%': {
            transform: 'translate(-50%, -50%) scale(1)',
          },
        },
      },
      animation: {
        'blob': 'blob var(--animation-duration, 7s) infinite',
      },
      colors: {
        customScrollbar: "#131942",
        customScrollbarHover: "#554205",
        customScrollbarTrack: "#f1f1f1",
        scrollbar: {
          light: {
            track: 'rgba(243, 244, 246, 0.6)',
            thumb: 'rgba(156, 163, 175, 0.7)',
            thumbHover: 'rgba(107, 114, 128, 0.9)',
          },
          dark: {
            track: 'rgba(31, 41, 55, 0.6)', 
            thumb: 'rgba(75, 85, 99, 0.8)', 
            thumbHover: 'rgba(107, 114, 128, 1)',
          }
        }
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        '::-webkit-scrollbar': {
          width: '5px',
          height: '5px',
        },
        '::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '10px',
        },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(156, 163, 175, 0.6)', 
          borderRadius: '10px',
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
          transition: 'all 0.2s ease-in-out',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(107, 114, 128, 0.8)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '::-webkit-scrollbar-thumb:active': {
          background: 'rgba(75, 85, 99, 0.9)',
        },
        // Dark theme scrollbar
        '@media (prefers-color-scheme: dark)': {
          '::-webkit-scrollbar-thumb': {
            background: 'rgba(75, 85, 99, 0.7)',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(107, 114, 128, 0.9)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          },
          '::-webkit-scrollbar-thumb:active': {
            background: 'rgba(156, 163, 175, 0.8)',
          },
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.6) transparent',
        },
        '@media (prefers-color-scheme: dark)': {
          '*': {
            scrollbarColor: 'rgba(75, 85, 99, 0.7) transparent',
          },
        },
      });
    },
  ],
};

export default config;
