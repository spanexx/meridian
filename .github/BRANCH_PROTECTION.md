# Branch Protection — master

To apply (after the repo exists at https://github.com/spanexx/meridian):

## Via GitHub UI

Settings → Branches → Add rule → Branch name pattern: `master`

Required settings:
- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (after CODEOWNERS file is added)
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required checks (added after ci.yml exists):
    - `lint`
    - `build`
    - `test`
- [x] Require conversation resolution before merging
- [x] Require linear history (no merge commits)
- [x] Require signed commits (optional, recommended)
- [x] Include administrators (the rule applies to you too)

Optional:
- [ ] Require deployments to succeed before merging
- [ ] Lock branch (only after the project stabilizes)
- [ ] Do not allow bypassing the above settings

## Via `gh` CLI (faster, reproducible)

After `gh auth login` and once ci.yml is in place:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/spanexx/meridian/protection/branches/master \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "build", "test"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "required_conversation_resolution": true,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "enforce_admins": true
}
JSON
```

Note: `contexts` array must match the names of the github-actions jobs
that run on PR. Update after ci.yml lands.

## CODEOWNERS (optional)

Create `.github/CODEOWNERS` with the repo owner as default reviewer:

```
# Default owners for everything in this repo
*       @spanexx
```

After this lands, the protection rule "Require review from Code Owners"
above will require your approval on every PR.

## What this prevents

- Direct pushes to master (no bypass)
- Merging without CI green
- Merging without a review
- Merge commits (history stays linear and bisectable)
- Force-pushes (no rewriting history)

## When to relax

- Single-maintainer phase (now): strict is fine; you can self-approve.
- Multi-maintainer phase: keep strict; rotation is built-in via the
  approval requirement.
- Public contributor phase: consider removing "enforce_admins" so
  emergency hotfixes can land fast, but keep everything else.

## See also

- `.agents/skills/git-conventions/SKILL.md` — branch + commit rules
- `.github/pull_request_template.md` — PR body template
- `.agents/workflows/release.yaml` — tag + release flow (uses master
  as the source of truth)