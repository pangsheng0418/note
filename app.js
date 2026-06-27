// Data Management System
class ExpenseManager {
    constructor() {
        this.records = JSON.parse(localStorage.getItem('expense_records')) || [];
        this.budget = parseInt(localStorage.getItem('expense_budget')) || 0;
    }

    generateMockData() {
        const today = new Date();
        const formatDate = (daysOffset) => {
            const d = new Date();
            d.setDate(today.getDate() - daysOffset);
            return d.toISOString().split('T')[0];
        };

        this.records = [
            { id: 'mock-1', date: formatDate(0), item: '美味漢堡加可樂', category: '食', amount: 150 },
            { id: 'mock-2', date: formatDate(1), item: '捷運乘車加值', category: '行', amount: 200 },
            { id: 'mock-3', date: formatDate(2), item: '購入夏天棉質短T', category: '衣', amount: 790 },
            { id: 'mock-4', date: formatDate(3), item: '週末院線電影票', category: '樂', amount: 330 },
            { id: 'mock-5', date: formatDate(4), item: '自來水費繳納', category: '住', amount: 480 },
            { id: 'mock-6', date: formatDate(5), item: '線上專業程式課程', category: '育', amount: 1200 },
            { id: 'mock-7', date: formatDate(6), item: '星巴克大杯拿鐵', category: '食', amount: 145 },
            { id: 'mock-8', date: formatDate(6), item: '租屋處寬頻網路費', category: '住', amount: 850 },
        ];
        this.save();
    }

    addRecord(date, item, category, amount) {
        const newRecord = {
            id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            date,
            item,
            category,
            amount: parseFloat(amount)
        };
        this.records.unshift(newRecord); // Add to the top
        this.save();
        return newRecord;
    }

    deleteRecord(id) {
        this.records = this.records.filter(record => record.id !== id);
        this.save();
    }

    save() {
        localStorage.setItem('expense_records', JSON.stringify(this.records));
    }

    setBudget(amount) {
        this.budget = parseInt(amount);
        localStorage.setItem('expense_budget', this.budget);
    }

    getStats() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        
        let monthTotal = 0;
        let todayTotal = 0;
        
        const todayStr = now.toISOString().split('T')[0];
        
        this.records.forEach(r => {
            const rDate = new Date(r.date);
            // Monthly total check
            if (rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
                monthTotal += r.amount;
            }
            // Today total check
            if (r.date === todayStr) {
                todayTotal += r.amount;
            }
        });

        // Daily average for the current month
        const daysInMonthPassed = now.getDate();
        const dailyAvg = daysInMonthPassed > 0 ? (monthTotal / daysInMonthPassed) : 0;

        return {
            monthTotal,
            todayTotal,
            dailyAvg: Math.round(dailyAvg),
            budgetPercent: this.budget > 0 ? Math.min(100, Math.round((monthTotal / this.budget) * 100)) : 0,
            budgetRemaining: this.budget - monthTotal
        };
    }

    getCategoryBreakdown() {
        const categories = { '食': 0, '衣': 0, '住': 0, '行': 0, '育': 0, '樂': 0, '其他': 0 };
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        this.records.forEach(r => {
            const rDate = new Date(r.date);
            if (rDate.getFullYear() === currentYear && rDate.getMonth() === currentMonth) {
                if (categories[r.category] !== undefined) {
                    categories[r.category] += r.amount;
                } else {
                    categories['其他'] += r.amount;
                }
            }
        });

        return Object.keys(categories).map(cat => ({
            category: cat,
            amount: categories[cat]
        })).filter(item => item.amount > 0);
    }

    getWeeklyTrend() {
        const trend = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
            
            const total = this.records
                .filter(r => r.date === dateStr)
                .reduce((sum, r) => sum + r.amount, 0);
                
            trend.push({
                dateStr,
                label: dateLabel,
                amount: total
            });
        }
        return trend;
    }
}

// Global Category Colors Palette matching style.css
const categoryColors = {
    '食': '#00f2fe',    // cyan
    '衣': '#a855f7',    // purple
    '住': '#f59e0b',    // amber
    '行': '#3b82f6',    // blue
    '育': '#10b981',    // emerald
    '樂': '#f43f5e',    // pink
    '其他': '#94a3b8'   // slate
};

// Chinese text numbers parsing
function parseChineseNumber(str) {
    const numMap = {
        '零': 0, '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    };
    const unitMap = {
        '十': 10, '百': 100, '千': 1000, '萬': 10000
    };
    
    // Remove formatting characters (like commas in digits)
    let clean = str.replace(/,/g, '');
    
    // Check if it's purely a standard number (e.g. 1500)
    if (/^\d+(\.\d+)?$/.test(clean)) {
        return parseFloat(clean);
    }
    
    // Clean string: keep only Chinese numerals and units and standard digits
    clean = clean.replace(/[^\u4e00-\u9fa50-9]/g, '');
    
    let total = 0;
    let temp = 0;
    let lastUnit = 1;
    
    for (let i = 0; i < clean.length; i++) {
        let char = clean[i];
        if (numMap[char] !== undefined) {
            let val = numMap[char];
            temp = val;
        } else if (unitMap[char] !== undefined) {
            let unit = unitMap[char];
            if (temp === 0 && unit === 10) temp = 1; // 十 -> 10, 
            
            if (unit >= 10000) {
                total = (total + temp) * unit;
                temp = 0;
            } else {
                total += temp * unit;
                temp = 0;
            }
            lastUnit = unit;
        }
    }
    total += temp;
    
    // Colloquial shortcut handling: e.g., "兩千五" -> "兩千" + "五(百)"
    if (clean.length >= 2) {
        let lastChar = clean[clean.length - 1];
        let secondLastChar = clean[clean.length - 2];
        if (numMap[lastChar] !== undefined && numMap[lastChar] !== 0 && unitMap[secondLastChar] !== undefined) {
            let prevUnit = unitMap[secondLastChar];
            let implicitUnit = prevUnit / 10;
            if (implicitUnit >= 1) {
                total += numMap[lastChar] * implicitUnit - numMap[lastChar];
            }
        }
    }
    
    return total;
}

// Main NLP Parser function
function parseExpense(text) {
    // 1. Keyword mapping for Categories
    const categoryKeywords = {
        '食': ['吃', '喝', '餐', '飯', '麵', '早餐', '午餐', '晚餐', '宵夜', '飲料', '咖啡', '星巴克', '漢堡', '牛排', '超市', '買菜', '火鍋', '點心', '零食'],
        '衣': ['衣', '鞋', '褲', '外套', '裙', '襪', '帽', '飾品', '買衣服', '襯衫', '服飾'],
        '住': ['房租', '水電', '瓦斯', '裝潢', '日用品', '衛生紙', '家具', '垃圾袋', '房貸', '寬頻', '管理費', '清潔'],
        '行': ['車', '捷運', '公車', '高鐵', '火車', '計程車', '加油', '汽油', '機車', '悠遊卡', '加值', 'Uber', '機票', '高架', '停車'],
        '育': ['書', '課程', '學費', '雜誌', '文具', '補習', '演講', '考試', '軟體', '訂閱', '訂閱費'],
        '樂': ['電影', '遊戲', 'KTV', '唱歌', '桌遊', '門票', '展覽', '按摩', '出國', '旅遊', '渡假', '民宿', '飯店', '玩具', '夜店']
    };

    let amount = 0;
    let description = '';
    let category = '其他';

    // 2. Extract digits / Chinese numbers from text
    // Match patterns like: "150元", "兩百塊", "花了三百五十元", "350"
    // Regex finds digit sequences or Chinese numeral blocks
    const numberRegex = /([0-9,.]+|[一二兩三四五六七八九十百千萬]+)\s*(?:元|塊|塊錢|元台幣|NTD)?/gi;
    
    let match;
    let foundAmountMatches = [];
    
    while ((match = numberRegex.exec(text)) !== null) {
        const rawNumStr = match[1];
        const parsedNum = parseChineseNumber(rawNumStr);
        if (parsedNum > 0) {
            foundAmountMatches.push({
                index: match.index,
                text: match[0],
                amount: parsedNum
            });
        }
    }
    
    // Choose the most plausible amount (often the last number in the phrase, or the one followed by currency terms)
    if (foundAmountMatches.length > 0) {
        // Sort to favor numbers followed by currency indicators, or just take the largest/last
        // Here we take the last number as it's typically the amount at the end: "吃午餐花了 150"
        const selectedMatch = foundAmountMatches[foundAmountMatches.length - 1];
        amount = selectedMatch.amount;
        
        // The rest of the text is likely the description
        // Remove the amount text and clean up keywords like "花了", "買了", "共", "計"
        description = text.replace(selectedMatch.text, '');
    } else {
        description = text;
    }

    // Clean up description
    description = description.replace(/(?:今天|昨天|花了|共|計|買了|一共|支出|記帳|紀錄|消費)/g, '').trim();
    if (description === '') {
        description = '日常支出';
    }

    // 3. Category matching
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                category = cat;
                break;
            }
        }
        if (category !== '其他') break;
    }

    return {
        amount,
        description,
        category,
        rawText: text
    };
}

// App Controller & View Renderer
class App {
    constructor() {
        this.manager = new ExpenseManager();
        this.recognition = null;
        this.isRecording = false;
        
        // Dom References
        this.dom = {
            btnMic: document.getElementById('btn-mic'),
            micWave: document.getElementById('mic-wave'),
            voiceStatus: document.getElementById('voice-status'),
            voiceIndicator: document.getElementById('voice-indicator'),
            transcriptText: document.getElementById('transcript-text'),
            transcriptBox: document.getElementById('transcript-box'),
            textParseForm: document.getElementById('text-parse-form'),
            manualTextInput: document.getElementById('manual-text-input'),
            
            // Stats
            statMonthTotal: document.getElementById('stat-month-total'),
            statTodayTotal: document.getElementById('stat-today-total'),
            statDailyAvg: document.getElementById('stat-daily-avg'),
            
            // Budget
            budgetSpent: document.getElementById('budget-spent'),
            budgetTotal: document.getElementById('budget-total'),
            budgetProgress: document.getElementById('budget-progress'),
            budgetStatusText: document.getElementById('budget-status-text'),
            btnEditBudget: document.getElementById('btn-edit-budget'),
            budgetModal: document.getElementById('budget-modal'),
            budgetSettingsForm: document.getElementById('budget-settings-form'),
            inputBudgetAmount: document.getElementById('input-budget-amount'),
            btnBudgetCancel: document.getElementById('btn-budget-cancel'),
            btnCloseBudgetModal: document.getElementById('btn-close-budget-modal'),
            
            // Modal Confirmation
            confirmModal: document.getElementById('confirm-modal'),
            recordConfirmForm: document.getElementById('record-confirm-form'),
            modalDate: document.getElementById('modal-date'),
            modalItem: document.getElementById('modal-item'),
            modalCategory: document.getElementById('modal-category'),
            modalAmount: document.getElementById('modal-amount'),
            rawTranscriptFeedback: document.getElementById('raw-transcript-feedback'),
            btnModalCancel: document.getElementById('btn-modal-cancel'),
            btnCloseModal: document.getElementById('btn-close-modal'),
            
            // Records List
            recordsList: document.getElementById('records-list'),
            emptyState: document.getElementById('empty-state'),
            searchInput: document.getElementById('search-input'),
            categoryFilter: document.getElementById('category-filter'),
            
            // SVG Wrappers
            pieChartWrapper: document.getElementById('pie-chart-wrapper'),
            pieLegend: document.getElementById('pie-legend'),
            trendChartWrapper: document.getElementById('trend-chart-wrapper')
        };

        this.initSpeechRecognition();
        this.bindEvents();
        this.renderAll();
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this.dom.voiceStatus.textContent = '瀏覽器不支援語音功能';
            this.dom.voiceIndicator.style.background = 'rgba(244, 63, 94, 0.05)';
            this.dom.voiceIndicator.style.color = '#f43f5e';
            this.dom.btnMic.style.opacity = '0.5';
            this.dom.btnMic.style.cursor = 'not-allowed';
            this.dom.btnMic.title = '您的瀏覽器不支持 Speech Recognition API，請手動輸入文字';
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-TW';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        this.recognition.onstart = () => {
            this.isRecording = true;
            this.dom.btnMic.classList.add('listening');
            this.dom.voiceIndicator.classList.add('recording');
            this.dom.voiceStatus.textContent = '正在傾聽中...';
            this.dom.transcriptText.textContent = '正在聆聽您的聲音...';
            this.dom.transcriptBox.classList.add('active');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            this.dom.transcriptText.innerHTML = currentText;
            this.dom.transcriptText.classList.remove('placeholder-text');
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopRecording();
            
            if (event.error === 'not-allowed') {
                this.dom.voiceStatus.textContent = '麥克風使用權限遭拒';
                this.dom.transcriptText.textContent = '請啟用麥克風存取權限後再試。';
            } else {
                this.dom.voiceStatus.textContent = '語音辨識出錯';
                this.dom.transcriptText.textContent = '出錯了：' + event.error + '。請再試一次。';
            }
        };

        this.recognition.onend = () => {
            if (!this.isRecording) return; // already handled
            
            const transcript = this.dom.transcriptText.textContent;
            this.stopRecording();
            
            if (transcript && transcript !== '正在聆聽您的聲音...' && transcript !== '語音辨識內容將會即時顯示在此處...') {
                this.handleParsedTextInput(transcript);
            } else {
                this.dom.voiceStatus.textContent = '未辨識到聲音';
                this.dom.transcriptText.textContent = '請點選麥克風，重新說出消費明細。';
            }
        };
    }

    startRecording() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
        } catch (e) {
            console.error(e);
        }
    }

    stopRecording() {
        this.isRecording = false;
        this.dom.btnMic.classList.remove('listening');
        this.dom.voiceIndicator.classList.remove('recording');
        this.dom.voiceStatus.textContent = '準備就緒';
        this.dom.transcriptBox.classList.remove('active');
        try {
            this.recognition.stop();
        } catch (e) {}
    }

    bindEvents() {
        // Microphone interaction
        this.dom.btnMic.addEventListener('click', () => {
            if (!this.recognition) return;
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Clickable tips to trigger simulation
        document.querySelectorAll('.clickable-tip').forEach(tip => {
            tip.addEventListener('click', (e) => {
                const text = e.target.textContent;
                this.dom.manualTextInput.value = text;
                this.handleParsedTextInput(text);
            });
        });

        // Text input processing
        this.dom.textParseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = this.dom.manualTextInput.value.trim();
            if (text) {
                this.handleParsedTextInput(text);
                this.dom.manualTextInput.value = '';
            }
        });

        // Search & Filter change
        this.dom.searchInput.addEventListener('input', () => this.renderRecordsList());
        this.dom.categoryFilter.addEventListener('change', () => this.renderRecordsList());

        // Confirmation Modal actions
        this.dom.btnCloseModal.addEventListener('click', () => this.closeConfirmModal());
        this.dom.btnModalCancel.addEventListener('click', () => this.closeConfirmModal());
        this.dom.recordConfirmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = this.dom.modalDate.value;
            const item = this.dom.modalItem.value.trim();
            const category = this.dom.modalCategory.value;
            const amount = parseFloat(this.dom.modalAmount.value);

            if (date && item && category && amount > 0) {
                this.manager.addRecord(date, item, category, amount);
                this.closeConfirmModal();
                this.renderAll();
                
                // Show notification glow or animation in list
                const firstRow = this.dom.recordsList.firstElementChild;
                if (firstRow) {
                    firstRow.style.background = 'rgba(0, 242, 254, 0.15)';
                    setTimeout(() => {
                        firstRow.style.background = '';
                    }, 1000);
                }
            }
        });

        // Budget Settings actions
        this.dom.btnEditBudget.addEventListener('click', () => {
            this.dom.inputBudgetAmount.value = this.manager.budget;
            this.dom.budgetModal.classList.add('active');
        });
        this.dom.btnCloseBudgetModal.addEventListener('click', () => this.dom.budgetModal.classList.remove('active'));
        this.dom.btnBudgetCancel.addEventListener('click', () => this.dom.budgetModal.classList.remove('active'));
        this.dom.budgetSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newBudget = parseInt(this.dom.inputBudgetAmount.value);
            if (newBudget >= 100) {
                this.manager.setBudget(newBudget);
                this.dom.budgetModal.classList.remove('active');
                this.renderAll();
            }
        });
    }

    handleParsedTextInput(text) {
        const parsed = parseExpense(text);
        
        // Prefill modal
        const today = new Date().toISOString().split('T')[0];
        this.dom.modalDate.value = today;
        this.dom.modalItem.value = parsed.description;
        this.dom.modalCategory.value = parsed.category;
        this.dom.modalAmount.value = parsed.amount > 0 ? parsed.amount : '';
        
        // Set raw feedback
        this.dom.rawTranscriptFeedback.textContent = `「${text}」`;
        
        // Open modal
        this.dom.confirmModal.classList.add('active');
        
        // Auto-focus amount field if it failed to extract, or description
        setTimeout(() => {
            if (!parsed.amount) {
                this.dom.modalAmount.focus();
            } else {
                this.dom.modalItem.focus();
            }
        }, 100);
    }

    closeConfirmModal() {
        this.dom.confirmModal.classList.remove('active');
    }

    // Main Renderer
    renderAll() {
        this.renderStats();
        this.renderBudget();
        this.renderRecordsList();
        this.renderCharts();
    }

    renderStats() {
        const stats = this.manager.getStats();
        
        // Animate counter values
        this.animateCounter(this.dom.statMonthTotal, stats.monthTotal);
        this.animateCounter(this.dom.statTodayTotal, stats.todayTotal);
        this.animateCounter(this.dom.statDailyAvg, stats.dailyAvg);
    }

    animateCounter(element, targetVal) {
        const duration = 800; // ms
        const startVal = parseInt(element.textContent.replace(/[$,]/g, '')) || 0;
        const startTime = performance.now();
        
        const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentVal = Math.round(startVal + (targetVal - startVal) * easeProgress);
            element.textContent = `$${currentVal.toLocaleString()}`;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    }

    renderBudget() {
        const stats = this.manager.getStats();
        this.dom.budgetSpent.textContent = `$${stats.monthTotal.toLocaleString()}`;
        this.dom.budgetTotal.textContent = `$${this.manager.budget.toLocaleString()}`;
        
        // Update bar percentage width
        this.dom.budgetProgress.style.width = `${stats.budgetPercent}%`;
        
        // Dynamic colors for warnings
        if (this.manager.budget === 0) {
            this.dom.budgetProgress.style.background = 'rgba(255,255,255,0.05)';
            this.dom.budgetProgress.style.boxShadow = 'none';
            this.dom.budgetStatusText.innerHTML = `<span style="color: var(--text-dim);">點選右上角圖示設定每月預算</span>`;
        } else if (stats.budgetPercent >= 100) {
            this.dom.budgetProgress.style.background = 'var(--accent-pink)';
            this.dom.budgetProgress.style.boxShadow = '0 0 10px rgba(244, 63, 94, 0.4)';
            this.dom.budgetStatusText.innerHTML = `<span style="color: var(--accent-pink); font-weight: 600;">預算已超支 $${Math.abs(stats.budgetRemaining).toLocaleString()} (超額 ${stats.budgetPercent - 100}%)</span>`;
        } else if (stats.budgetPercent >= 80) {
            this.dom.budgetProgress.style.background = 'var(--accent-amber)';
            this.dom.budgetProgress.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.4)';
            this.dom.budgetStatusText.textContent = `剩餘 $${stats.budgetRemaining.toLocaleString()} (${100 - stats.budgetPercent}%) — 預算即將告罄！`;
        } else {
            this.dom.budgetProgress.style.background = 'var(--primary-gradient)';
            this.dom.budgetProgress.style.boxShadow = 'none';
            this.dom.budgetStatusText.textContent = `剩餘 $${stats.budgetRemaining.toLocaleString()} (${100 - stats.budgetPercent}%)`;
        }
    }

    renderRecordsList() {
        const searchQuery = this.dom.searchInput.value.toLowerCase().trim();
        const selectedCat = this.dom.categoryFilter.value;
        
        // Filter records
        const filtered = this.manager.records.filter(r => {
            const matchesSearch = r.item.toLowerCase().includes(searchQuery) || r.amount.toString().includes(searchQuery);
            const matchesCategory = selectedCat === 'all' || r.category === selectedCat;
            return matchesSearch && matchesCategory;
        });

        // Clear list
        this.dom.recordsList.innerHTML = '';

        if (filtered.length === 0) {
            this.dom.emptyState.style.display = 'flex';
        } else {
            this.dom.emptyState.style.display = 'none';
            
            filtered.forEach(r => {
                const row = document.createElement('div');
                row.className = 'record-row';
                row.dataset.id = r.id;
                
                row.innerHTML = `
                    <span class="col-date">${r.date}</span>
                    <span class="col-item" title="${r.item}">${r.item}</span>
                    <span class="col-category">
                        <span class="category-badge badge-${r.category}">${r.category}</span>
                    </span>
                    <span class="col-amount">$${r.amount.toLocaleString()}</span>
                    <span class="col-actions">
                        <button class="btn-delete" title="刪除紀錄">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </span>
                `;

                // Add delete listener
                row.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Fade out animation
                    row.style.transform = 'translateX(50px)';
                    row.style.opacity = '0';
                    setTimeout(() => {
                        this.manager.deleteRecord(r.id);
                        this.renderAll();
                    }, 300);
                });

                this.dom.recordsList.appendChild(row);
            });
        }
    }

    renderCharts() {
        this.renderPieChart();
        this.renderTrendChart();
    }

    renderPieChart() {
        const data = this.manager.getCategoryBreakdown();
        const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
        
        if (totalAmount === 0) {
            this.dom.pieChartWrapper.innerHTML = `
                <div style="font-size:0.8rem; color:var(--text-dim); text-align:center;">
                    本月尚無數據，無法生成圓餅圖。
                </div>
            `;
            this.dom.pieLegend.innerHTML = '';
            return;
        }

        // 1. Render Legend
        this.dom.pieLegend.innerHTML = '';
        data.sort((a, b) => b.amount - a.amount).forEach(item => {
            const percent = Math.round((item.amount / totalAmount) * 100);
            const color = categoryColors[item.category] || categoryColors['其他'];
            
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-left">
                    <span class="legend-dot" style="background-color: ${color}"></span>
                    <span class="legend-label">${item.category}</span>
                </div>
                <span class="legend-value">$${item.amount.toLocaleString()} (${percent}%)</span>
            `;
            this.dom.pieLegend.appendChild(legendItem);
        });

        // 2. Build Interactive SVG Pie Chart
        let currentAngle = 0;
        const radius = 65;
        const cx = 100;
        const cy = 100;
        
        let slicesHTML = '';

        data.forEach(item => {
            const angle = (item.amount / totalAmount) * 360;
            const color = categoryColors[item.category] || categoryColors['其他'];
            
            // Calculate slice path
            const x1 = cx + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
            const y1 = cy + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
            
            currentAngle += angle;
            
            const x2 = cx + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
            const y2 = cy + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            // Slice path d attribute
            const d = [
                `M ${cx} ${cy}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
            ].join(' ');

            slicesHTML += `
                <path class="chart-pie-slice" d="${d}" fill="${color}" style="--slice-color: ${color}" data-cat="${item.category}" data-amount="${item.amount}">
                    <title>${item.category}: $${item.amount.toLocaleString()} (${Math.round(item.amount / totalAmount * 100)}%)</title>
                </path>
            `;
        });

        const svg = `
            <svg viewBox="0 0 200 200" width="100%" height="100%">
                <circle cx="${cx}" cy="${cy}" r="${radius + 5}" fill="rgba(0,0,0,0.1)"></circle>
                <g>${slicesHTML}</g>
                <!-- Inner hole for Donut Style -->
                <circle cx="${cx}" cy="${cy}" r="45" fill="#0c1221"></circle>
                <!-- Center text -->
                <g class="chart-pie-center-text">
                    <text x="${cx}" y="${cy - 4}" font-size="10" fill="var(--text-muted)">本月支出</text>
                    <text x="${cx}" y="${cy + 12}" font-size="14" font-weight="700" fill="#fff" id="pie-center-val">$${totalAmount.toLocaleString()}</text>
                </g>
            </svg>
        `;

        this.dom.pieChartWrapper.innerHTML = svg;

        // Interactive hover effects to change center text
        const slices = this.dom.pieChartWrapper.querySelectorAll('.chart-pie-slice');
        const centerValText = this.dom.pieChartWrapper.querySelector('#pie-center-val');
        
        slices.forEach(slice => {
            slice.addEventListener('mouseenter', (e) => {
                const cat = e.target.getAttribute('data-cat');
                const amt = parseInt(e.target.getAttribute('data-amount'));
                centerValText.textContent = `$${amt.toLocaleString()}`;
                centerValText.previousElementSibling.textContent = cat;
                centerValText.setAttribute('fill', categoryColors[cat]);
            });

            slice.addEventListener('mouseleave', () => {
                centerValText.textContent = `$${totalAmount.toLocaleString()}`;
                centerValText.previousElementSibling.textContent = '本月支出';
                centerValText.setAttribute('fill', '#fff');
            });
        });
    }

    renderTrendChart() {
        const trendData = this.manager.getWeeklyTrend();
        const maxVal = Math.max(...trendData.map(t => t.amount), 100); // Avoid division by zero
        
        // SVG dimensions
        const width = 360;
        const height = 180;
        const padding = { top: 20, right: 20, bottom: 25, left: 35 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Calculate points
        const points = trendData.map((d, index) => {
            const x = padding.left + (index / 6) * chartWidth;
            const y = padding.top + chartHeight - (d.amount / maxVal) * chartHeight;
            return { x, y, label: d.label, amount: d.amount };
        });

        // Build SVG path
        let pathD = '';
        let areaD = `M ${points[0].x} ${padding.top + chartHeight} `;
        
        points.forEach((p, index) => {
            if (index === 0) {
                pathD = `M ${p.x} ${p.y} `;
            } else {
                // Smooth bezier curve logic or straight lines
                // Straight lines are simpler and very modern
                pathD += `L ${p.x} ${p.y} `;
            }
            areaD += `L ${p.x} ${p.y} `;
        });

        areaD += `L ${points[points.length - 1].x} ${padding.top + chartHeight} Z`;

        // Render Y-Axis Guides
        let yGuides = '';
        const step = 3;
        for (let i = 0; i <= step; i++) {
            const y = padding.top + (i / step) * chartHeight;
            const val = Math.round(maxVal - (i / step) * maxVal);
            yGuides += `
                <line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke-dasharray="2 2"></line>
                <text class="chart-axis-text" x="${padding.left - 8}" y="${y + 3}" text-anchor="end">${val.toLocaleString()}</text>
            `;
        }

        // Render X-Axis labels & points
        let pointsHTML = '';
        let xLabelsHTML = '';

        points.forEach((p) => {
            pointsHTML += `
                <g class="chart-point-group">
                    <circle class="chart-point" cx="${p.x}" cy="${p.y}" r="4.5" fill="#00f2fe" stroke="#0c1221" stroke-width="2" data-amt="${p.amount}" data-date="${p.label}">
                        <title>${p.label}: $${p.amount.toLocaleString()}</title>
                    </circle>
                </g>
            `;
            
            xLabelsHTML += `
                <text class="chart-axis-text" x="${p.x}" y="${height - 8}" text-anchor="middle">${p.label}</text>
            `;
        });

        const svg = `
            <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">
                <!-- Grid Lines & Y Axis Labels -->
                <g>${yGuides}</g>
                
                <!-- Chart Area Gradient Fill -->
                <defs>
                    <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.25"></stop>
                        <stop offset="100%" stop-color="#00f2fe" stop-opacity="0.00"></stop>
                    </linearGradient>
                </defs>
                <path d="${areaD}" fill="url(#area-grad)"></path>

                <!-- Trend Line Path -->
                <path class="chart-line-path" d="${pathD}" fill="none" stroke="url(#line-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
                <defs>
                    <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#4facfe"></stop>
                        <stop offset="100%" stop-color="#00f2fe"></stop>
                    </linearGradient>
                </defs>

                <!-- X Axis Baseline -->
                <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="rgba(255,255,255,0.06)"></line>

                <!-- X Axis Labels -->
                <g>${xLabelsHTML}</g>

                <!-- Interactive Data points -->
                <g>${pointsHTML}</g>
            </svg>
        `;

        this.dom.trendChartWrapper.innerHTML = svg;
    }
}

// Start App when DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
