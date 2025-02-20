// Create container for the buttons
const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = 'position: fixed; right: 20px; top: 20px; z-index: 99999;';

// Create backup button (up arrow)
const backupButton = document.createElement('button');
backupButton.innerHTML = '↑';
backupButton.title = 'Backup to local computer';
backupButton.style.cssText = `
    padding: 8px 8px;
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
    padding: 8px 8px;
    margin: 5px;
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
`;

// Function to export data
async function exportData() {
    const data = {
        localStorage: {},
        indexedDB: {}
    };

    // Get localStorage data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data.localStorage[key] = localStorage.getItem(key);
    }

    // Get indexedDB data
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onerror = () => reject(request.error);
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['keyval'], 'readonly');
            const store = transaction.objectStore('keyval');
            
            store.getAll().onsuccess = function(event) {
                data.indexedDB = event.target.result;
                
                // Create and download JSON file
                const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                const jsonLink = document.createElement('a');
                jsonLink.href = jsonUrl;
                jsonLink.download = 'backup.json';
                document.body.appendChild(jsonLink);
                jsonLink.click();
                document.body.removeChild(jsonLink);
                URL.revokeObjectURL(jsonUrl);

                // Create and download ZIP file
                const zip = new JSZip();
                zip.file('backup.json', JSON.stringify(data));
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    const zipUrl = URL.createObjectURL(content);
                    const zipLink = document.createElement('a');
                    zipLink.href = zipUrl;
                    zipLink.download = 'backup.zip';
                    document.body.appendChild(zipLink);
                    zipLink.click();
                    document.body.removeChild(zipLink);
                    URL.revokeObjectURL(zipUrl);
                });

                resolve();
            };
        };
    });
}

// Function to import data
async function importData(file) {
    const content = await file.text();
    const data = JSON.parse(content);

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
                data.indexedDB.forEach(item => {
                    store.add(item);
                });
            };
            
            transaction.oncomplete = () => resolve();
        };
    });
}

// Add click handlers
backupButton.addEventListener('click', async () => {
    try {
        await exportData();
    } catch (error) {
        console.error('Backup failed:', error);
        alert('Backup failed: ' + error.message);
    }
});

restoreButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(file);
                const jsonFile = Object.keys(zip.files)[0];
                const content = await zip.file(jsonFile).async('text');
                await importData(new Blob([content], { type: 'application/json' }));
            } else {
                await importData(file);
            }
            
            alert('Restore completed successfully!');
            location.reload(); // Reload the page to apply changes
            
        } catch (error) {
            console.error('Restore failed:', error);
            alert('Restore failed: ' + error.message);
        }
    };
    
    input.click();
});

// Add buttons to container and container to document
buttonContainer.appendChild(backupButton);
buttonContainer.appendChild(restoreButton);
document.body.appendChild(buttonContainer);

// Add JSZip library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js';
document.head.appendChild(script);

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
