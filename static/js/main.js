document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const toggleIcon = document.getElementById("toggleIcon");
  const moonIcon = document.getElementById("moonIcon");
  const sunIcon = document.getElementById("sunIcon");

  const fileUpload = document.getElementById("fileUploadLabel");
  const fileInput = document.getElementById("file-input");
  const filenameDisplay = document.getElementById("filename");
  const previewImage = document.getElementById("imagePreview");
  const convertBtn = document.getElementById("convertBtn");
  const extractedTextContainer = document.getElementById("extractedText");
  const downloadLink = document.getElementById("downloadLink");

  let selectedFile = null;

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
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

  // Prevent default on drag/drop events
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
      fileInput.value = "";
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

    // Show loading animation by adding a class
    convertBtn.disabled = true;
    convertBtn.classList.add("loading");
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
      // Remove loading animation and enable button
      convertBtn.disabled = false;
      convertBtn.classList.remove("loading");
    }
  });
});
