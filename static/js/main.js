let myChart;
let isRotating = false;
let rotationInterval;
let districtDataMap = {}; // 存储地块数据映射
let socket; // WebSocket连接
let currentDistrictColors = {}; // 当前地块颜色状态

// 地块数据映射（API返回的格式到字母的映射）
const districtNameMap = {
    'A地': 'A',
    'B地': 'B', 
    'C地': 'C',
    'D地': 'D',
    'E地': 'E',
    'F地': 'F',
    'G地': 'G',
    'H地': 'H',
    'I地': 'I'
};

// 地块详细信息数据（使用代称）
const districtDetails = {
    'A': {
        name: 'A市',
        code: 'A',
        population: 85.6,
        area: 1387.5,
        gdp: 456.8,
        description: 'A市是区域的主城区，是政治、经济、文化中心。这里历史悠久，文化底蕴深厚，是重要的历史文化名城。',
        features: [
            '政府所在地',
            '历史文化名城',
            '教育文化中心',
            '商业贸易发达',
            '交通枢纽地位'
        ]
    },
    'B': {
        name: 'B市',
        code: 'B',
        population: 32.8,
        area: 657.2,
        gdp: 234.5,
        description: 'B市是新兴城区，近年来发展迅速，是重要的工业基地和物流中心。',
        features: [
            '新兴工业基地',
            '物流中心',
            '高新技术产业',
            '现代化城区',
            '交通便利'
        ]
    },
    'C': {
        name: 'C市',
        code: 'C',
        population: 67.2,
        area: 1313.6,
        gdp: 298.7,
        description: 'C市是重要的县级市，以纺织工业闻名，是重要的纺织产业基地。',
        features: [
            '纺织工业基地',
            '传统制造业',
            '历史文化名城',
            '水运交通便利',
            '农业资源丰富'
        ]
    },
    'D': {
        name: 'D市',
        code: 'D',
        population: 125.9,
        area: 1105.5,
        gdp: 789.2,
        description: 'D市是著名的小商品集散地，被誉为"商品超市"，是重要的小商品批发市场。',
        features: [
            '小商品贸易中心',
            '国际贸易中心',
            '电商产业发达',
            '物流配送中心',
            '国际化程度高'
        ]
    },
    'E': {
        name: 'E市',
        code: 'E',
        population: 84.3,
        area: 1747.2,
        gdp: 567.9,
        description: 'E市以工艺制造、建筑、影视等产业闻名，是著名的"工艺之乡"和"影视名城"。',
        features: [
            '工艺制造基地',
            '建筑之乡',
            '影视名城',
            '影视产业园',
            '文化旅游胜地'
        ]
    },
    'F': {
        name: 'F市',
        code: 'F',
        population: 72.1,
        area: 1049.0,
        gdp: 445.6,
        description: 'F市以制造业闻名，是"制造业之都"，拥有完整的制造产业链。',
        features: [
            '制造业之都',
            '制造业基地',
            '产业链完整',
            '工业经济发达',
            '技术创新中心'
        ]
    },
    'G': {
        name: 'G市',
        code: 'G',
        population: 38.7,
        area: 900.0,
        gdp: 156.3,
        description: 'G市以特色产业和艺术文化闻名，是"工艺之都"和"艺术之乡"。',
        features: [
            '工艺制造中心',
            '艺术文化之乡',
            '生态旅游胜地',
            '农业特色产业',
            '文化底蕴深厚'
        ]
    },
    'H': {
        name: 'H市',
        code: 'H',
        population: 33.9,
        area: 1577.2,
        gdp: 123.4,
        description: 'H市以旅游和农业闻名，是重要的生态旅游目的地。',
        features: [
            '旅游胜地',
            '农业基地',
            '生态保护良好',
            '休闲度假胜地',
            '绿色生态城市'
        ]
    },
    'I': {
        name: 'I市',
        code: 'I',
        population: 21.5,
        area: 1196.0,
        gdp: 89.7,
        description: 'I市是重要的生态城市，以特色产业和生态旅游闻名，是"生态之乡"。',
        features: [
            '生态产业基地',
            '生态保护城市',
            '特色产业基地',
            '生态旅游胜地',
            '绿色发展示范区'
        ]
    }
};

// 初始化地图
function initMap() {
    debugOutput('开始初始化地图...');

    // 获取容器
    const chartDom = document.getElementById('map-container');
    if (!chartDom) {
        debugOutput('错误: 找不到地图容器元素');
        console.error('找不到地图容器元素');
        return;
    }

    debugOutput('地图容器元素已找到');

    // 初始化ECharts实例
    myChart = echarts.init(chartDom, null, {
        renderer: 'canvas',
        useDirtyRect: false, // 禁用脏矩形优化以减少闪烁
        useCoarsePointer: false // 禁用粗指针以减少渲染问题
    });

    debugOutput('ECharts实例已创建');
    
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
        debugOutput('数据加载成功 - GeoJSON特征数量: ' + geoJson.features.length + ', 区县数据数量: ' + districtData.length);
        myChart.hideLoading();

        // 注册地图
        echarts.registerMap('jinhua', geoJson);
        debugOutput('地图已注册');

        // 创建数据映射
        districtData.forEach(item => {
            districtDataMap[item.name] = item;
        });

        debugOutput('数据映射创建完成，包含 ' + Object.keys(districtDataMap).length + ' 个地块');
        
        // 配置选项
        const option = {
            backgroundColor: '#0f172a',

            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    const data = districtDataMap[params.name];
                    if (data) {
                        // 检查当前地块是否为警告状态
                        const currentColor = currentDistrictColors[params.name] || '#5698c3';
                        const isWarning = currentColor === '#ffc107';
                        
                        // 根据状态选择主题色
                        const borderColor = isWarning ? '#ffc107' : '#3b82f6';
                        const accentColor = isWarning ? '#ffe066' : '#93c5fd';
                        const valueColor = isWarning ? '#ffeb3b' : '#60a5fa';
                        const populationColor = isWarning ? '#ffc107' : '#3b82f6';
                        
                        return `
                            <div style="padding: 12px; background: rgba(15, 23, 42, 0.95); border-radius: 6px; border-left: 3px solid ${borderColor}; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ffffff;">${params.name}</div>
                                <div style="color: ${accentColor}; margin-bottom: 4px;">发展指数: <span style="color: ${valueColor}; font-weight: bold;">${data.value}</span></div>
                                <div style="color: #cbd5e1;">人口: <span style="color: ${populationColor};">${(data.population/10000).toFixed(1)}</span> 万人</div>
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
            // visualMap: {
            //     show: false,
            //     type: 'continuous',
            //     min: 0,
            //     max: 100,
            //     calculable: false,
            //     inRange: {
            //         color: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
            //     }
            // },
            series: [
                {
                    type: 'map3D',
                    map: 'jinhua',
                    data: districtData.map(item => ({
                        name: item.name,
                        // value: item.value,  // 移除value字段避免数据驱动的颜色变化
                        population: item.population
                    })),
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
                            intensity: 0.8,
                            shadow: false,
                            alpha: 45,
                            beta: 30
                        },
                        ambient: {
                            intensity: 0.7
                        }
                    },
                    viewControl: {
                        projection: 'perspective',
                        alpha: 45,
                        beta: 40,
                        distance: 115,
                        panSensitivity: 0.5,
                        rotateSensitivity: 0.5,
                        zoomSensitivity: 0.8,
                        autoRotate: false,
                        minAlpha: 10,
                        maxAlpha: 80,
                        minBeta: -40,
                        maxBeta: 80,
                        minDistance: 80,
                        maxDistance: 200,
                        damping: 0.98,
                        enableZoom: true,
                        enableRotate: true,
                        enablePan: true
                    },
                    silent: false,
                    itemStyle: {
                        color: '#5698c3',
                        opacity: 1.0,
                        borderWidth: 1.5,
                        borderColor: 'rgba(30, 64, 175, 1.0)'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            textStyle: {
                                color: '#ffffff',
                                fontSize: 22,
                                backgroundColor: 'transparent',
                                padding: [0, 0],
                                borderRadius: 0,
                                fontWeight: 'bold',
                                borderColor: 'transparent',
                                borderWidth: 0,
                                textShadowBlur: 10,
                                textShadowColor: 'rgba(59, 130, 246, 0.8)'
                            }
                        },
                        itemStyle: {
                            color: '#7bb3d3' // 默认悬停颜色（淡蓝色）
                        }
                    },
                    label: {
                        show: true,
                        formatter: function(params) {
                            const code = districtNameMap[params.name] || params.name;
                            return [
                                '{a|' + code + '}',
                                '{b|●}'
                            ].join('\n');
                        },
                        textStyle: {
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                            borderWidth: 0,
                            padding: [0, 0]
                        },
                        rich: {
                            a: {
                                color: '#ffffff',
                                fontSize: 16,
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(86, 152, 195, 0.9)',
                                padding: [6, 12],
                                borderRadius: 20,
                                borderColor: 'rgba(123, 179, 211, 0.8)',
                                borderWidth: 1
                            },
                            b: {
                                color: '#5698c3',
                                fontSize: 24,
                                fontWeight: 'bold',
                                textShadow: '0 0 10px #5698c3, 0 0 20px #5698c3, 0 0 30px #5698c3'
                            }
                        },
                        distance: 20
                    },
                    instancing: false,
                    postEffect: {
                        enable: false
                    },
                    temporalSuperSampling: {
                        enable: false
                    }
                }
            ]
        };
        
        // 设置配置项，使用notMerge确保完全替换配置
        myChart.setOption(option, true);

        debugOutput('地图配置已设置');

        // 添加多种事件监听
        setupEventListeners();
        
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
        debugOutput('数据加载失败: ' + error.message);
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

// 设置事件监听器
function setupEventListeners() {
    debugOutput('设置事件监听器...');
    
    // 1. ECharts通用点击事件
    myChart.on('click', function(params) {
        console.log('ECharts通用点击事件:', params);
        debugOutput('通用点击事件触发! 组件: ' + (params.componentType || '未定义') + ', 系列类型: ' + (params.seriesType || '未定义') + ', 名称: ' + (params.name || '未定义'));
        
        // 检查是否是地图点击（专注于map3D系列）
        if (params.seriesType === 'map3D' ||
            (params.componentType === 'series' && params.seriesType === 'map3D')) {
            debugOutput('地图区域点击: ' + params.name);
            handleDistrictClick(params);
        } else {
            debugOutput('非地图区域点击，组件类型: ' + params.componentType + ', 系列类型: ' + params.seriesType);
        }
    });

    // 2. 添加鼠标悬停事件（针对map3D系列）
    myChart.on('mouseover', function(params) {
        if (params.seriesType === 'map3D') {
            debugOutput('鼠标悬停: ' + params.name);
        }
    });

    // 3. 添加鼠标移出事件（针对map3D系列）
    myChart.on('mouseout', function(params) {
        if (params.seriesType === 'map3D') {
            debugOutput('鼠标移出: ' + params.name);
        }
    });

    // 6. 监听双击事件
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.addEventListener('dblclick', function(e) {
            console.log('地图容器双击事件:', e); // 调试信息
        });
    }

    // 7. 全局点击事件监听
    document.addEventListener('click', function(e) {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer && mapContainer.contains(e.target)) {
            console.log('全局点击事件 - 地图区域:', e); // 调试信息
        }
    });
    
    // 8. 尝试直接访问ECharts的渲染器
    if (myChart && myChart.getZr) {
        const zr = myChart.getZr();
        if (zr) {
            zr.on('click', function(params) {
                console.log('ZRender点击事件:', params); // 调试信息
            });
            
            zr.on('mousedown', function(params) {
                console.log('ZRender鼠标按下:', params); // 调试信息
            });
            
            zr.on('mouseup', function(params) {
                console.log('ZRender鼠标释放:', params); // 调试信息
            });
        }
    }
    
    debugOutput('所有事件监听器设置完成');
}



// 处理地块点击事件
function handleDistrictClick(params) {
    debugOutput('处理地块点击: ' + params.name);
    console.log('处理地块点击:', params); // 调试信息
    const districtName = params.name;
    const districtCode = districtNameMap[districtName];

    debugOutput('地块名称: ' + districtName + ', 代码: ' + districtCode);
    console.log('地块名称:', districtName, '代码:', districtCode); // 调试信息
    
    if (districtCode && districtDetails[districtCode]) {
        // 打开子页面
        debugOutput('正在打开地块详情: ' + districtCode);
        
        // 只显示模态框，移除浮动文本框
        openDistrictModal(districtCode);
    } else {
        debugOutput('未找到地块信息: ' + districtName + ' (代码: ' + districtCode + ')');
        console.log('未找到地块信息:', districtName); // 调试信息
        console.log('可用的地块映射:', districtNameMap); // 调试信息
        console.log('可用的地块详情:', Object.keys(districtDetails)); // 调试信息
    }
}

// 打开地块子页面
function openDistrictModal(districtCode) {
    console.log('打开模态框:', districtCode); // 调试信息
    const district = districtDetails[districtCode];
    if (!district) {
        console.log('未找到地块详情:', districtCode); // 调试信息
        return;
    }
    
    // 检查地块是否为警告状态
    const districtName = Object.keys(districtNameMap).find(key => districtNameMap[key] === districtCode);
    const currentColor = currentDistrictColors[districtName] || '#5698c3';
    const isWarning = currentColor === '#ffc107';
    
    // 更新模态框内容
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = `${district.code} - ${district.name}`;
    
    // 根据警告状态设置标题颜色
    if (isWarning) {
        modalTitle.style.textShadow = '0 0 20px rgba(255, 193, 7, 0.5)';
        modalTitle.style.color = '#ffe066';
    } else {
        modalTitle.style.textShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        modalTitle.style.color = '#ffffff';
    }
    
    const modalContent = document.getElementById('modal-content');
    const themeClass = isWarning ? 'warning-theme' : 'normal-theme';
    modalContent.className = `modal-content ${themeClass}`;
    modalContent.innerHTML = `
        <div class="district-info">
            <div class="district-stats ${themeClass}">
                <h3>基础信息</h3>
                <div class="stat-item">
                    <span class="stat-label">代码</span>
                    <span class="stat-value">${district.code}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">名称</span>
                    <span class="stat-value">${district.name}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">人口</span>
                    <span class="stat-value">${district.population} 万人</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">面积</span>
                    <span class="stat-value">${district.area} 平方公里</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">GDP</span>
                    <span class="stat-value">${district.gdp} 亿元</span>
                </div>
            </div>
            <div class="district-description ${themeClass}">
                <h3>区域描述</h3>
                <p>${district.description}</p>
            </div>
        </div>
        <div class="district-features ${themeClass}">
            <h3>特色亮点</h3>
            <ul class="feature-list">
                ${district.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
    `;
    
    // 显示模态框
    const modal = document.getElementById('district-modal');
    modal.classList.add('show');
    
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}


// 调试输出函数
function debugOutput(msg) {
    const el = document.getElementById('debug-output');
    if (el) {
        el.textContent = msg;
    }
}



// 关闭地块子页面
function closeDistrictModal() {
    const modal = document.getElementById('district-modal');
    modal.classList.remove('show');
    
    // 恢复背景滚动
    document.body.style.overflow = '';
}

// 初始化模态框事件
function initModalEvents() {
    // 关闭按钮点击事件
    document.getElementById('modal-close').addEventListener('click', closeDistrictModal);
    
    // 背景点击事件
    document.getElementById('district-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDistrictModal();
        }
    });
    
    // ESC键关闭事件
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDistrictModal();
        }
    });
}

// 初始化重置视角按钮事件
function initResetViewButton() {
    const resetBtn = document.getElementById('reset-view-btn');
    if (resetBtn) {
        console.log('重置视角按钮已找到并添加事件监听');
        debugOutput('重置视角按钮已初始化');
        resetBtn.addEventListener('click', function() {
            console.log('重置视角按钮被点击');
            resetView();
        });
    } else {
        console.error('未找到重置视角按钮元素');
        debugOutput('错误: 未找到重置视角按钮');
    }
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
    
    debugOutput('重置地图视角...');
    
    // 获取当前配置
    const currentOption = myChart.getOption();
    const series = currentOption.series[0];
    
    // 重置视角到默认位置
    myChart.setOption({
        series: [{
            ...series,
            viewControl: {
                alpha: 45,
                beta: 40,
                distance: 115,
                animationDurationUpdate: 1000,
                animationEasingUpdate: 'cubicInOut'
            }
        }]
    });
    
    debugOutput('视角已重置');
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
    let progress = 0;
    let currentStep = 1;
    const totalDuration = 3000; // 总加载时间3秒
    const stepDuration = totalDuration / 100; // 每1%需要的时间
    
    // 步骤切换的进度点
    const stepPoints = [0, 25, 60, 85, 100];
    const stepTexts = ['初始化系统...', '加载地图数据...', '渲染3D场景...', '启动完成'];
    
    const animationInterval = setInterval(() => {
        progress += 1;
        
        // 检查是否需要切换步骤
        if (progress >= stepPoints[currentStep] && currentStep < stepPoints.length - 1) {
            currentStep++;
        }
        
        // 更新进度
        updateLoadingProgress(progress, currentStep);
        
        // 完成加载
        if (progress >= 100) {
            clearInterval(animationInterval);
            
            // 延迟一下再显示主内容，让用户看到100%
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
            }, 300);
        }
    }, stepDuration);
}

// 初始化WebSocket连接
function initWebSocket() {
    try {
        // 连接到后台管理服务器的WebSocket
        socket = io('http://localhost:5005');
        
        socket.on('connect', function() {
            console.log('WebSocket已连接到后台管理服务器');
            debugOutput('WebSocket已连接');
            // 加入前端房间
            socket.emit('join_frontend');
        });

        socket.on('disconnect', function() {
            console.log('WebSocket连接断开');
            debugOutput('WebSocket连接断开');
        });

        // 接收初始状态
        socket.on('initial_status', function(status) {
            console.log('收到初始状态:', status);
            debugOutput('收到初始状态数据');
            updateDistrictColors(status);
        });

        // 接收状态更新
        socket.on('status_update', function(data) {
            console.log('收到状态更新:', data);
            debugOutput(`地块 ${data.district} 状态更新为 ${data.status}`);
            updateSingleDistrictColor(data.district, data.color);
        });

        socket.on('connect_error', function(error) {
            console.log('WebSocket连接错误:', error);
            debugOutput('WebSocket连接失败');
        });

    } catch (error) {
        console.error('WebSocket初始化失败:', error);
        debugOutput('WebSocket初始化失败');
    }
}

// 更新所有地块颜色
function updateDistrictColors(statusData) {
    if (!myChart) return;
    
    Object.keys(statusData).forEach(district => {
        currentDistrictColors[district] = statusData[district].color;
    });
    
    // 更新地图颜色
    updateMapColors();
    
    // 更新悬停效果
    updateDistrictHoverEffects();
}

// 更新单个地块颜色
function updateSingleDistrictColor(district, color) {
    if (!myChart) return;
    
    currentDistrictColors[district] = color;
    
    // 平滑更新单个地块颜色
    animateDistrictColorChange(district, color);
    
    // 更新悬停效果
    setTimeout(() => {
        updateDistrictHoverEffects();
    }, 100); // 稍微延迟以确保动画完成
}

// 更新地块悬停效果
function updateDistrictHoverEffects() {
    if (!myChart) return;
    
    const currentOption = myChart.getOption();
    const series = currentOption.series[0];
    
    // 为每个地块设置正确的悬停颜色
    const newData = series.data.map(item => {
        const currentColor = currentDistrictColors[item.name] || '#5698c3';
        const hoverColor = currentColor === '#ffc107' ? '#ffe066' : '#7bb3d3';
        
        return {
            ...item,
            emphasis: {
                ...item.emphasis,
                itemStyle: {
                    ...item.emphasis?.itemStyle,
                    color: hoverColor
                }
            }
        };
    });
    
    // 更新地图配置
    myChart.setOption({
        series: [{
            ...series,
            data: newData
        }]
    }, false);
}

// 颜色插值函数
function interpolateColor(color1, color2, factor) {
    // 将十六进制颜色转换为RGB
    const hex2rgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    // 将RGB转换为十六进制
    const rgb2hex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    const c1 = hex2rgb(color1);
    const c2 = hex2rgb(color2);
    
    if (!c1 || !c2) return color2;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return rgb2hex(r, g, b);
}

// 缓动函数
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 平滑动画更新地块颜色
function animateDistrictColorChange(district, targetColor) {
    if (!myChart) return;
    
    const currentOption = myChart.getOption();
    const series = currentOption.series[0];
    
    // 获取当前颜色
    let currentColor = '#5698c3'; // 默认蓝色
    const currentData = series.data.find(item => item.name === district);
    if (currentData && currentData.itemStyle && currentData.itemStyle.color) {
        currentColor = currentData.itemStyle.color;
    }
    
    // 如果颜色相同，直接返回
    if (currentColor === targetColor) {
        return;
    }
    
    debugOutput(`开始颜色动画: ${district} 从 ${currentColor} 到 ${targetColor}`);
    
    // 立即更新颜色状态，这样悬停效果能正确工作
    currentDistrictColors[district] = targetColor;
    
    // 立即更新悬停效果
    updateDistrictHoverEffects();
    
    const animationDuration = 2000; // 2秒动画
    const frameRate = 60; // 60FPS
    const totalFrames = (animationDuration / 1000) * frameRate;
    let currentFrame = 0;
    
    const animationInterval = setInterval(() => {
        currentFrame++;
        const progress = currentFrame / totalFrames;
        const easedProgress = easeInOutCubic(progress);
        
        // 计算当前帧的颜色
        const frameColor = interpolateColor(currentColor, targetColor, easedProgress);
        
        // 更新地图颜色
        const newData = series.data.map(item => {
            if (item.name === district) {
                return {
                    ...item,
                    itemStyle: {
                        color: frameColor,
                        opacity: 1.0,
                        borderWidth: 1.5,
                        borderColor: 'rgba(30, 64, 175, 1.0)'
                    }
                };
            }
            return item;
        });
        
        myChart.setOption({
            series: [{
                ...series,
                data: newData,
                animation: false // 禁用ECharts自带动画，使用我们的自定义动画
            }]
        }, false);
        
        // 动画完成
        if (currentFrame >= totalFrames) {
            clearInterval(animationInterval);
            // 确保最终颜色准确，并更新颜色状态
            currentDistrictColors[district] = targetColor;
            
            // 最终更新，确保颜色完全准确
            const finalData = series.data.map(item => {
                if (item.name === district) {
                    return {
                        ...item,
                        itemStyle: {
                            color: targetColor,
                            opacity: 1.0,
                            borderWidth: 1.5,
                            borderColor: 'rgba(30, 64, 175, 1.0)'
                        }
                    };
                }
                return item;
            });
            
            myChart.setOption({
                series: [{
                    ...series,
                    data: finalData,
                    animation: false
                }]
            }, false);
            
            // 更新悬停效果
            updateDistrictHoverEffects();
            
            debugOutput(`地块 ${district} 颜色动画完成: ${targetColor}`);
        }
    }, 1000 / frameRate);
}

// 更新整个地图的颜色
function updateMapColors() {
    if (!myChart) return;
    
    const currentOption = myChart.getOption();
    const series = currentOption.series[0];
    
    // 更新所有地块的颜色
    const newData = series.data.map(item => {
        const color = currentDistrictColors[item.name] || '#5698c3';
        return {
            ...item,
            itemStyle: {
                color: color,
                opacity: 1.0,
                borderWidth: 1.5,
                borderColor: 'rgba(30, 64, 175, 1.0)'
            }
        };
    });
    
    // 更新整个地图颜色
    myChart.setOption({
        series: [{
            ...series,
            data: newData,
            animation: false
        }]
    }, false);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    debugOutput('页面加载完成，开始初始化...');

    // 开始加载动画
    startLoadingAnimation();

    // 初始化WebSocket连接
    initWebSocket();

    // 添加防抖函数来优化性能
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (myChart) {
                myChart.resize();
                debugOutput('窗口大小调整，地图已重新计算尺寸');
            }
        }, 100);
    });

    // 初始化模态框事件
    initModalEvents();

    // 初始化重置视角按钮事件
    initResetViewButton();

    debugOutput('页面初始化完成');
});