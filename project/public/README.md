# Public Assets Folder

This folder contains static assets that are served at the root of the website.

## Logo File

**IMPORTANT:** Replace the placeholder `logo.svg` with your actual `logo.png` file (500x150 px).

### Steps to Add Your Logo:
1. Delete or rename `logo.svg` (this is just a placeholder)
2. Add your `logo.png` file to this folder (`/public/logo.png`)
3. Update `/src/components/Header.tsx` line 49: change `/logo.svg` to `/logo.png`
4. Refresh your browser

### Logo Specifications
- File name: `logo.png` (preferred) or `logo.svg`
- Recommended size: 500x150 pixels
- Format: PNG with transparency or SVG
- Location: `/public/logo.png`

The logo is displayed in the header with:
- **Desktop height:** 42px
- **Mobile height:** 34px
- **Width:** Auto (aspect ratio preserved)
- **Text:** "Tuğba Öztürk Kurs Merkezi" appears next to logo on tablet+

After replacing the logo file, the actual logo will appear in the header automatically.
