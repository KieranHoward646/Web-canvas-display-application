class DragDrop {
    constructor(canvasId, onPositionChange) {
        this.canvas = document.getElementById(canvasId);
        this.onPositionChange = onPositionChange;
        this.draggingElement = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        
        this.init();
    }

    init() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 实现缩放功能
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }

    handleMouseDown(e) {
        const element = e.target.closest('.section');
        if (element) {
            this.draggingElement = element;
            
            // 计算鼠标相对于元素的偏移量
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            this.offsetX = (e.clientX - canvasRect.left) / this.scale - element.offsetLeft;
            this.offsetY = (e.clientY - canvasRect.top) / this.scale - element.offsetTop;
            
            // 添加拖拽样式
            element.style.zIndex = '100';
        }
    }

    handleMouseMove(e) {
        if (this.draggingElement) {
            e.preventDefault();
            
            const canvasRect = this.canvas.getBoundingClientRect();
            const x = ((e.clientX - canvasRect.left) / this.scale - this.offsetX);
            const y = ((e.clientY - canvasRect.top) / this.scale - this.offsetY);
            
            // 更新元素位置
            this.draggingElement.style.left = `${x}px`;
            this.draggingElement.style.top = `${y}px`;
        }
    }

    handleMouseUp(e) {
        if (this.draggingElement) {
            // 恢复z-index
            this.draggingElement.style.zIndex = '10';
            
            // 获取元素ID和新位置
            const sectionId = this.draggingElement.dataset.id;
            const x = parseInt(this.draggingElement.style.left) || 0;
            const y = parseInt(this.draggingElement.style.top) || 0;
            
            // 调用回调函数更新位置
            if (this.onPositionChange && sectionId) {
                this.onPositionChange(sectionId, { x, y });
            }
            
            this.draggingElement = null;
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        // 计算新的缩放比例
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, this.scale * delta));
        
        if (newScale !== this.scale) {
            this.scale = newScale;
            
            // 应用缩放变换
            this.canvas.style.transform = `scale(${this.scale})`;
            this.canvas.style.transformOrigin = 'center center';
        }
    }

    resetScale() {
        this.scale = 1;
        this.canvas.style.transform = 'scale(1)';
    }
}