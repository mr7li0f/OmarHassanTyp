# Recommended public/assets structure

- public/
  - assets/
    - css/        # extracted CSS (splash, critical, vendor)
    - js/         # extracted JS (content.data.js, splash.js, helpers)
    - img/        # shared images used by pages and previews
  - fonts/        # all font files (.otf, .woff2) — keep production-ready formats here
  - data/         # raw data and large ZIPs

## Notes

- Keep runtime files in `public/assets` and reference them with `./assets/...`.
- Prefer webfont formats (`.woff2`) for production; keep `.otf` as source.
- The repository includes `scripts/generate-sitemap.py` to create `public/sitemap.xml`.
- CI workflow `.github/workflows/generate-sitemap.yml` runs the script and uploads the sitemap artifact.

## Deployment

- Serve the `public/` folder as the site root on GitHub Pages.
- Commit `public/sitemap.xml` after running the generator locally or enable the workflow and download the artifact.
