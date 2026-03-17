import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu']
});

const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));

await page.goto('http://127.0.0.1:9876/', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 1000));

// Test 1: Check if event listeners are attached to dropzone
const test1 = await page.evaluate(() => {
  const dz = document.getElementById('image-dropzone');
  // Try dispatching a click and see if it triggers anything
  let clickFired = false;
  const origClick = HTMLInputElement.prototype.click;
  const input = document.getElementById('image-input');
  HTMLInputElement.prototype.click = function() {
    if (this === input) clickFired = true;
    // Don't actually open file dialog
  };
  dz.click();
  HTMLInputElement.prototype.click = origClick;
  return { dropzoneClickTriggersInputClick: clickFired };
});
logs.push(`TEST1 (dropzone): ${JSON.stringify(test1)}`);

// Test 2: Check generate button handler
const test2 = await page.evaluate(() => {
  // Fill in minimal data
  const headlineInputs = document.querySelectorAll('#headlines-list .text-input');
  const ctaInputs = document.querySelectorAll('#ctas-list .text-input');
  
  const info = {
    headlineInputCount: headlineInputs.length,
    ctaInputCount: ctaInputs.length,
    headlineValues: [...headlineInputs].map(i => i.value),
    ctaValues: [...ctaInputs].map(i => i.value),
  };
  
  // Fill in values
  if (headlineInputs[0]) headlineInputs[0].value = 'Test Headline';
  if (ctaInputs[0]) ctaInputs[0].value = 'Buy Now';
  
  return info;
});
logs.push(`TEST2 (inputs): ${JSON.stringify(test2)}`);

// Test 3: Click generate and check for errors
const preClickLogs = logs.length;
const test3 = await page.evaluate(() => {
  return new Promise((resolve) => {
    const btn = document.getElementById('btn-generate');
    // Patch console.error to catch validation errors
    const origError = console.error;
    const origWarn = console.warn;
    const errors = [];
    console.error = (...args) => { errors.push(args.join(' ')); origError(...args); };
    console.warn = (...args) => { errors.push(args.join(' ')); origWarn(...args); };
    
    btn.click();
    
    setTimeout(() => {
      console.error = origError;
      console.warn = origWarn;
      
      const gallery = document.getElementById('gallery');
      const galleryGrid = document.getElementById('gallery-grid');
      const formErrors = document.getElementById('form-errors');
      
      resolve({
        errorsPatched: errors,
        galleryHidden: gallery?.hidden,
        galleryGridChildren: galleryGrid?.children.length,
        formErrorsExists: !!formErrors,
        formErrorsText: formErrors?.textContent?.substring(0, 200),
      });
    }, 500);
  });
});
logs.push(`TEST3 (generate): ${JSON.stringify(test3)}`);

console.log('=== ALL LOGS ===');
for (const l of logs) console.log(l);

await browser.close();
