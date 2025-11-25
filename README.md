# Jai Khyapa Parampara Digital Library

A beautiful, responsive library website hosting free spiritual ebooks compiled by KaliPutra-Ashish. This website is designed to be deployed on Cloudflare Pages.

## 📚 About

This digital library serves as a repository of divine knowledge and sacred texts, dedicated to the Khepa/Khyapa Parampara lineage. The library currently features:

- **Adya Mahakali Sahasranama** - 1000+ names of Maa with translations and spiritual insights
- **Kalabhairava Sahasranama** - 1000 sacred names of Kalabhairava with chanting guide

All ebooks are **FOREVER FREE** to download and share.

## 🚀 Deployment Instructions for Cloudflare Pages

### Option 1: Deploy via GitHub (Recommended)

1. **Create a GitHub Repository**
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it something like `jaikhyapaparampara-library`

2. **Push Your Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Jai Khyapa Parampara Library"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jaikhyapaparampara-library.git
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Go to **Pages** in the sidebar
   - Click **Create a project**
   - Click **Connect to Git**
   - Select your GitHub repository
   - Configure build settings:
     - **Production branch:** `main`
     - **Build command:** (leave empty - it's a static site)
     - **Build output directory:** `/`
   - Click **Save and Deploy**

4. **Configure Custom Domain**
   - Once deployed, go to your Pages project
   - Click **Custom domains**
   - Add your domain: `jaikhyapaparampara.com`
   - Follow DNS configuration instructions provided by Cloudflare

### Option 2: Deploy via Direct Upload

1. **Prepare Your Files**
   - Ensure all files are in one folder:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `uywjs16z45454.jpg`
     - `Bama_Khepa.jpg`

2. **Upload to Cloudflare Pages**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Go to **Pages** in the sidebar
   - Click **Create a project**
   - Click **Direct Upload**
   - Drag and drop your project folder or select files
   - Click **Deploy site**

3. **Configure Custom Domain** (same as above)

## 📁 File Structure

```
jaikhypaparampara_ebook_repo/
├── index.html              # Main HTML page
├── styles.css              # Stylesheet
├── script.js               # JavaScript functionality
├── uywjs16z45454.jpg       # Adya Mahakali book image
├── Bama_Khepa.jpg          # Kalabhairava book image
├── README.md               # This file
├── DEPLOYMENT_GUIDE.md     # Detailed deployment instructions
└── cloudflare.json         # Cloudflare Pages configuration
```

## 🎨 Features

- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Beautiful UI** - Traditional spiritual aesthetic with modern design
- **Fast Loading** - Optimized for Cloudflare's global CDN
- **SEO Optimized** - Proper meta tags and semantic HTML
- **Smooth Animations** - Elegant scroll effects and transitions
- **Accessibility** - Proper ARIA labels and semantic structure

## 🔗 External Links

The website links to:
- PDF downloads hosted on Cloudflare R2
- Internet Archive collections
- Online searchable name collections at dedicated domains

## 📱 Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🙏 Dedication

This library is dedicated to:
- Guru Shri Bamakhepa
- Guru Shri Shyamakhepa
- Shri Praveen RadhaKrishnan
- The entire Khyapa Parampara

## 📧 Contact

**Compiler:** KaliPutra-Ashish
- **Instagram:** [@ashishkaliputra](https://instagram.com/ashishkaliputra)
- **Email:** kaliputraashish@gmail.com

---

**Om Shri Gurubhyo Namaha**  
**Jai Khyapa Parampara**
