class LocalBackupManager {
    constructor() {
        this.setupButtons();
    }

   setupButtons() {
        // Get the settings button's position
        const settingsButton = document.querySelector('[data-element-id="workspace-tab-settings"]');
        if (!settingsButton) {
            console.error('Settings button not found');
            return;
        }

        // Create container for our buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 8px;
        `;

        // Create "Create" button
        const createBtn = document.createElement('button');
        createBtn.textContent = 'Create';
        createBtn.className = 'backup-button';
        createBtn.style.cssText = `
            padding: 2px 2px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 0px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
        `;
        createBtn.addEventListener('click', () => this.createBackup());

        // Create "Restore" button
        const restoreBtn = document.createElement('button');
        restoreBtn.textContent = 'Restore';
        restoreBtn.className = 'restore-button';
        restoreBtn.style.cssText = `
            padding: 2px 2px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 1px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
        `;
        restoreBtn.addEventListener('click', () => this.restoreBackup());

        // Add buttons to container
        buttonContainer.appendChild(createBtn);
        buttonContainer.appendChild(restoreBtn);

        // Insert container after settings button
        settingsButton.parentNode.insertBefore(buttonContainer, settingsButton.nextSibling);
    }


    async createBackup() {
        try {
            // Get current date/time for filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const data = await this.exportData();

            // Save as JSON
            const jsonBlob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            await this.downloadFile(`backup_${timestamp}.json`, jsonBlob);

            // Save as ZIP
            const zip = new JSZip();
            zip.file(`backup_${timestamp}.json`, JSON.stringify(data, null, 2));
            
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 }
            });

            await this.downloadFile(`backup_${timestamp}.zip`, zipBlob);
            alert('Backup completed successfully!');

        } catch (error) {
            console.error('Backup failed:', error);
            alert('Backup failed: ' + error.message);
        }
    }

    async restoreBackup() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        await this.importData(data);
                        alert('Backup restored successfully!');
                    } catch (error) {
                        console.error('Restore failed:', error);
                        alert('Failed to restore backup: ' + error.message);
                    }
                };
                reader.readAsText(file);
            };

            input.click();

        } catch (error) {
            console.error('Restore failed:', error);
            alert('Restore failed: ' + error.message);
        }
    }

    async exportData() {
        // Export data from localStorage and IndexedDB
        const data = {
            localStorage: {...localStorage},
            indexedDB: {},
            timestamp: new Date().toISOString(),
            metadata: {
                version: '1.0',
                platform: navigator.platform,
                userAgent: navigator.userAgent
            }
        };

        // Get IndexedDB data
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['keyval'], 'readonly');
        const store = transaction.objectStore('keyval');
        const keys = await store.getAllKeys();
        const values = await store.getAll();
        
        keys.forEach((key, i) => {
            data.indexedDB[key] = values[i];
        });

        return data;
    }

    async importData(data) {
        // Restore localStorage data
        Object.keys(data.localStorage).forEach(key => {
            localStorage.setItem(key, data.localStorage[key]);
        });

        // Restore IndexedDB data
        const db = await this.openIndexedDB();
        const transaction = db.transaction(['keyval'], 'readwrite');
        const store = transaction.objectStore('keyval');

        // Clear existing data
        await store.clear();

        // Add restored data
        Object.entries(data.indexedDB).forEach(([key, value]) => {
            store.put(value, key);
        });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        });
    }

    downloadFile(filename, blob) {
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

    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('keyval-store', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('keyval');
            };
        });
    }
}

// Initialize backup manager
const backupManager = new LocalBackupManager();

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
