# J/CHH

Portfolio site for Jasmin (J/CHH): UI/UX designer, web developer and AI builder.
Plain HTML, CSS and ES modules. No framework, no build step, no dependencies.

## Run it

```bash
npm run dev        # or: node server.js
# http://localhost:5173
```

The dev server falls back to `index.html` for `/about`, `/contact` and `/project/<slug>`. This is needed because the site uses real URLs (History API) instead of `#hash` routes.

## Structure

```
index.html          markup, head/meta, project cards
css/styles.css      tokens, layout, motion, dark theme, mobile
js/data.js          ALL content: projects, services, En/Fr/De strings
js/main.js          intro, routing, scroll-spy, overlay, cursor, i18n, theme
assets/img/*.webp   optimised project images (from the brand-margin PNG export)
assets/og.jpg       social preview image
server.js           local dev server with SPA fallback
_redirects          Netlify / Cloudflare Pages fallback
vercel.json         Vercel fallback
```

## Editing content

- **Text, translations, projects, which services apply to which project:** `js/data.js`.
  Project descriptions there are first drafts. Set `url` on a project to show a "Visit site" link.
- **Add a project:** add an object to `projects` in `data.js`, add its images to `assets/img/`, and add a matching `<a class="card" data-slug="...">` in `index.html` (set `--card-bg` to the colour of the image margin).
- **Colours and sizes:** the tokens at the top of `css/styles.css`. `--fs` is the single text size; `--left-w` and `--col-x` define the two columns.

## Behaviour worth knowing

- The logo is white with `mix-blend-mode: difference`, so it reads on cream, dark and photos without extra logic.
- Services that a project does not use turn grey in the right column.
- `/`, `/about` and `/contact` are one scrolling page; the URL and nav underline follow scroll position.
- `/project/<slug>` opens the overlay without a reload. Esc or Close returns to the list at the same scroll position.
- Language (En/Fr/De) and theme are remembered in `localStorage`; theme defaults to the OS setting.
- `prefers-reduced-motion` skips the intro and all transitions.

## Deploying

Any static host works. Root-relative URLs (`/assets/...`) assume the site lives at the domain root. For a sub-path (for example a GitHub Pages project site), add a `<base href>` and make the paths relative.
Before launch, set `og:image` in `index.html` to an absolute URL.

## Fonts

Hanken Grotesk loads from Google Fonts. To self-host, download the woff2 from Google Fonts or Fontsource, put it in `assets/fonts/`, add an `@font-face` in `css/styles.css` and remove the two Google `<link>` tags.
