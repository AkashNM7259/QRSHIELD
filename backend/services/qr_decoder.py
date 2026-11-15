"""
QR Decoding Engine using OpenCV and Pillow.
Decodes uploaded image files safely into raw payloads without automatic execution.
"""

import io
import re
import cv2
import numpy as np
from PIL import Image
from utils.validators import validate_image_file

class QRDecoder:
    """Robust image QR decoder supporting PNG, JPEG, WEBP with OpenCV detector."""

    def __init__(self):
        self.detector = cv2.QRCodeDetector()

    def identify_content_type(self, content: str) -> str:
        """Classify decoded payload into semantic category."""
        if not content:
            return "UNKNOWN"

        clean = content.strip()
        lower = clean.lower()

        if lower.startswith("upi://pay"):
            return "UPI"
        if lower.startswith(("http://", "https://")):
            return "URL"
        if lower.startswith(("wifi:", "wpa:")):
            return "WIFI"
        if lower.startswith(("mailto:", "matmsg:")):
            return "EMAIL"
        if lower.startswith("begin:vcard"):
            return "VCARD"
        if lower.startswith("smsto:"):
            return "SMS"

        # Check if naked domain without scheme
        if re.match(r'^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\.[a-zA-Z]{2,}(/.*)?$', clean):
            return "URL"

        return "TEXT"

    def decode_from_bytes(self, image_bytes: bytes) -> dict:
        """
        Decode QR payload from raw image bytes.
        Returns:
            {
                "success": bool,
                "content": str,
                "content_type": str,
                "error": Optional[str],
                "points": list
            }
        """
        if not image_bytes or len(image_bytes) == 0:
            return {
                "success": False,
                "content": "",
                "content_type": "UNKNOWN",
                "error": "Image buffer is empty."
            }

        # 1. Convert bytes to OpenCV BGR numpy array
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            img = None

        # Fallback to Pillow if cv2.imdecode fails
        if img is None:
            try:
                pil_img = Image.open(io.BytesIO(image_bytes))
                pil_img = pil_img.convert('RGB')
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                return {
                    "success": False,
                    "content": "",
                    "content_type": "UNKNOWN",
                    "error": f"Corrupted or unreadable image file: {str(e)}"
                }

        # 2. Attempt decoding with OpenCV QRCodeDetector
        try:
            retval, decoded_info, points, straight_qrcode = self.detector.detectAndDecodeMulti(img)
            if retval and decoded_info:
                # If multiple QR codes exist, extract valid payloads
                valid_codes = [c for c in decoded_info if c and c.strip()]
                if valid_codes:
                    primary_content = valid_codes[0]
                    content_type = self.identify_content_type(primary_content)
                    return {
                        "success": True,
                        "content": primary_content,
                        "all_contents": valid_codes,
                        "has_multiple": len(valid_codes) > 1,
                        "content_type": content_type,
                        "error": None
                    }
        except Exception:
            pass

        # Single QR fallback with preprocessing (Grayscale + Thresholding)
        try:
            data, bbox, _ = self.detector.detectAndDecode(img)
            if data and data.strip():
                return {
                    "success": True,
                    "content": data.strip(),
                    "content_type": self.identify_content_type(data),
                    "error": None
                }

            # Enhance contrast with Grayscale & Otsu thresholding
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            data_thresh, _, _ = self.detector.detectAndDecode(thresh)
            if data_thresh and data_thresh.strip():
                return {
                    "success": True,
                    "content": data_thresh.strip(),
                    "content_type": self.identify_content_type(data_thresh),
                    "error": None
                }
        except Exception as e:
            return {
                "success": False,
                "content": "",
                "content_type": "UNKNOWN",
                "error": f"Decoding pipeline error: {str(e)}"
            }

        return {
            "success": False,
            "content": "",
            "content_type": "UNKNOWN",
            "error": "No QR code could be detected in the provided image. Please check focus, lighting, and resolution."
        }

    def decode_file_storage(self, file_storage) -> dict:
        """Validate and decode uploaded file object."""
        is_valid, err_msg = validate_image_file(file_storage)
        if not is_valid:
            return {
                "success": False,
                "content": "",
                "content_type": "UNKNOWN",
                "error": err_msg
            }

        try:
            image_bytes = file_storage.read()
            return self.decode_from_bytes(image_bytes)
        except Exception as e:
            return {
                "success": False,
                "content": "",
                "content_type": "UNKNOWN",
                "error": f"Failed reading file data: {str(e)}"
            }

qr_decoder = QRDecoder()

