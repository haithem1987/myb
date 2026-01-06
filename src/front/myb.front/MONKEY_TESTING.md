# Monkey Testing Guide for MYB Application

## What is Monkey Testing?

Monkey testing is an automated testing technique where random user interactions are simulated on your application. It's called "monkey" testing because it's as if a monkey is randomly pressing buttons and interacting with your app. This helps discover:

- Unexpected crashes or errors
- Edge cases you didn't consider
- UI/UX issues
- Performance problems under random user behavior

## Installation

Gremlins.js is already installed as a dev dependency. If you need to reinstall:

```bash
npm install --save-dev gremlins.js --legacy-peer-deps
```

## Running Monkey Tests

### Option 1: Visual UI Interface (Recommended for Development)

1. Start your Angular application:
   ```bash
   npm start
   # or
   nx serve client
   ```

2. Open the monkey testing UI in your browser:
   ```bash
   npm run monkey-test:ui
   ```
   
   Or manually open: `monkey-test.html` in your browser

3. Configure test parameters:
   - **Application URL**: The URL where your app is running (default: http://localhost:4200)
   - **Test Duration**: How long to run the test (in seconds)
   - **Action Speed**: Delay between actions (in milliseconds)
   - **Error Rate**: Probability of generating error-prone actions (0-1)

4. Click "Start Monkey Test" and watch the chaos unfold!

### Option 2: CLI Mode (for CI/CD Integration)

```bash
npm run monkey-test
```

This displays instructions for integrating with headless browsers like Puppeteer or Playwright.

## What Does It Test?

The monkey test includes several "species" of gremlins that perform different actions:

1. **Clicker**: Randomly clicks on elements
2. **Toucher**: Simulates touch events (for mobile responsiveness)
3. **Form Filler**: Fills out forms with random data
4. **Scroller**: Scrolls the page randomly
5. **Typer**: Types random text into input fields

Plus "mogwais" (observers) that monitor:
- Alerts and console errors
- FPS (frames per second) to detect performance issues
- General app health

## Customization

You can customize the monkey test behavior by editing `monkey-test.html`:

```javascript
gremlins.createHorde({
    species: [
        gremlins.species.clicker({ maxNbTries: 50 }),
        gremlins.species.typer({ maxNbTries: 50 }),
        // Add more species or remove unwanted ones
    ],
    mogwais: [
        gremlins.mogwais.alert(),
        gremlins.mogwais.fps({ delay: 500 })
    ],
    strategies: [
        gremlins.strategies.distribution({ delay: 500 })
    ]
});
```

## Environment Variables

For CLI mode, you can configure using environment variables:

```bash
APP_URL=http://localhost:4200 TEST_DURATION=120 ACTION_SPEED=300 npm run monkey-test
```

- `APP_URL`: URL of your application
- `TEST_DURATION`: Test duration in seconds
- `ACTION_SPEED`: Milliseconds between actions

## Integration with CI/CD

For automated testing in CI/CD pipelines, install Puppeteer:

```bash
npm install --save-dev puppeteer
```

Then create a test script (example provided in `monkey-test-cli.js`).

## Best Practices

1. **Run after major changes**: Execute monkey tests after significant UI changes
2. **Monitor console**: Keep an eye on console errors during tests
3. **Combine with other tests**: Monkey testing complements unit and e2e tests, doesn't replace them
4. **Adjust speed**: Slower speeds catch more timing-related bugs
5. **Review failures**: When bugs are found, create specific test cases for them

## Troubleshooting

### Cross-Origin Issues
If you get CORS errors, make sure your Angular app is running and accessible.

### Tests complete too quickly
Increase the test duration or decrease the action speed.

### App crashes immediately
The default settings might be too aggressive. Try:
- Increasing action speed (slower actions)
- Reducing error rate
- Disabling specific species

## Resources

- [Gremlins.js Documentation](https://github.com/marmelab/gremlins.js)
- [Monkey Testing Best Practices](https://en.wikipedia.org/wiki/Monkey_testing)

## Summary of Changes

This monkey testing setup helps you:
- ✅ Discover unexpected bugs through random testing
- ✅ Test edge cases automatically
- ✅ Validate application stability under unpredictable user behavior
- ✅ Improve overall application robustness

Happy monkey testing! 🐒
