(() => {
    const SCRIPT_VERSION = "20260602-1";

    const setFileOnInput = (input, file) => {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
    };

    const getFormsetPrefix = (inlineGroup) => {
        const totalInput = inlineGroup.querySelector('input[name$="-TOTAL_FORMS"]');
        if (totalInput) {
            return totalInput.name.replace(/-TOTAL_FORMS$/, "");
        }
        const id = inlineGroup.id || "";
        return id.replace(/-group$/, "");
    };

    const getTotal = (prefix) => {
        const el = document.getElementById(`id_${prefix}-TOTAL_FORMS`);
        return el ? parseInt(el.value, 10) : 0;
    };

    const waitForTotal = (prefix, previousTotal) =>
        new Promise((resolve) => {
            let attempts = 0;
            const tick = () => {
                const current = getTotal(prefix);
                if (current > previousTotal || attempts >= 120) {
                    resolve(current);
                    return;
                }
                attempts += 1;
                setTimeout(tick, 30);
            };
            tick();
        });

    const clickAddRow = (inlineGroup) => {
        const link = inlineGroup.querySelector("tr.add-row a, .add-row a");
        if (link) {
            link.click();
            return true;
        }
        return false;
    };

    const findEmptyPhotoInput = (inlineGroup, prefix) => {
        const total = getTotal(prefix);
        for (let i = 0; i < total; i += 1) {
            const deleteInput = document.getElementById(`id_${prefix}-${i}-DELETE`);
            if (deleteInput && deleteInput.checked) continue;

            const input = document.getElementById(`id_${prefix}-${i}-photo`);
            if (!input) continue;

            const photoCell = input.closest("td");
            if (photoCell && photoCell.querySelector('a[href*="/media/"]')) continue;
            if (!input.files || input.files.length === 0) return input;
        }
        return null;
    };

    const assignFileToRow = (input, file) => {
        setFileOnInput(input, file);
        input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const assignFilesToInline = async (inlineGroup, files) => {
        const prefix = getFormsetPrefix(inlineGroup);
        if (!prefix) return;

        const list = Array.from(files).filter((f) => f && f.size > 0);
        if (!list.length) return;

        for (const file of list) {
            let input = findEmptyPhotoInput(inlineGroup, prefix);
            if (!input) {
                const before = getTotal(prefix);
                if (!clickAddRow(inlineGroup)) break;
                await waitForTotal(prefix, before);
                input = document.getElementById(`id_${prefix}-${getTotal(prefix) - 1}-photo`);
            }
            if (input) {
                assignFileToRow(input, file);
            }
        }
    };

    const createBulkUploadUi = (inlineGroup) => {
        const wrap = document.createElement("div");
        wrap.className = "bernans-bulk-photo";

        const title = document.createElement("p");
        title.className = "bernans-bulk-photo-title";
        title.textContent = "Загрузить несколько фото сразу";

        const hint = document.createElement("p");
        hint.className = "bernans-bulk-photo-hint";
        hint.textContent =
            "Выберите несколько изображений в проводнике — для каждого файла появится отдельная строка ниже. Не забудьте нажать «Сохранить».";

        const controls = document.createElement("div");
        controls.className = "bernans-bulk-photo-controls";

        const label = document.createElement("label");
        label.className = "bernans-bulk-photo-btn";

        const labelText = document.createElement("span");
        labelText.textContent = "Выбрать несколько фото";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.className = "bernans-bulk-photo-input";

        const status = document.createElement("span");
        status.className = "bernans-bulk-photo-status";
        status.textContent = "Файлы не выбраны";

        label.appendChild(labelText);
        label.appendChild(input);
        controls.appendChild(label);
        controls.appendChild(status);

        wrap.appendChild(title);
        wrap.appendChild(hint);
        wrap.appendChild(controls);

        input.addEventListener("change", async () => {
            const files = input.files;
            if (!files || !files.length) {
                status.textContent = "Файлы не выбраны";
                return;
            }

            status.textContent = `Добавляем ${files.length} фото…`;
            input.disabled = true;

            try {
                await assignFilesToInline(inlineGroup, files);
                status.textContent = `Добавлено строк: ${files.length}. Сохраните форму.`;
            } catch (error) {
                status.textContent = "Не удалось добавить все фото. Попробуйте ещё раз.";
            } finally {
                input.value = "";
                input.disabled = false;
            }
        });

        return wrap;
    };

    const initPhotoInlineBulk = (inlineGroup) => {
        if (inlineGroup.dataset.bulkPhotoInit === "1") return;
        if (!inlineGroup.querySelector('input[type="file"][name*="-photo"]')) return;

        inlineGroup.dataset.bulkPhotoInit = "1";

        const fieldset = inlineGroup.querySelector("fieldset.module");
        const bulkUi = createBulkUploadUi(inlineGroup);

        if (fieldset) {
            const heading = fieldset.querySelector("h2");
            if (heading && heading.nextSibling) {
                heading.insertAdjacentElement("afterend", bulkUi);
            } else {
                fieldset.insertBefore(bulkUi, fieldset.firstChild);
            }
        } else {
            inlineGroup.insertBefore(bulkUi, inlineGroup.firstChild);
        }
    };

    const initAll = () => {
        document
            .querySelectorAll(".js-inline-admin-formset.inline-group, .inline-group")
            .forEach(initPhotoInlineBulk);
    };

    const watch = () => {
        const root = document.getElementById("content");
        if (!root || root.dataset.bulkPhotoWatch === "1") return;
        root.dataset.bulkPhotoWatch = "1";
        const observer = new MutationObserver(() => initAll());
        observer.observe(root, { childList: true, subtree: true });
    };

    initAll();
    watch();

    window.addEventListener("load", () => {
        initAll();
        watch();
    });

    document.documentElement.dataset.bernansBulkPhotoJs = SCRIPT_VERSION;
})();
