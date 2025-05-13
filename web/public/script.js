document.addEventListener('DOMContentLoaded',() => {
    const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file');
const fileNameContainer = document.getElementById('file-name');
const fileLabel = document.getElementById('file-label');
const clearBtn = document.getElementById('clear-file');
const dropText = document.getElementById('drop-text');
const uploadButton = document.getElementById('btn1');
const resultBox = document.getElementById('result-box');

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
            const res = await fetch('/upload', {
                method: 'POST',
                body: form
            });
            const data = await res.json();
            if (data.error) {
                alert(data.error);
                return;
            }
             document.getElementById('result-text').value = 
        `=== Original Text ===\n${data.text}\n\n` +
        `=== AI Analysis ===\n${data.analysis}`;
      
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    }
  } else {
    alert("Please select a file.");
  }
});
});
