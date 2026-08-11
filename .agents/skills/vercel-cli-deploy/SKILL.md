---
name: vercel-cli-deploy
description: Use when deploying the meridian frontend to Vercel from a local machine via the Vercel CLI. Covers login, project linking, prebuilt artifact deployment, and rollbacks. Triggers: user says "deploy to vercel", "ship the frontend", "vercel deploy", or after pulling a frontend artifact from CI.
---

# Vercel CLI Deploy — meridian frontend

The meridian frontend is deployed to Vercel manually from the
developer's machine, not from CI. CI builds the production bundle
and uploads it as a GitHub Actions artifact (see
`.github/workflows/build.yml`); the developer pulls it locally and
runs `vercel deploy --prebuilt` to push it to Vercel.

## Why manual, not automated

- Avoids paying for cloud tiers while the project is pre-production.
- Gives the developer explicit control over when staging/production
  gets new code (no surprise deploys from a CI rerun).
- Works without any secrets stored in GitHub — the Vercel auth lives
  on the developer's machine in `~/.vercel/auth.json`.

When the project graduates past `v0.x.y` per the release workflow,
this skill gets revisited: the deploy step moves into a GitHub
Actions workflow using a `VERCEL_TOKEN` secret.

## Prerequisites — one-time setup

```bash
# 1. Install the Vercel CLI globally (or use npx vercel)
npm i -g vercel

# 2. Log in (interactive; opens a browser tab)
vercel login
#   ? Log in to Vercel
#   > Continue with GitHub        ← pick the option that matches your account
#   > Continue with Email
#   > Continue with GitLab
#   > Continue with Bitbucket
# Confirm in the browser. Auth token lands in ~/.vercel/auth.json.

# 3. Verify
vercel whoami

# 4. Link the project (once, in the repo root)
vercel link
#   ? Set up and deploy? Y
#   ? Which scope? <your-username>
#   ? Link to existing project? N    (Y if a project already exists)
#   ? What's your project's name? meridian-frontend
#   ? In which directory is your code located? ./frontend
# Creates .vercel/ folder with project.json. Gitignore .vercel/ in
# the repo — only project.json (without auth) is fine to commit, but
# default is to gitignore it.
```

## Deploying a prebuilt artifact

CI produced `meridian-frontend-<sha>.zip` on the Actions tab. Pull it
to a clean directory and deploy:

```bash
# Pull from the latest successful master build
gh run download --name meridian-frontend-$(git rev-parse origin/master)

# The artifact contains dist/meridian/browser/. Either cd into it
# (vercel auto-detects static output) or pass --build-output-dir.
cd dist/meridian/browser

# Deploy to production
vercel deploy --prebuilt --prod

# Or to a preview URL (no --prod flag)
vercel deploy --prebuilt
# Output: "✅ Preview: https://meridian-frontend-<hash>-<user>.vercel.app"
```

The `--prebuilt` flag tells Vercel not to rebuild — it ships the
exact bundle CI produced. This guarantees the deployed code matches
the CI-tested code byte-for-byte.

## Promoting a preview to production

```bash
vercel promote <deployment-url-or-id> --prod
# Example:
vercel promote https://meridian-frontend-abc123.vercel.app --prod
```

## Rolling back

```bash
# List recent deployments
vercel ls

# Roll back to a specific deployment
vercel rollback <deployment-url-or-id>
```

## Verifying after deploy

```bash
# Hit the production URL and check the response
curl -I https://meridian-frontend.vercel.app
# Expect: HTTP/2 200

# Check the SPA shell renders
curl -s https://meridian-frontend.vercel.app | grep -E '<title>|meridian'
```

## Common pitfalls

1. **`vercel deploy` rebuilds instead of using the artifact** — you
   forgot `--prebuilt`. Add it.

2. **"Project not found"** — the repo's `.vercel/project.json` points
   at a deleted project. Re-run `vercel link`.

3. **Wrong output directory** — Angular 17+ defaults to
   `dist/<project-name>/browser`. Run `vercel.json` if you need to
   override:
   ```json
   { "buildCommand": "ng build", "outputDirectory": "dist/meridian/browser" }
   ```

4. **Auth expired** — `vercel login` again. Tokens in
   ~/.vercel/auth.json don't auto-refresh forever.

5. **Deploy succeeded but the URL shows a 404** — Vercel is serving
   the right bundle but Angular's router needs server-side rewrites
   for client-side routes. Add `vercel.json` rewrites:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

## See also

- `.github/workflows/build.yml` — CI workflow that produces the
  artifact this skill deploys
- `.agents/workflows/release.yaml` — when v1.0.0 cuts, this skill
  evolves to use a `VERCEL_TOKEN` secret in CI
- `.agents/skills/git-conventions/SKILL.md` — branch + commit rules
  that govern when deploys happen