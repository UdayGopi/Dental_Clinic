# Debug Blank White Screen

## Step 1: Check Browser Console
1. Open browser (Chrome/Edge)
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Look for **RED error messages**
5. **Copy and share** any errors you see

## Step 2: Check Network Tab
1. In DevTools, click **Network** tab
2. Refresh page (F5)
3. Look for files with **RED status** (failed to load)
4. Check if `main.tsx` or other files are loading

## Step 3: Verify Server is Running
Check terminal where you ran `npm run dev`:
- Should show: `Local: http://localhost:3000`
- Should NOT show errors

## Step 4: Test Simple Version
Temporarily replace `main.tsx` content with this to test:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

const TestApp = () => (
  <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
    <h1 style={{ color: 'red', fontSize: '24px' }}>✅ React is Working!</h1>
    <p>If you see this, React is loading correctly.</p>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(<TestApp />)
```

If this shows, React is working. The issue is with the app code.

## Step 5: Common Issues

### Issue: "Cannot find module"
**Fix**: Run `npm install` in frontend directory

### Issue: "Failed to compile"
**Fix**: Check terminal for compilation errors

### Issue: CORS errors
**Fix**: Make sure backend is running on port 8000

### Issue: Port already in use
**Fix**: 
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Step 6: Complete Reinstall
If nothing works:
```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

## What to Share
Please share:
1. **Browser console errors** (F12 → Console)
2. **Terminal output** from `npm run dev`
3. **Network tab** showing failed files
4. **Browser name and version**

