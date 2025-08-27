let myChart;
let isRotating = false;
let rotationInterval;

// 初始化地图
function initMap() {
    // 获取容器
    const chartDom = document.getElementById('map-container');
    
    // 初始化ECharts实例
    myChart = echarts.init(chartDom);
    
    // 显示加载动画
    myChart.showLoading({
        text: '数据加载中...',
        color: '#8E2DE2',
        textColor: '#4A00E0',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel: 0
    });
    
    // 并行获取GeoJSON数据和区县数据
    Promise.all([
        fetch('/api/jinhua-geojson').then(response => response.json()),
        fetch('/api/district-data').then(response => response.json())
    ]).then(([geoJson, districtData]) => {
        myChart.hideLoading();
        
        // 注册地图
        echarts.registerMap('jinhua', geoJson);
        
        // 创建数据映射
        const dataMap = {};
        districtData.forEach(item => {
            dataMap[item.name] = item;
        });
        
        // 配置选项
        const option = {
            backgroundColor: 'transparent',
            title: {
                text: '金华市立体地图',
                subtext: 'Jinhua 3D Map Visualization',
                left: 'center',
                top: 20,
                textStyle: {
                    color: '#4A00E0',
                    fontSize: 24,
                    fontWeight: 'normal'
                },
                subtextStyle: {
                    color: '#8E2DE2',
                    fontSize: 14
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const data = dataMap[params.name];
                    if (data) {
                        return `
                            <div style="padding: 12px; background: rgba(255, 255, 255, 0.95); border-radius: 6px; border-left: 3px solid #8E2DE2; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #333;">${params.name}</div>
                                <div style="color: #666; margin-bottom: 4px;">发展指数: <span style="color: #4A00E0; font-weight: bold;">${data.value}</span></div>
                                <div style="color: #888;">人口: <span style="color: #8E2DE2;">${(data.population/10000).toFixed(1)}</span> 万人</div>
                            </div>
                        `;
                    }
                    return `<div style="padding: 10px; color: #333;">${params.name}</div>`;
                },
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
                padding: 0,
                textStyle: {
                    color: '#333'
                }
            },
            visualMap: {
                show: false,
                type: 'continuous',
                min: 0,
                max: 100,
                calculable: false,
                inRange: {
                    color: ['#4A00E0', '#6A11CB', '#8E2DE2', '#B721FF']
                }
            },
            geo3D: {
                map: 'jinhua',
                boxHeight: 20,
                regionHeight: 3,
                shading: 'lambert',
                realisticMaterial: {
                    roughness: 0.7,
                    metalness: 0.2
                },
                environment: 'none',
                groundPlane: {
                    show: true,
                    color: 'rgba(200, 200, 255, 0.2)'
                },
                light: {
                    main: {
                        color: '#ffffff',
                        intensity: 1.0,
                        shadow: true,
                        alpha: 40,
                        beta: 30
                    },
                    ambient: {
                        intensity: 0.6
                    }
                },
                viewControl: {
                    projection: 'perspective',
                    alpha: 45,
                    beta: 40,
                    distance: 130,
                    panSensitivity: 1,
                    rotateSensitivity: 1,
                    zoomSensitivity: 0.5,
                    autoRotate: false,
                    minAlpha: 10,
                    maxAlpha: 80,
                    minBeta: -40,
                    maxBeta: 80,
                    minDistance: 80,
                    maxDistance: 200,
                    damping: 0.9,
                    enableZoom: true
                },
                itemStyle: {
                    opacity: 0.9,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                },
                emphasis: {
                    label: {
                        show: true,
                        textStyle: {
                            color: '#ffffff',
                            fontSize: 14,
                            backgroundColor: 'rgba(74, 0, 224, 0.8)',
                            padding: [4, 8],
                            borderRadius: 4,
                            fontWeight: 'bold'
                        }
                    },
                    itemStyle: {
                        color: '#B721FF'
                    }
                },
                label: {
                    show: true,
                    textStyle: {
                        color: '#4A00E0',
                        fontSize: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: [3, 6],
                        borderRadius: 3,
                        fontWeight: 'normal'
                    },
                    distance: 12
                },
                instancing: true,
                postEffect: {
                    enable: true,
                    SSAO: {
                        enable: true,
                        radius: 1.5,
                        intensity: 0.8
                    }
                },
                temporalSuperSampling: {
                    enable: true
                }
            },
            series: [{
                type: 'bar3D',
                coordinateSystem: 'geo3D',
                shading: 'lambert',
                realisticMaterial: {
                    roughness: 0.6,
                    metalness: 0.3
                },
                data: geoJson.features.map((feature, idx) => {
                    const center = getCenterOfFeature(feature);
                    const name = feature.properties.name;
                    const value = dataMap[name] ? dataMap[name].value : 50;
                    return {
                        name: name,
                        value: [center[0], center[1], value / 2],
                        itemStyle: {
                            color: getColorByValue(value)
                        }
                    };
                }),
                barSize: [2, 2],
                minHeight: 1,
                itemStyle: {
                    opacity: 0.95
                },
                emphasis: {
                    label: {
                        show: true,
                        formatter: '{b}',
                        textStyle: {
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    }
                },
                instancing: true
            }]
        };
        
        // 设置配置项
        myChart.setOption(option);
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (myChart) {
                myChart.resize();
            }
        });
        
    }).catch(error => {
        console.error('数据加载失败:', error);
        myChart.hideLoading();
        myChart.setOption({
            title: {
                text: '数据加载失败',
                textStyle: {
                    color: '#ff4757',
                    fontSize: 20
                },
                left: 'center',
                top: 'center'
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
        });
    });
}

// 计算GeoJSON特征的中心点
function getCenterOfFeature(feature) {
    try {
        const coordinates = feature.geometry.coordinates[0];
        let sumX = 0, sumY = 0;
        const len = coordinates.length;
        for (let i = 0; i < len; i++) {
            sumX += coordinates[i][0];
            sumY += coordinates[i][1];
        }
        return [sumX / len, sumY / len];
    } catch (error) {
        return [120, 30]; // 金华市大概的经纬度
    }
}

// 根据数值获取颜色
function getColorByValue(value) {
    if (value < 20) return '#4A00E0';
    else if (value < 40) return '#6A11CB';
    else if (value < 60) return '#8E2DE2';
    else if (value < 80) return '#B721FF';
    else return '#DC2430';
}

// 旋转视角
function rotateView() {
    if (!myChart) return;
    
    if (isRotating) {
        clearInterval(rotationInterval);
        isRotating = false;
        document.getElementById('rotate-btn').textContent = '自动旋转';
        return;
    }
    
    isRotating = true;
    document.getElementById('rotate-btn').textContent = '停止旋转';
    
    let angle = 0;
    rotationInterval = setInterval(() => {
        angle += 1;
        if (angle >= 360) angle = 0;
        
        myChart.setOption({
            geo3D: {
                viewControl: {
                    beta: angle
                }
            }
        });
    }, 50);
}

// 重置视角
function resetView() {
    if (!myChart) return;
    
    if (isRotating) {
        clearInterval(rotationInterval);
        isRotating = false;
        document.getElementById('rotate-btn').textContent = '自动旋转';
    }
    
    myChart.setOption({
        geo3D: {
            viewControl: {
                alpha: 45,
                beta: 40,
                distance: 130
            }
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加防抖函数来优化性能
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (myChart) {
                myChart.resize();
            }
        }, 100);
    });
    
    initMap();
    
    // 绑定按钮事件
    document.getElementById('rotate-btn').addEventListener('click', rotateView);
    document.getElementById('reset-btn').addEventListener('click', resetView);
});