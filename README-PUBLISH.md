# Publish "Sylhet through DazzCam" on GitHub Pages (free)

Your book is already a plain static site — no server needed online.
GitHub Pages will serve it exactly like the local preview.

## One-time setup (5 minutes)

1. Double-click **`publish.bat`** in this folder.
   - It stages and commits everything (code + photos).
   - It prints the next steps (also listed below).
2. Go to **github.com** and create a **new empty repository**
   (no README, no .gitignore) — e.g. `sylhet-through-dazzcam`.
3. Back in this folder, open a terminal (or Git Bash) and run
   (replace `USER` and `REPO` with yours):
   ```
   git remote remove origin 2>nul & git remote add origin https://github.com/USER/REPO.git
   git push -u origin main
   ```
   GitHub will ask you to sign in the first time.
4. On the repository page: **Settings → Pages** → under
   *Build and deployment*: Source = **Deploy from a branch**,
   Branch = **main**, folder = **/ (root)** → **Save**.
5. Wait 1–2 minutes, then open:
   ```
   https://USER.github.io/REPO/
   ```
   That is the link you send friends. The photo-picker toolbar
   stays hidden automatically; add `?edit=1` to the URL when
   *you* want the editing controls back.

## Updating later

After changing photos or text, just run:
```
node make-thumbs.mjs
node build.mjs
node export-standalone.mjs
git add -A
git commit -m "Update book"
git push
```
Pages redeploys automatically in a minute or two.

## Notes

- `node_modules/` and `share/` are ignored via `.gitignore`
  (tooling + the single-file copy stay on your PC only).
- Everything else — pages, cover, 31 photos, styles — is published.
- Your originals in `assets/photos/` are included, so the
  repository is also a full backup of the project.
