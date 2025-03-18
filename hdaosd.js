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
      
      /* Hide KB button (by targeting unique class combination) */
      button.min-w-\\[58px\\].w-full {
        display: none !important;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = hideButtonStyles;
    document.head.appendChild(styleElement);

    console.log('Teams, Profile, and KB buttons hidden successfully');
  }

  // Check if the document is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideButtons();
  } else {
    // If not, wait for it to load
    document.addEventListener('DOMContentLoaded', hideButtons);
  }
})();
