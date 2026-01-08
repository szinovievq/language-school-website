document.addEventListener('DOMContentLoaded', function() {
    let allCourses = [];
    let allTutors = [];
    let selectedCourse = null;
    let selectedTutor = null;

    let coursePage = 1;
    let tutorPage = 1;
    const limit = 5;

    async function init() {
        try {
            const [cRes, tRes] = await Promise.all([
                fetch(`${BASE_URL}/api/courses?api_key=${API_KEY}`),
                fetch(`${BASE_URL}/api/tutors?api_key=${API_KEY}`)
            ]);
            allCourses = await cRes.json();
            allTutors = await tRes.json();

            populateLanguageFilter();
            setupSearchListeners();
            renderCourses();
            renderTutors();
        } catch (error) {
            console.error("Initialization error:", error);
            showAlert("Ошибка при загрузке данных. Пожалуйста, попробуйте позже.", "danger");
        }
    }

    function populateLanguageFilter() {
        const langSelect = document.getElementById('languageFilter');
        if (!langSelect) return;
        const languages = new Set();
        allTutors.forEach(t => t.languages_offered?.forEach(l => languages.add(l)));
        Array.from(languages).sort().forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang; opt.textContent = lang;
            langSelect.appendChild(opt);
        });
    }

    function setupSearchListeners() {
        const ids = ['languageFilter', 'levelFilter', 'courseNameSearch', 'courseLevelFilter'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(id.includes('Search') ? 'input' : 'change', () => {
                if (id.includes('course')) { coursePage = 1; renderCourses(); }
                else { tutorPage = 1; renderTutors(); }
            });
        });
    }

    function renderCourses() {
        const container = document.getElementById('courseList');
        if (!container) return;
        const nameVal = document.getElementById('courseNameSearch')?.value.toLowerCase() || "";
        const levelVal = document.getElementById('courseLevelFilter')?.value || "";

        const filtered = allCourses.filter(c => 
            c.name.toLowerCase().includes(nameVal) && (!levelVal || c.level === levelVal)
        );

        const start = (coursePage - 1) * limit;
        const pageData = filtered.slice(start, start + limit);
        container.innerHTML = pageData.length ? '' : '<div class="alert alert-info">Курсы не найдены.</div>';

        pageData.forEach(course => {
            const isSelected = selectedCourse?.id === course.id;
            const item = document.createElement('div');
            item.className = `list-group-item d-flex justify-content-between align-items-center p-4 mb-3 shadow-sm border rounded-3 ${isSelected ? 'bg-primary text-white' : 'bg-white'}`;
            item.style.cursor = "pointer";
            item.innerHTML = `
                <div class="flex-grow-1">
                    <h5 class="fw-bold mb-1">${course.name}</h5>
                    <p class="mb-2 ${isSelected ? 'text-white-50' : 'text-secondary'} small">${course.description || ''}</p>
                    <div class="course-meta opacity-75 small ${isSelected ? 'text-white' : 'text-muted'}">
                        <span class="me-3"><strong>📍 Уровень:</strong> ${course.level}</span>
                        <span class="me-3"><strong>👤 Преподаватель:</strong> ${course.teacher}</span>
                        <span><strong>💰 Цена:</strong> ${course.course_fee_per_hour} ₽/час</span>
                    </div>
                </div>
                <div class="ms-3">
                    <button class="btn ${isSelected ? 'btn-light text-primary' : 'btn-outline-primary'} fw-bold px-4 rounded-pill">
                        ${isSelected ? 'ВЫБРАНО' : 'ВЫБРАТЬ'}
                    </button>
                </div>
            `;
            item.onclick = () => { selectedCourse = course; renderCourses(); };
            container.appendChild(item);
        });
        renderPagination('coursePagination', filtered.length, coursePage, p => { coursePage = p; renderCourses(); });
    }

    function renderTutors() {
        const tbody = document.getElementById('tutorTableBody');
        if (!tbody) return;
        const langVal = document.getElementById('languageFilter')?.value;
        const levelVal = document.getElementById('levelFilter')?.value;

        const filtered = allTutors.filter(t => 
            (!langVal || t.languages_offered.includes(langVal)) && (!levelVal || t.language_level === levelVal)
        );

        const start = (tutorPage - 1) * limit;
        tbody.innerHTML = '';
        filtered.slice(start, start + limit).forEach(tutor => {
            const isSelected = selectedTutor?.id === tutor.id;
            const tr = document.createElement('tr');
            tr.className = isSelected ? 'table-primary' : '';
            tr.style.cursor = "pointer";
            tr.innerHTML = `<td>👤</td><td>${tutor.name}</td><td>${tutor.language_level}</td><td>${tutor.languages_offered.join(', ')}</td><td>${tutor.work_experience}</td><td class="fw-bold">${tutor.price_per_hour} ₽</td><td><button class="btn btn-sm btn-primary rounded-pill">${isSelected ? 'ВЫБРАНО' : 'ВЫБРАТЬ'}</button></td>`;
            tr.onclick = () => { selectedTutor = tutor; renderTutors(); };
            tbody.appendChild(tr);
        });
        renderPagination('tutorPagination', filtered.length, tutorPage, p => { tutorPage = p; renderTutors(); });
    }

    function renderPagination(id, total, current, onChange) {
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = '';
        const pages = Math.ceil(total / limit);
        if (pages <= 1) return;
        for (let i = 1; i <= pages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === current ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = (e) => { e.preventDefault(); onChange(i); };
            container.appendChild(li);
        }
    }

    function updateCourseTotal() {
        if (!selectedCourse) return;
        const startDate = new Date(document.getElementById('courseDate').value);
        const startTime = document.getElementById('courseTime').value;
        const persons = parseInt(document.getElementById('courseStud').value) || 1;

        const options = {
            supplementary: document.getElementById('supplementary')?.checked,
            personalized: document.getElementById('personalized')?.checked,
            excursions: document.getElementById('excursions')?.checked,
            assessment: document.getElementById('assessment')?.checked,
            interactive: document.getElementById('interactive')?.checked
        };

        const total = calculateTotalPrice(selectedCourse, { startDate, startTime, persons, options });
        document.getElementById('courseTotal').textContent = total.toLocaleString();
        document.getElementById('courseDurationText').value = getDurationText(document.getElementById('courseDate').value, selectedCourse.total_length);
        
        const diffDays = Math.ceil((startDate - new Date()) / (1000*60*60*24));
        if (document.getElementById('earlyRegistration')) document.getElementById('earlyRegistration').checked = (diffDays >= 30);
        if (document.getElementById('groupEnrollment')) document.getElementById('groupEnrollment').checked = (persons >= 5);
        if (document.getElementById('intensiveCourse')) document.getElementById('intensiveCourse').checked = (selectedCourse.week_length >= 5);
    }

    const modalEl = document.getElementById('courseModal');
    if (modalEl) {
        modalEl.addEventListener('show.bs.modal', (e) => {
            if (!selectedCourse) { e.preventDefault(); showAlert("Сначала выберите курс!", "warning"); return; }
            document.getElementById('courseDisplay').value = selectedCourse.name;
            document.getElementById('courseIdField').value = selectedCourse.id;
            document.getElementById('tutorNameDisplay').value = selectedCourse.teacher;
            
            const dateSelect = document.getElementById('courseDate');
            dateSelect.innerHTML = '';
            [...new Set(selectedCourse.start_dates.map(d => d.split('T')[0]))].forEach(d => {
                const opt = document.createElement('option');
                opt.value = d; opt.textContent = new Date(d).toLocaleDateString();
                dateSelect.appendChild(opt);
            });
            updateAvailableTimes();
        });
    }

    function updateAvailableTimes() {
        const dateVal = document.getElementById('courseDate').value;
        const timeSelect = document.getElementById('courseTime');
        timeSelect.innerHTML = '';
        selectedCourse.start_dates.filter(d => d.startsWith(dateVal)).forEach(d => {
            const t = d.split('T')[1].slice(0, 5);
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            timeSelect.appendChild(opt);
        });
        updateCourseTotal();
    }

    document.getElementById('courseDate')?.addEventListener('change', updateAvailableTimes);
    document.getElementById('courseTime')?.addEventListener('change', updateCourseTotal);
    document.getElementById('courseStud')?.addEventListener('input', updateCourseTotal);
    ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateCourseTotal);
    });

    document.getElementById('courseEnrollForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            course_id: Number(document.getElementById('courseIdField').value),
            date_start: document.getElementById('courseDate').value,
            time_start: document.getElementById('courseTime').value,
            duration: Number(selectedCourse.total_length),
            persons: Number(document.getElementById('courseStud').value),
            price: Number(document.getElementById('courseTotal').textContent.replace(/\s/g, '')),
            supplementary: document.getElementById('supplementary').checked ? 1 : 0,
            personalized: document.getElementById('personalized').checked ? 1 : 0,
            excursions: document.getElementById('excursions').checked ? 1 : 0,
            assessment: document.getElementById('assessment').checked ? 1 : 0,
            interactive: document.getElementById('interactive').checked ? 1 : 0
        };
        try {
            const res = await fetch(`${BASE_URL}/api/orders?api_key=${API_KEY}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            if (res.ok) { 
                showAlert("Вы успешно записались на курс!", "success");
                bootstrap.Modal.getInstance(modalEl).hide(); 
            } else {
                showAlert("Ошибка при оформлении записи. Попробуйте снова.", "danger");
            }
        } catch (err) {
            showAlert("Произошла ошибка соединения с сервером.", "danger");
        }
    });

    const tutorModalEl = document.getElementById('tutorModal');
    if (tutorModalEl) {
        tutorModalEl.addEventListener('show.bs.modal', (e) => {
            if (!selectedTutor) { 
                e.preventDefault();
                showAlert("Необходимо выбрать репетитора!", 'warning'); 
                return; 
            }
        });

        document.getElementById('tutorEnrollForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                
                //Здесь должен быть запрос к серверу - подача заявки репетитору, но api отсутствует. Пока поставлена заглушка

                if (true) {
                    showAlert(`Запрос для репетитора ${selectedTutor.name} успешно отправлен!`, 'success');
                    bootstrap.Modal.getInstance(tutorModalEl).hide();
                    e.target.reset();
                } else {
                    showAlert("Не удалось отправить запрос. Пожалуйста, проверьте данные.", "danger");
                }
            } catch (error) {
                console.error(error);
                showAlert("Ошибка сервера при отправке запроса репетитору.", "danger");
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    init();
});