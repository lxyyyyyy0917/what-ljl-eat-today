// 应用状态管理
class LunchApp {
    constructor() {
        this.foods = [];
        this.selectedEmoji = '🍱';
        this.init();
    }

    // 初始化应用
    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.render();
    }

    // 从本地存储加载数据
    loadFromStorage() {
        const stored = localStorage.getItem('lunchFoods');
        if (stored) {
            try {
                this.foods = JSON.parse(stored);
            } catch (e) {
                console.error('加载数据失败:', e);
                this.foods = [];
            }
        }
    }

    // 保存到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('lunchFoods', JSON.stringify(this.foods));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    }

    // 绑定事件
    bindEvents() {
        // 开始选择按钮
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startSelection());
        }

        // 再选一次按钮
        const rerollBtn = document.getElementById('rerollBtn');
        if (rerollBtn) {
            rerollBtn.addEventListener('click', () => this.startSelection());
        }

        // 添加按钮
        const addBtn = document.getElementById('addBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeAddModal());
        }

        // 确定按钮
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.addFood());
        }

        // 表情选择按钮
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.currentTarget.dataset.emoji;
                if (emoji) {
                    this.selectEmoji(emoji);
                }
            });
        });

        // 预设餐品按钮
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const food = e.currentTarget.dataset.food;
                const emoji = e.currentTarget.dataset.emoji;
                if (food && emoji) {
                    this.addPresetFood(food, emoji);
                }
            });
        });

        // 输入框回车事件
        const foodNameInput = document.getElementById('foodNameInput');
        if (foodNameInput) {
            foodNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addFood();
                }
            });
        }

        // 点击弹窗背景关闭
        const addModal = document.getElementById('addModal');
        if (addModal) {
            addModal.addEventListener('click', (e) => {
                if (e.target === addModal) {
                    this.closeAddModal();
                }
            });
        }
    }

    // 渲染餐品列表
    render() {
        const foodList = document.getElementById('foodList');
        const emptyState = document.getElementById('emptyState');
        
        if (!foodList || !emptyState) return;

        if (this.foods.length === 0) {
            foodList.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            foodList.innerHTML = this.foods.map((food, index) => `
                <div class="food-card" data-index="${index}">
                    <span class="emoji">${food.emoji}</span>
                    <span class="name">${food.name}</span>
                    <button class="delete-btn" data-index="${index}">✕</button>
                </div>
            `).join('');

            // 绑定删除按钮事件
            const deleteButtons = foodList.querySelectorAll('.delete-btn');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(e.currentTarget.dataset.index);
                    if (!isNaN(index)) {
                        this.deleteFood(index);
                    }
                });
            });
        }

        // 渲染转盘
        this.renderWheel();
    }

    // 渲染转盘
    renderWheel() {
        const wheelContainer = document.getElementById('wheelContainer');
        if (!wheelContainer) return;

        if (this.foods.length === 0) {
            wheelContainer.innerHTML = '<div class="text-center text-gray-500 py-8">请先添加餐品</div>';
            return;
        }

        const itemCount = this.foods.length;
        const anglePerItem = 360 / itemCount;
        
        // 生成渐变色
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        ];

        const wheelHTML = `
            <div class="wheel-pointer"></div>
            <div class="wheel" id="wheel">
                ${this.foods.map((food, index) => {
                    const rotation = anglePerItem * index;
                    const colorIndex = index % colors.length;
                    return `
                        <div class="wheel-item" style="
                            transform: rotate(${rotation}deg) skewY(${-90 + anglePerItem}deg);
                            background: ${colors[colorIndex]};
                        ">
                            <div style="transform: skewY(${90 - anglePerItem}deg) rotate(${anglePerItem / 2}deg);">
                                <span class="emoji">${food.emoji}</span>
                                <span class="name">${food.name}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
                <div class="wheel-center">🎯</div>
            </div>
        `;

        wheelContainer.innerHTML = wheelHTML;
    }

    // 开始选择
    startSelection() {
        if (this.foods.length === 0) {
            this.showToast('请先添加一些餐品哦！');
            return;
        }

        const wheel = document.getElementById('wheel');
        const startBtn = document.getElementById('startBtn');
        const resultSection = document.getElementById('resultSection');
        const resultText = document.getElementById('resultText');
        const resultEmoji = document.getElementById('resultEmoji');

        if (!wheel || !startBtn || !resultSection || !resultText || !resultEmoji) return;

        // 禁用按钮
        startBtn.disabled = true;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');

        // 随机选择
        const randomIndex = Math.floor(Math.random() * this.foods.length);
        const selectedFood = this.foods[randomIndex];

        // 计算旋转角度
        const itemCount = this.foods.length;
        const anglePerItem = 360 / itemCount;
        const baseRotation = 360 * 5; // 至少转5圈
        const targetAngle = anglePerItem * randomIndex;
        const finalRotation = baseRotation + (360 - targetAngle) + (anglePerItem / 2);

        // 应用旋转动画
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;

        // 动画结束后显示结果
        setTimeout(() => {
            if (selectedFood) {
                resultText.textContent = selectedFood.name;
                resultEmoji.textContent = selectedFood.emoji;
                
                // 显示结果
                resultSection.classList.remove('hidden');
                resultSection.classList.add('show');

                // 添加抖动效果
                setTimeout(() => {
                    resultEmoji.classList.add('shaking');
                    setTimeout(() => {
                        resultEmoji.classList.remove('shaking');
                    }, 500);
                }, 100);

                // 重置转盘
                setTimeout(() => {
                    wheel.style.transition = 'none';
                    wheel.style.transform = 'rotate(0deg)';
                    startBtn.disabled = false;
                    startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }, 1000);
            }
        }, 4000);
    }

    // 打开添加弹窗
    openAddModal() {
        const modal = document.getElementById('addModal');
        const input = document.getElementById('foodNameInput');
        
        if (!modal || !input) return;

        modal.classList.remove('hidden');
        modal.classList.add('show');
        input.value = '';
        input.focus();
        
        // 重置表情选择
        this.selectEmoji('🍱');
    }

    // 关闭添加弹窗
    closeAddModal() {
        const modal = document.getElementById('addModal');
        if (!modal) return;

        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // 选择表情
    selectEmoji(emoji) {
        this.selectedEmoji = emoji;
        const selectedEmojiDisplay = document.getElementById('selectedEmoji');
        if (selectedEmojiDisplay) {
            selectedEmojiDisplay.textContent = emoji;
        }

        // 更新按钮选中状态
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            if (btn.dataset.emoji === emoji) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // 添加餐品
    addFood() {
        const input = document.getElementById('foodNameInput');
        if (!input) return;

        const name = input.value.trim();
        
        if (!name) {
            this.showToast('请输入餐品名称');
            return;
        }

        if (name.length > 10) {
            this.showToast('餐品名称不能超过10个字');
            return;
        }

        // 检查是否已存在
        const exists = this.foods.some(food => food.name === name);
        if (exists) {
            this.showToast('该餐品已存在');
            return;
        }

        // 添加到列表
        this.foods.push({
            name: name,
            emoji: this.selectedEmoji
        });

        this.saveToStorage();
        this.render();
        this.closeAddModal();
        this.showToast('添加成功！');
    }

    // 添加预设餐品
    addPresetFood(name, emoji) {
        // 检查是否已存在
        const exists = this.foods.some(food => food.name === name);
        if (exists) {
            this.showToast('该餐品已存在');
            return;
        }

        // 添加到列表
        this.foods.push({
            name: name,
            emoji: emoji
        });

        this.saveToStorage();
        this.render();
        this.showToast('添加成功！');
    }

    // 删除餐品
    deleteFood(index) {
        if (index < 0 || index >= this.foods.length) return;

        const food = this.foods[index];
        if (!food) return;

        if (confirm(`确定要删除"${food.name}"吗？`)) {
            this.foods.splice(index, 1);
            this.saveToStorage();
            this.render();
            this.showToast('删除成功');

            // 如果删除后结果区域显示的是被删除的餐品，隐藏结果区域
            const resultSection = document.getElementById('resultSection');
            const resultText = document.getElementById('resultText');
            const startSection = document.getElementById('startSection');
            
            if (resultSection && resultText && startSection) {
                if (resultText.textContent === food.name) {
                    resultSection.classList.add('hidden');
                    resultSection.classList.remove('show');
                    startSection.classList.remove('hidden');
                }
            }
        }
    }

    // 显示提示消息
    showToast(message) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        // 2秒后移除
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }
}

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LunchApp();
    });
} else {
    new LunchApp();
}