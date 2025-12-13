#!/usr/bin/env python3
"""Build version and date updater for index.html"""

import re
from datetime import datetime, timezone
import os

def update_build_info():
    """Update build version and date in index.html"""
    
    file_path = "index.html"
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return False
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find and increment version
        version_match = re.search(r'meta name="build-version" content="([0-9.]+)"', content)
        if version_match:
            current_version = version_match.group(1)
            parts = current_version.split('.')
            parts[-1] = str(int(parts[-1]) + 1)
            new_version = '.'.join(parts)
            
            # Update meta tag
            content = re.sub(
                r'meta name="build-version" content="[^"]*"',
                f'meta name="build-version" content="{new_version}"',
                content
            )
            
            # Update footer version
            content = re.sub(
                r'<span id="version-value">V[0-9.]+</span>',
                f'<span id="version-value">V{new_version}</span>',
                content
            )
            
            print(f"✓ Version: {current_version} → {new_version}")
        else:
            print("✗ Error: Could not find build-version tag")
            return False
        
        # Update date to UTC
        utc_now = datetime.now(timezone.utc)
        utc_timestamp = utc_now.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Format date for footer (e.g., "December 13, 2025")
        footer_date = utc_now.strftime("%B %d, %Y")
        
        # Update meta tag
        content = re.sub(
            r'meta name="build-date" content="[^"]*"',
            f'meta name="build-date" content="{utc_timestamp}"',
            content
        )
        
        # Update footer date
        content = re.sub(
            r'<span id="last-updated-value">[^<]*</span>',
            f'<span id="last-updated-value">{footer_date}</span>',
            content
        )
        
        print(f"✓ Date: {utc_timestamp}")
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✓ index.html updated successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = update_build_info()
    exit(0 if success else 1)
