document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file');
    const fileLabel = document.getElementById('file-label');
    const clearBtn = document.getElementById('clear-file');
    const dropText = document.getElementById('drop-text');
    const uploadButton = document.getElementById('btn1');
    const resultText = document.getElementById('result-text');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const userQuestion = document.getElementById('user-question');
    const sendQuestionBtn = document.getElementById('send-question');
    const minimizeChatBtn = document.getElementById('minimize-chat');

    // Helper functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatAnalysis(text) {
        if (!text) return '';
        
        // Convert **bold** to <strong>bold</strong>
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert bullet points to proper lists
        html = html.replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)+/g, function(match) {
            return '<ul>' + match + '</ul>';
        });
        
        // Handle line breaks and preserve formatting
        html = html.replace(/\n/g, '<br>');
        
        // Convert numbered lists if present
        html = html.replace(/^\s*\d+\.\s*(.*)$/gm, '<li>$1</li>');
        
        return html;
    }

    function addMessage(text, sender, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} ${isThinking ? 'thinking' : ''}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div>${formatAnalysis(text)}</div>
            <div class="timestamp">${timeString}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async function sendQuestion() {
        const question = userQuestion.value.trim();
        if (!question) return;
        
        // Add user message
        addMessage(question, 'user');
        userQuestion.value = '';
        
        // Add thinking indicator
        const tempId = 'temp-' + Date.now();
        const tempDiv = document.createElement('div');
        tempDiv.id = tempId;
        tempDiv.className = 'message bot thinking';
        tempDiv.textContent = 'Analyzing your question...';
        chatMessages.appendChild(tempDiv);
        tempDiv.scrollIntoView({ behavior: 'smooth' });
        
        try {
            // Get conversation history
            const historyItems = Array.from(document.querySelectorAll('.message:not(.thinking)'))
                .slice(-5) // Last 5 messages for context
                .map(msg => ({
                    role: msg.classList.contains('user') ? 'user' : 'bot',
                    content: msg.querySelector('div')?.textContent || ''
                }));
            
            const response = await fetch('/followup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalText: document.querySelector('.original-text')?.textContent.replace('=== Original Text ===', '').trim() || '',
                    analysis: document.querySelector('.analysis-text')?.textContent.replace('=== AI Analysis ===', '').trim() || '',
                    question: question,
                    conversationHistory: historyItems.filter(msg => msg.role === 'user').map(msg => ({
                        question: msg.content,
                        answer: historyItems[historyItems.indexOf(msg) + 1]?.content || ''
                    }))
                })
            });
            
            const data = await response.json();
            
            // Remove thinking indicator
            const tempElement = document.getElementById(tempId);
            if (tempElement) tempElement.remove();
            
            // Add bot response
            addMessage(data.answer, 'bot');
            
        } catch (err) {
            console.error('Error:', err);
            const tempElement = document.getElementById(tempId);
            if (tempElement) {
                tempElement.textContent = 'Sorry, there was an error processing your question.';
                tempElement.classList.remove('thinking');
            }
        }
    }

    // File handling functions
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

    // Event listeners for file handling
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

    // Upload and analysis handling
    uploadButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if (fileInput.files.length > 0) {
            const form = new FormData(document.querySelector('form'));
            try {
                // Clear previous conversation
                chatMessages.innerHTML = '';
                
                // Show loading state
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
                
                // Show chat interface
                chatContainer.style.display = 'block';
                userQuestion.focus();
                
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

    // Chat event listeners
    sendQuestionBtn.addEventListener('click', sendQuestion);

    userQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestion();
        }
    });

    // Auto-resize textarea
    userQuestion.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    minimizeChatBtn.addEventListener('click', () => {
        chatContainer.classList.toggle('minimized');
        if (chatContainer.classList.contains('minimized')) {
            chatMessages.style.display = 'none';
            document.getElementById('chat-input-area').style.display = 'none';
            minimizeChatBtn.innerHTML = '<i class="fas fa-plus"></i>';
        } else {
            chatMessages.style.display = 'flex';
            document.getElementById('chat-input-area').style.display = 'flex';
            minimizeChatBtn.innerHTML = '<i class="fas fa-minus"></i>';
        }
    });
});