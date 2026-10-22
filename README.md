# Study Hub — AWS CLF-C02 / AIF-C01 practice

Static, zero-dependency exam trainer. Open `index.html`, pick CLF-C02 or AIF-C01, practice with instant scoring + starred review. Question banks in `data/*.json`.

## Run

No build. Serve locally (avoids `file://` quirks):

```bash
npx serve .   # or: python3 -m http.server 8000
# open http://localhost:8000
```

Deploys anywhere static: GitHub Pages, Netlify, Nginx.

## Layout

```
index.html        # home + exam picker
exam.html         # exam runner (uses assets/exam.js)
assets/           # home.js, exam.js, study-lab.css
data/
  aws-clf.json    # CLF-C02 questions
  aws-aif.json    # AIF-C01 questions
  exams.json      # exam index
```

## Notes

- Answers are in plaintext JSON (client-side by design). Fine for self-study; don't use for proctored exams.
- Starred questions persist in `localStorage`.

## License

MIT — see [LICENSE](LICENSE).
