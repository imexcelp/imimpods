// Create container for the buttons
const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = 'position: fixed; right: 20px; top: 20px; z-index: 99999;';

// Create backup button (up arrow)
const backupButton = document.createElement('button');
backupButton.innerHTML = 'C';
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
restoreButton.innerHTML = 'R';
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
backupButton.addEventListener('click', async () => {
    try {
        const data = await exportBackupData();
        
        // Create and download JSON file
        const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = 'backup.json';
        
        // Create and download ZIP file
        const jszip = await loadJSZip();
        const zip = new jszip();
        zip.file('backup.json', JSON.stringify(data));
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipContent);
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = 'backup.zip';
        
        // Trigger downloads
        document.body.appendChild(jsonLink);
        document.body.appendChild(zipLink);
        jsonLink.click();
        setTimeout(() => zipLink.click(), 100);
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(jsonLink);
            document.body.removeChild(zipLink);
            URL.revokeObjectURL(jsonUrl);
            URL.revokeObjectURL(zipUrl);
        }, 200);
        
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
            
            let data;
            if (file.name.endsWith('.zip')) {
                const jszip = await loadJSZip();
                const zip = await jszip.loadAsync(file);
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
});

// Add buttons to container and container to document
buttonContainer.appendChild(backupButton);
buttonContainer.appendChild(restoreButton);
document.body.appendChild(buttonContainer);

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
