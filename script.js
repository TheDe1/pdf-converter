const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const imageCount = document.getElementById('imageCount');
const pdfNameInput = document.getElementById('pdfName');
const pageSizeSelect = document.getElementById('pageSize');
const orientationSelect = document.getElementById('orientation');
const imageQualitySelect = document.getElementById('imageQuality');
const contentList = document.getElementById('contentList');
const themeToggle = document.getElementById('themeToggle');

let contentItems = [];
let nextId = 1;


let currentTheme = 'light';

const initTheme = () => {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
};

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
    currentTheme = isDark ? 'dark' : 'light';
});


initTheme();


uploadArea.addEventListener('click', () => fileInput.click());


uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
});


fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    fileInput.value = '';
});


function handleFiles(files) {
    let filesProcessed = 0;
    const totalFiles = files.length;
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {

            contentItems.push({
                id: nextId++,
                type: 'image',
                data: e.target.result,
                name: file.name
            });
            
            filesProcessed++;
            
   
            if (filesProcessed === totalFiles) {
                updateContentList();
                updateButtons();
                updateImageCount();
            }
        };
        reader.readAsDataURL(file);
    });
}


function updateContentList() {
    contentList.innerHTML = '';
    
    contentItems.forEach((item, index) => {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        
        contentItem.innerHTML = `
            <img src="${item.data}" class="content-image-thumb" alt="Image ${index + 1}">
            <div class="content-info">
                <div class="content-name">Page ${index + 1} - ${item.name}</div>
            </div>
            <button class="content-remove" onclick="removeContent(${item.id})">×</button>
        `;
        
        contentList.appendChild(contentItem);
    });
}


window.removeContent = function(id) {
    contentItems = contentItems.filter(item => item.id !== id);
    updateContentList();
    updateButtons();
    updateImageCount();
};


function updateButtons() {
    const hasContent = contentItems.length > 0;
    convertBtn.disabled = !hasContent;
    clearBtn.disabled = !hasContent;
}


function updateImageCount() {
    const imageCountNum = contentItems.length;
    
    if (imageCountNum > 0) {
        imageCount.textContent = `${imageCountNum} image${imageCountNum > 1 ? 's' : ''} selected 📄`;
    } else {
        imageCount.textContent = '';
    }
}


clearBtn.addEventListener('click', () => {
    contentItems = [];
    nextId = 1;
    updateContentList();
    updateButtons();
    updateImageCount();
    statusDiv.innerHTML = '<div class="status info">✨ All content cleared!</div>';
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 2000);
});


convertBtn.addEventListener('click', async () => {
    if (contentItems.length === 0) return;

    try {
        statusDiv.innerHTML = '<div class="status info">⏳ Converting to PDF...</div>';
        convertBtn.disabled = true;
        clearBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pageSize = pageSizeSelect.value;
        const orientation = orientationSelect.value;
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: pageSize
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const usableWidth = pageWidth - (2 * margin);
        const usableHeight = pageHeight - (2 * margin);
        
 
        for (let i = 0; i < contentItems.length; i++) {
            const item = contentItems[i];
            
 
            if (i > 0) {
                pdf.addPage();
            }
            
            const img = new Image();
            img.src = item.data;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    const imgRatio = img.width / img.height;
                    let imgWidth = usableWidth;
                    let imgHeight = imgWidth / imgRatio;
                    
             
                    if (imgHeight > usableHeight) {
                        imgHeight = usableHeight;
                        imgWidth = imgHeight * imgRatio;
                    }
                    
                   
                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;
                    
                   
                    pdf.addImage(item.data, 'JPEG', x, y, imgWidth, imgHeight);
                    resolve();
                };
            });
        }
        
        const pdfName = pdfNameInput.value.trim() || 'my-lovely-pdf';
        pdf.save(`${pdfName}.pdf`);
        statusDiv.innerHTML = '<div class="status success">✅ PDF created successfully! Download started!</div>';
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 4000);
        
    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = '<div class="status error">❌ Error creating PDF. Please try again.</div>';
    } finally {
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    }
});