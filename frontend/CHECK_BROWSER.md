# Browser Debugging Steps

## If you see a blank white page:

### Step 1: Open Browser Console
1. Press **F12** in your browser
2. Click **Console** tab
3. Look for **RED error messages**
4. **Copy ALL errors** and share them

### Step 2: Check Network Tab
1. In DevTools, click **Network** tab
2. Refresh page (F5)
3. Look for files with **RED status** (failed)
4. Check if `main.tsx` loads (should be 200 status)

### Step 3: Check What's Loading
In Console, type:
```javascript
document.getElementById('root')
```

If it returns `null`, the root element doesn't exist.

### Step 4: Check if Script is Running
In Console, type:
```javascript
console.log('Test')
```

If this works, JavaScript is running.

### Step 5: Verify Server
Check terminal where `npm run dev` is running:
- Should show: `Local: http://localhost:3000/`
- Should NOT show compilation errors

### Step 6: Try Different Browser
- Try Chrome
- Try Edge
- Try Firefox
- Try Incognito/Private mode

### Step 7: Clear Everything
1. Clear browser cache (Ctrl + Shift + Delete)
2. Clear site data
3. Hard refresh (Ctrl + Shift + R)

## What to Share:
1. **Browser name and version**
2. **All console errors** (F12 → Console)
3. **Network tab** - which files failed to load
4. **Terminal output** from `npm run dev`

