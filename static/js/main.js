let myChart;
let isRotating = false;
let rotationInterval;

// 初始化地图
function initMap() {
    // 获取容器
    const chartDom = document.getElementById('map-container');
    
            // 初始化ECharts实例
        myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false, // 禁用脏矩形优化以减少闪烁
            useCoarsePointer: false // 禁用粗指针以减少渲染问题
        });
    
    // 显示加载动画
    myChart.showLoading({
        text: '数据加载中...',
        color: '#3b82f6',
        textColor: '#1e40af',
        maskColor: 'rgba(15, 23, 42, 0.8)',
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
            backgroundColor: '#0f172a',

            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const data = dataMap[params.name];
                    if (data) {
                        return `
                            <div style="padding: 12px; background: rgba(15, 23, 42, 0.95); border-radius: 6px; border-left: 3px solid #3b82f6; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ffffff;">${params.name}</div>
                                <div style="color: #93c5fd; margin-bottom: 4px;">发展指数: <span style="color: #60a5fa; font-weight: bold;">${data.value}</span></div>
                                <div style="color: #cbd5e1;">人口: <span style="color: #3b82f6;">${(data.population/10000).toFixed(1)}</span> 万人</div>
                            </div>
                        `;
                    }
                    return `<div style="padding: 10px; color: #ffffff;">${params.name}</div>`;
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
                    color: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
                }
            },
            geo3D: {
                map: 'jinhua',
                boxHeight: 20,
                regionHeight: 3,
                shading: 'lambert',
                environment: 'none',
                groundPlane: {
                    show: false
                },
                light: {
                    main: {
                        color: '#ffffff',
                        intensity: 0.8, // 降低主光源强度
                        shadow: false,
                        alpha: 45, // 调整光照角度
                        beta: 30
                    },
                    ambient: {
                        intensity: 0.7 // 降低环境光强度
                    }
                },
                viewControl: {
                    projection: 'perspective',
                    alpha: 45,
                    beta: 40,
                    distance: 130,
                    panSensitivity: 0.5, // 进一步降低平移敏感度
                    rotateSensitivity: 0.5, // 进一步降低旋转敏感度
                    zoomSensitivity: 0.2, // 进一步降低缩放敏感度
                    autoRotate: false,
                    minAlpha: 10,
                    maxAlpha: 80,
                    minBeta: -40,
                    maxBeta: 80,
                    minDistance: 80,
                    maxDistance: 200,
                    damping: 0.98, // 进一步增加阻尼
                    enableZoom: true,
                    enableRotate: true,
                    enablePan: true
                },
                itemStyle: {
                    color: 'rgba(59, 130, 246, 1.0)', // 上部表面使用深蓝色
                    opacity: 1.0, // 使用完全不透明
                    borderWidth: 1, // 恢复边框但使用更细的线条
                    borderColor: 'rgba(147, 197, 253, 1.0)', // 使用浅蓝色边框
                    // 侧面使用不同的颜色
                    sideColor: 'rgba(30, 64, 175, 1.0)' // 侧面使用更深的蓝色
                },
                emphasis: {
                    label: {
                        show: true,
                        textStyle: {
                            color: '#ffffff',
                            fontSize: 18, // 强调时更大
                            backgroundColor: 'rgba(30, 64, 175, 0.95)', // 更深的蓝色
                            padding: [8, 16], // 更大的内边距
                            borderRadius: 25, // 更大的圆角
                            fontWeight: 'bold',
                            borderColor: 'rgba(147, 197, 253, 1.0)', // 更亮的边框
                            borderWidth: 2, // 更粗的边框
                            shadowBlur: 10, // 添加阴影
                            shadowColor: 'rgba(59, 130, 246, 0.5)'
                        }
                    },
                    itemStyle: {
                        color: '#60a5fa'
                    }
                },
                label: {
                    show: true,
                    formatter: function(params) {
                        return [
                            '{a|' + params.name + '}',
                            '{b|●}'
                        ].join('\n');
                    },
                    rich: {
                        a: {
                            color: '#ffffff',
                            fontSize: 16,
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(59, 130, 246, 0.9)',
                            padding: [6, 12],
                            borderRadius: 20,
                            borderColor: 'rgba(147, 197, 253, 0.8)',
                            borderWidth: 1
                        },
                        b: {
                            color: '#3b82f6',
                            fontSize: 24,
                            fontWeight: 'bold',
                            textShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6'
                        }
                    },
                    distance: 20
                },
                instancing: false, // 禁用实例化以减少渲染问题
                postEffect: {
                    enable: false // 完全禁用后处理效果
                },
                temporalSuperSampling: {
                    enable: false // 禁用时间超采样以减少闪烁
                }
            },
            series: [] // 移除bar3D系列以避免与geo3D冲突
        };
        
        // 设置配置项，使用notMerge确保完全替换配置
        myChart.setOption(option, true);
        
        // 添加点击动画效果
        myChart.on('click', function(params) {
            if (params.componentType === 'geo3D') {
                // 创建点击动画效果
                const clickEffect = document.createElement('div');
                clickEffect.className = 'hologram-click-effect';
                clickEffect.style.cssText = `
                    position: absolute;
                    left: ${params.event.offsetX}px;
                    top: ${params.event.offsetY}px;
                    width: 0;
                    height: 0;
                    border: 2px solid #3b82f6;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    animation: hologram-click 0.6s ease-out forwards;
                `;
                document.body.appendChild(clickEffect);
                
                // 移除动画元素
                setTimeout(() => {
                    if (clickEffect.parentNode) {
                        clickEffect.parentNode.removeChild(clickEffect);
                    }
                }, 600);
            }
        });
        
        // 监听窗口大小变化，使用防抖优化
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (myChart) {
                    myChart.resize();
                }
            }, 200); // 进一步增加防抖延迟
        });
        
        // 添加渲染优化
        if (myChart && myChart.getZr) {
            const zr = myChart.getZr();
            if (zr) {
                zr.configLayer(0, {
                    motionBlur: false, // 禁用运动模糊
                    useDirtyRect: false // 禁用脏矩形优化
                });
            }
        }
        
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

// 加载动画控制
let loadingProgress = 0;
let currentStep = 1;

function updateLoadingProgress(progress, step) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const steps = document.querySelectorAll('.step');
    
    // 更新进度条
    progressFill.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
    
    // 更新步骤状态
    steps.forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove('active', 'completed');
        
        if (stepNum < step) {
            stepEl.classList.add('completed');
        } else if (stepNum === step) {
            stepEl.classList.add('active');
        }
    });
}

function startLoadingAnimation() {
    // 第一步：初始化系统 (0-25%)
    updateLoadingProgress(0, 1);
    
    setTimeout(() => {
        updateLoadingProgress(25, 2);
        
        // 第二步：加载地图数据 (25-50%)
        setTimeout(() => {
            updateLoadingProgress(50, 3);
            
            // 第三步：渲染3D场景 (50-75%)
            setTimeout(() => {
                updateLoadingProgress(75, 4);
                
                // 第四步：启动完成 (75-100%)
                setTimeout(() => {
                    updateLoadingProgress(100, 4);
                    
                    // 完成加载，显示主内容
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loading-screen');
                        const mainContent = document.getElementById('main-content');
                        
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => {
                            loadingScreen.style.display = 'none';
                            mainContent.style.display = 'block';
                            
                            // 初始化地图
                            initMap();
                        }, 500);
                    }, 500);
                }, 800);
            }, 1000);
        }, 800);
    }, 500);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 开始加载动画
    startLoadingAnimation();
    
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
});