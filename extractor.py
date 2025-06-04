import os
from PIL import Image
import pytesseract
import PyPDF2
import docx
import sys

UPLOAD_FOLDER = 'uploads'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if sys.platform.startswith('win'):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text(filepath):
    ext = os.path.splitext(filepath)[1].lower()

    if ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif']:
        try:
            img = Image.open(filepath)
            text = pytesseract.image_to_string(img)
            return text.strip() or "No text found in the image."
        except Exception as e:
            return f"OCR error: {str(e)}"

    elif ext == '.pdf':
        try:
            text = ""
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text.strip() or "No text found in the PDF."
        except Exception as e:
            return f"PDF extraction error: {str(e)}"

    elif ext == '.docx':
        try:
            doc = docx.Document(filepath)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return "\n".join(full_text).strip() or "No text found in the DOCX."
        except Exception as e:
            return f"Word document extraction error: {str(e)}"

    elif ext == '.txt':
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            return content.strip() or "Text file is empty."
        except Exception as e:
            return f"Text file reading error: {str(e)}"

    else:
        return f"File type {ext} not supported for text extraction."
