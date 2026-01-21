class Notebook {
    constructor() {
        this.currentPage = 1;
        this.pages = {};
        this.currentFont = 'Noto Serif KR';
        this.currentSize = '16px';
        this.isApplyingFont = false;
        this.isReadOnly = this.checkReadOnlyMode();
        this.init();
    }
    checkReadOnlyMode() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
            return false;
        }
        return true;
    }

    async init() {
        await this.loadPages();
        if (this.isReadOnly) {
            this.setupReadOnlyMode();
        } else {
            this.setupEventListeners();
        }
        this.renderPage();
        if (!this.isReadOnly) {
            setInterval(() => {
                this.saveAllPages();
            }, 2000);
            window.addEventListener('beforeunload', () => {
                this.saveAllPages();
            });
            window.addEventListener('pagehide', () => {
                this.saveAllPages();
            });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.saveAllPages();
                }
            });
        }
    }
    setupReadOnlyMode() {
        document.body.classList.add('read-only-mode');
        document.getElementById('prevBtn').addEventListener('click', () => this.prevPage());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        if (leftContent) leftContent.contentEditable = 'false';
        if (rightContent) rightContent.contentEditable = 'false';
        setTimeout(() => {
            const formatButtons = document.querySelector('.format-buttons');
            const fontControls = document.querySelector('.font-controls');
            const sizeControls = document.querySelector('.size-controls');
            const shareBtn = document.getElementById('shareBtn');
            if (formatButtons) formatButtons.style.display = 'none';
            if (fontControls) fontControls.style.display = 'none';
            if (sizeControls) sizeControls.style.display = 'none';
            if (shareBtn) shareBtn.style.display = 'none';
        }, 0);
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
        
        leftContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        leftContent.addEventListener('drop', (e) => this.handleDrop(e, leftContent));
        rightContent.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        rightContent.addEventListener('drop', (e) => this.handleDrop(e, rightContent));
        
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
                    this.updateSavedSelection();
                }
            }
        });
        
        const fontSelect = document.getElementById('fontSelect');
        fontSelect.addEventListener('mousedown', (e) => {
            this.savedSelection = this.saveSelection();
        });
        fontSelect.addEventListener('pointerdown', () => {
            this.savedSelection = this.saveSelection();
        });
        fontSelect.addEventListener('focus', () => {
            this.savedSelection = this.saveSelection();
        });
        fontSelect.addEventListener('change', (e) => {
            const selectedFont = e.target.value;
            this.currentFont = selectedFont;
            this.isApplyingFont = true;
            if (!this.savedSelection) {
                const currentSelection = this.saveSelection();
                if (currentSelection) {
                    this.savedSelection = currentSelection;
                }
            }
            setTimeout(() => {
                this.applyFontToSelection(selectedFont);
                setTimeout(() => {
                    this.isApplyingFont = false;
                }, 100);
            }, 0);
        });
        
        const sizeSelect = document.getElementById('sizeSelect');
        sizeSelect.addEventListener('mousedown', (e) => {
            this.savedSelection = this.saveSelection();
        });
        sizeSelect.addEventListener('pointerdown', () => {
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
            this.updateSavedSelection();
            setTimeout(() => this.applyStyleToSelection('bold'), 0);
        });
        document.getElementById('italicBtn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.updateSavedSelection();
            setTimeout(() => this.applyStyleToSelection('italic'), 0);
        });
        document.getElementById('strikeBtn').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.updateSavedSelection();
            setTimeout(() => this.applyStyleToSelection('strikethrough'), 0);
        });
        
        document.getElementById('shareBtn').addEventListener('click', () => this.exportToExample());
    }
    
    handleInput(e, targetElement) {
        if (this.isApplyingFont) {
            return;
        }
        
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
        if (selection.rangeCount === 0) return;
        const clipboardData = e.clipboardData || window.clipboardData;
        const items = clipboardData.items;
        let imageFound = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                this.insertImage(blob, selection);
                imageFound = true;
                break;
            }
        }
        if (imageFound) return;
        const pasteData = clipboardData.getData('text/plain');
        if (!pasteData) return;
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
    handleDrop(e, targetElement) {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        const selection = window.getSelection();
        let range = null;
        if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            range.selectNodeContents(targetElement);
            range.collapse(false);
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.indexOf('image') !== -1) {
                this.insertImage(file, selection, range);
            }
        }
    }
    insertImage(file, selection, range = null) {
        if (!range && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        }
        if (!range) return;
        range.deleteContents();
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '10px 0';
            img.setAttribute('data-image', 'true');
            range.insertNode(img);
            const newRange = document.createRange();
            newRange.setStartAfter(img);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            setTimeout(() => {
                this.saveAllPages();
            }, 100);
        };
        reader.onerror = (e) => {
            console.error('Image read error:', e);
        };
        reader.readAsDataURL(file);
    }

    saveSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        const commonAncestor = range.commonAncestorContainer;
        const inLeft = leftContent && (leftContent.contains(commonAncestor) || leftContent === commonAncestor);
        const inRight = rightContent && (rightContent.contains(commonAncestor) || rightContent === commonAncestor);
        if (!inLeft && !inRight) return null;
        return {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            collapsed: range.collapsed
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
        
        const pagesToSave = JSON.stringify(this.pages);
        
        try {
            localStorage.setItem('notebook-pages', pagesToSave);
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
                    body: pagesToSave
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
        
        const paths = ['./example-data.json', 'example-data.json', '/example-data.json'];
        let exampleLoaded = false;
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const example = await response.json();
                    if (example && typeof example === 'object' && Object.keys(example).length > 0) {
                        this.pages = example;
                        localStorage.setItem('notebook-pages', JSON.stringify(example));
                        exampleLoaded = true;
                        return;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!exampleLoaded) {
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
        }
        
        if (!this.pages || Object.keys(this.pages).length === 0) {
            this.pages = {};
        }
    }

    renderPage() {
        if (!this.pages[this.currentPage]) {
            this.pages[this.currentPage] = { left: '', right: '', date: new Date().toISOString() };
        }
        
        const pageData = this.pages[this.currentPage];
        
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
            document.getElementById('rightContent').contentEditable = this.isReadOnly ? 'false' : 'true';
        }
        if (this.isReadOnly) {
            document.getElementById('leftContent').contentEditable = 'false';
        }
        
        document.getElementById('pageNumber').textContent = leftPageNum;
        document.getElementById('pageNumberRight').textContent = rightPageNum;
        document.getElementById('pageInfo').textContent = `페이지 ${this.currentPage}`;
        
        document.getElementById('prevBtn').disabled = this.currentPage === 1;
        document.getElementById('nextBtn').disabled = rightPageNum >= 50;
    }

    prevPage() {
        if (this.currentPage > 1) {
            const leftContentEl = document.getElementById('leftContent');
            const rightContentEl = document.getElementById('rightContent');
            if (leftContentEl && rightContentEl) {
                this.pages[this.currentPage] = {
                    left: leftContentEl.innerHTML,
                    right: rightContentEl.innerHTML,
                    date: new Date().toISOString()
                };
            }
            this.saveAllPages();
            this.currentPage--;
            this.renderPage();
        }
    }

    nextPage() {
        const nextRightPageNum = (this.currentPage + 1) * 2 + 2;
        if (nextRightPageNum <= 50) {
            const leftContentEl = document.getElementById('leftContent');
            const rightContentEl = document.getElementById('rightContent');
            if (leftContentEl && rightContentEl) {
                this.pages[this.currentPage] = {
                    left: leftContentEl.innerHTML,
                    right: rightContentEl.innerHTML,
                    date: new Date().toISOString()
                };
            }
            this.saveAllPages();
            this.currentPage++;
            this.renderPage();
        }
    }
    
    getWalkerRoot(range) {
        const root = range.commonAncestorContainer;
        return (root.nodeType === Node.TEXT_NODE) ? root.parentNode : root;
    }
    getEditableRootFromRange(range) {
        const leftContent = document.getElementById('leftContent');
        const rightContent = document.getElementById('rightContent');
        const commonAncestor = range.commonAncestorContainer;
        if (leftContent && (leftContent.contains(commonAncestor) || leftContent === commonAncestor)) return leftContent;
        if (rightContent && (rightContent.contains(commonAncestor) || rightContent === commonAncestor)) return rightContent;
        return null;
    }
    getWordRangeAtCaret() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return null;
        const baseRange = sel.getRangeAt(0);
        if (!baseRange.collapsed) return baseRange.cloneRange();
        let node = baseRange.startContainer;
        let offset = baseRange.startOffset;
        if (node.nodeType !== Node.TEXT_NODE) {
            const child = node.childNodes[offset] || node.childNodes[offset - 1];
            if (child && child.nodeType === Node.TEXT_NODE) {
                node = child;
                offset = Math.min(offset, node.nodeValue.length);
            } else {
                return null;
            }
        }
        const text = node.nodeValue || '';
        if (!text.trim()) return null;
        const isWordChar = (ch) => /[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ_]/.test(ch);
        let start = offset;
        let end = offset;
        if (start > 0 && !isWordChar(text[start]) && isWordChar(text[start - 1])) {
            start -= 1;
            end = start;
        }
        while (start > 0 && isWordChar(text[start - 1])) start--;
        while (end < text.length && isWordChar(text[end])) end++;
        if (end <= start) return null;
        const r = document.createRange();
        r.setStart(node, start);
        r.setEnd(node, end);
        return r;
    }
    hasStyleInRange(range, styleProperty, styleValue) {
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) return false;
        const doc = range.commonAncestorContainer.ownerDocument || document;
        const walkRoot = this.getWalkerRoot(range);
        const textWalker = doc.createTreeWalker(
            walkRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    try {
                        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    } catch {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            }
        );
        const textNodes = [];
        let n;
        while ((n = textWalker.nextNode())) textNodes.push(n);
        if (textNodes.length === 0) return false;
        let allHaveStyle = true;
        let hasAnyStyle = false;
        for (const textNode of textNodes) {
            let startOffset = 0;
            let endOffset = textNode.nodeValue.length;
            if (textNode === range.startContainer) startOffset = range.startOffset;
            if (textNode === range.endContainer) endOffset = range.endOffset;
            startOffset = Math.max(0, Math.min(startOffset, textNode.nodeValue.length));
            endOffset = Math.max(0, Math.min(endOffset, textNode.nodeValue.length));
            if (endOffset <= startOffset) continue;
            let currentParent = textNode.parentElement;
            let foundStyle = false;
            while (currentParent && currentParent !== doc.body) {
                if (currentParent.tagName === 'SPAN' || currentParent.tagName === 'B' || currentParent.tagName === 'I' || currentParent.tagName === 'S' || currentParent.tagName === 'STRIKE') {
                    const computedStyle = window.getComputedStyle(currentParent);
                    const inlineStyle = currentParent.style.getPropertyValue(styleProperty);
                    const hasStyle = styleProperty === 'font-weight' ? 
                        (inlineStyle === 'bold' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700) :
                        styleProperty === 'font-style' ? 
                        (inlineStyle === 'italic' || computedStyle.fontStyle === 'italic') :
                        styleProperty === 'text-decoration' ? 
                        (inlineStyle.includes('line-through') || computedStyle.textDecoration.includes('line-through')) : false;
                    if (hasStyle) {
                        foundStyle = true;
                        hasAnyStyle = true;
                        break;
                    }
                }
                currentParent = currentParent.parentElement;
            }
            if (!foundStyle) {
                allHaveStyle = false;
            }
        }
        return allHaveStyle && hasAnyStyle;
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
        let range = null;
        if (this.savedSelection) {
            const restored = this.restoreSelection(this.savedSelection);
            if (restored) range = restored;
        }
        const selection = window.getSelection();
        if (!range && selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0).cloneRange();
        }
        if (!range) return;
        if (range.collapsed) {
            const wordRange = this.getWordRangeAtCaret();
            if (wordRange) {
                range = wordRange;
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                const span = document.createElement('span');
                let css = '';
                if (styleType === 'bold') css = 'font-weight: bold !important;';
                if (styleType === 'italic') css = 'font-style: italic !important;';
                if (styleType === 'strikethrough') css = 'text-decoration: line-through !important;';
                span.style.cssText = css;
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStart(span.firstChild || span, 1);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                this.savedSelection = null;
                this.saveAllPages();
                return;
            }
        }
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) {
            this.savedSelection = null;
            return;
        }
        const targetElement = this.getEditableRootFromRange(range);
        if (!targetElement) {
            this.savedSelection = null;
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
                this.removeStyleFromRangeInline(range, styleProperty);
            } else {
                this.applyInlineStyleToRange(range, { [styleProperty]: styleValue });
            }
            setTimeout(() => targetElement?.focus(), 0);
        } catch (e) {
            console.error('Style application error:', e);
        } finally {
            this.savedSelection = null;
        }
        this.saveAllPages();
    }
    removeStyleFromRangeInline(range, styleProperty) {
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) return;
        const doc = range.commonAncestorContainer.ownerDocument || document;
        const walkRoot = this.getWalkerRoot(range);
        const textWalker = doc.createTreeWalker(
            walkRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    try {
                        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    } catch {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            }
        );
        const textNodes = [];
        let n;
        while ((n = textWalker.nextNode())) textNodes.push(n);
        if (textNodes.length === 0) return;
        for (const textNode of textNodes) {
            let startOffset = 0;
            let endOffset = textNode.nodeValue.length;
            if (textNode === range.startContainer) startOffset = range.startOffset;
            if (textNode === range.endContainer) endOffset = range.endOffset;
            startOffset = Math.max(0, Math.min(startOffset, textNode.nodeValue.length));
            endOffset = Math.max(0, Math.min(endOffset, textNode.nodeValue.length));
            if (endOffset <= startOffset) continue;
            let target = textNode;
            if (startOffset > 0) target = target.splitText(startOffset);
            if (endOffset - startOffset < target.nodeValue.length) target.splitText(endOffset - startOffset);
            let currentParent = target.parentElement;
            while (currentParent && currentParent !== doc.body) {
                if (currentParent.tagName === 'SPAN') {
                    const computedStyle = window.getComputedStyle(currentParent);
                    const inlineStyle = currentParent.style.getPropertyValue(styleProperty);
                    const hasStyle = styleProperty === 'font-weight' ? 
                        (inlineStyle === 'bold' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700) :
                        styleProperty === 'font-style' ? 
                        (inlineStyle === 'italic' || computedStyle.fontStyle === 'italic') :
                        styleProperty === 'text-decoration' ? 
                        (inlineStyle.includes('line-through') || computedStyle.textDecoration.includes('line-through')) : false;
                    if (hasStyle) {
                        const parent = currentParent.parentNode;
                        if (parent) {
                            currentParent.style.removeProperty(styleProperty);
                            if (currentParent.style.length === 0) {
                                while (currentParent.firstChild) {
                                    parent.insertBefore(currentParent.firstChild, currentParent);
                                }
                                parent.removeChild(currentParent);
                            }
                        }
                        break;
                    }
                }
                currentParent = currentParent.parentElement;
            }
        }
    }
    
    applySizeToSelection(fontSize) {
        let range = null;
        let targetElement = null;
        if (this.savedSelection) {
            const restored = this.restoreSelection(this.savedSelection);
            if (restored) range = restored;
        }
        const sel = window.getSelection();
        if (!range && sel && sel.rangeCount > 0) range = sel.getRangeAt(0).cloneRange();
        if (!range) return;
        targetElement = this.getEditableRootFromRange(range);
        if (!targetElement) {
            this.savedSelection = null;
            return;
        }
        if (range.collapsed) {
            const wordRange = this.getWordRangeAtCaret();
            if (wordRange) {
                range = wordRange;
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                const span = document.createElement('span');
                span.style.cssText = `font-size: ${fontSize} !important;`;
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStart(span.firstChild || span, 1);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                targetElement.focus();
                this.savedSelection = null;
                this.saveAllPages();
                return;
            }
        }
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) {
            this.savedSelection = null;
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
    
    applyInlineStyleToRange(range, styleObj) {
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) return;
        const doc = range.commonAncestorContainer.ownerDocument || document;
        const walkRoot = this.getWalkerRoot(range);
        const walker = doc.createTreeWalker(
            walkRoot,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    try {
                        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    } catch {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            }
        );
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) textNodes.push(node);
        if (textNodes.length === 0) return;
        const findStartOffset = (rng, textNode) => {
            let lo = 0, hi = textNode.nodeValue.length;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                const c = rng.comparePoint(textNode, mid);
                if (c === -1) lo = mid + 1;
                else hi = mid;
            }
            return lo;
        };
        const findEndOffset = (rng, textNode) => {
            let lo = 0, hi = textNode.nodeValue.length;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                const c = rng.comparePoint(textNode, mid);
                if (c === 1) hi = mid;
                else lo = mid + 1;
            }
            return lo;
        };
        for (const textNode of textNodes) {
            const len = textNode.nodeValue.length;
            let start = findStartOffset(range, textNode);
            let end = findEndOffset(range, textNode);
            start = Math.max(0, Math.min(start, len));
            end = Math.max(0, Math.min(end, len));
            if (end <= start) continue;
            let target = textNode;
            if (start > 0) target = target.splitText(start);
            const remain = end - start;
            if (remain < target.nodeValue.length) target.splitText(remain);
            const parentEl = target.parentElement;
            if (!parentEl) continue;
            const span = doc.createElement('span');
            for (const [k, v] of Object.entries(styleObj)) {
                span.style.setProperty(k, v, 'important');
            }
            parentEl.insertBefore(span, target);
            span.appendChild(target);
        }
    }
    applyFontToSelection(fontFamily) {
        let range = null;
        let targetElement = null;
        if (this.savedSelection) {
            const restored = this.restoreSelection(this.savedSelection);
            if (restored) range = restored;
        }
        const sel = window.getSelection();
        if (!range && sel && sel.rangeCount > 0) range = sel.getRangeAt(0).cloneRange();
        if (!range) return;
        targetElement = this.getEditableRootFromRange(range);
        if (!targetElement) {
            this.savedSelection = null;
            return;
        }
        if (range.collapsed) {
            const wordRange = this.getWordRangeAtCaret();
            if (wordRange) {
                range = wordRange;
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                const span = document.createElement('span');
                span.style.setProperty('font-family', fontFamily, 'important');
                span.innerHTML = '&#8203;';
                range.insertNode(span);
                range.setStart(span.firstChild || span, 1);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                targetElement.focus();
                this.savedSelection = null;
                this.saveAllPages();
                return;
            }
        }
        const selectedText = range.toString();
        if (!selectedText || !selectedText.trim()) {
            this.savedSelection = null;
            return;
        }
        try {
            this.applyInlineStyleToRange(range, { 'font-family': fontFamily });
            setTimeout(() => targetElement?.focus(), 0);
            this.saveAllPages();
        } catch (e) {
            console.error('Font application error:', e);
        } finally {
            this.savedSelection = null;
        }
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

