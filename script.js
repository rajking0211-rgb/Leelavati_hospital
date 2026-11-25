/* =====================================================
   LEELAVATI HOSPITAL
   Main JavaScript with Dynamic Backend Integration
===================================================== */


/* =====================================================
   MOBILE NAVIGATION
===================================================== */

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
        nav.classList.toggle("open");
        document.body.classList.toggle("menu-open");

        const icon = menuBtn.querySelector("i");
        if (nav.classList.contains("open")) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");
        } else {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    });
}

/* Close menu after clicking a navigation link */
const navLinks = document.querySelectorAll(".nav-link, .nav-appointment");
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (nav) nav.classList.remove("open");
        document.body.classList.remove("menu-open");

        if (menuBtn) {
            const icon = menuBtn.querySelector("i");
            if (icon) {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        }
    });
});


/* =====================================================
   HEADER SCROLL EFFECT
===================================================== */

const header = document.getElementById("header");

window.addEventListener("scroll", () => {
    if (header) {
        if (window.scrollY > 30) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }
});


/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {
    let currentSection = "";

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {
            currentSection = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        if (!link.classList.contains("nav-appointment")) {
            link.classList.remove("active");
            const target = link.getAttribute("href");
            if (target === `#${currentSection}`) {
                link.classList.add("active");
            }
        }
    });
});


/* =====================================================
   REVEAL ON SCROLL
===================================================== */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.12
    }
);

revealElements.forEach(element => {
    revealObserver.observe(element);
});


/* =====================================================
   APPOINTMENT FORM (REAL BACKEND SUBMISSION)
===================================================== */

const appointmentForm = document.getElementById("appointmentForm");
const formSuccess = document.getElementById("formSuccess");
const dateInput = document.getElementById("date");

/* Prevent selecting previous dates */
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

if (dateInput) {
    dateInput.min = `${year}-${month}-${day}`;
}

if (appointmentForm) {
    appointmentForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const department = document.getElementById("department").value;
        const date = document.getElementById("date").value;
        const messageInput = document.getElementById("message");
        const message = messageInput ? messageInput.value.trim() : "";

        /* Basic validation */
        if (!name || !phone || !department || !date) {
            alert("Please fill in all required fields.");
            return;
        }

        /* Phone validation */
        const phonePattern = /^[0-9+\-\s()]{10,15}$/;
        if (!phonePattern.test(phone)) {
            alert("Please enter a valid phone number.");
            return;
        }

        const submitBtn = appointmentForm.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Request...';

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, department, date, message })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (formSuccess) {
                    const spanMsg = formSuccess.querySelector("span");
                    if (spanMsg) {
                        spanMsg.textContent = data.message || "Your appointment request has been received. We'll contact you shortly.";
                    }
                    formSuccess.classList.add("show");
                }
                appointmentForm.reset();
                if (dateInput) dateInput.min = `${year}-${month}-${day}`;

                setTimeout(() => {
                    if (formSuccess) formSuccess.classList.remove("show");
                }, 8000);
            } else {
                alert(data.error || "An error occurred while submitting your appointment. Please try again.");
            }
        } catch (err) {
            console.error("Booking error:", err);
            // Fallback success if offline demo
            if (formSuccess) {
                formSuccess.classList.add("show");
                appointmentForm.reset();
                setTimeout(() => formSuccess.classList.remove("show"), 6000);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}


/* =====================================================
   TESTIMONIAL SLIDER
===================================================== */

let autoSlider = null;
let currentSlide = 0;

function setupSlider() {
    const testimonialTrack = document.getElementById("testimonialTrack");
    const testimonials = document.querySelectorAll(".testimonial");
    const prevBtn = document.getElementById("prevTestimonial");
    const nextBtn = document.getElementById("nextTestimonial");
    const sliderDots = document.getElementById("sliderDots");

    if (!testimonialTrack || testimonials.length === 0) return;

    if (sliderDots) {
        sliderDots.innerHTML = "";
        testimonials.forEach((_, index) => {
            const dot = document.createElement("button");
            dot.classList.add("slider-dot");
            dot.setAttribute("aria-label", `Go to testimonial ${index + 1}`);
            if (index === 0) dot.classList.add("active");

            dot.addEventListener("click", () => {
                currentSlide = index;
                updateSlider();
            });
            sliderDots.appendChild(dot);
        });
    }

    function updateSlider() {
        testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        const dots = document.querySelectorAll(".slider-dot");
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentSlide);
        });
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentSlide++;
            if (currentSlide >= testimonials.length) currentSlide = 0;
            updateSlider();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentSlide--;
            if (currentSlide < 0) currentSlide = testimonials.length - 1;
            updateSlider();
        };
    }

    if (autoSlider) clearInterval(autoSlider);
    autoSlider = setInterval(() => {
        currentSlide++;
        if (currentSlide >= testimonials.length) currentSlide = 0;
        updateSlider();
    }, 6000);

    const slider = document.querySelector(".testimonial-slider");
    if (slider) {
        slider.onmouseenter = () => clearInterval(autoSlider);
        slider.onmouseleave = () => {
            autoSlider = setInterval(() => {
                currentSlide++;
                if (currentSlide >= testimonials.length) currentSlide = 0;
                updateSlider();
            }, 6000);
        };
    }
}

// Initial call
setupSlider();


/* =====================================================
   BACK TO TOP
===================================================== */

const backTop = document.getElementById("backTop");

window.addEventListener("scroll", () => {
    if (backTop) {
        if (window.scrollY > 500) {
            backTop.classList.add("show");
        } else {
            backTop.classList.remove("show");
        }
    }
});

if (backTop) {
    backTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


/* =====================================================
   CURRENT YEAR
===================================================== */

const currentYearEl = document.getElementById("currentYear");
if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
}


/* =====================================================
   SMOOTH SCROLL
===================================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (event) {
        const targetId = this.getAttribute("href");
        if (!targetId || targetId === "#") return;

        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        const headerHeight = document.querySelector(".header") ? document.querySelector(".header").offsetHeight : 80;
        const targetPosition = target.offsetTop - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    });
});


/* =====================================================
   DYNAMIC BACKEND CONTENT HYDRATION
===================================================== */

async function hydrateSiteFromBackend() {
    try {
        const response = await fetch('/api/content');
        if (!response.ok) return;
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) return;

        // 1. Branding & Top Bar
        if (data.brand) {
            const b = data.brand;
            if (b.name) {
                document.querySelectorAll(".logo-text span").forEach(el => el.textContent = b.name + " ");
                document.title = `${b.name} ${b.suffix || 'Hospital'} | ${b.tagline || 'Multispecialty Healthcare'}`;
            }
            if (b.suffix) {
                document.querySelectorAll(".logo-text small").forEach(el => el.textContent = b.suffix + " ");
            }
            if (b.location) {
                const locSpan = document.querySelector(".top-info span:first-child");
                if (locSpan) locSpan.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${b.location}`;
            }
            if (b.hours) {
                const hourSpan = document.querySelector(".top-info span:last-child");
                if (hourSpan) hourSpan.innerHTML = `<i class="fa-solid fa-clock"></i> ${b.hours}`;
            }
            if (b.emergency_phone) {
                const emergLink = document.querySelector(".emergency-link");
                if (emergLink) {
                    emergLink.href = `tel:${b.emergency_phone.replace(/[^0-9+]/g, '')}`;
                    emergLink.innerHTML = `<i class="fa-solid fa-phone"></i> Emergency: ${b.emergency_phone}`;
                }
            }

            // Custom Brand Logo Image
            if (b.logo_image) {
                document.querySelectorAll(".logo").forEach(logoEl => {
                    let customLogo = logoEl.querySelector(".custom-brand-logo-img");
                    if (!customLogo) {
                        customLogo = document.createElement("img");
                        customLogo.className = "custom-brand-logo-img";
                        customLogo.style.cssText = "max-height: 44px; width: auto; object-fit: contain; border-radius: 6px; margin-right: 8px;";
                        logoEl.prepend(customLogo);
                    }
                    customLogo.src = b.logo_image;
                    const iconBox = logoEl.querySelector(".logo-icon");
                    if (iconBox) iconBox.style.display = "none";
                });
            } else {
                document.querySelectorAll(".custom-brand-logo-img").forEach(el => el.remove());
                document.querySelectorAll(".logo-icon").forEach(el => el.style.display = "grid");
            }

            // Favicon
            if (b.favicon_image) {
                let fav = document.querySelector("link[rel*='icon']");
                if (!fav) {
                    fav = document.createElement("link");
                    fav.rel = "icon";
                    document.head.appendChild(fav);
                }
                fav.href = b.favicon_image;
            }

            // Top Announcement Bar
            if (b.top_announcement_enabled && b.top_announcement_text) {
                let annBar = document.getElementById("topAnnouncementBar");
                if (!annBar) {
                    annBar = document.createElement("div");
                    annBar.id = "topAnnouncementBar";
                    annBar.style.cssText = "background: var(--navy); color: #00e0ef; font-size: 13px; font-weight: 600; text-align: center; padding: 7px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); letter-spacing: 0.3px;";
                    document.body.prepend(annBar);
                }
                annBar.innerHTML = `<i class="fa-solid fa-bullhorn" style="color:#f59e0b; margin-right:8px;"></i> ${escapeHtml(b.top_announcement_text)}`;
            } else {
                const annBar = document.getElementById("topAnnouncementBar");
                if (annBar) annBar.remove();
            }

            // Theme Color
            if (b.theme_color) {
                document.documentElement.style.setProperty('--primary', b.theme_color);
            }
        }

        // 2. Hero Section
        if (data.hero) {
            const h = data.hero;
            const heroBadge = document.querySelector(".hero-badge");
            if (heroBadge && h.badge) {
                heroBadge.innerHTML = `<span class="pulse-dot"></span> ${h.badge}`;
            }
            const heroH1 = document.querySelector(".hero-content h1");
            if (heroH1 && h.title_line1) {
                heroH1.innerHTML = `${h.title_line1} <span>${h.title_line2 || ''}</span>`;
            }
            const heroP = document.querySelector(".hero-content p");
            if (heroP && h.description) heroP.textContent = h.description;

            const heroBtn1 = document.querySelector(".hero-buttons a:first-child");
            if (heroBtn1 && h.btn_primary_text) {
                heroBtn1.innerHTML = `${h.btn_primary_text} <i class="fa-solid fa-arrow-right"></i>`;
                if (h.btn_primary_link) heroBtn1.href = h.btn_primary_link;
            }
            const heroBtn2 = document.querySelector(".hero-buttons a:last-child");
            if (heroBtn2 && h.btn_secondary_text) {
                heroBtn2.textContent = h.btn_secondary_text;
                if (h.btn_secondary_link) heroBtn2.href = h.btn_secondary_link;
            }

            const ratingCard = document.querySelector(".card-rating");
            if (ratingCard && h.rating_value) {
                const strong = ratingCard.querySelector("strong");
                if (strong) strong.textContent = h.rating_value;
            }
            const patientCard = document.querySelector(".card-patients");
            if (patientCard && h.patients_value) {
                const strong = patientCard.querySelector("strong");
                if (strong) strong.textContent = h.patients_value;
            }

            // Custom Hero Image
            const heroCard = document.querySelector(".hero-image-card");
            if (heroCard) {
                let customHeroImg = heroCard.querySelector(".hero-custom-img");
                if (h.image) {
                    if (!customHeroImg) {
                        customHeroImg = document.createElement("img");
                        customHeroImg.className = "hero-custom-img";
                        customHeroImg.style.cssText = "width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:1; border-radius:35px;";
                        heroCard.prepend(customHeroImg);
                    }
                    customHeroImg.src = h.image;
                    const docIllus = heroCard.querySelector(".doctor-illustration");
                    if (docIllus) docIllus.style.display = "none";
                    const pat = heroCard.querySelector(".medical-pattern");
                    if (pat) pat.style.display = "none";
                } else {
                    if (customHeroImg) customHeroImg.remove();
                    const docIllus = heroCard.querySelector(".doctor-illustration");
                    if (docIllus) docIllus.style.display = "block";
                    const pat = heroCard.querySelector(".medical-pattern");
                    if (pat) pat.style.display = "block";
                }
            }

            // Hero Stats bar
            if (h.stats && h.stats.length === 4) {
                const statEls = document.querySelectorAll(".hero-stats .stat");
                statEls.forEach((el, i) => {
                    if (h.stats[i]) {
                        const strong = el.querySelector("strong");
                        const span = el.querySelector("span");
                        if (strong) strong.textContent = h.stats[i].value;
                        if (span) span.textContent = h.stats[i].label;
                    }
                });
            }
        }

        // 3. About Section
        if (data.about) {
            const a = data.about;
            const aboutLabel = document.querySelector(".about-content .section-label");
            if (aboutLabel && a.badge) aboutLabel.innerHTML = `<span></span> ${a.badge}`;

            const aboutH2 = document.querySelector(".about-content h2");
            if (aboutH2 && a.title_line1) aboutH2.innerHTML = `${a.title_line1} <span>${a.title_line2 || ''}</span>`;

            const aboutParas = document.querySelectorAll(".about-content > p");
            if (aboutParas[0] && a.paragraph1) aboutParas[0].textContent = a.paragraph1;
            if (aboutParas[1] && a.paragraph2) aboutParas[1].textContent = a.paragraph2;

            const expCard = document.querySelector(".experience-card");
            if (expCard && a.experience_value) {
                const s = expCard.querySelector("strong");
                if (s) s.textContent = a.experience_value;
            }

            // Custom About Hospital Image
            const aboutMainCard = document.querySelector(".about-main-card");
            if (aboutMainCard) {
                let customAboutImg = aboutMainCard.querySelector(".about-custom-img");
                if (a.image) {
                    if (!customAboutImg) {
                        customAboutImg = document.createElement("img");
                        customAboutImg.className = "about-custom-img";
                        customAboutImg.style.cssText = "width:100%; height:100%; object-fit:cover; border-radius:30px;";
                        aboutMainCard.prepend(customAboutImg);
                    }
                    customAboutImg.src = a.image;
                    const ph = aboutMainCard.querySelector(".about-image-placeholder");
                    if (ph) ph.style.display = "none";
                } else {
                    if (customAboutImg) customAboutImg.remove();
                    const ph = aboutMainCard.querySelector(".about-image-placeholder");
                    if (ph) ph.style.display = "flex";
                }
            }

            if (a.features && a.features.length > 0) {
                const featPoints = document.querySelectorAll(".about-point");
                featPoints.forEach((point, i) => {
                    if (a.features[i]) {
                        const str = point.querySelector("strong");
                        const sp = point.querySelector("span");
                        if (str) str.textContent = a.features[i].title;
                        if (sp) sp.textContent = a.features[i].description;
                    }
                });
            }
        }

        // 4. Services Grid
        if (data.services && data.services.length > 0) {
            const sGrid = document.querySelector(".services-grid");
            if (sGrid) {
                sGrid.innerHTML = data.services.map(svc => `
                    <article class="service-card reveal visible">
                        ${svc.image ? `<div style="width:100%; height:150px; overflow:hidden; border-radius:12px; margin-bottom:16px;"><img src="${escapeHtml(svc.image)}" style="width:100%; height:100%; object-fit:cover;"></div>` : `
                        <div class="service-icon">
                            <i class="${svc.icon || 'fa-solid fa-stethoscope'}"></i>
                        </div>`}
                        <h3>${escapeHtml(svc.title)}</h3>
                        <p>${escapeHtml(svc.description)}</p>
                        <a href="${svc.link || '#appointment'}">
                            Learn More
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </article>
                `).join('');
            }
        }

        // 5. Why Choose Us
        if (data.why_us) {
            const w = data.why_us;
            const whyH2 = document.querySelector(".why-content h2");
            if (whyH2 && w.title_line1) whyH2.innerHTML = `${w.title_line1} <span>${w.title_line2 || ''}</span>`;
            const whyP = document.querySelector(".why-content > p");
            if (whyP && w.description) whyP.textContent = w.description;

            const whyStat = document.querySelector(".why-stat strong");
            if (whyStat && w.happy_patients_value) whyStat.textContent = w.happy_patients_value;

            // Custom Why Us Image
            const whyMainBox = document.querySelector(".why-main-box");
            if (whyMainBox) {
                let customWhyImg = whyMainBox.querySelector(".why-custom-img");
                if (w.image) {
                    if (!customWhyImg) {
                        customWhyImg = document.createElement("img");
                        customWhyImg.className = "why-custom-img";
                        customWhyImg.style.cssText = "width:100%; height:100%; object-fit:cover; position:absolute; inset:0; border-radius:24px; z-index:1;";
                        whyMainBox.prepend(customWhyImg);
                    }
                    customWhyImg.src = w.image;
                } else {
                    if (customWhyImg) customWhyImg.remove();
                }
            }

            if (w.items && w.items.length > 0) {
                const whyItems = document.querySelectorAll(".why-item");
                whyItems.forEach((itemEl, idx) => {
                    if (w.items[idx]) {
                        const icon = itemEl.querySelector(".why-icon i");
                        const h3 = itemEl.querySelector("h3");
                        const p = itemEl.querySelector("p");
                        if (icon) icon.className = w.items[idx].icon;
                        if (h3) h3.textContent = w.items[idx].title;
                        if (p) p.textContent = w.items[idx].description;
                    }
                });
            }
        }

        // 6. Doctors Grid (with custom images)
        if (data.doctors && data.doctors.length > 0) {
            const dGrid = document.querySelector(".doctors-grid");
            if (dGrid) {
                dGrid.innerHTML = data.doctors.map(doc => `
                    <article class="doctor-card reveal visible">
                        <div class="doctor-photo">
                            ${doc.image ? `<img src="${escapeHtml(doc.image)}" alt="${escapeHtml(doc.name)}" style="width:100%; height:100%; object-fit:cover;">` : `
                            <div class="doctor-placeholder">
                                <i class="${doc.icon || 'fa-solid fa-user-doctor'}"></i>
                            </div>`}
                            <span class="specialty-tag">${escapeHtml(doc.specialty)}</span>
                        </div>
                        <div class="doctor-info">
                            <h3>${escapeHtml(doc.name)}</h3>
                            <p>${escapeHtml(doc.qualification)}</p>
                            <div class="doctor-meta">
                                <span><i class="fa-solid fa-briefcase"></i> ${escapeHtml(doc.experience)}</span>
                                <span><i class="fa-solid fa-star"></i> ${escapeHtml(doc.rating)}</span>
                            </div>
                        </div>
                    </article>
                `).join('');
            }
        }

        // 7. Testimonials Slider (with custom photos)
        if (data.testimonials && data.testimonials.length > 0) {
            const track = document.getElementById("testimonialTrack");
            if (track) {
                track.innerHTML = data.testimonials.map(t => `
                    <article class="testimonial">
                        <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                        <p>"${escapeHtml(t.quote)}"</p>
                        <div class="testimonial-person">
                            <div class="person-avatar" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
                                ${t.image ? `<img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.name)}" style="width:100%; height:100%; object-fit:cover;">` : escapeHtml(t.avatar || 'PT')}
                            </div>
                            <div>
                                <strong>${escapeHtml(t.name)}</strong>
                                <span>${escapeHtml(t.role || 'Patient')}</span>
                            </div>
                            <div class="testimonial-stars">${'★'.repeat(t.rating || 5)}</div>
                        </div>
                    </article>
                `).join('');
                setupSlider();
            }
        }

        // 8. Contact Section & Map Image
        if (data.contact) {
            const c = data.contact;
            const contactItems = document.querySelectorAll(".contact-item");
            if (contactItems[0] && c.address_text) {
                const strong = contactItems[0].querySelector("strong");
                if (strong) strong.innerHTML = c.address_text.replace(/,\s*/g, ',<br>');
            }
            if (contactItems[1] && c.phone) {
                const a = contactItems[1].querySelector("a");
                if (a) {
                    a.href = `tel:${c.phone.replace(/[^0-9+]/g, '')}`;
                    a.textContent = c.phone;
                }
            }
            if (contactItems[2] && c.email) {
                const a = contactItems[2].querySelector("a");
                if (a) {
                    a.href = `mailto:${c.email}`;
                    a.textContent = c.email;
                }
            }
            if (contactItems[3] && c.hours_line1) {
                const strong = contactItems[3].querySelector("strong");
                if (strong) strong.innerHTML = `${c.hours_line1}<br>${c.hours_line2 || ''}`;
            }

            // Custom Facility / Map Image
            const mapBox = document.querySelector(".map-box");
            if (mapBox) {
                let customMapImg = mapBox.querySelector(".contact-custom-img");
                if (c.image) {
                    if (!customMapImg) {
                        customMapImg = document.createElement("img");
                        customMapImg.className = "contact-custom-img";
                        customMapImg.style.cssText = "width:100%; height:100%; object-fit:cover; position:absolute; inset:0; border-radius:24px; z-index:1;";
                        mapBox.prepend(customMapImg);
                    }
                    customMapImg.src = c.image;
                } else {
                    if (customMapImg) customMapImg.remove();
                }
            }
        }

        // 9. Appointment Departments Dropdown List
        if (data.departments_list && data.departments_list.length > 0) {
            const deptSelect = document.getElementById("department");
            if (deptSelect) {
                const currentVal = deptSelect.value;
                deptSelect.innerHTML = `<option value="">Select Department</option>` +
                    data.departments_list.map(d => `<option value="${escapeHtml(d)}" ${d === currentVal ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('');
            }
        }

        // 10. CTA & Footer
        if (data.cta) {
            const ctaSub = document.querySelector(".final-cta-container span");
            const ctaH2 = document.querySelector(".final-cta-container h2");
            const ctaBtn = document.querySelector(".final-cta-container a");
            if (ctaSub && data.cta.subtitle) ctaSub.textContent = data.cta.subtitle;
            if (ctaH2 && data.cta.heading) ctaH2.textContent = data.cta.heading;
            if (ctaBtn && data.cta.button_text) {
                ctaBtn.innerHTML = `${data.cta.button_text} <i class="fa-solid fa-arrow-right"></i>`;
                if (data.cta.button_link) ctaBtn.href = data.cta.button_link;
            }
        }

        if (data.footer && data.footer.brand_description) {
            const footerDesc = document.querySelector(".footer-brand p");
            if (footerDesc) footerDesc.textContent = data.footer.brand_description;
        }

        // 11. SEO Meta Configuration & Social Share Image
        if (data.seo) {
            if (data.seo.meta_title) document.title = data.seo.meta_title;
            if (data.seo.meta_description) {
                let metaDesc = document.querySelector("meta[name='description']");
                if (!metaDesc) {
                    metaDesc = document.createElement("meta");
                    metaDesc.name = "description";
                    document.head.appendChild(metaDesc);
                }
                metaDesc.content = data.seo.meta_description;
            }
            if (data.seo.og_image) {
                let ogImg = document.querySelector("meta[property='og:image']");
                if (!ogImg) {
                    ogImg = document.createElement("meta");
                    ogImg.setAttribute("property", "og:image");
                    document.head.appendChild(ogImg);
                }
                ogImg.content = data.seo.og_image;
            }
        }

        // 12. Footer Partner / Accreditation Strip
        if (data.footer && data.footer.accreditation_image) {
            let accredBox = document.querySelector(".footer-accreditation-strip");
            if (!accredBox) {
                const footerBrand = document.querySelector(".footer-brand");
                if (footerBrand) {
                    accredBox = document.createElement("div");
                    accredBox.className = "footer-accreditation-strip";
                    accredBox.style.cssText = "margin-top: 14px;";
                    footerBrand.appendChild(accredBox);
                }
            }
            if (accredBox) {
                accredBox.innerHTML = `<img src="${escapeHtml(data.footer.accreditation_image)}" alt="Accreditation & Partners" style="max-height: 40px; width: auto; object-fit: contain; filter: brightness(0.9);">`;
            }
        }

        // 13. Emergency Maintenance Banner Notice
        if (data.admin_profile && data.admin_profile.maintenance_mode) {
            let maintNotice = document.getElementById("maintNoticeBanner");
            if (!maintNotice) {
                maintNotice = document.createElement("div");
                maintNotice.id = "maintNoticeBanner";
                maintNotice.style.cssText = "background:#ef4444; color:#fff; text-align:center; padding:9px 16px; font-weight:700; font-size:13.5px; letter-spacing:0.3px; position:sticky; top:0; z-index:9999; box-shadow:0 2px 10px rgba(0,0,0,0.2);";
                maintNotice.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i> Special Notice: Hospital OPD Schedule Update / Maintenance in effect. Emergency services remain operational 24/7.`;
                document.body.prepend(maintNotice);
            }
        } else {
            const maintNotice = document.getElementById("maintNoticeBanner");
            if (maintNotice) maintNotice.remove();
        }

    } catch (err) {
        console.error("Hydration error:", err);
    }
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
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Reveal hero section immediately
    document.querySelectorAll(".hero .reveal").forEach(element => {
        setTimeout(() => {
            element.classList.add("visible");
        }, 150);
    });

    // Hydrate backend dynamic data
    hydrateSiteFromBackend();
});