(() => {
  function hideButtons() {
    // CSS rules for buttons with specific data-element-id attributes.
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

    /*
    // JavaScript to hide the KB button without affecting other elements.
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((btn) => {
      // Check if the button's inner text, when trimmed, equals "KB".
      // This approach is more precise than using a broad CSS selector.
      if (btn.innerText && btn.innerText.trim() === 'KB') {
        btn.style.display = 'none';
        console.log('KB button hidden successfully');
      }
    });
*/
    console.log('Teams and Profile buttons hidden successfully');
  }

  // Run the function when the DOM is loaded.
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    hideButtons();
  } else {
    document.addEventListener('DOMContentLoaded', hideButtons);
  }
})();
