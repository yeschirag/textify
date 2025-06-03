from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
import os
from werkzeug.utils import secure_filename
from extractor import extract_text  # your extractor.py with multi-format support

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
EXTRACTED_FOLDER = 'extracted_texts'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['EXTRACTED_FOLDER'] = EXTRACTED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max

# Create folders if not exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXTRACTED_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'pdf', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(uploaded_file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(uploaded_file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    uploaded_file.save(file_path)

    try:
        extracted_text = extract_text(file_path)
    except Exception as e:
        return jsonify({'error': f'Extraction failed: {str(e)}'}), 500

    base_name = os.path.splitext(filename)[0]
    txt_filename = base_name + '.txt'
    txt_path = os.path.join(app.config['EXTRACTED_FOLDER'], txt_filename)

    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(extracted_text)

    download_url = url_for('download_file', filename=txt_filename)

    return jsonify({
        'text': extracted_text,
        'download_url': download_url
    })

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['EXTRACTED_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
