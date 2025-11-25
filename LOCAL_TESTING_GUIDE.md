# Local Testing Guide

## Quick Test (Recommended)

The easiest way to test your website locally before deploying to Cloudflare Pages.

### Option 1: Using Python (Windows)

1. **Check if Python is installed**
   ```cmd
   python --version
   ```
   
   If not installed, download from [python.org](https://www.python.org/downloads/)

2. **Navigate to your project folder**
   ```cmd
   cd c:\Users\kalbhairav\Documents\jaikhypaparampara_ebook_repo
   ```

3. **Start local server**
   ```cmd
   python -m http.server 8000
   ```

4. **Open in browser**
   - Visit: http://localhost:8000
   - Or: http://127.0.0.1:8000

5. **Stop server**
   - Press `Ctrl + C` in the command prompt

---

### Option 2: Using VS Code Live Server Extension

1. **Install Live Server extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server"
   - Install by Ritwick Dey

2. **Launch Live Server**
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Your default browser will open automatically

3. **Auto-reload**
   - Any changes you make will automatically refresh the browser!

---

### Option 3: Using Node.js http-server

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Install with default settings

2. **Install http-server globally**
   ```cmd
   npm install -g http-server
   ```

3. **Navigate and run**
   ```cmd
   cd c:\Users\kalbhairav\Documents\jaikhypaparampara_ebook_repo
   http-server -p 8000
   ```

4. **Open browser**
   - Visit: http://localhost:8000

---

### Option 4: Direct File Opening (Limited)

⚠️ **Not recommended** - Some features may not work properly

1. Double-click `index.html` in File Explorer
2. It will open in your default browser
3. The URL will start with `file://`

**Limitations:**
- Some JavaScript features may not work
- Cannot test as if on a real web server

---

## Testing Checklist

Once your local server is running, test these features:

### ✅ Visual Design
- [ ] Page loads correctly
- [ ] Images appear (both book covers)
- [ ] Colors and fonts look good
- [ ] Responsive design works (resize browser)

### ✅ Navigation
- [ ] Click "Home" link - scrolls to top
- [ ] Click "Library" link - scrolls to books
- [ ] Click "About" link - scrolls to about section
- [ ] Smooth scrolling works

### ✅ Book Cards
- [ ] Both book cards display properly
- [ ] Images load correctly
- [ ] Hover effects work (cards lift up)
- [ ] All text is readable

### ✅ Links
- [ ] "Download PDF" buttons work (open in new tab)
- [ ] "Internet Archive" links work
- [ ] "Online Collection" links work
- [ ] Email link opens mail client
- [ ] Instagram link works

### ✅ Mobile View
- [ ] Open browser DevTools (F12)
- [ ] Click device toolbar icon (Ctrl+Shift+M)
- [ ] Test on different screen sizes:
  - iPhone SE (375px)
  - iPhone 12 (390px)
  - iPad (768px)
  - Desktop (1920px)

### ✅ Browser Compatibility
Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Common Issues and Fixes

### Images not showing
- Check file names match exactly: `uywjs16z45454.jpg` and `Bama_Khepa.jpg`
- Ensure images are in the same folder as `index.html`
- Clear browser cache (Ctrl+Shift+Delete)

### CSS not applied
- Ensure `styles.css` is in the same folder as `index.html`
- Check browser console (F12) for errors
- Hard refresh the page (Ctrl+Shift+R)

### JavaScript not working
- Open browser console (F12) to see errors
- Ensure `script.js` is in the same folder as `index.html`
- Check for typos in file names

### External links don't work locally
- This is normal! External links to PDFs will only work when:
  - The PDFs are actually uploaded to Cloudflare R2
  - You're testing on the deployed Cloudflare Pages site
- You can temporarily replace links with `#` for local testing

---

## Making Changes

### To edit content:
1. Open `index.html` in VS Code or any text editor
2. Make your changes
3. Save the file
4. Refresh your browser (F5 or Ctrl+R)

### To edit styles:
1. Open `styles.css`
2. Make your changes
3. Save the file
4. Hard refresh browser (Ctrl+Shift+R)

### To edit functionality:
1. Open `script.js`
2. Make your changes
3. Save the file
4. Hard refresh browser (Ctrl+Shift+R)

---

## Next Steps

Once you've tested locally and everything works:

1. **Deploy to Cloudflare Pages**
   - Follow instructions in `DEPLOYMENT_GUIDE.md`

2. **Test on Live Site**
   - Visit your `.pages.dev` URL
   - Test everything again
   - Share with friends for feedback

3. **Configure Custom Domain**
   - Point `jaikhyapaparampara.com` to Cloudflare
   - Wait for SSL certificate
   - Test with your custom domain

---

**Ready to deploy? See `DEPLOYMENT_GUIDE.md` for detailed instructions!**

Om Shri Gurubhyo Namaha  
Jai Khyapa Parampara
