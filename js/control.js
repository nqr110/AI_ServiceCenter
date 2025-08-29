// 控制面板主要功能
class ControlPanel {
    constructor() {
        this.blockInfo = {
            selectedBlock: null,
            totalBlocks: 0,
            selectedBlocks: 0,
            activeBlocks: 0
        };
        
        this.init();
        this.setupEventListeners();
        this.startDataUpdate();
    }

    init() {
        console.log('控制面板初始化...');
        this.updateStats();
        this.updateTime();
    }

    setupEventListeners() {
        // 刷新数据按钮
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // 清除选择按钮
        const clearBtn = document.getElementById('clear-selection');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }

        // 导出数据按钮
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 重置全部按钮
        const resetBtn = document.getElementById('reset-all');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAll();
            });
        }
    }

    // 更新统计信息
    updateStats() {
        // 模拟数据更新
        this.blockInfo.totalBlocks = Math.floor(Math.random() * 100) + 50;
        this.blockInfo.selectedBlocks = Math.floor(Math.random() * 10);
        this.blockInfo.activeBlocks = Math.floor(Math.random() * 20) + 5;

        // 更新DOM
        const totalBlocksEl = document.getElementById('total-blocks');
        const selectedBlocksEl = document.getElementById('selected-blocks');
        const activeBlocksEl = document.getElementById('active-blocks');

        if (totalBlocksEl) totalBlocksEl.textContent = this.blockInfo.totalBlocks;
        if (selectedBlocksEl) selectedBlocksEl.textContent = this.blockInfo.selectedBlocks;
        if (activeBlocksEl) activeBlocksEl.textContent = this.blockInfo.activeBlocks;
    }

    // 更新时间
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const lastUpdateEl = document.getElementById('last-update');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = timeString;
        }
    }

    // 更新区块信息
    updateBlockInfo(blockData) {
        const blockInfoEl = document.getElementById('block-info');
        if (blockInfoEl && blockData) {
            blockInfoEl.innerHTML = `
                <p><strong>区块ID:</strong> ${blockData.id || 'N/A'}</p>
                <p><strong>区块名称:</strong> ${blockData.name || '未命名区块'}</p>
                <p><strong>坐标:</strong> (${blockData.x || 0}, ${blockData.y || 0})</p>
                <p><strong>面积:</strong> ${blockData.area || 0} 平方米</p>
                <p><strong>状态:</strong> ${blockData.status || '正常'}</p>
                <p><strong>最后更新:</strong> ${new Date().toLocaleString('zh-CN')}</p>
            `;
        } else if (blockInfoEl) {
            blockInfoEl.innerHTML = '<p>点击区块查看详细信息</p>';
        }
    }

    // 刷新数据
    refreshData() {
        console.log('刷新数据...');
        
        // 添加加载效果
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            const originalText = refreshBtn.textContent;
            refreshBtn.textContent = '刷新中...';
            refreshBtn.disabled = true;
            
            setTimeout(() => {
                this.updateStats();
                this.updateTime();
                
                // 模拟更新区块信息
                const mockBlockData = {
                    id: 'BLK_' + Math.floor(Math.random() * 1000),
                    name: '区块 ' + Math.floor(Math.random() * 100),
                    x: Math.floor(Math.random() * 1000),
                    y: Math.floor(Math.random() * 1000),
                    area: Math.floor(Math.random() * 5000) + 1000,
                    status: ['正常', '活跃', '维护中'][Math.floor(Math.random() * 3)]
                };
                
                this.updateBlockInfo(mockBlockData);
                
                refreshBtn.textContent = originalText;
                refreshBtn.disabled = false;
                
                this.showNotification('数据刷新完成', 'success');
            }, 1000);
        }
    }

    // 清除选择
    clearSelection() {
        console.log('清除选择...');
        this.blockInfo.selectedBlocks = 0;
        
        const selectedBlocksEl = document.getElementById('selected-blocks');
        if (selectedBlocksEl) {
            selectedBlocksEl.textContent = '0';
        }
        
        this.updateBlockInfo(null);
        this.showNotification('已清除所有选择', 'info');
    }

    // 导出数据
    exportData() {
        console.log('导出数据...');
        
        const data = {
            timestamp: new Date().toISOString(),
            stats: this.blockInfo,
            exportedBy: 'Smart Center 控制面板'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `smart_center_data_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        this.showNotification('数据导出完成', 'success');
    }

    // 重置全部
    resetAll() {
        console.log('重置全部...');
        
        if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
            this.blockInfo = {
                selectedBlock: null,
                totalBlocks: 0,
                selectedBlocks: 0,
                activeBlocks: 0
            };
            
            this.updateStats();
            this.updateBlockInfo(null);
            this.showNotification('所有数据已重置', 'warning');
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        // 设置背景颜色
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 开始数据更新循环
    startDataUpdate() {
        // 每30秒更新一次时间
        setInterval(() => {
            this.updateTime();
        }, 30000);
        
        // 每5分钟更新一次统计数据
        setInterval(() => {
            this.updateStats();
        }, 300000);
    }

    // 模拟接收来自主页面的数据
    receiveDataFromMain(data) {
        console.log('接收到主页面数据:', data);
        
        if (data.blockInfo) {
            this.updateBlockInfo(data.blockInfo);
        }
        
        if (data.stats) {
            this.blockInfo = { ...this.blockInfo, ...data.stats };
            this.updateStats();
        }
    }
}

// 页面加载完成后初始化控制面板
document.addEventListener('DOMContentLoaded', () => {
    console.log('控制面板页面加载完成');
    window.controlPanel = new ControlPanel();
    
    // 模拟一些初始数据
    setTimeout(() => {
        window.controlPanel.refreshData();
    }, 1000);
});

// 监听来自其他窗口的消息（用于跨页面通信）
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SMART_CENTER_DATA') {
        if (window.controlPanel) {
            window.controlPanel.receiveDataFromMain(event.data.payload);
        }
    }
});

// 导出控制面板实例供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ControlPanel;
}