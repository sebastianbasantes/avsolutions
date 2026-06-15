/* ==========================================================================
   AV Solutions - Script principal
   Maneja: nav móvil, scroll reveal, formulario Forminit, scroll header
   ========================================================================== */

(function () {
    'use strict';

    /* ---------- Header scroll state ---------- */
    const header = document.querySelector('.header');
    if (header) {
        const onScroll = () => {
            if (window.scrollY > 20) {
                header.classList.add('is-scrolled');
            } else {
                header.classList.remove('is-scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Menú hamburguesa ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Cerrar al hacer click en un link
        navMenu.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Cerrar al cambiar tamaño a desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('is-open')) {
                navMenu.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                document.body.style.overflow = '';
            }
        });
    }

    /* ---------- Scroll Reveal con IntersectionObserver ---------- */
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
    if ('IntersectionObserver' in window && revealElements.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -60px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: mostrar todo si no hay soporte
        revealElements.forEach(el => el.classList.add('is-visible'));
    }

    /* ---------- Carrusel del Hero ---------- */
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.hero-slide');
        const dotsContainer = carousel.querySelector('.hero-carousel-dots');
        let currentSlide = 0;
        let intervalId = null;
        const SLIDE_DURATION = 4500;

        // Crear dots
        if (dotsContainer && slides.length > 1) {
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'hero-carousel-dot' + (i === 0 ? ' is-active' : '');
                dot.setAttribute('aria-label', `Ir al slide ${i + 1}`);
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            });
        }

        const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-carousel-dot') : [];

        const goToSlide = (index) => {
            slides[currentSlide].classList.remove('is-active');
            if (dots[currentSlide]) dots[currentSlide].classList.remove('is-active');
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('is-active');
            if (dots[currentSlide]) dots[currentSlide].classList.add('is-active');
            resetInterval();
        };

        const nextSlide = () => goToSlide(currentSlide + 1);

        const resetInterval = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(nextSlide, SLIDE_DURATION);
        };

        if (slides.length > 1) {
            resetInterval();
            // Pausar al hacer hover
            carousel.addEventListener('mouseenter', () => {
                if (intervalId) clearInterval(intervalId);
            });
            carousel.addEventListener('mouseleave', resetInterval);
        }
    }

    /* ---------- Mini-carruseles de proyectos ---------- */
    const proyectoMedias = document.querySelectorAll('.proyecto-media');
    proyectoMedias.forEach((media, index) => {
        const slides = media.querySelectorAll('.proyecto-media-slide');
        if (slides.length <= 1) return;

        let current = 0;
        // Pequeño desfase entre proyectos para que no roten todos a la vez
        const interval = 3500 + (index * 400);

        setInterval(() => {
            slides[current].classList.remove('is-active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('is-active');
        }, interval);
    });

    /* ==========================================================================
       FORMULARIO DE CONTACTO — Integración Forminit
       ========================================================================== */
    const form = document.getElementById('contact-form');
    if (!form) return;

    const FORM_ID = 'jki9oa2read';
    const submitBtn = form.querySelector('.form-submit');
    const formMessage = form.querySelector('.form-message');

    /* ---------- Validadores ---------- */
    const validators = {
        'fi-sender-fullName': (value) => {
            if (!value.trim()) return 'Por favor ingresa tu nombre completo.';
            if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
            return null;
        },
        'fi-sender-email': (value) => {
            if (!value.trim()) return 'Por favor ingresa tu correo electrónico.';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) return 'Ingresa un correo electrónico válido.';
            return null;
        },
        'fi-sender-phone': (value) => {
            if (!value.trim()) return 'Por favor ingresa un teléfono de contacto.';
            // Acepta formato local (09XXXXXXXX) o E.164 (+593XXXXXXXXX)
            const cleanedValue = value.replace(/[\s\-()]/g, '');
            const e164Regex = /^\+593\d{9}$/;
            const localRegex = /^0\d{9}$/;
            if (!e164Regex.test(cleanedValue) && !localRegex.test(cleanedValue)) {
                return 'Formato inválido. Usa +593XXXXXXXXX o 09XXXXXXXX.';
            }
            return null;
        },
        'fi-text-subject': (value) => {
            if (!value.trim()) return 'Por favor ingresa un asunto.';
            return null;
        },
        'fi-text-message': (value) => {
            if (!value.trim()) return 'Por favor escribe tu mensaje.';
            if (value.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
            return null;
        }
    };

    /* ---------- Convertir teléfono local a E.164 antes del envío ---------- */
    const normalizePhone = (value) => {
        const cleaned = value.replace(/[\s\-()]/g, '');
        if (cleaned.startsWith('+593')) return cleaned;
        if (cleaned.startsWith('0')) return '+593' + cleaned.substring(1);
        return cleaned;
    };

    /* ---------- Mostrar/ocultar errores por campo ---------- */
    const showFieldError = (input, message) => {
        const field = input.closest('.form-field');
        if (!field) return;
        field.classList.add('has-error');
        let errorEl = field.querySelector('.form-error');
        if (errorEl) {
            errorEl.textContent = message;
        }
    };

    const clearFieldError = (input) => {
        const field = input.closest('.form-field');
        if (!field) return;
        field.classList.remove('has-error');
    };

    /* ---------- Validación en blur ---------- */
    Object.keys(validators).forEach(name => {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) return;

        input.addEventListener('blur', () => {
            const error = validators[name](input.value);
            if (error) {
                showFieldError(input, error);
            } else {
                clearFieldError(input);
            }
        });

        input.addEventListener('input', () => {
            if (input.closest('.form-field').classList.contains('has-error')) {
                const error = validators[name](input.value);
                if (!error) clearFieldError(input);
            }
        });
    });

    /* ---------- Mostrar mensaje global ---------- */
    const showMessage = (text, type) => {
        if (!formMessage) return;
        formMessage.textContent = text;
        formMessage.className = `form-message is-visible ${type}`;
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const hideMessage = () => {
        if (!formMessage) return;
        formMessage.className = 'form-message';
        formMessage.textContent = '';
    };

    /* ---------- Submit ---------- */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        // Validar todo
        let hasErrors = false;
        Object.keys(validators).forEach(name => {
            const input = form.querySelector(`[name="${name}"]`);
            if (!input) return;
            const error = validators[name](input.value);
            if (error) {
                showFieldError(input, error);
                hasErrors = true;
            } else {
                clearFieldError(input);
            }
        });

        if (hasErrors) {
            showMessage('Por favor corrige los errores en el formulario.', 'error');
            return;
        }

        // Construir FormData
        const formData = new FormData(form);

        // Normalizar teléfono a E.164
        const phoneInput = form.querySelector('[name="fi-sender-phone"]');
        if (phoneInput) {
            formData.set('fi-sender-phone', normalizePhone(phoneInput.value));
        }

        // Estado de envío
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';

        try {
            // El SDK expone window.Forminit (capital F) y requiere instanciarse
            const ForminitSDK = window.Forminit || window.forminit;
            if (typeof ForminitSDK === 'undefined') {
                throw new Error('SDK de Forminit no disponible');
            }

            // Instanciar con apiKey = FORM_ID (ajustar si se tiene API key separada)
            const client = typeof ForminitSDK === 'function'
                ? new ForminitSDK({ apiKey: FORM_ID })
                : ForminitSDK;

            const submitFn = client.submit
                ? client.submit.bind(client)
                : ForminitSDK.submit
                    ? ForminitSDK.submit.bind(ForminitSDK)
                    : null;

            if (!submitFn) throw new Error('Método submit no encontrado en SDK');

            const response = await submitFn(FORM_ID, formData);

            console.log('Forminit response:', response);

            // Considerar éxito si no hay campo error en la respuesta
            const hasError = response && response.error;

            if (!hasError) {
                showMessage('¡Mensaje enviado con éxito! Te contactaremos pronto.', 'success');
                form.reset();
            } else {
                throw new Error(response.error || 'No se pudo enviar el mensaje');
            }
        } catch (err) {
            console.error('Error al enviar formulario:', err);
            showMessage(
                'Ocurrió un error al enviar tu mensaje. Por favor intenta nuevamente o contáctanos directamente al +593 96 874 4312.',
                'error'
            );
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

})();
