document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file');
    const fileNameContainer = document.getElementById('file-name');
    const fileLabel = document.getElementById('file-label');
    const clearBtn = document.getElementById('clear-file');
    const dropText = document.getElementById('drop-text');
    const uploadButton = document.getElementById('btn1');
    const resultBox = document.getElementById('result-box');
    const resultText = document.getElementById('result-text');
    const followUpBox = document.getElementById('follow-up-box');
    const followUpQuestion = document.getElementById('follow-up-question');
    const askBtn = document.getElementById('ask-btn');
    const followUpAnswer = document.getElementById('follow-up-answer');
    function escapeHtml(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }

    function formatAnalysis(text) {
        
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)+/g, function(match) {
            return '<ul>' + match + '</ul>';
        });
        // Handle line breaks
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    const updateFileName = () => {
        if (fileInput.files.length > 0) {
            dropText.style.display = 'none';
            fileLabel.textContent = `Selected file: ${fileInput.files[0].name}`;
            clearBtn.style.display = 'inline';
        } else {
            fileLabel.textContent = '';
            clearBtn.style.display = 'none';
            dropText.style.display = 'block';
            fileInput.disabled = false;
        }
    };

    dropZone.addEventListener('click', () => {
        if (!fileInput.disabled) fileInput.click();
    });

    fileInput.addEventListener('change', updateFileName);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length && !fileInput.disabled) {
            fileInput.files = e.dataTransfer.files;
            updateFileName();
        }
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        updateFileName();
    });

    uploadButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if (fileInput.files.length > 0) {
            const form = new FormData(document.querySelector('form'));
            try {
                uploadButton.disabled = true;
                uploadButton.textContent = 'Analyzing...';
                
                const res = await fetch('/upload', {
                    method: 'POST',
                    body: form
                });
                
                const data = await res.json();
                if (data.error) {
                    alert(data.error);
                    return;
                }
                
                resultText.innerHTML = 
                    `<div class="original-text"><strong>=== Original Text ===</strong><br>${escapeHtml(data.text)}</div>` +
                    `<div class="analysis-text"><strong>=== AI Analysis ===</strong><br>${formatAnalysis(data.analysis)}</div>`;
                
                followUpBox.style.display = 'block';
                followUpQuestion.value = '';
                followUpAnswer.innerHTML = '';
                
            } catch (err) {
                alert("Upload failed");
                console.error(err);
            } finally {
                uploadButton.disabled = false;
                uploadButton.textContent = 'Upload';
            }
        } else {
            alert("Please select a file.");
        }
    });

    askBtn.addEventListener('click', async () => {
        const question = followUpQuestion.value.trim();
        if (!question) {
            alert("Please enter a question");
            return;
        }
        try {
            askBtn.disabled = true;
            askBtn.textContent = 'Asking...';
            
            const response = await fetch('/followup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalText: document.querySelector('.original-text').textContent.replace('=== Original Text ===', '').trim(),
                    analysis: document.querySelector('.analysis-text').textContent.replace('=== AI Analysis ===', '').trim(),
                    question: question
                })
            });
            
            const data = await response.json();
            followUpAnswer.innerHTML = formatAnalysis(data.answer);
        } catch (err) {
            alert("Failed to get answer");
            console.error(err);
        } finally {
            askBtn.disabled = false;
            askBtn.textContent = 'Ask';
        }
    });
});