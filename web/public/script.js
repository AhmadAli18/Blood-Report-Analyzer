const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file');
const fileNameContainer = document.getElementById('file-name');
const fileLabel = document.getElementById('file-label');
const clearBtn = document.getElementById('clear-file');
const dropText = document.getElementById('drop-text');
const uploadButton = document.getElementById('btn1');
const form = document.getElementById('upload-form'); // Add this to get the form element

const updateFileName = () => {
    if (fileInput.files.length > 0) {
        dropText.style.display = 'none';
        fileLabel.textContent = `Selected file: ${fileInput.files[0].name}`;
        clearBtn.style.display = 'inline';
        fileInput.disabled = false;
    } else {
        fileLabel.textContent = '';
        clearBtn.style.display = 'none';
        dropText.style.display = 'block';
        fileInput.disabled = false;
    }
};

dropZone.addEventListener('click', () => {
    if (!fileInput.disabled) {
        fileInput.click();
    }
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

// ✅ Upload logic using fetch
uploadButton.addEventListener('click', async (e) => {
    e.preventDefault();

    if (fileInput.files.length === 0) {
        alert("Please select a file before uploading.");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const res = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const resultText = await res.text();

        if (res.ok) {
            alert(`✅ ${resultText}`);
            fileInput.disabled = true;
        } else {
            alert(`❌ Upload failed: ${resultText}`);
        }
    } catch (err) {
        console.error('Error uploading file:', err);
        alert("An error occurred during upload.");
    }
});
