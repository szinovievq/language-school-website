function getDurationText(startDateStr, weeks) {
    if (!startDateStr || !weeks) return weeks ? `${weeks} нед.` : "—";
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + (weeks * 7));
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${weeks} Нед. (До: ${day}.${month}.${year})`;
}

function calculateTotalPrice(course, params) {
    if (!course) return 0;

    const {
        startDate,
        startTime,
        persons,
        options
    } = params;

    const weeks = course.total_length || 0;
    const hoursPerWeek = course.week_length || 0;
    const feePerHour = course.course_fee_per_hour || 0;
    const isWeekend = (startDate.getDay() === 0 || startDate.getDay() === 6) ? 1.5 : 1;
    let total = (feePerHour * weeks * hoursPerWeek * isWeekend) * persons;

    const hour = parseInt((startTime || "00").split(':')[0]);
    if (hour >= 9 && hour < 12) total += (400 * persons);
    else if (hour >= 18 && hour < 20) total += (1000 * persons);

    if (options.supplementary) total += (2000 * persons);
    if (options.personalized)  total += (1500 * weeks);
    if (options.excursions)     total *= 1.25;
    if (options.assessment)     total += 300;
    if (options.interactive)    total *= 1.5;

    return Math.round(total);
}

function showAlert(message, type = 'success') {
    const notificationArea = document.getElementById('notification-area');
    
    if (!notificationArea) {
        console.warn('Контейнер #notification-area не найден на странице.');
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show shadow-sm border-0`;
    alertDiv.role = 'alert';

    alertDiv.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span class="text-center w-100">${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    notificationArea.prepend(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}