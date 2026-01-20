class Notebook {
    constructor() {
        this.currentPage = 1;
        this.pages = {};
        this.currentFont = 'Noto Serif KR';
        this.currentSize = '16px';
        this.init();
    }

    async init() {
        await this.loadPages();
        this.setupEventListeners();
        this.renderPage();
        setInterval(() => {
            this.saveAllPages();
        }, 3000);
        
        window.addEventListener('beforeunload', () => {
            this.saveAllPages();
        });
    }

    setupEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
        
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        
        leftContent.addEventListener('input', (e) => {
            this.handleInput(e, leftContent);
            this.saveAllPages();
        });
        rightContent.addEventListener('input', (e) => {
            this.handleInput(e, rightContent);
            this.saveAllPages();
        });
        
        leftContent.addEventListener('blur', () => this.saveAllPages());
        rightContent.addEventListener('blur', () => this.saveAllPages());
        
        leftContent.addEventListener('paste', (e) => this.handlePaste(e));
        rightContent.addEventListener('paste', (e) => this.handlePaste(e));
        
        leftContent.addEventListener('copy', (e) => this.handleCopy(e));
        rightContent.addEventListener('copy', (e) => this.handleCopy(e));
        
        leftContent.addEventListener('cut', (e) => this.handleCopy(e));
        rightContent.addEventListener('cut', (e) => this.handleCopy(e));
        
        leftContent.addEventListener('mouseup', () => {
            setTimeout(() => this.updateSavedSelection(), 0);
        });
        rightContent.addEventListener('mouseup', () => {
            setTimeout(() => this.updateSavedSelection(), 0);
        });
        
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const leftContent = document.getElementById('leftContent');
                const rightContent = document.getElementById('rightContent');
                const commonAncestor = range.commonAncestorContainer;
                if (leftContent.contains(commonAncestor) || rightContent.contains(commonAncestor)) {
                    if (!selection.isCollapsed) {
                        this.updateSavedSelection();
                    }
                }
            }
        });
        
        const fontSelect = document.getElementById('fontSelect');
        fontSelect.addEventListener('mousedown', (e) => {
            this.savedSelection = this.saveSelection();
        });
        fontSelect.addEventListener('focus', () => {
            this.savedSelection = this.saveSelection();
        });
        fontSelect.addEventListener('change', (e) => {
            const selectedFont = e.target.value;
            this.currentFont = selectedFont;
            setTimeout(() => {
                this.applyFontToSelection(selectedFont);
            }, 0);
        });
        
        const sizeSelect = document.getElementById('sizeSelect');
        sizeSelect.addEventListener('mousedown', (e) => {
            this.savedSelection = this.saveSelection();
        });
        sizeSelect.addEventListener('focus', () => {
            this.savedSelection = this.saveSelection();
        });
        this.currentSize = sizeSelect.value;
        sizeSelect.addEventListener('change', (e) => {
            const selectedSize = e.target.value;
            this.currentSize = selectedSize;
            setTimeout(() => {
                this.applySizeToSelection(selectedSize);
            }, 0);
        });
        
        document.getElementById('boldBtn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyStyleToSelection('bold');
        });
        document.getElementById('italicBtn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyStyleToSelection('italic');
        });
        document.getElementById('strikeBtn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.applyStyleToSelection('strikethrough');
        });
        
        document.getElementById('shareBtn').addEventListener('click', () => this.exportToExample());
    }
    
    handleInput(e, targetElement) {
        setTimeout(() => {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                return;
            }
            
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
                return;
            }
            
            const commonAncestor = range.commonAncestorContainer;
            if (!targetElement.contains(commonAncestor) && targetElement !== commonAncestor) {
                return;
            }
            
            let node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
                node = node.parentElement;
            }
            
            if (node && node !== targetElement) {
                const computedStyle = window.getComputedStyle(node);
                const currentFont = computedStyle.fontFamily;
                const currentSize = computedStyle.fontSize;
                
                if (!currentFont.includes(this.currentFont) || currentSize !== this.currentSize) {
                    return;
                }
            }
            
            const textNode = range.startContainer;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                const parent = textNode.parentElement;
                if (parent && parent !== targetElement) {
                    const computedStyle = window.getComputedStyle(parent);
                    const parentFont = computedStyle.fontFamily;
                    const parentSize = computedStyle.fontSize;
                    
                    if (parentFont.includes(this.currentFont) && parentSize === this.currentSize) {
                        return;
                    }
                }
                
                if (textNode.textContent && textNode.textContent.length > 0) {
                    const lastCharIndex = textNode.textContent.length - 1;
                    const lastChar = textNode.textContent[lastCharIndex];
                    
                    if (lastChar && lastChar.trim()) {
                        const span = document.createElement('span');
                        span.style.cssText = `font-family: "${this.currentFont}" !important; font-size: ${this.currentSize} !important;`;
                        
                        const textBefore = textNode.textContent.slice(0, lastCharIndex);
                        const textAfter = textNode.textContent.slice(lastCharIndex);
                        
                        if (textBefore) {
                            textNode.textContent = textBefore;
                        } else {
                            if (textNode.parentNode) {
                                textNode.parentNode.removeChild(textNode);
                            }
                        }
                        
                        span.textContent = textAfter;
                        if (textNode.parentNode) {
                            textNode.parentNode.insertBefore(span, textNode.nextSibling);
                        } else {
                            range.insertNode(span);
                        }
                        
                        const newRange = document.createRange();
                        newRange.setStartAfter(span);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            }
        }, 0);
    }
    
    handleCopy(e) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            if (selectedText) {
                e.clipboardData.setData('text/plain', selectedText);
                e.preventDefault();
            }
        }
    }
    
    handlePaste(e) {
        e.preventDefault();
        const selection = window.getSelection();
        
        if (selection.rangeCount === 0) {
            return;
        }
        
        const pasteData = (e.clipboardData || window.clipboardData).getData('text/plain');
        
        if (!pasteData) {
            return;
        }
        
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const textNode = document.createTextNode(pasteData);
        range.insertNode(textNode);
        
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        this.saveAllPages();
    }

    saveSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            return null;
        }
        const range = selection.getRangeAt(0);
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        const commonAncestor = range.commonAncestorContainer;
        if (!leftContent.contains(commonAncestor) && !rightContent.contains(commonAncestor) && commonAncestor !== leftContent && commonAncestor !== rightContent) {
            return null;
        }
        return {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
        };
    }
    
    updateSavedSelection() {
        const selection = this.saveSelection();
        if (selection) {
            this.savedSelection = selection;
        }
    }
    
    restoreSelection(savedSelection) {
        if (!savedSelection) return null;
        
        try {
            const range = document.createRange();
            range.setStart(savedSelection.startContainer, savedSelection.startOffset);
            range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            return range;
        } catch (e) {
            return null;
        }
    }
    
    async saveCurrentPage() {
        const leftContentEl = document.getElementById('leftContent');
        const rightContentEl = document.getElementById('rightContent');
        
        if (!leftContentEl || !rightContentEl) {
            return;
        }
        
        const leftContent = leftContentEl.innerHTML;
        const rightContent = rightContentEl.innerHTML;
        
        this.pages[this.currentPage] = {
            left: leftContent,
            right: rightContent,
            date: new Date().toISOString()
        };
        
        try {
            const response = await fetch('/api/pages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.pages)
            });
            
            if (!response.ok) {
                throw new Error('Server save failed');
            }
        } catch (error) {
            try {
                localStorage.setItem('notebook-pages', JSON.stringify(this.pages));
            } catch (localError) {
                console.error('Error saving pages:', localError);
            }
        }
    }
    
    saveAllPages() {
        const leftContentEl = document.getElementById('leftContent');
        const rightContentEl = document.getElementById('rightContent');
        
        if (!leftContentEl || !rightContentEl) {
            return;
        }
        
        const leftContent = leftContentEl.innerHTML;
        const rightContent = rightContentEl.innerHTML;
        
        this.pages[this.currentPage] = {
            left: leftContent,
            right: rightContent,
            date: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('notebook-pages', JSON.stringify(this.pages));
        } catch (error) {
            console.error('Error saving all pages to localStorage:', error);
        }
        
        (async () => {
            try {
                const response = await fetch('/api/pages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.pages)
                });
                
                if (!response.ok) {
                    throw new Error('Server save failed');
                }
            } catch (error) {
            }
        })();
    }

    async loadPages() {
        try {
            const response = await fetch('/api/pages');
            if (response.ok) {
                const saved = await response.json();
                if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
                    this.pages = saved;
                    return;
                }
            }
        } catch (error) {
        }
        
        try {
            const saved = localStorage.getItem('notebook-pages');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                    this.pages = parsed;
                }
            }
        } catch (error) {
        }
        
        const paths = ['./example-data.json', 'example-data.json', '/example-data.json'];
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const example = await response.json();
                    if (example && typeof example === 'object' && Object.keys(example).length > 0) {
                        if (!this.pages || Object.keys(this.pages).length === 0) {
                            this.pages = example;
                        }
                        if (!localStorage.getItem('notebook-pages')) {
                            localStorage.setItem('notebook-pages', JSON.stringify(example));
                        }
                        return;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!this.pages || Object.keys(this.pages).length === 0) {
            this.pages = {};
        }
    }

    renderPage() {
        const pageData = this.pages[this.currentPage] || { left: '', right: '' };
        
        const leftContentEl = document.getElementById('leftContent');
        const rightContentEl = document.getElementById('rightContent');
        
        if (leftContentEl) {
            leftContentEl.innerHTML = pageData.left || '';
        }
        if (rightContentEl) {
            rightContentEl.innerHTML = pageData.right || '';
        }
        
        const leftPageNum = this.currentPage * 2 + 1;
        const rightPageNum = this.currentPage * 2 + 2;
        
        const leftPage = document.getElementById('leftPage');
        const rightPage = document.getElementById('rightPage');
        
        if (this.currentPage === 1) {
            leftPage.classList.add('torn');
        } else {
            leftPage.classList.remove('torn');
        }
        
        if (rightPageNum === 50) {
            rightPage.classList.add('empty');
            document.getElementById('rightContent').contentEditable = 'false';
        } else {
            rightPage.classList.remove('empty');
            document.getElementById('rightContent').contentEditable = 'true';
        }
        
        document.getElementById('pageNumber').textContent = leftPageNum;
        document.getElementById('pageNumberRight').textContent = rightPageNum;
        document.getElementById('pageInfo').textContent = `페이지 ${this.currentPage}`;
        
        document.getElementById('prevBtn').disabled = this.currentPage === 1;
        document.getElementById('nextBtn').disabled = rightPageNum >= 50;
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.saveAllPages();
            this.currentPage--;
            this.renderPage();
        }
    }

    nextPage() {
        const nextRightPageNum = (this.currentPage + 1) * 2 + 2;
        if (nextRightPageNum <= 50) {
            this.saveAllPages();
            this.currentPage++;
            this.renderPage();
        }
    }
    
    hasStyleInRange(range, styleProperty, styleValue) {
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        
        let node;
        let hasStyle = false;
        let checkedCount = 0;
        
        while (node = walker.nextNode()) {
            if (range.intersectsNode(node)) {
                checkedCount++;
                const computedStyle = window.getComputedStyle(node);
                let nodeValue = '';
                
                if (styleProperty === 'font-weight') {
                    nodeValue = computedStyle.fontWeight;
                    if (nodeValue === 'bold' || parseInt(nodeValue) >= 700) {
                        hasStyle = true;
                    }
                } else if (styleProperty === 'font-style') {
                    nodeValue = computedStyle.fontStyle;
                    if (nodeValue === 'italic') {
                        hasStyle = true;
                    }
                } else if (styleProperty === 'text-decoration') {
                    nodeValue = computedStyle.textDecoration;
                    if (nodeValue.includes('line-through')) {
                        hasStyle = true;
                    }
                }
                
                const inlineStyle = node.style.getPropertyValue(styleProperty);
                if (inlineStyle && inlineStyle.includes(styleValue)) {
                    hasStyle = true;
                }
            }
        }
        
        if (checkedCount === 0) {
            const textNodes = [];
            const textWalker = document.createTreeWalker(
                range.commonAncestorContainer,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let textNode;
            while (textNode = textWalker.nextNode()) {
                if (range.intersectsNode(textNode)) {
                    const parent = textNode.parentElement;
                    if (parent) {
                        const computedStyle = window.getComputedStyle(parent);
                        let nodeValue = '';
                        
                        if (styleProperty === 'font-weight') {
                            nodeValue = computedStyle.fontWeight;
                            if (nodeValue === 'bold' || parseInt(nodeValue) >= 700) {
                                hasStyle = true;
                                break;
                            }
                        } else if (styleProperty === 'font-style') {
                            nodeValue = computedStyle.fontStyle;
                            if (nodeValue === 'italic') {
                                hasStyle = true;
                                break;
                            }
                        } else if (styleProperty === 'text-decoration') {
                            nodeValue = computedStyle.textDecoration;
                            if (nodeValue.includes('line-through')) {
                                hasStyle = true;
                                break;
                            }
                        }
                        
                        const inlineStyle = parent.style.getPropertyValue(styleProperty);
                        if (inlineStyle && inlineStyle.includes(styleValue)) {
                            hasStyle = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return hasStyle;
    }
    
    removeStyleFromRange(range, styleProperty) {
        const contents = range.extractContents();
        
        const processNode = (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                const inlineStyle = element.style.getPropertyValue(styleProperty);
                
                if (inlineStyle) {
                    element.style.removeProperty(styleProperty);
                }
                
                if (element.children.length > 0) {
                    Array.from(element.children).forEach(child => {
                        processNode(child);
                    });
                }
                
                if (element.style.length === 0 && element.tagName === 'SPAN' && !element.hasAttribute('style')) {
                    const parent = element.parentNode;
                    if (parent) {
                        while (element.firstChild) {
                            parent.insertBefore(element.firstChild, element);
                        }
                        parent.removeChild(element);
                    }
                }
            }
        };
        
        if (contents.nodeType === Node.ELEMENT_NODE) {
            processNode(contents);
        } else if (contents.childNodes.length > 0) {
            Array.from(contents.childNodes).forEach(child => {
                processNode(child);
            });
        }
        
        return contents;
    }
    
    applyStyleToSelection(styleType) {
        const selection = window.getSelection();
        
        if (selection.rangeCount === 0 || selection.isCollapsed) {
            return;
        }
        
        const range = selection.getRangeAt(0).cloneRange();
        const selectedText = range.toString();
        
        if (!selectedText || !selectedText.trim()) {
            return;
        }
        
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        
        let targetElement = null;
        const commonAncestor = range.commonAncestorContainer;
        if (leftContent.contains(commonAncestor) || leftContent === commonAncestor) {
            targetElement = leftContent;
        } else if (rightContent.contains(commonAncestor) || rightContent === commonAncestor) {
            targetElement = rightContent;
        } else {
            return;
        }
        
        let styleProperty = '';
        let styleValue = '';
        
        if (styleType === 'bold') {
            styleProperty = 'font-weight';
            styleValue = 'bold';
        } else if (styleType === 'italic') {
            styleProperty = 'font-style';
            styleValue = 'italic';
        } else if (styleType === 'strikethrough') {
            styleProperty = 'text-decoration';
            styleValue = 'line-through';
        }
        
        const hasStyle = this.hasStyleInRange(range, styleProperty, styleValue);
        
        try {
            if (hasStyle) {
                const contents = this.removeStyleFromRange(range, styleProperty);
                range.insertNode(contents);
            } else {
                const contents = range.extractContents();
                const span = document.createElement('span');
                span.style.setProperty(styleProperty, styleValue, 'important');
                
                if (contents.childNodes.length === 0) {
                    span.textContent = selectedText;
                } else {
                    span.appendChild(contents);
                }
                
                range.insertNode(span);
            }
            
            setTimeout(() => {
                const newSelection = window.getSelection();
                newSelection.removeAllRanges();
                const newRange = document.createRange();
                newRange.setStart(range.startContainer, range.startOffset);
                newRange.setEnd(range.endContainer, range.endOffset);
                newSelection.addRange(newRange);
                targetElement.focus();
            }, 0);
        } catch (e) {
            console.error('Style application error:', e);
        }
        
        this.saveAllPages();
    }
    
    applySizeToSelection(fontSize) {
        let range = null;
        let targetElement = null;
        
        if (this.savedSelection) {
            const restored = this.restoreSelection(this.savedSelection);
            if (restored) {
                range = restored;
                const leftContent = document.getElementById('leftContent');
                const rightContent = document.getElementById('rightContent');
                const commonAncestor = range.commonAncestorContainer;
                if (leftContent.contains(commonAncestor) || leftContent === commonAncestor) {
                    targetElement = leftContent;
                } else if (rightContent.contains(commonAncestor) || rightContent === commonAncestor) {
                    targetElement = rightContent;
                }
            }
        }
        
        if (!range) {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                return;
            }
            
            range = selection.getRangeAt(0).cloneRange();
            const leftContent = document.getElementById('leftContent');
            const rightContent = document.getElementById('rightContent');
            const commonAncestor = range.commonAncestorContainer;
            
            if (leftContent.contains(commonAncestor) || leftContent === commonAncestor) {
                targetElement = leftContent;
            } else if (rightContent.contains(commonAncestor) || rightContent === commonAncestor) {
                targetElement = rightContent;
            } else {
                return;
            }
        }
        
        if (!targetElement || !range) {
            return;
        }
        
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) {
            try {
                const span = document.createElement('span');
                span.style.cssText = `font-size: ${fontSize} !important;`;
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStartAfter(span);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                targetElement.focus();
                this.savedSelection = null;
                this.saveAllPages();
            } catch (e) {
                console.error('Size application error:', e);
                this.savedSelection = null;
            }
            return;
        }
        
        try {
            const contents = range.extractContents();
            
            const removeSizeStyles = (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node;
                    element.style.removeProperty('font-size');
                    
                    if (element.children.length > 0) {
                        Array.from(element.children).forEach(child => {
                            removeSizeStyles(child);
                        });
                    }
                    
                    if (element.style.length === 0 && element.tagName === 'SPAN' && !element.hasAttribute('style')) {
                        const parent = element.parentNode;
                        if (parent) {
                            while (element.firstChild) {
                                parent.insertBefore(element.firstChild, element);
                            }
                            parent.removeChild(element);
                        }
                    }
                }
            };
            
            if (contents.nodeType === Node.ELEMENT_NODE) {
                removeSizeStyles(contents);
            } else if (contents.childNodes.length > 0) {
                Array.from(contents.childNodes).forEach(child => {
                    removeSizeStyles(child);
                });
            }
            
            const span = document.createElement('span');
            span.style.cssText = `font-size: ${fontSize} !important;`;
            
            if (contents.childNodes.length === 0) {
                span.textContent = selectedText;
            } else {
                span.appendChild(contents);
            }
            
            range.insertNode(span);
            
            setTimeout(() => {
                const newSelection = window.getSelection();
                newSelection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                newSelection.addRange(newRange);
                targetElement.focus();
            }, 0);
            
            this.savedSelection = null;
        } catch (e) {
            console.error('Size application error:', e);
            this.savedSelection = null;
        }
        
        this.saveAllPages();
    }
    
    applyFontToSelection(fontFamily) {
        let range = null;
        let targetElement = null;
        
        if (this.savedSelection) {
            const restored = this.restoreSelection(this.savedSelection);
            if (restored) {
                range = restored;
                const leftContent = document.getElementById('leftContent');
                const rightContent = document.getElementById('rightContent');
                const commonAncestor = range.commonAncestorContainer;
                if (leftContent.contains(commonAncestor) || leftContent === commonAncestor) {
                    targetElement = leftContent;
                } else if (rightContent.contains(commonAncestor) || rightContent === commonAncestor) {
                    targetElement = rightContent;
                }
            }
        }
        
        if (!range) {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                return;
            }
            
            range = selection.getRangeAt(0).cloneRange();
            const leftContent = document.getElementById('leftContent');
            const rightContent = document.getElementById('rightContent');
            const commonAncestor = range.commonAncestorContainer;
            
            if (leftContent.contains(commonAncestor) || leftContent === commonAncestor) {
                targetElement = leftContent;
            } else if (rightContent.contains(commonAncestor) || rightContent === commonAncestor) {
                targetElement = rightContent;
            } else {
                return;
            }
        }
        
        if (!targetElement || !range) {
            return;
        }
        
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) {
            try {
                const span = document.createElement('span');
                span.style.cssText = `font-family: "${fontFamily}" !important;`;
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStartAfter(span);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                targetElement.focus();
                this.savedSelection = null;
                this.saveAllPages();
            } catch (e) {
                console.error('Font application error:', e);
                this.savedSelection = null;
            }
            return;
        }
        
        try {
            const contents = range.extractContents();
            
            const removeFontStyles = (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node;
                    element.style.removeProperty('font-family');
                    
                    if (element.children.length > 0) {
                        Array.from(element.children).forEach(child => {
                            removeFontStyles(child);
                        });
                    }
                    
                    if (element.style.length === 0 && element.tagName === 'SPAN' && !element.hasAttribute('style')) {
                        const parent = element.parentNode;
                        if (parent) {
                            while (element.firstChild) {
                                parent.insertBefore(element.firstChild, element);
                            }
                            parent.removeChild(element);
                        }
                    }
                }
            };
            
            if (contents.nodeType === Node.ELEMENT_NODE) {
                removeFontStyles(contents);
            } else if (contents.childNodes.length > 0) {
                Array.from(contents.childNodes).forEach(child => {
                    removeFontStyles(child);
                });
            }
            
            const span = document.createElement('span');
            span.style.cssText = `font-family: "${fontFamily}" !important;`;
            
            if (contents.childNodes.length === 0) {
                span.textContent = selectedText;
            } else {
                span.appendChild(contents);
            }
            
            range.insertNode(span);
            
            setTimeout(() => {
                const newSelection = window.getSelection();
                newSelection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                newSelection.addRange(newRange);
                targetElement.focus();
            }, 0);
            
            this.savedSelection = null;
        } catch (e) {
            console.error('Font application error:', e);
            this.savedSelection = null;
        }
        
        this.saveAllPages();
    }
    
    async exportToExample() {
        try {
            const response = await fetch('/api/export-example', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.pages)
            });
            
            if (response.ok) {
                const result = await response.json();
                alert('example-data.json 파일이 업데이트되었습니다.\n이제 Git에 커밋하고 push하면 다른 사람들도 볼 수 있습니다.');
            } else {
                alert('공유하기 실패: 서버에 연결할 수 없습니다.');
            }
        } catch (error) {
            alert('공유하기 실패: ' + error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Notebook();
});

