/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1B2A",
          soft: "#132638",
          line: "#24384E",
        },
        paper: {
          DEFAULT: "#F4F5F2",
          card: "#FFFFFF",
          sunk: "#EAEBE6",
        },
        rule: "#DBDDD6",
        slate: {
          DEFAULT: "#5A6472",
          soft: "#8A929D",
        },
        stamp: {
          DEFAULT: "#D0342C",
          soft: "#F6E4E2",
          deep: "#A82820",
        },
        route: {
          DEFAULT: "#1B4B8F",
          soft: "#E2E9F4",
        },
        signal: {
          DEFAULT: "#1F7A5C",
          soft: "#E0F0EA",
        },
        hold: {
          DEFAULT: "#B07203",
          soft: "#FAEFD8",
        },
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        sans: ["'Instrument Sans'", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        lift: "0 1px 2px rgba(14,27,42,0.06), 0 8px 24px -12px rgba(14,27,42,0.18)",
        panel: "0 24px 60px -20px rgba(14,27,42,0.35)",
      },
      maxWidth: {
        shell: "1240px",
        prose: "68ch",
      },
      keyframes: {
        stripeRun: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "56px 0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        stripeRun: "stripeRun 1.6s linear infinite",
        pulseDot: "pulseDot 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
