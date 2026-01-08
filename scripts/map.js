function initMap() {
    const mapElement = document.getElementById("map");

    const myMap = new ymaps.Map("map", {
        center: [55.755864, 37.617698],
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl']
    });

    const locations = [
        {
            coords: [55.750819, 37.608922],
            title: 'Российская Государственная Библиотека',
            address: 'улица Воздвиженка, 3/5, Москва, 119019'
        },
        {
            coords: [55.748240, 37.648142],
            title: 'Всероссийская государственная библиотека иностранной литературы имени М. И. Рудомино',
            address: 'Николоямская улица, 1, Москва, 109240'
        },
        {
            coords: [55.738556, 37.594456],
            title: 'Австрийская библиотека',
            address: 'улица Остоженка, 38с1, Москва, 119034'
        },
        {
            coords: [55.744551, 37.545548],
            title: 'Библиотека № 209 им. А. Н. Толстого',
            address: 'Кутузовский проспект, 24, Москва, 121151'
        },
        {
            coords: [55.767020, 37.678791],
            title: 'Библиотека им. Н. А. Некрасова',
            address: 'Бауманская улица, 58/25с14, Москва, 105005'
        }
    ];

    locations.forEach(loc => {
        const placemark = new ymaps.Placemark(loc.coords, {
            hintContent: loc.title,
            balloonContent: `<strong>${loc.title}</strong><br>${loc.address}`
        }, {
            preset: 'islands#blueLanguageIcon'
        });
        myMap.geoObjects.add(placemark);
    });

    myMap.container.fitToViewport();
}

if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
} else {
    console.error("Ошибка: API Яндекс.Карт не загружено.");
}