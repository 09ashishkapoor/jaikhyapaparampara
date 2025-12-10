#!/usr/bin/env python3
"""
Image optimization script - compresses JPEGs and creates WebP versions
Targets: Bama_Khepa.jpg, uywjs16z45454.jpg, Shyama_Khepa.jpg, praveen_radhakrishnan.jpg
"""

from PIL import Image
import os
import sys

# Images to optimize with their target display sizes
IMAGES_TO_OPTIMIZE = {
    'Bama_Khepa.jpg': 200,
    'uywjs16z45454.jpg': 200,
    'Shyama_Khepa.jpg': 200,
    'praveen_radhakrishnan.jpg': 200,
}

def get_file_size_kb(filepath):
    """Get file size in KiB"""
    return os.path.getsize(filepath) / 1024

def optimize_image(image_path, target_size=200):
    """
    Optimize a single image:
    1. Compress JPEG to 85% quality
    2. Create WebP version at 85% quality
    """
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return False
    
    original_size = get_file_size_kb(image_path)
    filename = os.path.basename(image_path)
    name_without_ext = os.path.splitext(filename)[0]
    directory = os.path.dirname(image_path)
    
    try:
        # Open image
        img = Image.open(image_path)
        print(f"\n📷 Processing: {filename}")
        print(f"   Original size: {original_size:.1f} KiB")
        print(f"   Original dimensions: {img.width}x{img.height}px")
        
        # Save optimized JPEG (85% quality)
        jpeg_output = os.path.join(directory, f"{name_without_ext}.jpg")
        img.save(jpeg_output, quality=85, optimize=True)
        jpeg_size = get_file_size_kb(jpeg_output)
        jpeg_saved = original_size - jpeg_size
        print(f"   ✓ Compressed JPEG: {jpeg_size:.1f} KiB (saved {jpeg_saved:.1f} KiB)")
        
        # Create WebP version (85% quality)
        webp_output = os.path.join(directory, f"{name_without_ext}.webp")
        img.save(webp_output, 'WEBP', quality=85)
        webp_size = get_file_size_kb(webp_output)
        webp_saved = original_size - webp_size
        print(f"   ✓ WebP version: {webp_size:.1f} KiB (saved {webp_saved:.1f} KiB)")
        
        return True
    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")
        return False

def main():
    print("=" * 60)
    print("Image Optimization Script")
    print("=" * 60)
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    total_original = 0
    total_optimized = 0
    success_count = 0
    
    for image_name, target_size in IMAGES_TO_OPTIMIZE.items():
        image_path = os.path.join(script_dir, image_name)
        
        if optimize_image(image_path, target_size):
            success_count += 1
            if os.path.exists(image_path):
                original_size = get_file_size_kb(image_path)
                total_original += original_size
    
    # Calculate total savings
    if success_count > 0:
        print("\n" + "=" * 60)
        print(f"✅ Successfully optimized {success_count} images")
        print("\n📝 HTML usage (use these in your index.html):")
        print("=" * 60)
        for image_name in IMAGES_TO_OPTIMIZE.keys():
            name_without_ext = os.path.splitext(image_name)[0]
            print(f"""
<picture>
  <source srcset="{name_without_ext}.webp" type="image/webp">
  <img src="{image_name}" alt="[Your alt text]" width="200" height="200" loading="lazy">
</picture>""")
        print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
