(function () {
  /**
   * @param {string} modalId
   * @param {string|Element} blurTarget
   */
  function openModal(modalId, blurTarget) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal mit ID "${modalId}" nicht gefunden`);
      return;
    }

    modal.classList.remove("hidden");
    openBackgroundBlur(blurTarget || "#page-content");

    document.addEventListener("keydown", handleEscapeKey);
  }

  /**
   * @param {string} modalId
   * @param {string|Element} blurTarget
   */
  function closeModal(modalId, blurTarget) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`Modal mit ID "${modalId}" nicht gefunden`);
      return;
    }

    modal.classList.add("hidden");
    closeBackgroundBlur(blurTarget || "#page-content");

    if (!document.querySelector(".modal:not(.hidden)")) {
      document.removeEventListener("keydown", handleEscapeKey);
    }
  }


  function handleEscapeKey(e) {
    if (e.key === "Escape") {
      const openModals = document.querySelectorAll(".modal:not(.hidden)");
      if (openModals.length > 0) {
        const lastModal = openModals[openModals.length - 1];
        closeModal(lastModal.id);
      }
    }
  }


  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target.id);
    }
  });

  window.openModal = openModal;
  window.closeModal = closeModal;
})();
