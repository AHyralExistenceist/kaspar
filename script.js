class Notebook {
    constructor() {
        this.currentPage = 1;
        this.pages = {};
        this.init();
    }

    init() {
        this.loadPages();
        this.setupEventListeners();
        this.renderPage();
    }

    setupEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
        
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        
        leftContent.addEventListener('input', () => this.saveCurrentPage());
        rightContent.addEventListener('input', () => this.saveCurrentPage());
        
        leftContent.addEventListener('blur', () => this.saveCurrentPage());
        rightContent.addEventListener('blur', () => this.saveCurrentPage());
    }


    saveCurrentPage() {
        const leftContent = document.getElementById('leftContent').innerHTML;
        const rightContent = document.getElementById('rightContent').innerHTML;
        
        this.pages[this.currentPage] = {
            left: leftContent,
            right: rightContent,
            date: new Date().toISOString()
        };
        
        localStorage.setItem('notebookPages', JSON.stringify(this.pages));
    }

    loadPages() {
        const saved = localStorage.getItem('notebookPages');
        if (saved) {
            this.pages = JSON.parse(saved);
        }
    }

    renderPage() {
        const pageData = this.pages[this.currentPage] || { left: '', right: '' };
        
        document.getElementById('leftContent').innerHTML = pageData.left || '';
        document.getElementById('rightContent').innerHTML = pageData.right || '';
        
        const leftPageNum = (this.currentPage - 1) * 2 + 1;
        const rightPageNum = (this.currentPage - 1) * 2 + 3;
        
        const leftPage = document.getElementById('leftPage');
        if (this.currentPage === 1) {
            leftPage.classList.add('torn');
        } else {
            leftPage.classList.remove('torn');
        }
        
        document.getElementById('pageNumber').textContent = leftPageNum;
        document.getElementById('pageNumberRight').textContent = rightPageNum;
        document.getElementById('pageInfo').textContent = `페이지 ${this.currentPage}`;
        
        document.getElementById('prevBtn').disabled = this.currentPage === 1;
        document.getElementById('nextBtn').disabled = rightPageNum >= 50;
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.saveCurrentPage();
            this.currentPage--;
            this.renderPage();
        }
    }

    nextPage() {
        const nextRightPageNum = this.currentPage * 2 + 3;
        if (nextRightPageNum <= 50) {
            this.saveCurrentPage();
            this.currentPage++;
            this.renderPage();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Notebook();
});

