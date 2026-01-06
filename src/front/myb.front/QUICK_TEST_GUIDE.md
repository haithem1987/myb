# Quick Test Guide - Monkey Testing Setup

## Status: ✅ Monkey Testing Ready

### Fixed Issues:
1. ✅ Removed NxWelcomeComponent imports from admin and myb.front apps
2. ✅ Created missing models directory structure
3. ✅ Updated tsconfig.base.json module resolution to "bundler"
4. ✅ Updated module setting to ES2022
5. ✅ Fixed auth library tsconfig (removed commonjs module)
6. ✅ Cleared Nx cache

### Current State:
- **Monkey Test UI**: Ready to use at `http://localhost:8080/monkey-test.html`
- **Simple HTTP Server**: Running on port 8080
- **Build Status**: Some build issues with ng-packagr (ES module compatibility), but dev mode works

## How to Test Monkey Testing NOW:

### Option 1: Test with Existing Running App (Recommended)

If you have your Angular app already running somewhere:

1. **Open the Monkey Test UI:**
   ```bash
   open http://localhost:8080/monkey-test.html
   ```
   Or manually open: `/Users/nidhalbenmaad/Workspace/myb-dev/myb/src/front/myb.front/monkey-test.html` in your browser

2. **Configure the test:**
   - Application URL: `http://localhost:4200` (or wherever your app is running)
   - Test Duration: 60 seconds (adjustable)
   - Action Speed: 500ms (adjustable)
   - Error Rate: 0.1 (adjustable)

3. **Click "Start Monkey Test"** and watch it run!

### Option 2: Test with Sample App

If you don't have an app running, test with any website:

1. Open `http://localhost:8080/monkey-test.html`
2. Change Application URL to: `https://example.com` or any website
3. Click "Start Monkey Test"

### Option 3: Use the CLI Instructions

Run the CLI helper:
```bash
cd /Users/nidhalbenmaad/Workspace/myb-dev/myb/src/front/myb.front
npm run monkey-test
```

This shows you how to integrate with Puppeteer for automated testing.

## What the Monkey Test Does:

The test will:
- 🖱️ **Click** randomly on elements
- 📝 **Fill forms** with random data
- 📜 **Scroll** the page
- ⌨️ **Type** random text
- 👆 **Touch** elements (for mobile testing)
- 🔍 **Monitor** for errors, alerts, and performance issues

## Expected Results:

You should see:
- The iframe loading your application
- Random interactions happening automatically
- Status updates showing test progress
- FPS monitoring overlay (if enabled)
- Console logs of any errors found

## Stopping the Test:

- Click **"Stop Monkey Test"** button anytime
- Or wait for the duration to complete

## To Start Your Angular App (when ready):

Once the build issues are fully resolved, you can start your app with:

```bash
cd /Users/nidhalbenmaad/Workspace/myb-dev/myb/src/front/myb.front
nx serve client --port=4200
```

## Known Issues (Being Fixed):

1. **Build Issues**: ng-packagr has ES module compatibility issues with Angular 21
   - **Impact**: Production builds may fail
   - **Workaround**: Use development mode or fix ng-packagr version
   - **Does NOT affect monkey testing**: Monkey testing works independently

2. **Module Resolution**: Updated to "bundler" for Angular 21 compatibility
   - **Status**: Fixed ✅

3. **Missing Models**: Created the models directory structure
   - **Status**: Fixed ✅

## Files Changed:

- ✅ Fixed: `apps/admin/src/app/app.component.ts`
- ✅ Fixed: `apps/myb.front/src/app/app.component.ts`
- ✅ Fixed: `tsconfig.base.json` (moduleResolution and module settings)
- ✅ Fixed: `libs/auth/tsconfig.json` (removed commonjs)
- ✅ Created: `libs/shared/shared-ui/src/lib/models/index.ts`
- ✅ Created: `libs/shared/shared-ui/src/lib/models/user.model.ts`

## Next Steps:

1. **Test the monkey testing NOW** using the instructions above
2. **Fix ng-packagr**: Update to latest version or configure for ES modules
3. **Test your Angular app**: Once build issues are resolved

## Support:

If you encounter any issues:
1. Check browser console for errors
2. Verify the HTTP server is running: `curl http://localhost:8080`
3. Verify gremlins.js is loaded in the monkey-test.html file

---

**Ready to test!** Open `http://localhost:8080/monkey-test.html` in your browser now! 🐒
