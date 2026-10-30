# Pictures, videos and documents

The aim is a fast site that takes little space on the hosting account. The rule is simple: **store only small pictures; link to everything else.**

## Pictures (stored by us, always small)

Every picture uploaded in the admin panel (media library, school logo, cover and gallery) goes through `src/lib/media/optimize.ts` before it is saved:

- turned upright according to the camera orientation;
- shrunk to at most **1600 px** on the longer side (never enlarged);
- converted to **WebP** (quality 80), transparency kept for logos;
- stripped of hidden metadata: camera model, owner name and **GPS position**.

A 5 MB phone photo typically becomes 100 to 300 KB. Accepted input: JPEG, PNG, WebP, AVIF up to 8 MB and about 40 million pixels. SVG and HEIC (iPhone) files are refused; export HEIC photos as JPEG.

Limits per school: **15 gallery photos, 6 videos, 8 documents**. Choose the best photos instead of every photo.

Pictures uploaded before this existed can be converted in one go:

```bash
npm run media:optimize            # shows the saving, changes nothing
npm run media:optimize -- --apply # converts, switches every page to the new file, deletes the old one
```

The script refuses to touch a non-local project unless `ALLOW_REMOTE_MEDIA=1` is set. Run it on a copy of production data first.

The library marks pictures of 500 KB or more as **Large**; re-upload those or run the script.

## Videos (never stored by us)

Upload the video to YouTube as **Unlisted** and paste the link into the school (or article). The page shows a placeholder and loads nothing from YouTube until the visitor presses play, so the page stays fast and no visitor data goes to Google by simply opening a school page.

## Documents (links only)

Brochures, price lists and admission rules are added to a school as **links**: to the school's own website or to a shared drive (Google Drive, Dropbox, OneDrive, Yandex Disk) with “anyone with the link can view”. Links must start with `https://`. Visitors see where each link leads (“Opens Google Drive”) and it opens in a new tab. Nothing is uploaded to our server.

Check these links now and then: a document owner can delete the file or change its sharing.

## Why not Google Drive for pictures?

Drive is not a web file server. Picture links are not an officially supported way to serve a website, can stop working without notice, are slowed or blocked by download quotas for popular files, are not resized, and need whole folders to be public. It works well as a way for schools to *send* photos to the team, who then upload them (and are shrunk automatically).

## Later: object storage and a CDN

When the site is deployed, move the media bucket off the web server:

- **DigitalOcean Spaces** (S3-compatible, with a built-in CDN) fits a DigitalOcean setup. Supabase Storage can also stay in use if you host Supabase itself.
- Pictures are already small and referenced by full address, so moving them means copying the files and updating the addresses (a short migration script).
- Put the site behind a CDN (Cloudflare's free plan is enough to start) so images are served from nearby.

Also decide where Next.js keeps its optimised-image cache: on a server with a disk it grows (`.next/cache/images`); on serverless hosts use the CDN or Supabase image transformations instead.
