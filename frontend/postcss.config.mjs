// Tailwind v4 ships its own PostCSS plugin and bundles autoprefixer, so the
// old `tailwindcss + autoprefixer` pair is replaced by a single entry.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
