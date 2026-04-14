(function () {
  function resolveTarget(targetOrSelector) {
    if (!targetOrSelector) {
      return document.getElementById("page-content") || document.querySelector(".blur-target");
    }

    if (typeof targetOrSelector === "string") {
      return document.querySelector(targetOrSelector);
    }

    if (targetOrSelector instanceof Element) {
      return targetOrSelector;
    }

    return null;
  }

  function setBackgroundBlur(enabled, targetOrSelector) {
    var target = resolveTarget(targetOrSelector);
    if (!target) return;
    target.classList.toggle("is-blurred", Boolean(enabled));
  }

  function openBackgroundBlur(targetOrSelector) {
    setBackgroundBlur(true, targetOrSelector);
  }

  function closeBackgroundBlur(targetOrSelector) {
    setBackgroundBlur(false, targetOrSelector);
  }

  window.setBackgroundBlur = setBackgroundBlur;
  window.openBackgroundBlur = openBackgroundBlur;
  window.closeBackgroundBlur = closeBackgroundBlur;
})();
