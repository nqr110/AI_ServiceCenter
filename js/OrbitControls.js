/**
 * OrbitControls - Simple orbit controls for Three.js
 * Simplified version for local use
 */

class OrbitControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement || document;
        
        // Settings
        this.enabled = true;
        this.enableRotate = true;
        this.enableZoom = true;
        this.enablePan = true;
        
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.0;
        this.panSpeed = 1.0;
        
        this.minDistance = 0;
        this.maxDistance = Infinity;
        
        // Auto rotate settings
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0;
        
        // Internal state
        this.target = new THREE.Vector3();
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.panOffset = new THREE.Vector3();
        this.zoomChanged = false;
        
        this.rotateStart = new THREE.Vector2();
        this.rotateEnd = new THREE.Vector2();
        this.rotateDelta = new THREE.Vector2();
        
        this.panStart = new THREE.Vector2();
        this.panEnd = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();
        
        this.dollyStart = new THREE.Vector2();
        this.dollyEnd = new THREE.Vector2();
        this.dollyDelta = new THREE.Vector2();
        
        this.state = 'NONE';
        
        // Bind events
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);
        
        this.domElement.addEventListener('mousedown', this.onMouseDown);
        this.domElement.addEventListener('wheel', this.onMouseWheel);
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        this.update();
    }
    
    update() {
        const offset = new THREE.Vector3();
        const quat = new THREE.Quaternion().setFromUnitVectors(
            this.camera.up, new THREE.Vector3(0, 1, 0)
        );
        const quatInverse = quat.clone().invert();
        
        const position = this.camera.position;
        
        offset.copy(position).sub(this.target);
        offset.applyQuaternion(quat);
        
        this.spherical.setFromVector3(offset);
        
        // Auto rotate - 确保这里不会自动旋转
        if (this.autoRotate && this.state === 'NONE') {
            this.sphericalDelta.theta -= 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
        }
        
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        this.spherical.phi = Math.max(0.000001, Math.min(Math.PI - 0.000001, this.spherical.phi));
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        
        this.target.add(this.panOffset);
        
        offset.setFromSpherical(this.spherical);
        offset.applyQuaternion(quatInverse);
        
        position.copy(this.target).add(offset);
        
        this.camera.lookAt(this.target);
        
        this.sphericalDelta.set(0, 0, 0);
        this.panOffset.set(0, 0, 0);
        
        return false;
    }
    
    onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (event.button === 0) {
            if (!this.enableRotate) return;
            this.rotateStart.set(event.clientX, event.clientY);
            this.state = 'ROTATE';
        } else if (event.button === 1) {
            if (!this.enableZoom) return;
            this.dollyStart.set(event.clientX, event.clientY);
            this.state = 'DOLLY';
        } else if (event.button === 2) {
            if (!this.enablePan) return;
            this.panStart.set(event.clientX, event.clientY);
            this.state = 'PAN';
        }
        
        if (this.state !== 'NONE') {
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        }
    }
    
    onMouseMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (this.state === 'ROTATE') {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
            
            const element = this.domElement === document ? this.domElement.body : this.domElement;
            
            this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientHeight;
            this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / element.clientHeight;
            
            this.rotateStart.copy(this.rotateEnd);
            
        } else if (this.state === 'DOLLY') {
            this.dollyEnd.set(event.clientX, event.clientY);
            this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
            
            if (this.dollyDelta.y > 0) {
                this.spherical.radius *= 1.1;
            } else if (this.dollyDelta.y < 0) {
                this.spherical.radius /= 1.1;
            }
            
            this.dollyStart.copy(this.dollyEnd);
            
        } else if (this.state === 'PAN') {
            this.panEnd.set(event.clientX, event.clientY);
            this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
            
            const element = this.domElement === document ? this.domElement.body : this.domElement;
            
            const offset = new THREE.Vector3();
            offset.copy(this.camera.position).sub(this.target);
            
            let targetDistance = offset.length();
            targetDistance *= Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
            
            const panLeft = new THREE.Vector3();
            panLeft.setFromMatrixColumn(this.camera.matrix, 0);
            panLeft.multiplyScalar(-2 * this.panDelta.x * targetDistance / element.clientHeight);
            
            const panUp = new THREE.Vector3();
            panUp.setFromMatrixColumn(this.camera.matrix, 1);
            panUp.multiplyScalar(2 * this.panDelta.y * targetDistance / element.clientHeight);
            
            this.panOffset.add(panLeft).add(panUp);
            
            this.panStart.copy(this.panEnd);
        }
        
        this.update();
    }
    
    onMouseUp() {
        if (!this.enabled) return;
        
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        
        this.state = 'NONE';
    }
    
    onMouseWheel(event) {
        if (!this.enabled || !this.enableZoom) return;
        
        event.preventDefault();
        
        if (event.deltaY < 0) {
            this.spherical.radius /= 1.1;
        } else if (event.deltaY > 0) {
            this.spherical.radius *= 1.1;
        }
        
        this.update();
    }
    
    dispose() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}

// Make it available globally
if (typeof THREE !== 'undefined') {
    THREE.OrbitControls = OrbitControls;
}