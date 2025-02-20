// Create the backup and restore buttons with arrow symbols
function createBackupRestoreButtons() {
    // Create container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'position: fixed; right: 20px; top: 20px; z-index: 1000;';

    // Create backup button (up arrow)
    const backupButton = document.createElement('button');
    backupButton.innerHTML = '↑';
    backupButton.title = 'Backup to local computer';
    backupButton.style.cssText = `
        padding: 8px 12px;
        margin: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
    `;

    // Create restore button (down arrow)
    const restoreButton = document.createElement('button');
    restoreButton.innerHTML = '↓';
    restoreButton.title = 'Restore from local computer';
    restoreButton.style.cssText = `
        padding: 8px 12px;
        margin: 5px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
    `;

    // Add click handlers
    backupButton.addEventListener('click', handleBackup);
    restoreButton.addEventListener('click', handleRestore);

    // Add buttons to container and container to document
    buttonContainer.appendChild(backupButton);
    buttonContainer.appendChild(restoreButton);
    document.body.appendChild(buttonContainer);
}

// Function to handle backup
async function handleBackup() {
    try {
        // Get data from localStorage and indexedDB
        const data = await exportBackupData();
        
        // Create and download JSON file
        const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        downloadFile(jsonBlob, 'backup.json');
        
        // Create and download ZIP file
        const zip = new JSZip();
        zip.file('backup.json', JSON.stringify(data));
        const zipContent = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipContent, 'backup.zip');
        
    } catch (error) {
        console.error('Backup failed:', error);
        alert('Backup failed: ' + error.message);
    }
}

// Function to handle restore
function handleRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            
            let data;
            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                const jsonFile = Object.keys(zip.files)[0];
                const content = await zip.file(jsonFile).async('text');
                data = JSON.parse(content);
            } else {
                const content = await file.text();
                data = JSON.parse(content);
            }
            
            await importDataToStorage(data);
            alert('Restore completed successfully!');
            
        } catch (error) {
            console.error('Restore failed:', error);
            alert('Restore failed: ' + error.message);
        }
    };
    
    input.click();
}

// Helper function to export backup data
async function exportBackupData() {
    const data = {
        localStorage: { ...localStorage },
        indexedDB: {}
    };

    // Get data from indexedDB
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => reject(request.error);
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['keyval'], 'readonly');
            const store = transaction.objectStore('keyval');
            
            store.getAll().onsuccess = function(event) {
                data.indexedDB = event.target.result;
                resolve(data);
            };
        };
    });
}

// Helper function to import data to storage
async function importDataToStorage(data) {
    // Restore localStorage data
    Object.keys(data.localStorage).forEach(key => {
        localStorage.setItem(key, data.localStorage[key]);
    });

    // Restore indexedDB data
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => reject(request.error);
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['keyval'], 'readwrite');
            const store = transaction.objectStore('keyval');
            
            // Clear existing data
            store.clear().onsuccess = function() {
                // Add new data
                Object.keys(data.indexedDB).forEach(key => {
                    store.put(data.indexedDB[key], key);
                });
            };
            
            transaction.oncomplete = () => resolve();
        };
    });
}

// Helper function to download files
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Initialize buttons when the page loads
document.addEventListener('DOMContentLoaded', createBackupRestoreButtons);



(() => {
  function hideButtons() {
    const hideButtonStyles = `
      /* Hide Teams button */
      button[data-element-id="workspace-tab-teams"] {
        display: none !important;
      }
      
      /* Hide User Profile button */
      button[data-element-id="workspace-profile-button"] {
        display: none !important;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = hideButtonStyles;
    document.head.appendChild(styleElement);

    console.log('Teams and Profile buttons hidden successfully');
  }

  // Check if the document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideButtons();
  } else {
    // If not, wait for it to load
    document.addEventListener('DOMContentLoaded', hideButtons);
  }
})();
