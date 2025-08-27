document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    const map = L.map('map').setView([29.0, 120.0], 10);
    
    // 添加底图图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // 获取GeoJSON数据并添加到地图
    fetch('/api/geojson')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function(feature) {
                    return {
                        color: '#3388ff',
                        weight: 2,
                        opacity: 0.7,
                        fillOpacity: 0.2
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(feature.properties.name);
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
});