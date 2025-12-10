#!/usr/bin/env python3
"""
Optimized HTTP server with compression and caching headers
for the Jai Khyapa Parampara website
"""

import http.server
import socketserver
import gzip
import io
import os
from datetime import datetime, timedelta

PORT = 8000
CACHE_LIFETIME_DAYS = 30

class GzipHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with gzip compression and optimized caching headers"""
    
    def end_headers(self):
        """Add custom headers before ending headers"""
        # Add caching headers for static assets
        if self.path.endswith(('.js', '.css', '.jpg', '.png', '.gif', '.webp', '.woff2', '.woff')):
            # Cache static assets for 30 days
            cache_expires = datetime.utcnow() + timedelta(days=CACHE_LIFETIME_DAYS)
            self.send_header('Cache-Control', f'public, max-age={CACHE_LIFETIME_DAYS * 86400}')
            self.send_header('Expires', cache_expires.strftime('%a, %d %b %Y %H:%M:%S GMT'))
        else:
            # Don't cache HTML files
            self.send_header('Cache-Control', 'public, max-age=0, must-revalidate')
            self.send_header('Expires', '0')
        
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        # Call parent to finish headers
        super().end_headers()
    
    def send_response(self, code, message=None):
        """Override to add compression"""
        super().send_response(code, message)
    
    def do_GET(self):
        """Handle GET requests with compression"""
        # Check Accept-Encoding before sending headers
        accept_encoding = self.headers.get('Accept-Encoding', '')
        should_compress = 'gzip' in accept_encoding and self.path.endswith(('.html', '.js', '.css', '.json', '.xml', '.svg'))
        
        # Read the file to check size and compress if needed
        try:
            # Determine the file path
            if self.path == '/':
                file_path = 'index.html'
            else:
                file_path = self.translate_path(self.path)
            
            # Check if file exists
            if not os.path.isfile(file_path):
                self.send_error(404)
                return
            
            # Read content
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Compress if client accepts gzip and file type is compressible
            if should_compress:
                compressed = io.BytesIO()
                with gzip.GzipFile(fileobj=compressed, mode='wb') as gz:
                    gz.write(content)
                compressed_content = compressed.getvalue()
                
                # Only use compression if it actually reduces size (typical threshold: >500 bytes savings)
                if len(compressed_content) < len(content) - 100:
                    content = compressed_content
                    self.send_response(200)
                    self.send_header('Content-Type', self.guess_type(file_path)[0] or 'application/octet-stream')
                    self.send_header('Content-Encoding', 'gzip')
                    self.send_header('Vary', 'Accept-Encoding')
                    self.send_header('Content-Length', str(len(content)))
                    self.end_headers()
                    self.wfile.write(content)
                    return
            
            # Send uncompressed
            self.send_response(200)
            self.send_header('Content-Type', self.guess_type(file_path)[0] or 'application/octet-stream')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Vary', 'Accept-Encoding')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, str(e))

if __name__ == "__main__":
    handler = GzipHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"🕉️  Serving Jai Khyapa Parampara at http://localhost:{PORT}")
        print(f"📦 Gzip compression enabled for text assets")
        print(f"⏱️  Static assets cached for {CACHE_LIFETIME_DAYS} days")
        print(f"✨ Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🙏 Server stopped gracefully")

