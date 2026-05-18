const { chromium } = require('playwright');

async function testApp() {
  console.log('Starting Playwright test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  
  try {
    // Navigate to the app
    console.log('Loading page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('Page loaded successfully');
    
    // Check if main elements are present
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for main content
    const hasContent = await page.locator('body').isVisible();
    console.log('Body visible:', hasContent);
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Report results
    if (errors.length > 0) {
      console.log('\nConsole errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('\nNo console errors found!');
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApp().catch(console.error);
