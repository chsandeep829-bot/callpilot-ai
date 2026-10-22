# CallPilot AI

A mobile-friendly starter for a consent-aware AI calling workflow.

## Included
- Responsive campaign dashboard
- Campaign purpose and language selection
- Local simulation with consent and opt-out checks
- Cloudflare Worker API endpoint for OmniRoute
- Cloudflare static assets configuration

## Important
This project does not place real telephone calls. A model router does not provide telephony by itself. Real calls require a separate provider, speech input/output, verified consent, opt-out enforcement, calling-hour controls, and a compliance review.

## Configure OmniRoute
Set these in Cloudflare Worker settings:
- `OMNIROUTE_API_KEY` as a Secret
- `OMNIROUTE_BASE_URL` as a variable pointing to the publicly reachable OmniRoute API base
- `OMNIROUTE_MODEL` as a model ID supported by your OmniRoute server

Never put API keys in browser JavaScript or commit them to GitHub.

## Deploy
Use Cloudflare Workers with static assets and the included `wrangler.toml`. Test `/api/health` after deployment. The default localhost API URL is only a placeholder and will not work from a cloud Worker.
