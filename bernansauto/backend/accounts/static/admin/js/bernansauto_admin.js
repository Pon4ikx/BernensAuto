(() => {
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

    const getFileLabel = (input) => {
        const name = (input.name || "").toLowerCase();
        if (name.includes("photo") || name.includes("image")) {
            return "Обзор";
        }
        return "Выбрать файл";
    };

    const getFileNameFromPage = (input) => {
        const row = input.closest(".form-row, .field-photo, .field-image, td, p, div");
        if (!row) return "";
        const link = row.querySelector("a[href*='/media/']");
        if (!link) return "";
        const text = (link.textContent || "").trim();
        if (text) return text;
        const href = link.getAttribute("href") || "";
        const parts = href.split("/");
        return parts[parts.length - 1] || "";
    };

    const enhanceFileInput = (input) => {
        if (input.dataset.bernansFileEnhanced === "1") return;
        if (input.closest(".bernans-file-wrap")) return;

        input.dataset.bernansFileEnhanced = "1";
        input.classList.add("bernans-file-enhanced");

        const wrap = document.createElement("div");
        wrap.className = "bernans-file-wrap";

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
        const existingName = getFileNameFromPage(input);
        nameEl.textContent = existingName || "Файл не выбран";
        if (existingName) {
            nameEl.classList.add("bernans-file-name--selected");
        }

        const parent = input.parentNode;
        parent.insertBefore(wrap, input);
        wrap.appendChild(label);
        label.appendChild(inner);
        label.appendChild(input);
        wrap.appendChild(nameEl);

        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (file) {
                nameEl.textContent = file.name;
                nameEl.classList.add("bernans-file-name--selected");
                return;
            }
            nameEl.textContent = existingName || "Файл не выбран";
            nameEl.classList.toggle("bernans-file-name--selected", Boolean(existingName));
        });
    };

    const enhanceFileInputs = () => {
        document
            .querySelectorAll('#content-main input[type="file"]:not([data-bernans-file-enhanced])')
            .forEach(enhanceFileInput);
    };

    const watchFileInputs = () => {
        const root = document.getElementById("content");
        if (!root || root.dataset.bernansFileWatch === "1") return;
        root.dataset.bernansFileWatch = "1";
        const observer = new MutationObserver(() => enhanceFileInputs());
        observer.observe(root, { childList: true, subtree: true });
    };

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
})();
