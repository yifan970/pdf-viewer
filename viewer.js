// 初始化PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const container = document.getElementById('pdf-container');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');

// 配置参数
const config = {
    pdfUrl: './19140162.pdf',
    scale: 1.5,
    currentPage: 1,
    totalPages: 0,
    isRendering: false,
    pdfDoc: null
};

// 加载PDF文档
const loadPDF = async () => {
    try {
        // 只加载一次PDF文档
        if (!config.pdfDoc) {
            const loadingTask = pdfjsLib.getDocument(config.pdfUrl);
            config.pdfDoc = await loadingTask.promise;
            config.totalPages = config.pdfDoc.numPages;
        }
        
        renderPage();
        setupEventListeners();
    } catch (err) {
        console.error('PDF加载失败:', err);
        alert('无法加载PDF文件，请检查文件名或路径');
    }
};

// 渲染当前页面
const renderPage = async () => {
    if (config.isRendering || !config.pdfDoc) return;
    config.isRendering = true;
    
    try {
        const page = await config.pdfDoc.getPage(config.currentPage);
        const viewport = page.getViewport({ scale: config.scale });
        
        // 设置canvas尺寸
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // 清除上一页内容
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 渲染PDF页面
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        // 调整容器尺寸
        container.style.height = `${canvas.height}px`;
        container.style.width = `${canvas.width}px`;
    } catch (err) {
        console.error('页面渲染失败:', err);
    } finally {
        config.isRendering = false;
    }
};

// 事件监听设置
const setupEventListeners = () => {
    // 键盘翻页
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToPrevPage();
        if (e.key === 'ArrowRight') goToNextPage();
    });
    
    // 触摸滑动翻页
    let touchStartX = 0;
    let touchStartTime = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        const timeDiff = Date.now() - touchStartTime;
        
        // 快速滑动检测 (300ms内滑动超过50px)
        if (Math.abs(diffX) > 50 && timeDiff < 300) {
            if (diffX > 0) goToNextPage();
            else goToPrevPage();
        }
    }, { passive: true });
};

// 翻页功能
const goToPrevPage = () => {
    if (config.currentPage > 1) {
        config.currentPage--;
        renderPage();
    }
};

const goToNextPage = () => {
    if (config.currentPage < config.totalPages) {
        config.currentPage++;
        renderPage();
    }
};

// 初始化
window.onload = loadPDF;