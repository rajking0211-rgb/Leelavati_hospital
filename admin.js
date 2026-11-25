/* =====================================================
   LEELAVATI HOSPITAL - ADMIN DASHBOARD LOGIC
   Comprehensive Image Management, Dynamic CRUD & State Engine
===================================================== */

let siteContent = null;
let appointmentsData = [];

// =====================================================
// INITIALIZATION & AUTH CHECK
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initModals();
    initDepartmentManager();
    initManualAppointmentManager();
    await checkAuth();
    await loadInitialData();
});

async function checkAuth() {
    try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = '/admin/login';
            return;
        }
        const username = data.user || 'Admin';
        document.getElementById('adminUsernameDisplay').textContent = username;
        document.getElementById('adminAvatarLetter').textContent = username.charAt(0).toUpperCase();
    } catch (err) {
        console.error('Auth verification error:', err);
    }
}

async function loadInitialData() {
    await Promise.all([
        fetchSiteContent(),
        fetchAppointments(),
        fetchEnvDetails()
    ]);
}

// =====================================================
// TAB NAVIGATION
// =====================================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const menuToggle = document.getElementById('menuToggle');
    const adminSidebar = document.getElementById('adminSidebar');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
                if (window.innerWidth <= 1024) {
                    adminSidebar.classList.remove('open');
                }
            }
        });
    });

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
        });
    }

    // Topbar Master Save
    const btnSaveMaster = document.getElementById('btnSaveMaster');
    if (btnSaveMaster) {
        btnSaveMaster.addEventListener('click', saveAllContent);
    }

    // Refresh Stats
    const btnRefreshStats = document.getElementById('btnRefreshStats');
    if (btnRefreshStats) {
        btnRefreshStats.addEventListener('click', async () => {
            await fetchAppointments();
            showToast('Metrics and appointments refreshed!', 'info');
        });
    }

    // Individual Tab Save Buttons
    document.querySelectorAll('.btn-save-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            saveAllContent();
        });
    });

    // Theme color sync
    const colorPicker = document.getElementById('brand_theme_color');
    const colorText = document.getElementById('brand_theme_color_text');
    if (colorPicker && colorText) {
        colorPicker.addEventListener('input', () => {
            colorText.value = colorPicker.value;
        });
        colorText.addEventListener('input', () => {
            colorPicker.value = colorText.value;
        });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm('Are you sure you want to log out?')) {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
            }
        });
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        }
    });

    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.classList.add('active');
        const tabTitle = targetPanel.querySelector('.panel-header h2')?.innerText || 'Dashboard';
        document.getElementById('currentTabTitle').textContent = tabTitle.trim();
    }
}

// =====================================================
// UNIFIED IMAGE MANAGEMENT (UPLOAD, CHANGE, REMOVE, URL)
// =====================================================

window.handleImageUpload = async function (fileInput, fieldId) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('file', file);

    const parentBtn = fileInput.closest('.btn-upload-file');
    const originalText = parentBtn ? parentBtn.innerHTML : '';
    if (parentBtn) {
        parentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
    }

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
            setImageState(fieldId, data.url);
            showToast('Image uploaded and set successfully!', 'success');
        } else {
            showToast(data.error || 'Failed to upload image.', 'error');
        }
    } catch (err) {
        console.error('Image upload error:', err);
        showToast('Network error during image upload.', 'error');
    } finally {
        if (parentBtn) {
            parentBtn.innerHTML = originalText;
        }
        fileInput.value = ''; // Reset file input
    }
};

window.handleImageRemove = function (fieldId) {
    setImageState(fieldId, '');
    showToast('Image removed. Default visual will be used.', 'info');
};

window.handleImageUrlInput = function (fieldId) {
    const input = document.getElementById(fieldId);
    const url = input ? input.value.trim() : '';
    syncImagePreview(fieldId, url);
};

function setImageState(fieldId, url) {
    const input = document.getElementById(fieldId);
    if (input) input.value = url || '';
    syncImagePreview(fieldId, url);
}

function syncImagePreview(fieldId, url) {
    const preview = document.getElementById(fieldId + '_preview');
    const placeholder = document.getElementById(fieldId + '_placeholder');
    if (url) {
        if (preview) {
            preview.src = url;
            preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
    } else {
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// =====================================================
// API: LOAD SITE CONTENT
// =====================================================

async function fetchSiteContent() {
    try {
        const res = await fetch('/api/content');
        if (!res.ok) throw new Error('Failed to load site content');
        siteContent = await res.json();
        populateFormFields(siteContent);
    } catch (err) {
        console.error('Error loading content:', err);
        showToast('Error loading site content from server.', 'error');
    }
}

function populateFormFields(data) {
    if (!data) return;

    // Sidebar & Brand
    if (data.brand) {
        document.getElementById('sidebarHospitalName').textContent = data.brand.name || 'Leelavati';
        setVal('brand_name', data.brand.name);
        setVal('brand_suffix', data.brand.suffix);
        setVal('brand_tagline', data.brand.tagline);
        setVal('brand_location', data.brand.location);
        setVal('brand_hours', data.brand.hours);
        setVal('brand_emergency_phone', data.brand.emergency_phone);
        setVal('brand_phone', data.brand.phone);
        setVal('brand_email', data.brand.email);
        setVal('brand_address', data.brand.address);
        setVal('brand_social_facebook', data.brand.social_facebook);
        setVal('brand_social_instagram', data.brand.social_instagram);
        setVal('brand_social_linkedin', data.brand.social_linkedin);
        setVal('brand_social_youtube', data.brand.social_youtube);

        // Images & Styling
        setImageState('brand_logo_img', data.brand.logo_image);
        setImageState('brand_favicon_img', data.brand.favicon_image);
        setImageState('brand_announcement_icon', data.brand.announcement_icon);

        const annCheck = document.getElementById('brand_top_announcement_enabled');
        if (annCheck) annCheck.checked = data.brand.top_announcement_enabled !== false;
        setVal('brand_top_announcement_text', data.brand.top_announcement_text);

        const themeCol = data.brand.theme_color || '#087f8c';
        setVal('brand_theme_color', themeCol);
        setVal('brand_theme_color_text', themeCol);
    }

    // Hero
    if (data.hero) {
        setVal('hero_badge', data.hero.badge);
        setVal('hero_title_line1', data.hero.title_line1);
        setVal('hero_title_line2', data.hero.title_line2);
        setVal('hero_description', data.hero.description);
        setVal('hero_btn_primary_text', data.hero.btn_primary_text);
        setVal('hero_btn_primary_link', data.hero.btn_primary_link);
        setVal('hero_btn_secondary_text', data.hero.btn_secondary_text);
        setVal('hero_btn_secondary_link', data.hero.btn_secondary_link);
        setVal('hero_trust_title', data.hero.trust_title);
        setVal('hero_trust_subtitle', data.hero.trust_subtitle);
        setVal('hero_rating_value', data.hero.rating_value);
        setVal('hero_patients_value', data.hero.patients_value);
        setImageState('hero_img', data.hero.image);
        setImageState('hero_bg_img', data.hero.bg_image);
        setImageState('hero_trust_avatar', data.hero.trust_avatar);
        renderHeroStats(data.hero.stats || []);
    }

    // About
    if (data.about) {
        setVal('about_badge', data.about.badge);
        setVal('about_title_line1', data.about.title_line1);
        setVal('about_title_line2', data.about.title_line2);
        setVal('about_paragraph1', data.about.paragraph1);
        setVal('about_paragraph2', data.about.paragraph2);
        setVal('about_experience_value', data.about.experience_value);
        setVal('about_experience_label', data.about.experience_label);
        setImageState('about_img', data.about.image);
        setImageState('about_director_img', data.about.director_image);
        setImageState('about_badge_img', data.about.badge_image);
        renderAboutFeatures(data.about.features || []);
    }

    // Services
    if (data.services_header) {
        setVal('services_badge', data.services_header.badge);
        setVal('services_title_line1', data.services_header.title_line1);
        setVal('services_title_line2', data.services_header.title_line2);
        setVal('services_description', data.services_header.description);
        setImageState('services_banner_img', data.services_header.banner_image);
    }
    renderServicesGrid(data.services || []);
    document.getElementById('statServicesCount').textContent = (data.services || []).length;
    renderDepartmentsList(data.departments_list || []);

    // Why Us
    if (data.why_us) {
        setVal('why_badge', data.why_us.badge);
        setVal('why_title_line1', data.why_us.title_line1);
        setVal('why_title_line2', data.why_us.title_line2);
        setVal('why_description', data.why_us.description);
        setVal('why_happy_patients_value', data.why_us.happy_patients_value);
        setVal('why_quality_title', data.why_us.quality_title);
        setImageState('why_img', data.why_us.image);
        setImageState('why_award_img', data.why_us.award_image);
        renderWhyItems(data.why_us.items || []);
    }

    // Doctors
    if (data.doctors_header) {
        setVal('doctors_badge', data.doctors_header.badge);
        setVal('doctors_title_line1', data.doctors_header.title_line1);
        setVal('doctors_title_line2', data.doctors_header.title_line2);
        setVal('doctors_description', data.doctors_header.description);
        setImageState('doctors_banner_img', data.doctors_header.banner_image);
    }
    renderDoctorsGrid(data.doctors || []);
    document.getElementById('statDoctorsCount').textContent = (data.doctors || []).length;

    // Testimonials
    if (data.testimonials_header) {
        setVal('testimonials_badge', data.testimonials_header.badge);
        setVal('testimonials_title_line1', data.testimonials_header.title_line1);
        setVal('testimonials_title_line2', data.testimonials_header.title_line2);
        setImageState('testimonials_banner_img', data.testimonials_header.banner_image);
    }
    renderTestimonialsGrid(data.testimonials || []);

    // Appointment Booking Section
    if (data.appointment_section) {
        setVal('appointment_assist_phone', data.appointment_section.assist_phone);
        setVal('appointment_badge', data.appointment_section.badge);
        setVal('appointment_title_line1', data.appointment_section.title_line1);
        setVal('appointment_title_line2', data.appointment_section.title_line2);
        setVal('appointment_description', data.appointment_section.description);
        setImageState('appointment_banner_img', data.appointment_section.banner_image);
    }

    // Contact & Footer
    if (data.contact) {
        setVal('contact_badge', data.contact.badge);
        setVal('contact_title_line1', data.contact.title_line1);
        setVal('contact_title_line2', data.contact.title_line2);
        setVal('contact_description', data.contact.description);
        setVal('contact_address_text', data.contact.address_text);
        setVal('contact_phone', data.contact.phone);
        setVal('contact_email', data.contact.email);
        setVal('contact_hours_line1', data.contact.hours_line1);
        setVal('contact_hours_line2', data.contact.hours_line2);
        setVal('contact_map_subtitle', data.contact.map_subtitle);
        setImageState('contact_img', data.contact.image);
        setImageState('contact_reception_img', data.contact.reception_image);
        setImageState('contact_qr_img', data.contact.qr_code_image);
    }

    if (data.cta) {
        setVal('cta_subtitle', data.cta.subtitle);
        setVal('cta_heading', data.cta.heading);
        setVal('cta_button_text', data.cta.button_text);
        setVal('cta_button_link', data.cta.button_link);
    }

    if (data.footer) {
        setVal('footer_brand_description', data.footer.brand_description);
        setVal('footer_copyright_text', data.footer.copyright_text);
        setImageState('footer_accreditation_img', data.footer.accreditation_image);
    }

    // SEO
    if (data.seo) {
        setVal('seo_meta_title', data.seo.meta_title);
        setVal('seo_meta_description', data.seo.meta_description);
        setVal('seo_meta_keywords', data.seo.meta_keywords);
        setImageState('seo_og_img', data.seo.og_image);
    }

    // Admin Profile & System
    if (data.admin_profile) {
        setImageState('admin_avatar_img', data.admin_profile.avatar_image);
        const maint = document.getElementById('maintenance_mode_toggle');
        if (maint) maint.checked = !!data.admin_profile.maintenance_mode;
    }

    // Central Media Hub
    renderDashboardMediaHub();
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// =====================================================
// DEPARTMENTS LIST OPTIONS MANAGER
// =====================================================

function initDepartmentManager() {
    const addBtn = document.getElementById('btnAddDepartment');
    const input = document.getElementById('newDepartmentInput');

    if (addBtn && input) {
        const addDept = () => {
            const val = input.value.trim();
            if (!val) return;
            if (!siteContent.departments_list) siteContent.departments_list = [];
            if (!siteContent.departments_list.includes(val)) {
                siteContent.departments_list.push(val);
                renderDepartmentsList(siteContent.departments_list);
                input.value = '';
                showToast(`Department "${val}" added!`, 'success');
            } else {
                showToast('Department already exists.', 'warning');
            }
        };

        addBtn.addEventListener('click', addDept);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addDept();
            }
        });
    }
}

function renderDepartmentsList(departments) {
    const container = document.getElementById('departmentsListContainer');
    if (!container) return;
    if (!departments || departments.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:13px;">No departments configured. Add one below.</span>';
        return;
    }

    container.innerHTML = departments.map((dept, idx) => `
        <span class="dept-tag">
            <span>${escapeHtml(dept)}</span>
            <button type="button" onclick="removeDepartment(${idx})" title="Remove ${escapeHtml(dept)}">&times;</button>
        </span>
    `).join('');
}

window.removeDepartment = function (index) {
    if (!siteContent.departments_list) return;
    const removed = siteContent.departments_list.splice(index, 1);
    renderDepartmentsList(siteContent.departments_list);
    showToast(`Removed department "${removed[0]}".`, 'info');
};

// =====================================================
// RENDER SUB-COMPONENTS
// =====================================================

function renderHeroStats(stats) {
    const container = document.getElementById('heroStatsContainer');
    container.innerHTML = stats.map((stat, idx) => `
        <div class="form-group" style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid var(--border);">
            <label>Stat Box #${idx + 1}</label>
            <div style="display:flex; gap:10px;">
                <input type="text" class="hero-stat-val" data-idx="${idx}" value="${stat.value || ''}" placeholder="Value (e.g. 10K+)">
                <input type="text" class="hero-stat-lbl" data-idx="${idx}" value="${stat.label || ''}" placeholder="Label (e.g. Patients Served)">
            </div>
        </div>
    `).join('');
}

function renderAboutFeatures(features) {
    const container = document.getElementById('aboutFeaturesContainer');
    container.innerHTML = features.map((feat, idx) => `
        <div class="form-group" style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
            <label style="font-weight:700; color:var(--primary);">Feature Bullet #${idx + 1}</label>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <input type="text" class="about-feat-title" data-idx="${idx}" value="${feat.title || ''}" placeholder="Feature Title">
                <input type="text" class="about-feat-desc" data-idx="${idx}" value="${feat.description || ''}" placeholder="Feature Brief Description">
            </div>
        </div>
    `).join('');
}

function renderWhyItems(items) {
    const container = document.getElementById('whyItemsContainer');
    container.innerHTML = items.map((item, idx) => `
        <div class="form-group" style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
            <label style="font-weight:700; color:var(--primary);">Why Us Card #${idx + 1}</label>
            <div class="form-grid-3" style="gap:10px; margin-top:6px;">
                <input type="text" class="why-item-icon" data-idx="${idx}" value="${item.icon || ''}" placeholder="Icon (e.g. fa-solid fa-clock)">
                <input type="text" class="why-item-title" data-idx="${idx}" value="${item.title || ''}" placeholder="Title">
                <input type="text" class="why-item-desc" data-idx="${idx}" value="${item.description || ''}" placeholder="Description">
            </div>
        </div>
    `).join('');
}

// Services Grid
function renderServicesGrid(services) {
    const grid = document.getElementById('servicesGrid');
    if (!services || services.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No services found. Click Add New Specialty above.</p>';
        return;
    }

    grid.innerHTML = services.map(svc => `
        <div class="dynamic-item-card">
            <div>
                <div class="item-top">
                    <div class="item-icon-box" style="overflow:hidden;">
                        ${svc.image ? `<img src="${escapeHtml(svc.image)}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="${svc.icon || 'fa-solid fa-stethoscope'}"></i>`}
                    </div>
                    <div class="item-info">
                        <h4>${svc.title || 'Untitled'}</h4>
                        <span>${svc.link || '#appointment'}</span>
                    </div>
                </div>

                <!-- 1-Click Card Image Strip -->
                <div class="item-card-media-strip">
                    <div class="item-card-media-preview">
                        ${svc.image ? `<img src="${escapeHtml(svc.image)}">` : `<i class="${svc.icon || 'fa-solid fa-stethoscope'}" style="color:var(--text-muted); font-size:16px;"></i>`}
                    </div>
                    <div class="item-card-media-info">
                        <small style="font-weight:600; color:${svc.image ? 'var(--primary)' : 'var(--text-muted)'};">
                            ${svc.image ? 'Custom Image Active' : 'Default Icon'}
                        </small>
                    </div>
                    <div class="item-card-media-actions">
                        <label class="btn-card-upload-file" title="Upload or Change Image">
                            <i class="fa-solid fa-cloud-arrow-up"></i> Change
                            <input type="file" accept="image/*" onchange="handleCardImageUpload('service', ${svc.id}, this)">
                        </label>
                        ${svc.image ? `<button type="button" class="btn-card-remove-file" onclick="removeServiceImage(${svc.id})" title="Remove Image"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>

                <p class="item-desc">${svc.description || ''}</p>
            </div>
            <div class="item-actions">
                <button class="btn-edit-item" onclick="openEditService(${svc.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit Details
                </button>
                <button class="btn-delete-item" onclick="deleteService(${svc.id})">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Doctors Grid
function renderDoctorsGrid(doctors) {
    const grid = document.getElementById('doctorsGrid');
    if (!doctors || doctors.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No doctor profiles found. Click Add Doctor above.</p>';
        return;
    }

    grid.innerHTML = doctors.map(doc => `
        <div class="dynamic-item-card">
            <div>
                <div class="item-top">
                    <div class="item-icon-box" style="overflow:hidden;">
                        ${doc.image ? `<img src="${escapeHtml(doc.image)}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="${doc.icon || 'fa-solid fa-user-doctor'}"></i>`}
                    </div>
                    <div class="item-info">
                        <h4>${doc.name || 'Dr. Name'}</h4>
                        <span>${doc.specialty || 'General Medicine'}</span>
                    </div>
                </div>

                <!-- 1-Click Doctor Photo Strip -->
                <div class="item-card-media-strip">
                    <div class="item-card-media-preview">
                        ${doc.image ? `<img src="${escapeHtml(doc.image)}">` : `<i class="fa-solid fa-user-doctor" style="color:var(--text-muted); font-size:16px;"></i>`}
                    </div>
                    <div class="item-card-media-info">
                        <small style="font-weight:600; color:${doc.image ? 'var(--primary)' : 'var(--text-muted)'};">
                            ${doc.image ? 'Portrait Active' : 'Default Silhouette'}
                        </small>
                    </div>
                    <div class="item-card-media-actions">
                        <label class="btn-card-upload-file" title="Upload or Change Photo">
                            <i class="fa-solid fa-camera"></i> Change
                            <input type="file" accept="image/*" onchange="handleCardImageUpload('doctor', ${doc.id}, this)">
                        </label>
                        ${doc.image ? `<button type="button" class="btn-card-remove-file" onclick="removeDoctorPhoto(${doc.id})" title="Remove Photo"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>

                <p class="item-desc">
                    <strong>Qualification:</strong> ${doc.qualification || 'MBBS'}<br>
                    <strong>Experience:</strong> ${doc.experience || '10+ Years'}<br>
                    <strong>Rating:</strong> ⭐ ${doc.rating || '4.9'}
                </p>
            </div>
            <div class="item-actions">
                <button class="btn-edit-item" onclick="openEditDoctor(${doc.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit Details
                </button>
                <button class="btn-delete-item" onclick="deleteDoctor(${doc.id})">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Testimonials Grid
function renderTestimonialsGrid(testimonials) {
    const grid = document.getElementById('testimonialsGrid');
    if (!testimonials || testimonials.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No testimonials found. Click Add Testimonial above.</p>';
        return;
    }

    grid.innerHTML = testimonials.map(test => `
        <div class="dynamic-item-card">
            <div>
                <div class="item-top">
                    <div class="item-icon-box" style="font-weight:700; overflow:hidden;">
                        ${test.image ? `<img src="${escapeHtml(test.image)}" style="width:100%; height:100%; object-fit:cover;">` : (test.avatar || 'PT')}
                    </div>
                    <div class="item-info">
                        <h4>${test.name || 'Patient'}</h4>
                        <span>${'★'.repeat(test.rating || 5)} (${test.role || 'Patient'})</span>
                    </div>
                </div>

                <!-- 1-Click Patient Avatar Strip -->
                <div class="item-card-media-strip">
                    <div class="item-card-media-preview">
                        ${test.image ? `<img src="${escapeHtml(test.image)}">` : `<span style="font-weight:700; font-size:13px; color:var(--primary);">${escapeHtml(test.avatar || 'PT')}</span>`}
                    </div>
                    <div class="item-card-media-info">
                        <small style="font-weight:600; color:${test.image ? 'var(--primary)' : 'var(--text-muted)'};">
                            ${test.image ? 'Custom Photo' : 'Initials Avatar'}
                        </small>
                    </div>
                    <div class="item-card-media-actions">
                        <label class="btn-card-upload-file" title="Upload or Change Avatar Photo">
                            <i class="fa-solid fa-user"></i> Change
                            <input type="file" accept="image/*" onchange="handleCardImageUpload('testimonial', ${test.id}, this)">
                        </label>
                        ${test.image ? `<button type="button" class="btn-card-remove-file" onclick="removeTestimonialPhoto(${test.id})" title="Remove Photo"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>

                <p class="item-desc">"${test.quote || ''}"</p>
            </div>
            <div class="item-actions">
                <button class="btn-edit-item" onclick="openEditTestimonial(${test.id})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit Details
                </button>
                <button class="btn-delete-item" onclick="deleteTestimonial(${test.id})">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// =====================================================
// SAVE ALL CONTENT (PERMANENT DISK WRITE)
// =====================================================

async function saveAllContent() {
    if (!siteContent) return;

    // Collect Brand
    siteContent.brand = {
        name: getVal('brand_name'),
        suffix: getVal('brand_suffix'),
        tagline: getVal('brand_tagline'),
        location: getVal('brand_location'),
        hours: getVal('brand_hours'),
        emergency_phone: getVal('brand_emergency_phone'),
        phone: getVal('brand_phone'),
        email: getVal('brand_email'),
        address: getVal('brand_address'),
        social_facebook: getVal('brand_social_facebook'),
        social_instagram: getVal('brand_social_instagram'),
        social_linkedin: getVal('brand_social_linkedin'),
        social_youtube: getVal('brand_social_youtube'),
        logo_image: getVal('brand_logo_img'),
        favicon_image: getVal('brand_favicon_img'),
        announcement_icon: getVal('brand_announcement_icon'),
        top_announcement_enabled: document.getElementById('brand_top_announcement_enabled')?.checked !== false,
        top_announcement_text: getVal('brand_top_announcement_text'),
        theme_color: getVal('brand_theme_color') || '#087f8c'
    };

    // Collect Hero Stats
    const heroStats = [];
    document.querySelectorAll('.hero-stat-val').forEach((valInput, idx) => {
        const lblInput = document.querySelector(`.hero-stat-lbl[data-idx="${idx}"]`);
        heroStats.push({
            id: idx + 1,
            value: valInput.value.trim(),
            label: lblInput ? lblInput.value.trim() : ''
        });
    });

    siteContent.hero = {
        badge: getVal('hero_badge'),
        title_line1: getVal('hero_title_line1'),
        title_line2: getVal('hero_title_line2'),
        description: getVal('hero_description'),
        btn_primary_text: getVal('hero_btn_primary_text'),
        btn_primary_link: getVal('hero_btn_primary_link'),
        btn_secondary_text: getVal('hero_btn_secondary_text'),
        btn_secondary_link: getVal('hero_btn_secondary_link'),
        trust_title: getVal('hero_trust_title'),
        trust_subtitle: getVal('hero_trust_subtitle'),
        rating_value: getVal('hero_rating_value'),
        rating_label: 'Patient Rating',
        patients_value: getVal('hero_patients_value'),
        patients_label: 'Patients Served',
        image: getVal('hero_img'),
        bg_image: getVal('hero_bg_img'),
        trust_avatar: getVal('hero_trust_avatar'),
        stats: heroStats
    };

    // Collect About Features
    const aboutFeatures = [];
    document.querySelectorAll('.about-feat-title').forEach((titleInput, idx) => {
        const descInput = document.querySelector(`.about-feat-desc[data-idx="${idx}"]`);
        aboutFeatures.push({
            id: idx + 1,
            title: titleInput.value.trim(),
            description: descInput ? descInput.value.trim() : ''
        });
    });

    siteContent.about = {
        badge: getVal('about_badge'),
        title_line1: getVal('about_title_line1'),
        title_line2: getVal('about_title_line2'),
        paragraph1: getVal('about_paragraph1'),
        paragraph2: getVal('about_paragraph2'),
        experience_value: getVal('about_experience_value'),
        experience_label: getVal('about_experience_label'),
        image: getVal('about_img'),
        director_image: getVal('about_director_img'),
        badge_image: getVal('about_badge_img'),
        features: aboutFeatures
    };

    // Collect Services Header
    siteContent.services_header = {
        badge: getVal('services_badge'),
        title_line1: getVal('services_title_line1'),
        title_line2: getVal('services_title_line2'),
        description: getVal('services_description'),
        banner_image: getVal('services_banner_img')
    };

    // Collect Why Items
    const whyItems = [];
    document.querySelectorAll('.why-item-icon').forEach((iconInput, idx) => {
        const titleInput = document.querySelector(`.why-item-title[data-idx="${idx}"]`);
        const descInput = document.querySelector(`.why-item-desc[data-idx="${idx}"]`);
        whyItems.push({
            id: idx + 1,
            icon: iconInput.value.trim(),
            title: titleInput ? titleInput.value.trim() : '',
            description: descInput ? descInput.value.trim() : ''
        });
    });

    siteContent.why_us = {
        badge: getVal('why_badge'),
        title_line1: getVal('why_title_line1'),
        title_line2: getVal('why_title_line2'),
        description: getVal('why_description'),
        happy_patients_value: getVal('why_happy_patients_value'),
        happy_patients_label: 'Happy Patients',
        quality_title: getVal('why_quality_title'),
        quality_subtitle: 'With compassion & trust',
        image: getVal('why_img'),
        award_image: getVal('why_award_img'),
        items: whyItems
    };

    // Doctors Header
    siteContent.doctors_header = {
        badge: getVal('doctors_badge'),
        title_line1: getVal('doctors_title_line1'),
        title_line2: getVal('doctors_title_line2'),
        description: getVal('doctors_description'),
        banner_image: getVal('doctors_banner_img')
    };

    // Testimonials Header
    siteContent.testimonials_header = {
        badge: getVal('testimonials_badge'),
        title_line1: getVal('testimonials_title_line1'),
        title_line2: getVal('testimonials_title_line2'),
        banner_image: getVal('testimonials_banner_img')
    };

    // Appointment Booking Section
    siteContent.appointment_section = {
        assist_phone: getVal('appointment_assist_phone'),
        badge: getVal('appointment_badge'),
        title_line1: getVal('appointment_title_line1'),
        title_line2: getVal('appointment_title_line2'),
        description: getVal('appointment_description'),
        banner_image: getVal('appointment_banner_img')
    };

    // Contact & Footer
    siteContent.contact = {
        badge: getVal('contact_badge'),
        title_line1: getVal('contact_title_line1'),
        title_line2: getVal('contact_title_line2'),
        description: getVal('contact_description'),
        address_title: 'Visit Us',
        address_text: getVal('contact_address_text'),
        phone_title: 'Call Us',
        phone: getVal('contact_phone'),
        email_title: 'Email Us',
        email: getVal('contact_email'),
        hours_title: 'Working Hours',
        hours_line1: getVal('contact_hours_line1'),
        hours_line2: getVal('contact_hours_line2'),
        map_title: siteContent.brand.name + ' ' + (siteContent.brand.suffix || 'Hospital'),
        map_subtitle: getVal('contact_map_subtitle'),
        image: getVal('contact_img'),
        reception_image: getVal('contact_reception_img'),
        qr_code_image: getVal('contact_qr_img')
    };

    siteContent.cta = {
        subtitle: getVal('cta_subtitle'),
        heading: getVal('cta_heading'),
        button_text: getVal('cta_button_text'),
        button_link: getVal('cta_button_link')
    };

    siteContent.footer = {
        brand_description: getVal('footer_brand_description'),
        copyright_text: getVal('footer_copyright_text'),
        accreditation_image: getVal('footer_accreditation_img')
    };

    // SEO
    siteContent.seo = {
        meta_title: getVal('seo_meta_title'),
        meta_description: getVal('seo_meta_description'),
        meta_keywords: getVal('seo_meta_keywords'),
        og_image: getVal('seo_og_img')
    };

    // Admin Profile & System
    siteContent.admin_profile = {
        avatar_image: getVal('admin_avatar_img'),
        maintenance_mode: document.getElementById('maintenance_mode_toggle')?.checked || false
    };

    // Send to backend
    const saveBtn = document.getElementById('btnSaveMaster');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const res = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(siteContent)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast('All changes & images permanently saved to disk!', 'success');
            document.getElementById('sidebarHospitalName').textContent = siteContent.brand.name;
        } else {
            showToast(data.error || 'Failed to save changes.', 'error');
        }
    } catch (err) {
        console.error('Save error:', err);
        showToast('Network error while saving changes.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>Save All Changes</span>';
        }
    }
}

// =====================================================
// APPOINTMENTS CRUD & MANAGEMENT
// =====================================================

async function fetchAppointments() {
    try {
        const res = await fetch('/api/appointments');
        if (!res.ok) throw new Error('Failed to fetch appointments');
        appointmentsData = await res.json();
        renderAppointments(appointmentsData);
    } catch (err) {
        console.error('Appointments fetch error:', err);
    }
}

function renderAppointments(appointments) {
    const totalCount = appointments.length;
    const pendingCount = appointments.filter(a => a.status === 'Pending').length;

    document.getElementById('statTotalApts').textContent = totalCount;
    document.getElementById('statPendingApts').textContent = pendingCount;
    document.getElementById('sidebarPendingBadge').textContent = pendingCount;

    // Render Recent Appointments (Top 5) on Dashboard
    const recentTbody = document.getElementById('recentAppointmentsBody');
    if (appointments.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No appointments received yet.</td></tr>';
    } else {
        recentTbody.innerHTML = appointments.slice(0, 5).map(apt => `
            <tr>
                <td><strong>${escapeHtml(apt.name)}</strong></td>
                <td><a href="tel:${escapeHtml(apt.phone)}" style="color:var(--primary); font-weight:600;"><i class="fa-solid fa-phone"></i> ${escapeHtml(apt.phone)}</a></td>
                <td><span style="background:#e8f7f8; color:var(--primary-dark); padding:3px 8px; border-radius:6px; font-weight:600; font-size:12px;">${escapeHtml(apt.department)}</span></td>
                <td><i class="fa-regular fa-calendar"></i> ${escapeHtml(apt.date)}</td>
                <td><span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span></td>
                <td>
                    <select class="status-select" onchange="changeAppointmentStatus('${apt.id}', this.value)">
                        <option value="Pending" ${apt.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${apt.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${apt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    // Render Full Table on Tab 2
    renderAllAppointmentsTable(appointments);
}

function renderAllAppointmentsTable(appointments) {
    const tbody = document.getElementById('allAppointmentsBody');
    const searchTerm = (document.getElementById('aptSearchInput')?.value || '').toLowerCase();
    const filterStatus = document.getElementById('aptStatusFilter')?.value || 'ALL';

    const filtered = appointments.filter(apt => {
        const matchesSearch = !searchTerm ||
            (apt.name && apt.name.toLowerCase().includes(searchTerm)) ||
            (apt.phone && apt.phone.toLowerCase().includes(searchTerm)) ||
            (apt.department && apt.department.toLowerCase().includes(searchTerm));

        const matchesStatus = filterStatus === 'ALL' || apt.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:24px;">No appointments match your criteria.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(apt => `
        <tr>
            <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:11px;">${apt.id}</code></td>
            <td><strong>${escapeHtml(apt.name)}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <a href="tel:${escapeHtml(apt.phone)}" style="color:var(--navy); font-weight:600;"><i class="fa-solid fa-phone"></i> ${escapeHtml(apt.phone)}</a>
                    <a href="https://wa.me/${escapeHtml(apt.phone.replace(/[^0-9]/g, ''))}" target="_blank" title="WhatsApp Message" style="color:#25d366; font-size:16px;">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                </div>
            </td>
            <td><span style="background:#e8f7f8; color:var(--primary-dark); padding:3px 8px; border-radius:6px; font-weight:600; font-size:12px;">${escapeHtml(apt.department)}</span></td>
            <td><strong>${escapeHtml(apt.date)}</strong></td>
            <td style="max-width:200px; font-size:12.5px; line-height:1.4;">${escapeHtml(apt.message || 'None')}</td>
            <td style="font-size:11px; color:var(--text-muted);">${escapeHtml(apt.created_at || '')}</td>
            <td>
                <select class="status-select" onchange="changeAppointmentStatus('${apt.id}', this.value)">
                    <option value="Pending" ${apt.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${apt.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${apt.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="btn-delete-item" onclick="deleteAppointment('${apt.id}')" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Search and filter listeners
document.getElementById('aptSearchInput')?.addEventListener('input', () => {
    renderAllAppointmentsTable(appointmentsData);
});
document.getElementById('aptStatusFilter')?.addEventListener('change', () => {
    renderAllAppointmentsTable(appointmentsData);
});

async function changeAppointmentStatus(aptId, newStatus) {
    try {
        const res = await fetch(`/api/appointments/${aptId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(data.message, 'success');
            await fetchAppointments();
        } else {
            showToast(data.error || 'Failed to update status.', 'error');
        }
    } catch (err) {
        showToast('Network error while updating appointment.', 'error');
    }
}

async function deleteAppointment(aptId) {
    if (!confirm('Are you sure you want to permanently delete this appointment record?')) return;
    try {
        const res = await fetch(`/api/appointments/${aptId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('Appointment record deleted permanently.', 'info');
            await fetchAppointments();
        } else {
            showToast(data.error || 'Failed to delete record.', 'error');
        }
    } catch (err) {
        showToast('Network error while deleting appointment.', 'error');
    }
}

// Export JSON
document.getElementById('btnExportApts')?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appointmentsData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `hospital_appointments_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
});

// =====================================================
// MODALS (SERVICES, DOCTORS, TESTIMONIALS)
// =====================================================

function initModals() {
    // Service Modal Openers
    document.getElementById('btnAddServiceModal')?.addEventListener('click', () => {
        document.getElementById('serviceModalTitle').textContent = 'Add New Specialty';
        document.getElementById('serviceModalId').value = '';
        document.getElementById('serviceModalTitleInput').value = '';
        document.getElementById('serviceModalIconInput').value = 'fa-solid fa-stethoscope';
        document.getElementById('serviceModalDescInput').value = '';
        document.getElementById('serviceModalLinkInput').value = '#appointment';
        setImageState('serviceModalImg', '');
        openModal('serviceModal');
    });

    document.getElementById('btnSaveServiceModal')?.addEventListener('click', () => {
        const id = document.getElementById('serviceModalId').value;
        const title = document.getElementById('serviceModalTitleInput').value.trim();
        const icon = document.getElementById('serviceModalIconInput').value.trim();
        const desc = document.getElementById('serviceModalDescInput').value.trim();
        const link = document.getElementById('serviceModalLinkInput').value.trim();
        const image = getVal('serviceModalImg');

        if (!title || !desc) {
            showToast('Please fill in title and description.', 'error');
            return;
        }

        if (id) {
            // Edit
            const item = siteContent.services.find(s => s.id == id);
            if (item) {
                item.title = title;
                item.icon = icon;
                item.description = desc;
                item.link = link;
                item.image = image;
            }
        } else {
            // Add
            const nextId = (siteContent.services.length > 0 ? Math.max(...siteContent.services.map(s => s.id || 0)) : 0) + 1;
            siteContent.services.push({ id: nextId, title, icon, description: desc, link, image });
        }

        closeModal('serviceModal');
        renderServicesGrid(siteContent.services);
        document.getElementById('statServicesCount').textContent = siteContent.services.length;
        saveAllContent();
    });

    // Doctor Modal Openers
    document.getElementById('btnAddDoctorModal')?.addEventListener('click', () => {
        document.getElementById('doctorModalTitle').textContent = 'Add Medical Doctor';
        document.getElementById('doctorModalId').value = '';
        document.getElementById('doctorModalNameInput').value = '';
        document.getElementById('doctorModalSpecialtyInput').value = '';
        document.getElementById('doctorModalQualInput').value = 'MBBS, MD';
        document.getElementById('doctorModalExpInput').value = '10+ Years';
        document.getElementById('doctorModalRatingInput').value = '4.9';
        setImageState('doctorModalImg', '');
        openModal('doctorModal');
    });

    document.getElementById('btnSaveDoctorModal')?.addEventListener('click', () => {
        const id = document.getElementById('doctorModalId').value;
        const name = document.getElementById('doctorModalNameInput').value.trim();
        const specialty = document.getElementById('doctorModalSpecialtyInput').value.trim();
        const qual = document.getElementById('doctorModalQualInput').value.trim();
        const exp = document.getElementById('doctorModalExpInput').value.trim();
        const rating = document.getElementById('doctorModalRatingInput').value.trim();
        const image = getVal('doctorModalImg');

        if (!name || !specialty) {
            showToast('Please enter doctor name and specialty.', 'error');
            return;
        }

        if (id) {
            const item = siteContent.doctors.find(d => d.id == id);
            if (item) {
                item.name = name;
                item.specialty = specialty;
                item.qualification = qual;
                item.experience = exp;
                item.rating = rating;
                item.image = image;
            }
        } else {
            const nextId = (siteContent.doctors.length > 0 ? Math.max(...siteContent.doctors.map(d => d.id || 0)) : 0) + 1;
            siteContent.doctors.push({
                id: nextId,
                name,
                specialty,
                qualification: qual,
                experience: exp,
                rating,
                icon: 'fa-solid fa-user-doctor',
                image
            });
        }

        closeModal('doctorModal');
        renderDoctorsGrid(siteContent.doctors);
        document.getElementById('statDoctorsCount').textContent = siteContent.doctors.length;
        saveAllContent();
    });

    // Testimonial Modal Openers
    document.getElementById('btnAddTestimonialModal')?.addEventListener('click', () => {
        document.getElementById('testimonialModalTitle').textContent = 'Add Patient Review';
        document.getElementById('testimonialModalId').value = '';
        document.getElementById('testModalNameInput').value = '';
        document.getElementById('testModalAvatarInput').value = 'AS';
        document.getElementById('testModalRoleInput').value = 'Patient';
        document.getElementById('testModalRatingInput').value = '5';
        document.getElementById('testModalQuoteInput').value = '';
        setImageState('testModalImg', '');
        openModal('testimonialModal');
    });

    document.getElementById('btnSaveTestimonialModal')?.addEventListener('click', () => {
        const id = document.getElementById('testimonialModalId').value;
        const name = document.getElementById('testModalNameInput').value.trim();
        const avatar = document.getElementById('testModalAvatarInput').value.trim();
        const role = document.getElementById('testModalRoleInput').value.trim();
        const rating = parseInt(document.getElementById('testModalRatingInput').value) || 5;
        const quote = document.getElementById('testModalQuoteInput').value.trim();
        const image = getVal('testModalImg');

        if (!name || !quote) {
            showToast('Please fill in patient name and review quote.', 'error');
            return;
        }

        if (id) {
            const item = siteContent.testimonials.find(t => t.id == id);
            if (item) {
                item.name = name;
                item.avatar = avatar;
                item.role = role;
                item.rating = rating;
                item.quote = quote;
                item.image = image;
            }
        } else {
            const nextId = (siteContent.testimonials.length > 0 ? Math.max(...siteContent.testimonials.map(t => t.id || 0)) : 0) + 1;
            siteContent.testimonials.push({ id: nextId, name, avatar, role, rating, quote, image });
        }

        closeModal('testimonialModal');
        renderTestimonialsGrid(siteContent.testimonials);
        saveAllContent();
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Edit helpers
window.openEditService = function (id) {
    const item = siteContent.services.find(s => s.id == id);
    if (!item) return;
    document.getElementById('serviceModalTitle').textContent = 'Edit Specialty';
    document.getElementById('serviceModalId').value = item.id;
    document.getElementById('serviceModalTitleInput').value = item.title || '';
    document.getElementById('serviceModalIconInput').value = item.icon || '';
    document.getElementById('serviceModalDescInput').value = item.description || '';
    document.getElementById('serviceModalLinkInput').value = item.link || '#appointment';
    setImageState('serviceModalImg', item.image || '');
    openModal('serviceModal');
};

window.deleteService = function (id) {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    siteContent.services = siteContent.services.filter(s => s.id != id);
    renderServicesGrid(siteContent.services);
    document.getElementById('statServicesCount').textContent = siteContent.services.length;
    saveAllContent();
};

window.openEditDoctor = function (id) {
    const item = siteContent.doctors.find(d => d.id == id);
    if (!item) return;
    document.getElementById('doctorModalTitle').textContent = 'Edit Doctor Profile';
    document.getElementById('doctorModalId').value = item.id;
    document.getElementById('doctorModalNameInput').value = item.name || '';
    document.getElementById('doctorModalSpecialtyInput').value = item.specialty || '';
    document.getElementById('doctorModalQualInput').value = item.qualification || '';
    document.getElementById('doctorModalExpInput').value = item.experience || '';
    document.getElementById('doctorModalRatingInput').value = item.rating || '4.9';
    setImageState('doctorModalImg', item.image || '');
    openModal('doctorModal');
};

window.deleteDoctor = function (id) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    siteContent.doctors = siteContent.doctors.filter(d => d.id != id);
    renderDoctorsGrid(siteContent.doctors);
    document.getElementById('statDoctorsCount').textContent = siteContent.doctors.length;
    saveAllContent();
};

window.openEditTestimonial = function (id) {
    const item = siteContent.testimonials.find(t => t.id == id);
    if (!item) return;
    document.getElementById('testimonialModalTitle').textContent = 'Edit Testimonial';
    document.getElementById('testimonialModalId').value = item.id;
    document.getElementById('testModalNameInput').value = item.name || '';
    document.getElementById('testModalAvatarInput').value = item.avatar || '';
    document.getElementById('testModalRoleInput').value = item.role || 'Patient';
    document.getElementById('testModalRatingInput').value = item.rating || 5;
    document.getElementById('testModalQuoteInput').value = item.quote || '';
    setImageState('testModalImg', item.image || '');
    openModal('testimonialModal');
};

window.deleteTestimonial = function (id) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    siteContent.testimonials = siteContent.testimonials.filter(t => t.id != id);
    renderTestimonialsGrid(siteContent.testimonials);
    saveAllContent();
};

// =====================================================
// .ENV CREDENTIALS & SECURITY
// =====================================================

async function fetchEnvDetails() {
    try {
        const res = await fetch('/api/admin/env');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('envUsername').value = data.username || 'admin';
            document.getElementById('envPassword').value = data.password || '';
        }
    } catch (err) {
        console.error('Env fetch error:', err);
    }
}

// Password toggle
const toggleEnvPass = document.getElementById('toggleEnvPass');
if (toggleEnvPass) {
    toggleEnvPass.addEventListener('click', () => {
        const passInput = document.getElementById('envPassword');
        const eyeIcon = document.getElementById('envEyeIcon');
        const isPass = passInput.getAttribute('type') === 'password';
        passInput.setAttribute('type', isPass ? 'text' : 'password');
        eyeIcon.classList.toggle('fa-eye', !isPass);
        eyeIcon.classList.toggle('fa-eye-slash', isPass);
    });
}

// Update .env credentials form
const updateEnvForm = document.getElementById('updateEnvForm');
if (updateEnvForm) {
    updateEnvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('envUsername').value.trim();
        const password = document.getElementById('envPassword').value.trim();

        if (!username || !password) {
            showToast('Username and password cannot be empty.', 'error');
            return;
        }

        const btn = document.getElementById('btnUpdateEnv');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating .env...';

        try {
            const res = await fetch('/api/admin/env', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message, 'success');
                document.getElementById('adminUsernameDisplay').textContent = username;
                document.getElementById('adminAvatarLetter').textContent = username.charAt(0).toUpperCase();
            } else {
                showToast(data.error || 'Failed to update credentials in .env.', 'error');
            }
        } catch (err) {
            showToast('Network error while updating .env file.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save New Credentials to .env';
        }
    });
}

// Reset site content to defaults
const btnResetDefaults = document.getElementById('btnResetDefaults');
if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', async () => {
        if (!confirm('Warning: This will overwrite your current site content with the default template. Are you sure?')) return;
        try {
            const res = await fetch('/api/content/reset', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.success) {
                siteContent = data.content;
                populateFormFields(siteContent);
                showToast('Website content restored to defaults.', 'info');
            } else {
                showToast(data.error || 'Failed to reset.', 'error');
            }
        } catch (err) {
            showToast('Network error while resetting content.', 'error');
        }
    });
}

// =====================================================
// UTILITIES (TOAST & ESCAPE)
// =====================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-solid fa-circle-check';
    if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
    if (type === 'info') iconClass = 'fa-solid fa-circle-info';
    if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* =====================================================
   CENTRAL MEDIA HUB & ITEM CARD 1-CLICK IMAGE HANDLERS
===================================================== */

function renderDashboardMediaHub() {
    const hub = document.getElementById('dashboardMediaHub');
    if (!hub || !siteContent) return;

    const mediaList = [
        { id: 'brand_logo_img', label: 'Hospital Logo', section: 'Branding', val: siteContent.brand?.logo_image, icon: 'fa-solid fa-hospital' },
        { id: 'brand_favicon_img', label: 'Browser Favicon', section: 'Branding', val: siteContent.brand?.favicon_image, icon: 'fa-regular fa-circle-dot' },
        { id: 'brand_announcement_icon', label: 'Announcement Badge', section: 'Top Bar', val: siteContent.brand?.announcement_icon, icon: 'fa-solid fa-bullhorn' },
        { id: 'hero_img', label: 'Hero Main Photo', section: 'Hero Section', val: siteContent.hero?.image, icon: 'fa-solid fa-user-doctor' },
        { id: 'hero_bg_img', label: 'Hero Background Banner', section: 'Hero Section', val: siteContent.hero?.bg_image, icon: 'fa-solid fa-panorama' },
        { id: 'hero_trust_avatar', label: 'Hero Trust Badge Avatar', section: 'Hero Section', val: siteContent.hero?.trust_avatar, icon: 'fa-solid fa-users' },
        { id: 'about_img', label: 'Facility Main Visual', section: 'About Hospital', val: siteContent.about?.image, icon: 'fa-solid fa-hospital' },
        { id: 'about_director_img', label: 'Director Portrait', section: 'About Hospital', val: siteContent.about?.director_image, icon: 'fa-solid fa-user-tie' },
        { id: 'about_badge_img', label: 'Quality / NABH Badge', section: 'About Hospital', val: siteContent.about?.badge_image, icon: 'fa-solid fa-award' },
        { id: 'services_banner_img', label: 'Services Header Banner', section: 'Services', val: siteContent.services_header?.banner_image, icon: 'fa-solid fa-stethoscope' },
        { id: 'why_img', label: 'Why Us Care Graphic', section: 'Why Choose Us', val: siteContent.why_us?.image, icon: 'fa-solid fa-heart-pulse' },
        { id: 'why_award_img', label: 'Patient Safety Award', section: 'Why Choose Us', val: siteContent.why_us?.award_image, icon: 'fa-solid fa-certificate' },
        { id: 'doctors_banner_img', label: 'Doctors Group Banner', section: 'Doctors Team', val: siteContent.doctors_header?.banner_image, icon: 'fa-solid fa-users-viewfinder' },
        { id: 'testimonials_banner_img', label: 'Testimonials Accent Banner', section: 'Testimonials', val: siteContent.testimonials_header?.banner_image, icon: 'fa-solid fa-comment-dots' },
        { id: 'appointment_banner_img', label: 'Consultation Form Banner', section: 'Appointments', val: siteContent.appointment_section?.banner_image, icon: 'fa-solid fa-calendar-check' },
        { id: 'contact_img', label: 'Facility / Map Exterior', section: 'Contact', val: siteContent.contact?.image, icon: 'fa-solid fa-map-pin' },
        { id: 'contact_reception_img', label: 'Reception Entrance Photo', section: 'Contact', val: siteContent.contact?.reception_image, icon: 'fa-solid fa-door-open' },
        { id: 'contact_qr_img', label: 'Payment / WhatsApp QR', section: 'Contact', val: siteContent.contact?.qr_code_image, icon: 'fa-solid fa-qrcode' },
        { id: 'footer_accreditation_img', label: 'Partner Logos Strip', section: 'Footer', val: siteContent.footer?.accreditation_image, icon: 'fa-solid fa-shield-cat' },
        { id: 'seo_og_img', label: 'Social Share (OG) Preview', section: 'SEO', val: siteContent.seo?.og_image, icon: 'fa-solid fa-share-nodes' },
        { id: 'admin_avatar_img', label: 'Admin Profile Avatar', section: 'Security', val: siteContent.admin_profile?.avatar_image, icon: 'fa-solid fa-user-astronaut' }
    ];

    hub.innerHTML = mediaList.map(item => {
        const hasImg = !!item.val;
        return `
            <div class="media-hub-card">
                <div class="media-hub-preview">
                    ${hasImg ? `<img src="${escapeHtml(item.val)}" alt="${escapeHtml(item.label)}">` : `
                        <div class="hub-placeholder">
                            <i class="${item.icon}" style="font-size:24px;"></i>
                            <small>Default Visual</small>
                        </div>
                    `}
                </div>
                <div class="media-hub-info">
                    <div>
                        <div class="media-hub-title">${escapeHtml(item.label)}</div>
                        <small style="color:var(--text-muted); font-size:11px;">${escapeHtml(item.section)}</small>
                    </div>
                    <span class="media-hub-badge ${hasImg ? 'media-badge-active' : 'media-badge-default'}">
                        ${hasImg ? 'Custom Active' : 'Default'}
                    </span>
                </div>
                <div class="media-hub-actions">
                    <label class="btn-upload-file" title="Upload or change image">
                        <i class="fa-solid fa-cloud-arrow-up"></i> ${hasImg ? 'Change' : 'Upload'}
                        <input type="file" accept="image/*" onchange="handleHubImageUpload(this, '${item.id}')">
                    </label>
                    ${hasImg ? `
                        <button type="button" class="btn-remove-img" onclick="handleHubImageRemove('${item.id}')" title="Remove custom image">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Media Hub Upload & Remove Handlers
window.handleHubImageUpload = async function(fileInput, fieldId) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    const parentBtn = fileInput.closest('.btn-upload-file');
    const originalText = parentBtn ? parentBtn.innerHTML : '';
    if (parentBtn) parentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setImageState(fieldId, data.url);
            showToast('Image uploaded and synced across tabs!', 'success');
            await saveAllContent();
        } else {
            showToast(data.error || 'Failed to upload image.', 'error');
        }
    } catch (err) {
        showToast('Network error during image upload.', 'error');
    } finally {
        if (parentBtn) parentBtn.innerHTML = originalText;
        fileInput.value = '';
    }
};

window.handleHubImageRemove = async function(fieldId) {
    setImageState(fieldId, '');
    showToast('Image removed. Reverted to default visual.', 'info');
    await saveAllContent();
};

// 1-Click Card Image Upload Handler for Services, Doctors, and Testimonials
window.handleCardImageUpload = async function(type, id, fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    const parentLabel = fileInput.closest('.btn-card-upload-file');
    const origHtml = parentLabel ? parentLabel.innerHTML : '';
    if (parentLabel) parentLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
            const uploadedUrl = data.url;
            if (type === 'service') {
                const item = siteContent.services.find(s => s.id == id);
                if (item) item.image = uploadedUrl;
                renderServicesGrid(siteContent.services);
            } else if (type === 'doctor') {
                const item = siteContent.doctors.find(d => d.id == id);
                if (item) item.image = uploadedUrl;
                renderDoctorsGrid(siteContent.doctors);
            } else if (type === 'testimonial') {
                const item = siteContent.testimonials.find(t => t.id == id);
                if (item) item.image = uploadedUrl;
                renderTestimonialsGrid(siteContent.testimonials);
            }
            showToast('Item photo updated and saved!', 'success');
            await saveAllContent();
        } else {
            showToast(data.error || 'Upload failed.', 'error');
        }
    } catch (err) {
        showToast('Network error uploading item photo.', 'error');
    } finally {
        if (parentLabel) parentLabel.innerHTML = origHtml;
        fileInput.value = '';
    }
};

window.removeServiceImage = async function(id) {
    const item = siteContent.services.find(s => s.id == id);
    if (item) {
        item.image = '';
        renderServicesGrid(siteContent.services);
        showToast('Specialty custom image removed.', 'info');
        await saveAllContent();
    }
};

window.removeDoctorPhoto = async function(id) {
    const item = siteContent.doctors.find(d => d.id == id);
    if (item) {
        item.image = '';
        renderDoctorsGrid(siteContent.doctors);
        showToast('Doctor photo removed. Reverted to medical silhouette.', 'info');
        await saveAllContent();
    }
};

window.removeTestimonialPhoto = async function(id) {
    const item = siteContent.testimonials.find(t => t.id == id);
    if (item) {
        item.image = '';
        renderTestimonialsGrid(siteContent.testimonials);
        showToast('Testimonial photo removed. Reverted to initials avatar.', 'info');
        await saveAllContent();
    }
};

// =====================================================
// MANUAL / WALK-IN APPOINTMENT REGISTRATION
// =====================================================

function initManualAppointmentManager() {
    const btnOpen = document.getElementById('btnOpenManualAppointment');
    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            const deptSelect = document.getElementById('manualAptDepartment');
            if (deptSelect && siteContent?.departments_list) {
                deptSelect.innerHTML = siteContent.departments_list.map(d => `
                    <option value="${escapeHtml(d)}">${escapeHtml(d)}</option>
                `).join('');
            }
            const dateInput = document.getElementById('manualAptDate');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            openModal('manualAppointmentModal');
        });
    }

    const btnSave = document.getElementById('btnSaveManualApt');
    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            const name = document.getElementById('manualAptName')?.value.trim();
            const phone = document.getElementById('manualAptPhone')?.value.trim();
            const email = document.getElementById('manualAptEmail')?.value.trim();
            const department = document.getElementById('manualAptDepartment')?.value;
            const date = document.getElementById('manualAptDate')?.value;
            const status = document.getElementById('manualAptStatus')?.value || 'Confirmed';
            const message = document.getElementById('manualAptNotes')?.value.trim();

            if (!name || !phone) {
                showToast('Patient full name and phone number are required.', 'error');
                return;
            }

            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                const res = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, phone, email, department, date, status, message })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast('Walk-in patient appointment recorded successfully!', 'success');
                    closeModal('manualAppointmentModal');
                    // Reset form
                    document.getElementById('manualAptName').value = '';
                    document.getElementById('manualAptPhone').value = '';
                    document.getElementById('manualAptEmail').value = '';
                    document.getElementById('manualAptNotes').value = '';
                    await fetchAppointments();
                } else {
                    showToast(data.error || 'Failed to save appointment.', 'error');
                }
            } catch (err) {
                showToast('Network error while saving appointment.', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = 'Save Appointment';
            }
        });
    }
}
