# Troubleshooting Blank UI

## Quick Fixes

### 1. Check Browser Console
Open browser DevTools (F12) and check Console tab for errors.

### 2. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cache and reload page
- Or hard refresh: `Ctrl + F5`

### 3. Reinstall Dependencies
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### 4. Check if Backend is Running
Backend must be running on `http://localhost:8000`
```bash
# In another terminal
cd Digital_clinic_Agent
uvicorn app.main:app --reload
```

### 5. Check Terminal for Errors
Look at the terminal where `npm run dev` is running for any errors.

### 6. Verify Port
Make sure port 3000 is not in use by another application.

## Common Issues

### Issue: "Cannot find module"
**Solution**: Run `npm install` in the frontend directory

### Issue: "Failed to fetch" or CORS errors
**Solution**: Make sure backend is running on port 8000

### Issue: White/blank screen
**Solution**: 
1. Check browser console (F12)
2. Check if `http://localhost:3000` is accessible
3. Try accessing `http://127.0.0.1:3000`

### Issue: React errors
**Solution**: 
1. Clear node_modules and reinstall
2. Check for syntax errors in console
3. Verify all imports are correct

## Debug Steps

1. **Open Browser Console** (F12)
   - Look for red error messages
   - Share the error with developer

2. **Check Network Tab**
   - Verify all files are loading (200 status)
   - Check if API calls are failing

3. **Verify Installation**
   ```bash
   cd frontend
   npm list react
   npm list react-dom
   ```

4. **Check Vite Server**
   - Terminal should show: `Local: http://localhost:3000`
   - If not, check for port conflicts

## Still Not Working?

1. Stop the dev server (Ctrl+C)
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again
4. Run `npm run dev`
5. Open `http://localhost:3000` in a new incognito/private window

