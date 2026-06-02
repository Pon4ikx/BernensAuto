(() => {
    const SCRIPT_VERSION = "20260602-2";

    const forceLightTheme = () => {
        const html = document.documentElement;
        html.dataset.theme = "light";
        html.style.colorScheme = "light";
        try {
            localStorage.setItem("theme", "light");
        } catch (error) {
            /* Ignore storage access errors */
        }
    };

    const hideThemeControls = () => {
        const selectors = [
            ".theme-toggle",
            ".theme-switch",
            "button[aria-label*='theme' i]",
            "button[title*='theme' i]",
            "button[aria-label*='тема' i]",
            "button[title*='тема' i]",
        ];

        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
                element.style.display = "none";
            });
        });
    };

    const FILE_BTN_ICON =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l1-2zm3 16a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';

    const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i;

    const objectUrls = new WeakMap();

    const revokeObjectUrl = (img) => {
        const prev = objectUrls.get(img);
        if (prev) {
            URL.revokeObjectURL(prev);
            objectUrls.delete(img);
        }
    };

    const isImageFile = (file) =>
        Boolean(file && (file.type.startsWith("image/") || IMAGE_EXT_RE.test(file.name || "")));

    const isPhotoInput = (input) => {
        const name = (input.name || "").toLowerCase();
        return name.includes("photo") || name.includes("image");
    };

    const getFileLabel = (input) => (isPhotoInput(input) ? "Обзор" : "Выбрать файл");

    const getPhotoFieldCell = (input) =>
        input.closest("td.field-photo, td.field-image, td[class*='field-photo']");

    /** Левая колонка «Превью» в табличном инлайне */
    const getInlinePreviewCell = (input) => {
        const photoTd = getPhotoFieldCell(input);
        if (photoTd) {
            let prev = photoTd.previousElementSibling;
            while (prev && prev.tagName !== "TD") {
                prev = prev.previousElementSibling;
            }
            if (prev && prev.tagName === "TD") {
                return prev;
            }
        }

        const tr = input.closest("tr");
        if (!tr) return null;
        return (
            tr.querySelector("td.field-photo_preview") ||
            tr.querySelector("td.field-image_preview") ||
            null
        );
    };

    const isInlinePhotoUpload = (input) => Boolean(isPhotoInput(input) && getInlinePreviewCell(input));

    const getMediaLinkInCell = (cell) => {
        if (!cell) return null;
        return cell.querySelector("a[href*='/media/']");
    };

    const getMediaLinkNearInput = (input) => {
        const photoTd = getPhotoFieldCell(input);
        return getMediaLinkInCell(photoTd) || getMediaLinkInCell(getRow(input));
    };

    const getRow = (input) =>
        input.closest(".form-row, .field-photo, .field-image, .field-box, td, p, div");

    const getSavedFileName = (input) => {
        const link = getMediaLinkNearInput(input);
        if (!link) return "";
        const text = (link.textContent || "").trim();
        if (text) return text;
        const href = link.getAttribute("href") || "";
        return href.split("/").pop() || "";
    };

    const renderPreviewInto = (container, file, fallbackHref, fileLabel) => {
        container.innerHTML = "";

        if (file && isImageFile(file)) {
            const img = document.createElement("img");
            img.className = "bernans-file-preview";
            img.alt = "Превью";
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;
            objectUrls.set(img, objectUrl);
            container.appendChild(img);

            const path = document.createElement("div");
            path.className = "bernans-file-path";
            path.textContent = file.name;
            container.appendChild(path);
            return;
        }

        if (fallbackHref && IMAGE_EXT_RE.test(fallbackHref)) {
            const img = document.createElement("img");
            img.className = "bernans-file-preview";
            img.alt = "Превью";
            img.src = fallbackHref;
            container.appendChild(img);

            if (fileLabel) {
                const path = document.createElement("div");
                path.className = "bernans-file-path";
                path.textContent = fileLabel;
                container.appendChild(path);
            }
        }
    };

    const updateInlinePreviewCell = (input, file) => {
        const cell = getInlinePreviewCell(input);
        if (!cell) return;

        let box = cell.querySelector(":scope > .bernans-inline-preview");
        if (!box) {
            box = document.createElement("div");
            box.className = "bernans-inline-preview";
            cell.innerHTML = "";
            cell.appendChild(box);
        }

        if (file && isImageFile(file)) {
            box.querySelectorAll(".bernans-file-preview").forEach(revokeObjectUrl);
            renderPreviewInto(box, file, null);
            return;
        }

        const savedLink = getMediaLinkNearInput(input);
        const fallbackHref = savedLink?.getAttribute("href") || "";
        const savedName = getSavedFileName(input);

        if (fallbackHref) {
            renderPreviewInto(box, null, fallbackHref, savedName);
            return;
        }

        cell.innerHTML = '<span class="bernans-inline-preview-empty">—</span>';
    };

    const hideDuplicatePreviewsInPhotoCell = (input) => {
        const photoTd = getPhotoFieldCell(input);
        if (!photoTd) return;
        photoTd.querySelectorAll("img").forEach((img) => {
            img.style.display = "none";
        });
    };

    const collectNonPreviewSiblings = (input) => {
        const parent = input.parentNode;
        if (!parent) return [];

        const siblings = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node === input) continue;
            if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) continue;
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === "IMG") continue;
                if (node.querySelector && node.querySelector("img")) continue;
            }
            siblings.push(node);
        }
        return siblings;
    };

    const handlePhotoFileChange = (input) => {
        const file = input.files && input.files[0];
        const wrap = input.closest(".bernans-file-wrap");
        const nameEl = wrap?.querySelector(".bernans-file-name");

        if (nameEl) {
            if (file) {
                nameEl.textContent = file.name;
                nameEl.classList.add("bernans-file-name--selected");
            } else {
                const savedName = getSavedFileName(input);
                nameEl.textContent = savedName || "Файл не выбран";
                nameEl.classList.toggle("bernans-file-name--selected", Boolean(savedName));
            }
        }

        if (isInlinePhotoUpload(input)) {
            updateInlinePreviewCell(input, file || null);
        }
    };

    const enhanceFileInput = (input) => {
        if (input.dataset.bernansFileEnhanced === "1") return;
        if (input.closest(".bernans-file-wrap")) return;

        const inlinePhoto = isInlinePhotoUpload(input);
        const existingName = getSavedFileName(input);
        const widgetSiblings = inlinePhoto ? collectNonPreviewSiblings(input) : collectWidgetSiblingsLegacy(input);

        input.dataset.bernansFileEnhanced = "1";
        input.classList.add("bernans-file-enhanced");

        const wrap = document.createElement("div");
        wrap.className = inlinePhoto
            ? "bernans-file-wrap bernans-file-wrap--inline-photo"
            : "bernans-file-wrap";

        if (!inlinePhoto) {
            const previewBlock = document.createElement("div");
            previewBlock.className = "bernans-file-existing bernans-file-live";
            const previewHref = getMediaLinkNearInput(input)?.getAttribute("href") || "";
            if (previewHref) {
                renderPreviewInto(previewBlock, null, previewHref, existingName);
            }
            if (previewBlock.childNodes.length) {
                wrap.appendChild(previewBlock);
            }
        } else {
            const meta = document.createElement("div");
            meta.className = "bernans-file-meta";
            widgetSiblings.forEach((node) => meta.appendChild(node));
            if (meta.childNodes.length) {
                wrap.appendChild(meta);
            }
            hideDuplicatePreviewsInPhotoCell(input);
        }

        if (!input.id) {
            input.id = `bernans_file_${Math.random().toString(36).slice(2, 9)}`;
        }

        const label = document.createElement("label");
        label.className = "bernans-file-btn";

        const inner = document.createElement("span");
        inner.className = "bernans-file-btn-inner";

        const icon = document.createElement("span");
        icon.className = "bernans-file-btn-icon";
        icon.innerHTML = FILE_BTN_ICON;

        const btnText = document.createElement("span");
        btnText.className = "bernans-file-btn-text";
        btnText.textContent = getFileLabel(input);

        inner.appendChild(icon);
        inner.appendChild(btnText);

        const nameEl = document.createElement("span");
        nameEl.className = "bernans-file-name";
        nameEl.textContent = existingName || "Файл не выбран";
        if (existingName) {
            nameEl.classList.add("bernans-file-name--selected");
        }

        const controls = document.createElement("div");
        controls.className = "bernans-file-controls";

        const parent = input.parentNode;
        parent.insertBefore(wrap, input);
        controls.appendChild(label);
        label.appendChild(inner);
        label.appendChild(input);
        controls.appendChild(nameEl);
        wrap.appendChild(controls);
    };

    function collectWidgetSiblingsLegacy(input) {
        const parent = input.parentNode;
        if (!parent) return [];
        const siblings = [];
        for (const node of Array.from(parent.childNodes)) {
            if (node === input) continue;
            if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) continue;
            siblings.push(node);
        }
        return siblings;
    }

    const enhanceFileInputs = () => {
        const root = document.getElementById("content-main") || document.getElementById("content");
        if (!root) return;
        root.querySelectorAll('input[type="file"]:not([data-bernans-file-enhanced])').forEach(enhanceFileInput);
    };

    const watchFileInputs = () => {
        const root = document.getElementById("content");
        if (!root || root.dataset.bernansFileWatch === "1") return;
        root.dataset.bernansFileWatch = "1";
        const observer = new MutationObserver(() => enhanceFileInputs());
        observer.observe(root, { childList: true, subtree: true });
    };

    document.addEventListener(
        "change",
        (event) => {
            const input = event.target;
            if (!input || input.type !== "file") return;
            if (!input.closest("#content-main, #content")) return;
            if (!isPhotoInput(input)) return;
            handlePhotoFileChange(input);
        },
        true
    );

    forceLightTheme();
    hideThemeControls();
    enhanceFileInputs();
    watchFileInputs();

    window.addEventListener("load", () => {
        forceLightTheme();
        hideThemeControls();
        enhanceFileInputs();
        watchFileInputs();
    });

    document.documentElement.dataset.bernansAdminJs = SCRIPT_VERSION;
})();
