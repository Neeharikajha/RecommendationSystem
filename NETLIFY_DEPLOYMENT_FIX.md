# Netlify Deployment Fix

## Issue Fixed

The build was failing because you were using `REACT_APP_` environment variable prefixes (for Create React App) instead of `VITE_` prefixes required by Vite.

## Changes Made

1. **Updated `frontend/.env`**: Changed all `REACT_APP_*` variables to `VITE_*`
2. **Updated `frontend/src/firebase.js`**: Changed `process.env.REACT_APP_*` to `import.meta.env.VITE_*`
3. **Updated `netlify.toml`**: Added all Firebase environment variables to production environment

## Next Steps

### Option 1: Set Environment Variables in Netlify Dashboard (Recommended)

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following environment variables:

```
VITE_BACKEND_URL = https://recommendationsystem-s0gt.onrender.com/api
VITE_TMDB_KEY = [your_tmdb_api_key]
VITE_FIREBASE_API_KEY = AIzaSyAO9WMzJ5_xhLwwG57GqcXQggQYY1iyq-o
VITE_FIREBASE_AUTH_DOMAIN = netflix-clone-d8c00.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = netflix-clone-d8c00
VITE_FIREBASE_STORAGE_BUCKET = netflix-clone-d8c00.appspot.com
VITE_MASSAGING_SENDER = 661864881239
VITE_APP_ID = 1:661864881239:web:be4223243b3bb126dc9712
VITE_MEASUREMENT_ID = G-2CV8HRS71X
```

4. Trigger a new deploy

### Option 2: Use netlify.toml (Already Configured)

The environment variables are already set in `netlify.toml`. Just update `VITE_TMDB_KEY` with your actual TMDB API key if you need it.

## Important Notes

- **VITE\_ prefix**: Vite only exposes environment variables that start with `VITE_`
- **import.meta.env**: In Vite, use `import.meta.env.VITE_*` instead of `process.env.REACT_APP_*`
- **Security**: Consider storing sensitive keys in Netlify's environment variables dashboard instead of committing them to the repository

## Testing

The build has been tested locally and works correctly. Push these changes to trigger a new Netlify deployment.
