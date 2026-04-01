# 3D Vinyl Record Player 🎵

A fun, interactive 3D vinyl record player built with React and Three.js. Search for your favorite albums, drop the needle, and watch the record spin!

> **Just For Fun!**
> This project is built only for fun. It uses the public iTunes Search API to fetch music data. Because of this, **each song is only a 30-second preview clip**, not the full track. 

## Features

- **Interactive 3D Turntable:** Fully rendered in 3D using Three.js. You can drag to orbit around the record player and scroll to zoom in/out.
- **Dynamic Album Art:** The center label of the vinyl record dynamically updates to match the album artwork of the currently playing record.
- **iTunes Integration:** Search for any album available on iTunes (no login required).
- **Working Tone Arm:** The tone arm automatically moves to the record when playing and tracks its progress as the 30-second clips play.

## Tech Stack

- **Frontend Framework:** React (with Vite)
- **3D Rendering:** Three.js
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Data Source:** iTunes Search API

## How to Run Locally

If you've downloaded the source code, you can run this project on your own machine:

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Open your terminal in the project folder.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:3000` (or whatever port Vite provides).

## Deployment

This project is a standard Vite application and can be easily deployed to platforms like **Vercel**, **Netlify**, or **GitHub Pages**. Just connect your repository and use the standard build command (`npm run build`) and publish directory (`dist`).
