# Testing Guide - OmarHassanType Portfolio Fixes

## ✅ Implementation Complete

All 4 major fixes have been applied to `public/app.js`:

1. **API-First Content Loading** - `fetchContentData()` now tries API before static fallback
2. **JWT Token Authentication** - Admin token is now restored from localStorage on page load
3. **Visitor Counter Gating** - Visitor counter only displays for owner admin (`ilirt8`)
4. **Admin Access via Logo Tap** - 5 taps on logo within 2.2 seconds opens admin login

---

## 🔧 Setup Instructions

### Step 1: Install Node.js

⚠️ **Node.js is not currently installed on this system**

Download and install from: [https://nodejs.org/](https://nodejs.org/) (LTS version recommended)

After installation, verify:

```powershell
node --version
npm --version
```

### Step 2: Install Dependencies

```powershell
cd c:\Users\hp\Desktop\OmarHassanType
npm install
```

### Step 3: Start the Server

```powershell
npm start
```

Expected output:

```text
Server listening on port 5000
```

The server will be available at: `http://localhost:5000`

---

## ✅ Testing Checklist

### Test 1: API Connection Works

**Goal**: Verify `isStaticMode` is now `false` (API mode active)

1. Open browser console (F12)
2. Navigate to `http://localhost:5000`
3. Check console: `console.log(isStaticMode)` should output `false`
4. Network tab should show successful `GET /api/content` request

**Expected Result**: ✅ API data loads successfully

---

### Test 2: Token Persistence on Refresh

**Goal**: Admin token persists when page is reloaded

1. Open admin panel (tap logo 5 times quickly)
2. Login with credentials: `ilirt8` / `ilirt8`
3. Check localStorage:
   - Console: `console.log(localStorage.getItem('admin_token'))` should show JWT
   - Token should decode to: `{"username":"ilirt8"}`
4. Refresh the page (F5)
5. Check console again: token should still be present

**Expected Result**: ✅ Admin session persists across page refreshes

---

### Test 3: Visitor Counter Only Shows for Owner

**Goal**: Visitor counter displays only when logged in as `ilirt8`

**Case 1 - Before Login**:

1. Open console: `console.log(canDisplayVisitorCount())` → should be `false`
2. Visitor counter element should NOT be visible

**Case 2 - After Login as Admin**:

1. Tap logo 5 times to open admin panel
2. Login with `ilirt8` / `ilirt8`
3. Open console: `console.log(canDisplayVisitorCount())` → should be `true`
4. Visitor counter should now be visible with actual count

**Case 3 - After Logout**:

1. Click logout in admin panel
2. Visitor counter should disappear again

**Expected Result**: ✅ Visitor counter gates correctly based on owner authentication

---

### Test 4: Font Download Tracking

**Goal**: Downloads are now tracked via API

1. Open admin panel and login as `ilirt8`
2. Go to Fonts page
3. Click download button on any font
4. Network tab should show: `POST /api/track-download/[fontId]` with status 200

**Before Fix**: Would call local storage only
**After Fix**: Now calls API AND local storage

**Expected Result**: ✅ Download tracking sends to backend

---

### Test 5: Font View Tracking

**Goal**: Font views are tracked when visiting font detail page

1. Open admin panel and login
2. Navigate to fonts list
3. Click on a specific font to view details
4. Network tab should show: `POST /api/track-font/[fontId]` with status 200
5. Admin stats should increment

**Expected Result**: ✅ Font view tracking sends to backend

---

### Test 6: Stats Dashboard

**Goal**: Admin can see accurate stats

1. Login as admin (`ilirt8` / `ilirt8`)
2. Open admin panel
3. Check stats display:
   - Total Visits count
   - Today's Visits count
   - Font Views per font
   - Font Downloads per font
   - Recent download history

**Expected Result**: ✅ Stats reflect actual user interactions

---

### Test 7: Logo Tap Sequence

**Goal**: Admin login accessible via logo Easter egg

**How to test**:

1. At home page, rapidly tap/click the logo 5 times within 2.2 seconds
2. Admin login modal should appear
3. If taps are too slow (>2.2s between first and last), nothing happens

**Expected Result**: ✅ Admin login accessible via hidden tap sequence

---

## 📊 Network Tab Monitoring

When testing, monitor the Network tab (F12 → Network) for these endpoints:

| Endpoint | Method | When | Status |
| --- | --- | --- | --- |
| `/api/content` | GET | Page load | 200 |
| `/api/track-visit` | POST | Page visit | 200 |
| `/api/track-font/:id` | POST | View font detail | 200 |
| `/api/track-download/:id` | POST | Download font | 200 |
| `/api/font-stats-public` | GET | Fonts page loads | 200 |
| `/api/login` | POST | Admin login | 200 |
| `/api/stats` | GET | Admin panel opens | 200 |
| `/api/visitor-count` | GET | Admin logged in | 200 |

---

## 🔍 Browser Console Commands for Debugging

```javascript
// Check API mode status
console.log('isStaticMode:', isStaticMode);
console.log('token:', token);

// Check admin authentication state
console.log('authenticatedAdminUsername:', authenticatedAdminUsername);
console.log('isOwnerAdminAuthenticated():', isOwnerAdminAuthenticated());

// Check visitor counter gate
console.log('canDisplayVisitorCount():', canDisplayVisitorCount());

// Check token in storage
console.log('localStorage admin_token:', localStorage.getItem('admin_token'));

// Manually trigger admin login
openAdminPanel();

// Check public font stats
console.log('publicFontStatsById:', publicFontStatsById);
```

---

## 🐛 Troubleshooting

### Problem: `isStaticMode` is still `true`

**Solution**: Check that `fetchContentData()` was updated to try API first. Verify patches were applied to lines ~3310-3340.

### Problem: Token not persisting

**Solution**: Check that `readStoredAdminToken()` is called on page load (line ~1195). Check browser's localStorage tab in DevTools.

### Problem: Visitor counter not showing even when logged in

**Solution**:

- Verify you're logged in with `ilirt8` (not another admin)
- Check `canDisplayVisitorCount()` returns `true`
- Check `/api/visitor-count` endpoint exists on server

### Problem: Download/view tracking not working

**Solution**:

- Verify server is running (check for 200 status on endpoints)
- Check Network tab for POST requests being sent
- Verify database/JSON storage is writable

### Problem: Admin login modal doesn't appear with logo taps

**Solution**:

- Make sure you tap exactly 5 times
- Keep all taps within 2.2 seconds
- Check browser console for any JavaScript errors
- Verify `attemptOpenAdminFromLogoTap()` function exists (line ~4034)

---

## 🎯 Success Criteria

All of the following should be true for full fix validation:

- [ ] `isStaticMode` is `false` when page loads
- [ ] Admin can login with `ilirt8` / `ilirt8`
- [ ] Admin token persists when page refreshes
- [ ] Visitor counter only visible when logged in as `ilirt8`
- [ ] Download button sends POST to `/api/track-download/:id`
- [ ] Font detail page sends POST to `/api/track-font/:id`
- [ ] Admin panel displays actual stats from API
- [ ] Stats increment with new user interactions
- [ ] Logo 5-tap sequence opens admin login panel

---

## 📝 Notes

- The 5-tap logo sequence is hidden; normal single-click still navigates to home
- Arabic text rendering (Geeza vs Qahwa) was also investigated; toast notifications now use Qahwa font
- All changes are client-side; no server code modifications were needed (server.js already had all required endpoints)

Good luck with testing! 🚀
