/**
 * Smart Center 3D地图可视化主文件
 * 基于Three.js实现GeoJSON数据的3D可视化
 */

class SmartCenter3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.gui = null;
        
        this.geojsonData = null;
        this.blockMeshes = [];
        this.selectedBlock = null;
        this.hoveredBlock = null;
        
        this.settings = {
            blockHeight: 50,
            wireframe: false,
            animation: false,
            rotationSpeed: 0.005,
            cameraAutoRotate: false
        };
        
        this.colors = {
            normal: 0x1565C0, // 深蓝色
            selected: 0xFF9800,
            hovered: 0xF44336,
            ground: 0x2196F3
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoading(true);
            
            this.setupScene();
            await this.loadGeoJSON();
            this.setupControls();
            this.setupEventListeners();
            this.animate();
            
            this.showLoading(false);
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('初始化失败，请检查数据文件');
        }
    }
    
    setupScene() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x062e8b);
        
        // 创建相机
        const container = document.getElementById('map-container');
        if (!container) {
            throw new Error('找不到map-container元素');
        }
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
        this.camera.position.set(0, 800, 1200); // 提高视角高度，降低仰角
        
        // 创建渲染器
        const canvas = document.getElementById('three-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 添加光照
        this.setupLighting();
        
        // 创建射线投射器和鼠标向量
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 添加地面
        this.createGround();
        
        // // 添加网格辅助线
        // const gridHelper = new THREE.GridHelper(2000, 50, 0x888888, 0xcccccc);
        // gridHelper.position.y = -1;
        // this.scene.add(gridHelper);
    }
    
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(500, 1000, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 2000;
        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;
        this.scene.add(directionalLight);
        
        // 点光源
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 1000);
        pointLight.position.set(0, 300, 0);
        this.scene.add(pointLight);
    }
    
    createGround() {
        // 创建网格辅助线，确保中心线也是淡蓝色
        const gridHelper = new THREE.GridHelper(2000, 20, 0x84a1e3, 0x84a1e3); // 淡蓝色网格线和中心线，降低密度
        gridHelper.position.y = -5; // 位于地块底部作为背景
        
        // 确保所有线条都是淡蓝色，包括中心十字线
        gridHelper.material.color.setHex(0x84a1e3);
        if (gridHelper.children && gridHelper.children.length > 0) {
            gridHelper.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0x84a1e3);
                }
            });
        }
        
        this.scene.add(gridHelper);
        
        // 在网格交叉点添加小十字标识
        this.createGridCrosses();
        
        // 添加背景小点点装饰
        this.createBackgroundDots();
    }
    
    createGridCrosses() {
        const gridSize = 2000;
        const divisions = 20;
        const step = gridSize / divisions;
        const crossSize = 25; // 十字的大小
        const crossThickness = 2; // 线条粗细
        
        // 创建十字材质
        const crossMaterial = new THREE.LineBasicMaterial({ 
            color: 0x66ccff,
            linewidth: crossThickness
        });
        
        // 为每个交叉点创建十字
        for (let i = 0; i <= divisions; i++) {
            for (let j = 0; j <= divisions; j++) {
                const x = -gridSize/2 + i * step;
                const z = -gridSize/2 + j * step;
                
                // 创建水平线
                const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x - crossSize/2, -4.5, z),
                    new THREE.Vector3(x + crossSize/2, -4.5, z)
                ]);
                const horizontalLine = new THREE.Line(horizontalGeometry, crossMaterial);
                this.scene.add(horizontalLine);
                
                // 创建垂直线
                const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, -4.5, z - crossSize/2),
                    new THREE.Vector3(x, -4.5, z + crossSize/2)
                ]);
                const verticalLine = new THREE.Line(verticalGeometry, crossMaterial);
                this.scene.add(verticalLine);
            }
        }
    }

    createBackgroundDots() {
        const gridSize = 2000;
        const dotSpacing = 10; // 点点之间的间距
        const dotSize = 1.5; // 点点的大小
        const dotColor = 0x66ccff; // 淡蓝色 (SkyBlue)
        
        // 创建点点材质
        const dotMaterial = new THREE.MeshBasicMaterial({ 
            color: dotColor,
            transparent: true,
            opacity: 0.3 // 淡淡的效果
        });
        
        // 创建点点几何体
        const dotGeometry = new THREE.SphereGeometry(dotSize, 8, 6);
        
        // 计算需要创建的点点数量
        const dotsPerSide = Math.floor(gridSize / dotSpacing);
        
        // 创建均匀分布的小点点
        for (let i = 0; i <= dotsPerSide; i++) {
            for (let j = 0; j <= dotsPerSide; j++) {
                const x = -gridSize/2 + i * dotSpacing;
                const z = -gridSize/2 + j * dotSpacing;
                
                // 创建点点网格
                const dot = new THREE.Mesh(dotGeometry, dotMaterial);
                dot.position.set(x, -6, z); // 位于网格线下方
                this.scene.add(dot);
            }
        }
    }

    async loadGeoJSON() {
        try {
            const response = await fetch('./data/106区块.geojson');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.geojsonData = await response.json();
            this.createBlockMeshes();
            this.updateStats();
        } catch (error) {
            console.error('加载GeoJSON失败:', error);
            throw error;
        }
    }
    
    createBlockMeshes() {
        if (!this.geojsonData || !this.geojsonData.features) {
            console.error('无效的GeoJSON数据');
            return;
        }
        
        // 计算边界框用于居中
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.geojsonData.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
                this.extractCoordinates(feature.geometry.coordinates).forEach(coord => {
                    minX = Math.min(minX, coord[0]);
                    maxX = Math.max(maxX, coord[0]);
                    minY = Math.min(minY, coord[1]);
                    maxY = Math.max(maxY, coord[1]);
                });
            }
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const scale = 1000; // 缩放因子
        
        // 为每个区块创建3D模型
        this.geojsonData.features.forEach((feature, index) => {
            const blockMesh = this.createBlockMesh(feature, centerX, centerY, scale, index);
            if (blockMesh) {
                this.blockMeshes.push(blockMesh);
                this.scene.add(blockMesh);
            }
        });
    }
    
    extractCoordinates(coords) {
        let result = [];
        if (Array.isArray(coords[0])) {
            coords.forEach(coord => {
                result = result.concat(this.extractCoordinates(coord));
            });
        } else {
            result.push(coords);
        }
        return result;
    }
    
    createBlockMesh(feature, centerX, centerY, scale, index) {
        try {
            const geometry = feature.geometry;
            if (!geometry || !geometry.coordinates) return null;
            
            let shape;
            
            if (geometry.type === 'Polygon') {
                shape = this.createShapeFromPolygon(geometry.coordinates[0], centerX, centerY, scale);
            } else if (geometry.type === 'MultiPolygon') {
                // 对于MultiPolygon，使用第一个多边形
                shape = this.createShapeFromPolygon(geometry.coordinates[0][0], centerX, centerY, scale);
            } else {
                console.warn('不支持的几何类型:', geometry.type);
                return null;
            }
            
            if (!shape) return null;
            
            // 创建挤出几何体
            const extrudeSettings = {
                depth: this.settings.blockHeight,
                bevelEnabled: true,
                bevelSegments: 2,
                steps: 2,
                bevelSize: 2,
                bevelThickness: 1
            };
            
            const blockGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            
            // 创建材质
            const material = new THREE.MeshLambertMaterial({
                color: this.colors.normal,
                wireframe: this.settings.wireframe,
                transparent: true,
                opacity: 0.9 // 提高透明度，避免看到底部框线
            });
            
            const mesh = new THREE.Mesh(blockGeometry, material);
            
            // 添加淡蓝色边框线
            const edges = new THREE.EdgesGeometry(blockGeometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x66CCFF }); // 淡蓝色边框
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            mesh.add(wireframe);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            // 让地块向后倾倒90度
            mesh.rotation.x = -Math.PI / 2;
            
            // 调整位置使地块与网格底面完全对齐
            mesh.position.y = -2;
            
            // 存储原始数据
            mesh.userData = {
                feature: feature,
                index: index,
                originalColor: this.colors.normal
            };
            
            return mesh;
        } catch (error) {
            console.error('创建区块网格失败:', error);
            return null;
        }
    }
    
    createShapeFromPolygon(coordinates, centerX, centerY, scale) {
        try {
            const shape = new THREE.Shape();
            
            coordinates.forEach((coord, index) => {
                const x = (coord[0] - centerX) * scale;
                const y = (coord[1] - centerY) * scale;
                
                if (index === 0) {
                    shape.moveTo(x, y);
                } else {
                    shape.lineTo(x, y);
                }
            });
            
            return shape;
        } catch (error) {
            console.error('创建形状失败:', error);
            return null;
        }
    }
    
    setupControls() {
        // 轨道控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 2000;
        this.controls.maxPolarAngle = Math.PI * 0.8; // 允许相机向下俯视，像人低头一样
        
        // 设置初始目标点和俯视角度
        this.controls.target.set(0, 0, 0); // 目标点在原点
        this.camera.lookAt(0, -50, 0); // 让相机初始时就低头俯视
        
        // 强制禁用自动旋转，确保地块静止
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 1.0;
        
        this.controls.update(); // 更新控制器状态
    }
    
    setupGUI() {
        this.gui = new dat.GUI();
        
        const visualFolder = this.gui.addFolder('视觉设置');
        visualFolder.add(this.settings, 'blockHeight', 10, 200).onChange(() => {
            this.updateBlockHeight();
        });
        visualFolder.add(this.settings, 'wireframe').onChange(() => {
            this.toggleWireframe();
        });
        visualFolder.add(this.settings, 'animation');
        
        const cameraFolder = this.gui.addFolder('相机控制');
        cameraFolder.add(this.settings, 'cameraAutoRotate').onChange(() => {
            // 强制保持自动旋转为false，确保地块静止
            this.controls.autoRotate = false;
        });
        cameraFolder.add(this.settings, 'rotationSpeed', 0.001, 0.02);
        
        visualFolder.open();
    }
    
    setupEventListeners() {
        // 窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());
        
        // 鼠标事件
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event));
        
        // 按钮事件
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('toggleWireframe').addEventListener('click', () => this.toggleWireframe());
        document.getElementById('toggleAnimation').addEventListener('click', () => this.toggleAnimation());
    }
    
    onWindowResize() {
        const container = document.getElementById('map-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.handleHover();
    }
    
    onMouseClick(event) {
        this.handleClick();
    }
    
    handleHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.blockMeshes);
        
        // 重置之前悬停的对象
        if (this.hoveredBlock && this.hoveredBlock !== this.selectedBlock) {
            this.hoveredBlock.material.color.setHex(this.hoveredBlock.userData.originalColor);
        }
        
        if (intersects.length > 0) {
            const newHovered = intersects[0].object;
            if (newHovered !== this.selectedBlock) {
                this.hoveredBlock = newHovered;
                this.hoveredBlock.material.color.setHex(this.colors.hovered);
                this.renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            this.hoveredBlock = null;
            this.renderer.domElement.style.cursor = 'grab';
        }
    }
    
    handleClick() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.blockMeshes);
        
        // 重置之前选中的对象
        if (this.selectedBlock) {
            this.selectedBlock.material.color.setHex(this.selectedBlock.userData.originalColor);
        }
        
        if (intersects.length > 0) {
            this.selectedBlock = intersects[0].object;
            this.selectedBlock.material.color.setHex(this.colors.selected);
            this.showBlockInfo(this.selectedBlock.userData.feature);
            this.updateStats();
        } else {
            this.selectedBlock = null;
            this.clearBlockInfo();
            this.updateStats();
        }
    }
    
    showBlockInfo(feature) {
        const infoDiv = document.getElementById('block-info');
        const properties = feature.properties;
        
        infoDiv.innerHTML = `
            <p><strong>区块名称:</strong> ${properties.name || '未知'}</p>
            <p><strong>区块ID:</strong> ${properties.block_id || '未知'}</p>
            <p><strong>行政代码:</strong> ${properties.adcode || '未知'}</p>
            <p><strong>级别:</strong> ${properties.level || '未知'}</p>
            <p><strong>子区域数:</strong> ${properties.childrenNum || '未知'}</p>
        `;
    }
    
    clearBlockInfo() {
        const infoDiv = document.getElementById('block-info');
        infoDiv.innerHTML = '<p>点击区块查看详细信息</p>';
    }
    
    updateStats() {
        document.getElementById('total-blocks').textContent = this.blockMeshes.length;
        document.getElementById('selected-blocks').textContent = this.selectedBlock ? 1 : 0;
    }
    
    resetView() {
        this.camera.position.set(0, 800, 1200);
        if (this.controls) {
            this.controls.reset();
        }
    }
    
    toggleWireframe() {
        this.settings.wireframe = !this.settings.wireframe;
        if (this.blockMeshes) {
            this.blockMeshes.forEach(mesh => {
                mesh.material.wireframe = this.settings.wireframe;
            });
        }
    }
    
    toggleAnimation() {
        this.settings.animation = !this.settings.animation;
    }
    
    updateBlockHeight() {
        // 重新创建所有区块以应用新高度
        this.blockMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.blockMeshes = [];
        this.createBlockMeshes();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 移除区块旋转动画，让地块像拼图一样静止平铺
        // if (this.settings.animation) {
        //     this.blockMeshes.forEach((mesh, index) => {
        //         if (mesh !== this.selectedBlock && mesh !== this.hoveredBlock) {
        //             mesh.rotation.y += this.settings.rotationSpeed * Math.sin(Date.now() * 0.001 + index);
        //         }
        //     });
        // }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
    
    showError(message) {
        alert(message);
        this.showLoading(false);
    }
}

// 等待页面加载完成后初始化
function initApp() {
    // 检查Three.js是否加载
    if (typeof THREE === 'undefined') {
        console.error('Three.js未加载，等待重试...');
        setTimeout(initApp, 100);
        return;
    }
    
    // 检查OrbitControls是否加载
    if (!THREE.OrbitControls) {
        console.log('OrbitControls未加载，等待重试...');
        setTimeout(initApp, 100);
        return;
    }
    
    console.log('所有库已加载，初始化应用...');
    new SmartCenter3D();
}

// 页面加载完成后开始初始化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// 备用初始化方法
window.addEventListener('load', () => {
    if (document.readyState === 'complete') {
        setTimeout(initApp, 500);
    }
});