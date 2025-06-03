document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const toggleCircle = document.querySelector(".switch-thumb");  // fixed selector
  const toggleIcon = document.getElementById("toggleIcon");      // fixed ID

  const fileUpload = document.getElementById("fileUploadLabel");
  const fileInput = document.getElementById("file-input");
  const filenameDisplay = document.getElementById("filename");
  const previewImage = document.getElementById("imagePreview");
  const convertBtn = document.getElementById("convertBtn");
  const extractedTextContainer = document.getElementById("extractedText");
  const downloadLink = document.getElementById("downloadLink");

  let selectedFile = null;

  // Theme toggle setup
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    toggleCircle.style.left = theme === "light" ? "27px" : "1px"; // match your CSS thumb position
    toggleIcon.textContent = theme === "light" ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }

  let currentTheme = localStorage.getItem("theme") || "dark";
  setTheme(currentTheme);

  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(currentTheme);
    localStorage.setItem("theme", currentTheme);
  });

  themeToggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      themeToggle.click();
    }
  });

  // Prevent default drag/drop behavior on fileUpload container
  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt => {
    fileUpload.addEventListener(evt, e => e.preventDefault());
  });

  fileUpload.addEventListener("dragover", () => {
    fileUpload.classList.add("dragover");
  });

  fileUpload.addEventListener("dragleave", () => {
    fileUpload.classList.remove("dragover");
  });

  fileUpload.addEventListener("drop", (e) => {
    fileUpload.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0]);
      fileInput.value = ""; // reset input to allow re-selecting same file later
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      selectFile(fileInput.files[0]);
    } else {
      resetFileSelection();
    }
  });

  function selectFile(file) {
    selectedFile = file;
    filenameDisplay.textContent = `Selected file: ${file.name}`;
    convertBtn.disabled = false;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        previewImage.hidden = false;
      };
      reader.readAsDataURL(file);
    } else {
      clearPreview();
    }
  }

  function clearPreview() {
    previewImage.src = "";
    previewImage.style.display = "none";
    previewImage.hidden = true;
  }

  function resetFileSelection() {
    selectedFile = null;
    filenameDisplay.textContent = "";
    clearPreview();
    convertBtn.disabled = true;
  }

  convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
      alert("Please select a file before uploading.");
      return;
    }

    convertBtn.disabled = true;
    extractedTextContainer.textContent = "Processing...";
    downloadLink.hidden = true;
    downloadLink.href = "#";
    downloadLink.download = "";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errMsg = response.statusText;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch { }
        extractedTextContainer.textContent = `Error: ${errMsg}`;
        convertBtn.disabled = false;
        return;
      }

      const data = await response.json();
      extractedTextContainer.textContent = data.text || "No text extracted.";

      if (data.download_url) {
        downloadLink.href = data.download_url;
        downloadLink.download = data.download_url.split('/').pop();
        downloadLink.hidden = false;
      } else {
        downloadLink.hidden = true;
      }
    } catch (error) {
      extractedTextContainer.textContent = `Error: ${error.message}`;
    } finally {
      convertBtn.disabled = false;
    }
  });
});
