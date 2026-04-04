"""
MinerU PDF Extraction Service
Flask server that processes PDFs using MinerU and returns extracted content.
"""

import os
import tempfile
import base64
import json
from io import BytesIO
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

app = Flask(__name__)
CORS(app)

# Try to import MinerU - provide helpful error if not installed
try:
    from magic_pdf.pipe.UNIPipe import UNIPipe
    from magic_pdf.rw.DiskReaderWriter import DiskReaderWriter
    MINERU_AVAILABLE = True
except ImportError:
    MINERU_AVAILABLE = False
    print("Warning: MinerU not installed. Install with: pip install -U 'mineru[all]'")

# Try to import colorthief for color extraction
try:
    from colorthief import ColorThief
    COLORTHIEF_AVAILABLE = True
except ImportError:
    COLORTHIEF_AVAILABLE = False
    print("Warning: colorthief not installed. Color extraction disabled.")


def extract_dominant_colors(image_bytes: bytes, color_count: int = 5) -> list[str]:
    """Extract dominant colors from an image."""
    if not COLORTHIEF_AVAILABLE:
        return []

    try:
        color_thief = ColorThief(BytesIO(image_bytes))
        palette = color_thief.get_palette(color_count=color_count, quality=1)
        return [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in palette]
    except Exception as e:
        print(f"Color extraction failed: {e}")
        return []


def image_to_base64(image_path: str) -> dict | None:
    """Convert an image file to base64 with metadata."""
    try:
        with Image.open(image_path) as img:
            # Get dimensions
            width, height = img.size

            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Save to bytes
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            image_bytes = buffer.getvalue()

            # Get dominant colors
            colors = extract_dominant_colors(image_bytes)

            # Encode to base64
            b64 = base64.b64encode(image_bytes).decode('utf-8')

            return {
                "base64": f"data:image/png;base64,{b64}",
                "width": width,
                "height": height,
                "colors": colors
            }
    except Exception as e:
        print(f"Failed to process image {image_path}: {e}")
        return None


def process_pdf_with_mineru(pdf_path: str, output_dir: str) -> dict:
    """Process a PDF file using MinerU and return extracted content."""

    if not MINERU_AVAILABLE:
        return {
            "error": "MinerU not installed",
            "message": "Please install MinerU: pip install -U 'mineru[all]'"
        }

    try:
        # Read PDF bytes
        with open(pdf_path, 'rb') as f:
            pdf_bytes = f.read()

        # Create output writer
        image_writer = DiskReaderWriter(output_dir)

        # Process PDF with MinerU
        pipe = UNIPipe(pdf_bytes, {"_pdf_type": "", "model_list": []}, image_writer)
        pipe.pipe_classify()
        pipe.pipe_analyze()
        pipe.pipe_parse()

        # Get markdown content
        md_content = pipe.pipe_mk_markdown(output_dir, drop_mode="none")

        # Collect extracted images
        images = []
        all_colors = []

        # Find all extracted images in output directory
        for img_file in Path(output_dir).glob("**/*.png"):
            img_data = image_to_base64(str(img_file))
            if img_data:
                img_data["id"] = img_file.stem
                images.append(img_data)
                all_colors.extend(img_data.get("colors", []))

        for img_file in Path(output_dir).glob("**/*.jpg"):
            img_data = image_to_base64(str(img_file))
            if img_data:
                img_data["id"] = img_file.stem
                images.append(img_data)
                all_colors.extend(img_data.get("colors", []))

        # Deduplicate and limit colors
        unique_colors = list(dict.fromkeys(all_colors))[:10]

        return {
            "success": True,
            "images": images,
            "text": md_content,
            "colors": unique_colors,
            "layout": {
                "pageCount": len(pipe.pdf_mid_data.get("pdf_info", [])) if hasattr(pipe, 'pdf_mid_data') else 0
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "images": [],
            "text": "",
            "colors": [],
            "layout": {}
        }


def process_pdf_simple(pdf_path: str, output_dir: str) -> dict:
    """
    Simple PDF processing fallback when MinerU is not available.
    Uses basic PDF image extraction via pdf2image or returns empty.
    """
    try:
        # Try pdf2image as fallback
        from pdf2image import convert_from_path

        images = convert_from_path(pdf_path, dpi=150)
        extracted_images = []
        all_colors = []

        for i, img in enumerate(images):
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            image_bytes = buffer.getvalue()

            # Get colors
            colors = extract_dominant_colors(image_bytes)
            all_colors.extend(colors)

            # Convert to base64
            b64 = base64.b64encode(image_bytes).decode('utf-8')

            extracted_images.append({
                "id": f"page_{i+1}",
                "base64": f"data:image/png;base64,{b64}",
                "width": img.width,
                "height": img.height,
                "colors": colors
            })

        unique_colors = list(dict.fromkeys(all_colors))[:10]

        return {
            "success": True,
            "images": extracted_images,
            "text": "",
            "colors": unique_colors,
            "layout": {
                "pageCount": len(images)
            }
        }

    except ImportError:
        return {
            "success": False,
            "error": "Neither MinerU nor pdf2image available for PDF processing",
            "message": "Install MinerU: pip install -U 'mineru[all]' or pdf2image: pip install pdf2image",
            "images": [],
            "text": "",
            "colors": [],
            "layout": {}
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "images": [],
            "text": "",
            "colors": [],
            "layout": {}
        }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "mineru_available": MINERU_AVAILABLE,
        "colorthief_available": COLORTHIEF_AVAILABLE
    })


@app.route('/process', methods=['POST'])
def process_pdf():
    """
    Process a PDF file and return extracted content.

    Expects multipart form data with a 'file' field containing the PDF.

    Returns JSON with:
    - images: Array of extracted images with base64 data and colors
    - text: Extracted markdown text
    - colors: Dominant colors from all images
    - layout: Page count and structure info
    """

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "File must be a PDF"}), 400

    # Create temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save uploaded PDF
        pdf_path = os.path.join(temp_dir, 'input.pdf')
        file.save(pdf_path)

        # Create output directory for extracted content
        output_dir = os.path.join(temp_dir, 'output')
        os.makedirs(output_dir, exist_ok=True)

        # Process PDF
        if MINERU_AVAILABLE:
            result = process_pdf_with_mineru(pdf_path, output_dir)
        else:
            result = process_pdf_simple(pdf_path, output_dir)

        return jsonify(result)


if __name__ == '__main__':
    print("=" * 50)
    print("MinerU PDF Extraction Service")
    print("=" * 50)
    print(f"MinerU available: {MINERU_AVAILABLE}")
    print(f"ColorThief available: {COLORTHIEF_AVAILABLE}")
    print("")
    print("Endpoints:")
    print("  GET  /health  - Health check")
    print("  POST /process - Process PDF file")
    print("")
    print("Starting server on http://localhost:5000")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=True)
