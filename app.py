import os
import json
import uuid
import datetime
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for
from flask_cors import CORS
from dotenv import dotenv_values

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
CONTENT_FILE = os.path.join(DATA_DIR, 'site_content.json')
APPOINTMENTS_FILE = os.path.join(DATA_DIR, 'appointments.json')
ENV_FILE = os.path.join(BASE_DIR, '.env')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'}

# Helper: Load .env dynamically on every call so changes are picked up immediately
def get_env_config():
    if not os.path.exists(ENV_FILE):
        default_env = (
            "# Admin Authentication Credentials\n"
            "ADMIN_USERNAME=admin\n"
            "ADMIN_PASSWORD=admin123\n"
            "SECRET_KEY=leelavati_hospital_secret_key_2026_secured\n"
            "PORT=5000\n"
        )
        with open(ENV_FILE, 'w', encoding='utf-8') as f:
            f.write(default_env)

    # Read dynamically directly from file
    config = dotenv_values(ENV_FILE)
    admin_user = config.get('ADMIN_USERNAME', 'admin') or 'admin'
    admin_pass = config.get('ADMIN_PASSWORD', 'admin123') or 'admin123'
    secret_key = config.get('SECRET_KEY', 'default_secret_key_leelavati_2026')
    port = int(config.get('PORT', 5000) or 5000)
    return {
        'ADMIN_USERNAME': admin_user.strip(),
        'ADMIN_PASSWORD': admin_pass.strip(),
        'SECRET_KEY': secret_key.strip(),
        'PORT': port
    }

# Helper: Update .env file
def update_env_credentials(username=None, password=None):
    current = get_env_config()
    new_user = username.strip() if username else current['ADMIN_USERNAME']
    new_pass = password.strip() if password else current['ADMIN_PASSWORD']
    secret = current['SECRET_KEY']
    port = current['PORT']

    lines = []
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()

    user_set = False
    pass_set = False
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('ADMIN_USERNAME='):
            new_lines.append(f"ADMIN_USERNAME={new_user}\n")
            user_set = True
        elif stripped.startswith('ADMIN_PASSWORD='):
            new_lines.append(f"ADMIN_PASSWORD={new_pass}\n")
            pass_set = True
        else:
            new_lines.append(line)

    if not user_set:
        new_lines.append(f"ADMIN_USERNAME={new_user}\n")
    if not pass_set:
        new_lines.append(f"ADMIN_PASSWORD={new_pass}\n")

    temp_path = f"{ENV_FILE}.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    os.replace(temp_path, ENV_FILE)

# Safe atomic JSON helpers
def load_json(filepath, default_value):
    if not os.path.exists(filepath):
        save_json(filepath, default_value)
        return default_value
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return default_value

def save_json(filepath, data):
    temp_path = f"{filepath}.tmp"
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_path, filepath)

# Initialize Flask App
env_cfg = get_env_config()
app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.secret_key = env_cfg['SECRET_KEY']
CORS(app)

# Authentication Decorator
def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            # Also support custom header for API clients
            auth_header = request.headers.get('X-Admin-Password')
            curr_cfg = get_env_config()
            if auth_header and auth_header == curr_cfg['ADMIN_PASSWORD']:
                session['is_admin'] = True
                return f(*args, **kwargs)
            return jsonify({'error': 'Unauthorized. Admin login required.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ==========================================
# PUBLIC FRONTEND ROUTES
# ==========================================

@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory(BASE_DIR, 'style.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory(BASE_DIR, 'script.js')

@app.route('/admin')
def serve_admin():
    if not session.get('is_admin'):
        return redirect('/admin/login')
    return send_from_directory(BASE_DIR, 'admin.html')

@app.route('/admin/login')
def serve_admin_login():
    if session.get('is_admin'):
        return redirect('/admin')
    return send_from_directory(BASE_DIR, 'admin-login.html')

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)

# ==========================================
# API: MEDIA / IMAGE UPLOADS
# ==========================================

@app.route('/api/upload', methods=['POST'])
@require_admin
def upload_file():
    file = request.files.get('file') or request.files.get('image')
    if not file or file.filename == '':
        return jsonify({'error': 'No image file uploaded. Please select an image.'}), 400
    
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'Unsupported format .{ext}. Allowed image formats: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    unique_filename = f"{uuid.uuid4().hex[:12]}.{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    file.save(dest_path)
    file_url = f"/uploads/{unique_filename}"
    
    return jsonify({
        'success': True,
        'message': 'Image uploaded successfully!',
        'url': file_url,
        'filename': unique_filename
    })

@app.route('/api/upload/<filename>', methods=['DELETE'])
@require_admin
def delete_upload_file(filename):
    safe_name = os.path.basename(filename)
    dest_path = os.path.join(UPLOAD_DIR, safe_name)
    if os.path.exists(dest_path):
        try:
            os.remove(dest_path)
            return jsonify({'success': True, 'message': 'Image file removed.'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'Image not found.'}), 404

# ==========================================
# API: SITE CONTENT (PERMANENT STORAGE)
# ==========================================

@app.route('/api/content', methods=['GET'])
def get_site_content():
    content = load_json(CONTENT_FILE, {})
    return jsonify(content)

@app.route('/api/content', methods=['POST'])
@require_admin
def update_site_content():
    new_data = request.get_json(silent=True)
    if not new_data or not isinstance(new_data, dict):
        return jsonify({'error': 'Invalid JSON data provided.'}), 400

    current_data = load_json(CONTENT_FILE, {})
    # Deep merge or full update
    current_data.update(new_data)
    save_json(CONTENT_FILE, current_data)
    return jsonify({
        'success': True,
        'message': 'Site content successfully updated and saved permanently to disk.',
        'content': current_data
    })

@app.route('/api/content/reset', methods=['POST'])
@require_admin
def reset_site_content():
    # If backup exists or restore initial template
    initial_file = os.path.join(DATA_DIR, 'site_content_default.json')
    if os.path.exists(initial_file):
        default_content = load_json(initial_file, {})
    else:
        # Fallback to current
        default_content = load_json(CONTENT_FILE, {})
    save_json(CONTENT_FILE, default_content)
    return jsonify({'success': True, 'message': 'Content reset to defaults.', 'content': default_content})

# ==========================================
# API: APPOINTMENTS (PERMANENT STORAGE)
# ==========================================

@app.route('/api/appointments', methods=['GET'])
@require_admin
def get_appointments():
    appointments = load_json(APPOINTMENTS_FILE, [])
    # Return newest appointments first
    return jsonify(appointments)

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get('name') or '').strip()
    phone = (data.get('phone') or '').strip()
    department = (data.get('department') or '').strip()
    date_val = (data.get('date') or '').strip()
    message = (data.get('message') or '').strip()

    if not name or not phone or not department or not date_val:
        return jsonify({'error': 'Please fill in all required fields (Name, Phone, Department, Date).'}), 400

    now_str = datetime.datetime.now().strftime('%Y-%m-%d %I:%M %p')
    new_appointment = {
        'id': f"apt_{uuid.uuid4().hex[:8]}",
        'name': name,
        'phone': phone,
        'department': department,
        'date': date_val,
        'message': message,
        'status': 'Pending',
        'created_at': now_str
    }

    appointments = load_json(APPOINTMENTS_FILE, [])
    appointments.insert(0, new_appointment)
    save_json(APPOINTMENTS_FILE, appointments)

    return jsonify({
        'success': True,
        'message': 'Appointment request received successfully! Our team will contact you shortly.',
        'appointment': new_appointment
    }), 201

@app.route('/api/appointments/<apt_id>', methods=['PATCH'])
@require_admin
def update_appointment_status(apt_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get('status')
    new_notes = data.get('notes')

    appointments = load_json(APPOINTMENTS_FILE, [])
    found = False
    for apt in appointments:
        if apt['id'] == apt_id:
            if new_status:
                apt['status'] = new_status
            if new_notes is not None:
                apt['notes'] = new_notes.strip()
            found = True
            break

    if not found:
        return jsonify({'error': 'Appointment not found.'}), 404

    save_json(APPOINTMENTS_FILE, appointments)
    return jsonify({'success': True, 'message': 'Appointment record updated successfully.'})

@app.route('/api/appointments/<apt_id>', methods=['DELETE'])
@require_admin
def delete_appointment(apt_id):
    appointments = load_json(APPOINTMENTS_FILE, [])
    initial_len = len(appointments)
    appointments = [apt for apt in appointments if apt['id'] != apt_id]

    if len(appointments) == initial_len:
        return jsonify({'error': 'Appointment not found.'}), 404

    save_json(APPOINTMENTS_FILE, appointments)
    return jsonify({'success': True, 'message': 'Appointment deleted successfully.'})

# ==========================================
# API: ADMIN AUTH & .ENV SETTINGS
# ==========================================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or request.form.to_dict()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    # Read fresh credentials directly from .env dynamically
    cfg = get_env_config()
    env_user = cfg['ADMIN_USERNAME']
    env_pass = cfg['ADMIN_PASSWORD']

    if username == env_user and password == env_pass:
        session['is_admin'] = True
        session['admin_user'] = username
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'redirect': '/admin'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Invalid username or password. Check your .env file credentials.'
        }), 401

@app.route('/api/admin/logout', methods=['POST', 'GET'])
def admin_logout():
    session.clear()
    if request.method == 'GET':
        return redirect('/admin/login')
    return jsonify({'success': True, 'message': 'Logged out successfully.', 'redirect': '/admin/login'})

@app.route('/api/admin/check', methods=['GET'])
def check_admin_status():
    is_admin = bool(session.get('is_admin'))
    user = session.get('admin_user') or 'admin'
    return jsonify({'authenticated': is_admin, 'user': user})

@app.route('/api/admin/env', methods=['GET'])
@require_admin
def get_env_details():
    cfg = get_env_config()
    return jsonify({
        'username': cfg['ADMIN_USERNAME'],
        'password': cfg['ADMIN_PASSWORD'],
        'port': cfg['PORT'],
        'env_file_path': ENV_FILE
    })

@app.route('/api/admin/env', methods=['POST'])
@require_admin
def update_env_details():
    data = request.get_json(silent=True) or {}
    new_user = (data.get('username') or '').strip()
    new_pass = (data.get('password') or '').strip()

    if not new_user or not new_pass:
        return jsonify({'error': 'Both username and password are required.'}), 400

    update_env_credentials(new_user, new_pass)
    session['admin_user'] = new_user
    return jsonify({
        'success': True,
        'message': 'Admin credentials updated in .env successfully! You can also view or edit them in .env anytime.',
        'username': new_user
    })

if __name__ == '__main__':
    # Also save a default backup for content reset
    default_bk = os.path.join(DATA_DIR, 'site_content_default.json')
    if not os.path.exists(default_bk) and os.path.exists(CONTENT_FILE):
        with open(CONTENT_FILE, 'r', encoding='utf-8') as src:
            with open(default_bk, 'w', encoding='utf-8') as dst:
                dst.write(src.read())

    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    current_cfg = get_env_config()
    port = current_cfg['PORT']
    print("==================================================")
    print("LEELAVATI HOSPITAL SERVER STARTING")
    print(f"Admin Portal: http://localhost:{port}/admin")
    print(f"Public Site:  http://localhost:{port}/")
    print(f"Admin User:   {current_cfg['ADMIN_USERNAME']}")
    print(f"Admin Pass:   {current_cfg['ADMIN_PASSWORD']}")
    print(f"Credentials:  {ENV_FILE}")
    print("==================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
