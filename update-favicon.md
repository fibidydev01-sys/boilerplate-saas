# Favicon Update Workflow

Quick guide to update favicons using [favicomatic.com](https://favicomatic.com/).

---

## How to Use

**Step 1 — Generate favicons**

Go to [favicomatic.com](https://favicomatic.com/), upload your logo, and download the ZIP.

**Step 2 — Place the files**

Extract the ZIP and put the folder into:

```
public/favicomatic/
```

**Step 3 — Run the script**

```bash
./update-favicon.sh
```

The script will show a preview first, then ask for confirmation before making any changes.

---

## What the Script Does

| Action | Detail |
|--------|--------|
| Replace | Copies files from `favicomatic/` into `branding/` with correct names |
| Keep | `logo.png` and `logo-sm.png` are never touched |
| Delete | Removes `favicomatic/` and `favicon/` folders after copying |

## File Mapping

| From (`favicomatic/`) | To (`branding/`) |
|---|---|
| `apple-touch-icon-152x152.png` | `apple-touch-icon.png` |
| `favicon.ico` | `favicon.ico` |
| `favicon-196x196.png` | `icon-192.png` |
| `favicon-128.png` | `icon-144.png` |
| `favicon-96x96.png` | `icon-96.png` |
| `favicon-32x32.png` | `icon-48.png` |
| `apple-touch-icon-72x72.png` | `icon-72.png` |
| `mstile-144x144.png` | `icon-512.png` |

---

> Tool: [favicomatic.com](https://favicomatic.com/)