document.addEventListener('DOMContentLoaded', function() {
    let allOrders = [], allCourses = [], allTutors = [];
    let currentDeleteId = null, editSelectedCourse = null;
    let currentPage = 1;
    const limit = 5;

    async function init() {
        try {
            const [oRes, cRes, tRes] = await Promise.all([
                fetch(`${BASE_URL}/api/orders?api_key=${API_KEY}`),
                fetch(`${BASE_URL}/api/courses?api_key=${API_KEY}`),
                fetch(`${BASE_URL}/api/tutors?api_key=${API_KEY}`)
            ]);
            allOrders = await oRes.json();
            allCourses = await cRes.json();
            allTutors = await tRes.json();
            renderOrders();
        } catch (e) { 
            console.error("Load error", e); 
            showAlert("Ошибка при загрузке данных", "danger");
        }
    }

    function getName(order) {
        if (order.course_id) return allCourses.find(c => c.id === order.course_id)?.name || `Курс #${order.course_id}`;
        return allTutors.find(t => t.id === order.tutor_id) ? `Преподаватель: ${allTutors.find(t => t.id === order.tutor_id).name}` : "Не найден";
    }

    function renderOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = allOrders.length ? '' : '<tr><td colspan="5" class="text-center p-4">У вас пока нет заказанных курсов :(</td></tr>';
        
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const ordersToDisplay = allOrders.slice(startIndex, endIndex);

        ordersToDisplay.forEach((order, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 text-muted">${startIndex + i + 1}</td>
                <td class="fw-bold">${getName(order)}</td>
                <td>${new Date(order.date_start).toLocaleDateString()} ${order.time_start.slice(0, 5)}</td>
                <td class="fw-bold">${order.price.toLocaleString()} ₽</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="showDetails(${order.id})">Подробнее</button>
                        <button class="btn btn-outline-warning" onclick="openEditModal(${order.id})">Изменить</button>
                        <button class="btn btn-outline-danger" onclick="confirmDelete(${order.id})">Удалить</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });

        renderPagination();
    }

    function renderPagination() {
        const container = document.getElementById('ordersPagination');
        if (!container) return;
        
        container.innerHTML = '';
        const totalPages = Math.ceil(allOrders.length / limit);

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            
            li.onclick = (e) => {
                e.preventDefault();
                currentPage = i;
                renderOrders();
                window.scrollTo(0, 0); 
            };
            
            container.appendChild(li);
        }
    }

    window.showDetails = (id) => {
        const order = allOrders.find(o => o.id == id);
        const course = allCourses.find(c => c.id === order.course_id);
        const container = document.getElementById('detailsContent');
        const weeks = course ? course.total_length : (order.duration || 0);
        
        const optionNames = { early_registration: "Ранняя регистрация", group_enrollment: "Групповая запись", intensive_course: "Интенсивные курсы", supplementary: "Дополнительные учебные материалы ", personalized: "Индивидуальные занятия", excursions: "Культурные экскурсии", assessment: "Оценка уровня владения языком", interactive: "Доступ к интерактивной онлайн-платформе" };
        let opts = Object.keys(optionNames).filter(k => order[k]).map(k => `<li><i class="bi bi-check2 text-success me-2"></i>${optionNames[k]}</li>`).join('');

        container.innerHTML = `
            <div class="mb-4"><label class="text-muted small fw-bold text-uppercase d-block mb-1">Курс</label><h4 class="fw-bold text-primary">${getName(order)}</h4></div>
            <div class="row g-3 mb-4">
                <div class="col-6 p-2 bg-light rounded shadow-sm"><label class="small d-block">Дата начала</label><b>${new Date(order.date_start).toLocaleDateString()}</b></div>
                <div class="col-6 p-2 bg-light rounded shadow-sm"><label class="small d-block">Время</label><b>${order.time_start.slice(0, 5)}</b></div>
                <div class="col-12 p-2 bg-light rounded shadow-sm"><label class="small d-block">Продолжительность</label><b>${getDurationText(order.date_start, weeks)}</b></div>
            </div>
            <div class="mb-4"><label class="text-muted small fw-bold text-uppercase d-block mb-2">Опции</label><ul class="list-unstyled">${opts || 'Нет'}</ul></div>
            <div class="pt-3 border-top d-flex justify-content-between"><span>Итого:</span><span class="h3 fw-bold text-primary">${order.price.toLocaleString()} ₽</span></div>`;
        new bootstrap.Modal(document.getElementById('detailsModal')).show();
    };

    window.openEditModal = (id) => {
        const order = allOrders.find(o => o.id == id);
        editSelectedCourse = allCourses.find(c => c.id === order.course_id);

        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editCourseName').textContent = editSelectedCourse.name;
        document.getElementById('editInstructor').value = editSelectedCourse.teacher;
        document.getElementById('editPersons').value = order.persons;

        const dateSelect = document.getElementById('editDate');
        dateSelect.innerHTML = '';
        [...new Set(editSelectedCourse.start_dates.map(d => d.split('T')[0]))].forEach(d => {
            const opt = document.createElement('option');
            opt.value = d; opt.textContent = new Date(d).toLocaleDateString();
            if (d === order.date_start) opt.selected = true;
            dateSelect.appendChild(opt);
        });

        updateEditTimes();
        document.getElementById('editTime').value = order.time_start.slice(0, 5);
        
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(k => {
            const el = document.getElementById(`edit_${k}`);
            if (el) el.checked = !!order[k];
        });

        calculateEditPrice();
        new bootstrap.Modal(document.getElementById('editModal')).show();
    };

    function updateEditTimes() {
        const dateVal = document.getElementById('editDate').value;
        const timeSelect = document.getElementById('editTime');
        const cur = timeSelect.value;
        timeSelect.innerHTML = '';
        editSelectedCourse.start_dates.filter(d => d.startsWith(dateVal)).forEach(d => {
            const t = d.split('T')[1].slice(0, 5);
            const opt = document.createElement('option');
            opt.value = t; opt.textContent = t;
            if (t === cur) opt.selected = true;
            timeSelect.appendChild(opt);
        });
        calculateEditPrice();
    }

    function calculateEditPrice() {
        if (!editSelectedCourse) return;
        const dateStr = document.getElementById('editDate').value;
        const startDate = new Date(dateStr);
        const startTime = document.getElementById('editTime').value;
        const persons = parseInt(document.getElementById('editPersons').value) || 1;
        
        const options = { 
            supplementary: document.getElementById('edit_supplementary').checked, 
            personalized: document.getElementById('edit_personalized').checked, 
            excursions: document.getElementById('edit_excursions').checked, 
            assessment: document.getElementById('edit_assessment').checked, 
            interactive: document.getElementById('edit_interactive').checked 
        };

        const diffDays = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));
        const earlyRegEl = document.getElementById('edit_early_registration');
        const groupEnrEl = document.getElementById('edit_group_enrollment');
        const intensiveEl = document.getElementById('edit_intensive_course');

        if (earlyRegEl) earlyRegEl.checked = (diffDays >= 30);
        if (groupEnrEl) groupEnrEl.checked = (persons >= 5);
        if (intensiveEl) intensiveEl.checked = (editSelectedCourse.week_length >= 5);

        const total = calculateTotalPrice(editSelectedCourse, { startDate, startTime, persons, options });
        
        document.getElementById('editTotal').textContent = total.toLocaleString();
        document.getElementById('editDurationText').textContent = getDurationText(dateStr, editSelectedCourse.total_length);
    }

    document.getElementById('editDate').onchange = updateEditTimes;
    ['editTime', 'editPersons', 'edit_supplementary', 'edit_personalized', 'edit_excursions', 'edit_assessment', 'edit_interactive'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onchange = el.oninput = calculateEditPrice;
    });

    document.getElementById('editOrderForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editOrderId').value;
        const body = {
            date_start: document.getElementById('editDate').value,
            time_start: document.getElementById('editTime').value,
            persons: Number(document.getElementById('editPersons').value),
            price: Number(document.getElementById('editTotal').textContent.replace(/\s/g, '')),
            supplementary: document.getElementById('edit_supplementary').checked ? 1 : 0,
            personalized: document.getElementById('edit_personalized').checked ? 1 : 0,
            excursions: document.getElementById('edit_excursions').checked ? 1 : 0,
            assessment: document.getElementById('edit_assessment').checked ? 1 : 0,
            interactive: document.getElementById('edit_interactive').checked ? 1 : 0
        };

        try {
            const res = await fetch(`${BASE_URL}/api/orders/${id}?api_key=${API_KEY}`, {
                method: 'PUT', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(body)
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                showAlert("Заказ успешно обновлен", "success");
                await init();
            } else {
                showAlert("Не удалось обновить заказ", "danger");
            }
        } catch (error) {
            showAlert("Ошибка сети при редактировании", "danger");
        }
    };

    window.confirmDelete = (id) => {
        currentDeleteId = id;
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    };

    document.getElementById('confirmDeleteBtn').onclick = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/orders/${currentDeleteId}?api_key=${API_KEY}`, { 
                method: 'DELETE' 
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                showAlert("Заказ успешно удален", "success");
                await init();
            } else {
                showAlert("Ошибка при удалении заказа", "danger");
            }
        } catch (error) {
            showAlert("Ошибка сети при удалении", "danger");
        }
    };

    init();
});