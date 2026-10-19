/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: "#ffffff",
          subtle: "#FBFBFA",
          hover: "#F1F1EF",
          border: "#E9E9E7",
          darkborder: "#D3D3D0",
          text: "#37352F",
          secondary: "#787774",
          light: "#9B9A97",
          blue: "#2383E2",
          bluelight: "#EBF5FB",
          green: "#0F7B6C",
          greenlight: "#EDF6F3",
          red: "#EB5757",
          redlight: "#FDF5F5",
          yellow: "#DFAB01",
          yellowlight: "#FDF8E8",
          orange: "#D9730D",
          tag: "#EFEFED",
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Helvetica',
          '"Apple Color Emoji"',
          'Arial',
          'sans-serif',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
        mono: [
          '"SFMono-Regular"',
          'Menlo',
          'Consolas',
          '"PT Mono"',
          '"Liberation Mono"',
          'monospace'
        ]
      },
      boxShadow: {
        notion: "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px",
        'notion-card': "rgba(15, 15, 15, 0.04) 0px 0px 0px 1px, rgba(15, 15, 15, 0.03) 0px 2px 4px",
        'notion-sm': "rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 1px 2px",
      }
    },
  },
  plugins: [],
}
