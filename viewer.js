// 配置PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.js';

// 获取DOM元素
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');

// 初始化变量
let pdfDoc = null;
let currentPage = 1;
let pageRendering = false;
let pageNumPending = null;

// 渲染页面函数
function renderPage(pageNum) {
    pageRendering = true;
    
    pdfDoc.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(() => {
            pageRendering = false;
            currentPage = pageNum;
            currentPageSpan.textContent = currentPage;
            
            // 更新按钮状态
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= pdfDoc.numPages;
            
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

// 队列渲染（处理快速翻页）
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// 上一页
prevBtn.addEventListener('click', () => {
    if (currentPage <= 1) return;
    queueRenderPage(currentPage - 1);
});

// 下一页
nextBtn.addEventListener('click', () => {
    if (currentPage >= pdfDoc.numPages) return;
    queueRenderPage(currentPage + 1);
});

// 加载PDF文件
pdfjsLib.getDocument('19140162.pdf').promise.then(pdf => {
    pdfDoc = pdf;
    totalPagesSpan.textContent = pdf.numPages;
    
    // 初始渲染第一页
    renderPage(currentPage);
}).catch(err => {
    console.error('PDF加载错误:', err);
    alert('无法加载PDF文件，请检查控制台获取详细信息');
});

// 添加键盘翻页支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
        queueRenderPage(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < pdfDoc?.numPages) {
        queueRenderPage(currentPage + 1);
    }
});