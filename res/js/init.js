let lineItems = [];
let canvas, ctx, isDrawing = false;
let attachments = [];

let savedRfpId = '';

function getFormData() {
    const form = document.querySelector('form');
    const formData = new FormData(form);

    return formData;
}

function generateRfpId() {
    // Set today's date
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    document.getElementById('date_submitted').value = today;

    let year = now.getFullYear();

    // 1. Get milliseconds elapsed since the start of the current year
    const startOfYear = new Date(year, 0, 1);
    const msThisYear = now - startOfYear;

    // 2. Convert to Base-36 (alphanumeric) and uppercase it (~6 to 7 characters)
    const timePart = msThisYear.toString(36).toUpperCase();

    // 3. Generate a 1-character random alphanumeric suffix to prevent exact-millisecond collisions
    const randomPart = Math.random().toString(36).substring(2, 3).toUpperCase();

    // Convert Year to Fiscal Year
    // 1. Assume it's Fiscal Year of This Year
    let fy = `FY${year.toString().slice(-2)}`;

    // 2. Is it after June 30th?
    if (now.getMonth() > 6) {
        year = year + 1;
        fy = `FY${year.toString().slice(-2)}`;
    }

    // Generate Final ID (e.g., RFP-2026-KF839AB2)
    const randomId = `${fy}-${timePart}${randomPart}`;
    
    // old method: Generate Random Form ID
    // const randomId = 'RFP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    return randomId;
}

function updateRfpType() {
    const formData = getFormData();

    let id = 'RFP';

    switch(formData.get('cost_center')) {
        case 'Administration':
            id = 'CHU';
            break;
        case 'School':
            id = 'SCH';
            break;
        case 'Miner Catholic':
            id = 'MST';
            break;
        case 'ECC':
            id = 'ECC';
            break;
        case 'Preschool':
            id = 'PRE';
            break;
        case 'Home & School (H&SA)':
            id = 'HSA';
            break;
        case 'Lunch Program':
            id = 'LUN';
            break;
        default:
            id = 'RFP';
    }
    
    id = id.toUpperCase();
    
    document.getElementById('rfp-type').value = id;
}

function updateRfpId() {
    if (savedRfpId == '') {
        savedRfpId = generateRfpId();
    }

    document.getElementById('rfp-id').value = savedRfpId;
}

// Payment Method Toggle Controls
function togglePaymentFields() {
    // figure out what's checked
    const method = document.querySelector('input[name="order_method"]:checked');

    if (method) {
        // disable payee name if not checks
        if (method.value == 'reimburse_me') {
            document.getElementById('payee_name').disabled = false;
        } else {
            document.getElementById('payee_name').disabled = true;
        }
    }
}

function selectThisOther(e) {
    let other = e.getAttribute('data-other');
    otherElem = document.querySelector(`input[type="radio"][name="${other}"][value="Other"]`);
    otherElem.checked = true;
}

// Dynamic Line Item Functions
function addLineItem(vendor = '', account = '', desc = '', qty = 1, cost = 0.00) {
    const id = Date.now() + Math.random();
    lineItems.push({ id, vendor, account, desc, qty, cost });
    renderLineItems();
    calculateTotals();
}

function removeLineItem(id) {
    // if (lineItems.length <= 1) {
    //     // showToast("At least one line item is required.", "warning");
    //     return;
    // }
    lineItems = lineItems.filter(item => item.id !== id);
    renderLineItems();
    calculateTotals();
}

function updateLineItem(id, field, value) {
    const item = lineItems.find(i => i.id === id);
    if (item) {
        if (field === 'qty') item.qty = parseFloat(value) || 0;
        else if (field === 'cost') item.cost = parseFloat(value) || 0;
        else item[field] = value;

        const totalElem = document.getElementById(`line-total-${id}`);
        if (totalElem) {
            const rowTotal = item.qty * item.cost;
            totalElem.innerText = '$' + rowTotal.toFixed(2);
        }
        calculateTotals();
    }
}

function renderLineItems() {
    const tbody = document.getElementById('line-items-tbody');
    tbody.innerHTML = '';

    lineItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        // tr.className = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
        tr.classList.add('line-item');

        tr.setAttribute('data-id', item.id);

        const rowTotal = (item.qty * item.cost).toFixed(2);

        tr.innerHTML = `
                    <td>
                        <input type="text" value="${escapeHtml(item.vendor)}" oninput="updateLineItem(${item.id}, 'vendor', this.value)" placeholder="Vendor">
                    </td>
                    <td>
                        <input type="text" value="${escapeHtml(item.account)}" oninput="updateLineItem(${item.id}, 'account', this.value)" placeholder="Account #">
                    </td>
                    <td>
                        <input type="text" value="${escapeHtml(item.desc)}" oninput="updateLineItem(${item.id}, 'desc', this.value)" placeholder="Item Description / Purpose">
                    </td>
                    <td>
                        <input type="number" min="1" value="${item.qty}" oninput="updateLineItem(${item.id}, 'qty', this.value)">
                    </td>
                    <td>
                        <input type="number" step="0.01" min="0" value="${item.cost.toFixed(2)}" oninput="updateLineItem(${item.id}, 'cost', this.value)">
                    </td>
                    <td id="line-total-${item.id}" class="line-total">
                        $${rowTotal}
                    </td>
                    <td class="no-print">
                        <button type="button" onclick="removeLineItem(${item.id})" title="Remove Line">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

function calculateTotals() {
    let subtotal = 0;
    lineItems.forEach(item => {
        subtotal += (item.qty * item.cost);
    });

    const shipping = parseFloat(document.getElementById('shipping_amount').value) || 0;
    const discount = parseFloat(document.getElementById('discount_amount').value) || 0;
    const grandTotal = Math.max(0, subtotal + shipping - discount);

    document.getElementById('subtotal-display').innerText = '$' + subtotal.toFixed(2);
    document.getElementById('grand-total-display').innerText = '$' + grandTotal.toFixed(2);
}

// Signature Canvas & Typed Signature Logic
function initSignaturePad() {
    canvas = document.getElementById('sig-canvas');
    ctx = canvas.getContext('2d');
    ctx.strokeStyle = "#1b4332";
    ctx.lineWidth = 2;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', (e) => { startDrawing(e); e.preventDefault(); });
    canvas.addEventListener('touchmove', (e) => { draw(e); e.preventDefault(); });
    canvas.addEventListener('touchend', stopDrawing);
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleSignatureMode() {
    const mode = document.querySelector('input[name="sig_mode"]:checked').value;
    const drawContainer = document.getElementById('sig-draw-container');
    const typeContainer = document.getElementById('sig-type-container');

    if (mode === 'draw') {
        drawContainer.classList.remove('hidden');
        typeContainer.classList.add('hidden');
    } else {
        drawContainer.classList.add('hidden');
        typeContainer.classList.remove('hidden');
    }
}

// ---------------------------------------------------------------------------
// File Attachments
//
// Each attachment is stored as { id, name, type, size, dataUrl }.
// Keeping the file as a data: URL means
//   - an <img> can display it directly,
//   - pdf.js can decode it (via dataUrlToBytes),
//   - it drops straight into the saved JSON with no extra conversion.
//
// Printable pages are rendered as soon as a file is attached, not when Print
// is clicked. window.print() is synchronous and won't wait for pdf.js, and this
// way the pages are also present if someone prints from the browser menu.
// ---------------------------------------------------------------------------

// Resolve pdf.js paths relative to this script so it works wherever the app is hosted.
const PDFJS_BASE = new URL('pdfjs/build/', document.currentScript.src);
let pdfjsLibPromise = null;

// Resolves once every pending attachment has finished rendering.
let attachmentsReady = Promise.resolve();

function loadPdfJs() {
    // pdf.js ships as an ES module; dynamic import() lets this classic script load it on demand.
    if (!pdfjsLibPromise) {
        pdfjsLibPromise = import(new URL('pdf.mjs', PDFJS_BASE).href).then(lib => {
            lib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.mjs', PDFJS_BASE).href;
            return lib;
        });
        // Let a later attempt retry if loading failed.
        pdfjsLibPromise.catch(() => { pdfjsLibPromise = null; });
    }
    return pdfjsLibPromise;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function dataUrlToBytes(dataUrl) {
    const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function isPdf(att) {
    return att.type === 'application/pdf' || /\.pdf$/i.test(att.name);
}

async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    // Clear the input so picking the same file again still fires onchange.
    e.target.value = '';

    for (const file of files) {
        try {
            addAttachment({
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: await readFileAsDataUrl(file)
            });
        } catch (err) {
            console.error(`Could not read ${file.name}`, err);
            alert(`Could not read "${file.name}".`);
        }
    }
}

function addAttachment(att) {
    att.id = att.id || (Date.now() + Math.random()).toString(36);
    attachments.push(att);

    renderAttachmentPreviews();

    // Make this attachment's print container now, in order, so files appear in
    // the order they were added no matter which one finishes rendering first.
    const holder = document.createElement('div');
    holder.dataset.attachmentId = att.id;
    document.getElementById('print-attachments').appendChild(holder);

    const job = renderAttachmentForPrint(att, holder).catch(err => {
        console.error(`Could not render ${att.name}`, err);
        holder.innerHTML = '';
        holder.appendChild(makeAttachmentPage(att,
            `Could not render this file for printing. Please print "${att.name}" separately.`));
    });
    attachmentsReady = Promise.all([attachmentsReady, job]);
}

function removeAttachment(id) {
    attachments = attachments.filter(a => a.id !== id);
    document.querySelector(`#print-attachments [data-attachment-id="${id}"]`)?.remove();
    renderAttachmentPreviews();
}

function clearAttachments() {
    attachments = [];
    document.getElementById('print-attachments').innerHTML = '';
    renderAttachmentPreviews();
}

// Builds a <figure> that will start a new printed page, with a small caption.
function makeAttachmentPage(att, captionExtra = '') {
    const figure = document.createElement('figure');
    figure.className = 'attachment-page';
    const caption = document.createElement('figcaption');
    // The RFP number is filled in by updateAttachmentCaptions() at print time,
    // in case the cost center / ID changes after the file was attached.
    const rfpRef = document.createElement('span');
    rfpRef.className = 'rfp-ref';
    caption.append(rfpRef, ` Attachment: ${att.name}${captionExtra ? ' · ' + captionExtra : ''}`);
    figure.appendChild(caption);
    return figure;
}

function updateAttachmentCaptions() {
    const rfp = `${document.getElementById('rfp-type').value}-${document.getElementById('rfp-id').value} ·`;
    for (const span of document.querySelectorAll('#print-attachments .rfp-ref')) {
        span.textContent = rfp;
    }
}

async function renderAttachmentForPrint(att, holder) {
    if (!isPdf(att)) {
        // Images: an <img> is all that's needed; CSS scales it to fit the page.
        const page = makeAttachmentPage(att);
        const img = document.createElement('img');
        img.src = att.dataUrl;
        page.appendChild(img);
        holder.appendChild(page);
        return;
    }

    // PDFs: draw each page onto its own <canvas>.
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: dataUrlToBytes(att.dataUrl) });

    try {
        const pdf = await loadingTask.promise;

        for (let n = 1; n <= pdf.numPages; n++) {
            // The file may have been removed while we were rendering.
            if (!holder.isConnected) return;

            const page = await pdf.getPage(n);

            // PDF units are 1/72 in. Scale 2 gives ~144 DPI: sharp on paper
            // without using too much memory. Raise it for sharper prints.
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const context = canvas.getContext('2d');

            // Transparent PDFs would otherwise come out with no background.
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: context, viewport, intent: 'print' }).promise;
            page.cleanup();

            const figure = makeAttachmentPage(att, `Page ${n} of ${pdf.numPages}`);
            figure.appendChild(canvas);
            holder.appendChild(figure);

            if (n === 1) setPdfThumbnail(att.id, canvas);
        }
    } finally {
        // Frees the parsed document and its worker-side memory.
        loadingTask.destroy();
    }
}

// Copies a rendered first page into the small preview card.
function setPdfThumbnail(id, sourceCanvas) {
    const thumbHolder = document.querySelector(`.attachment-card[data-attachment-id="${id}"] .thumb`);
    if (!thumbHolder) return;

    const thumb = document.createElement('canvas');
    const scale = Math.min(85 / sourceCanvas.width, 110 / sourceCanvas.height);
    thumb.width = Math.round(sourceCanvas.width * scale);
    thumb.height = Math.round(sourceCanvas.height * scale);
    thumb.getContext('2d').drawImage(sourceCanvas, 0, 0, thumb.width, thumb.height);
    thumb.className = 'thumb';
    thumbHolder.replaceWith(thumb);

    // Keep it for when the preview list is redrawn.
    const att = attachments.find(a => a.id === id);
    if (att) att.thumbUrl = thumb.toDataURL();
}

function renderAttachmentPreviews() {
    const container = document.getElementById('file-preview-container');
    container.innerHTML = '';

    for (const att of attachments) {
        const card = document.createElement('div');
        card.className = 'attachment-card';
        card.dataset.attachmentId = att.id;

        let thumb;
        if (!isPdf(att) || att.thumbUrl) {
            thumb = document.createElement('img');
            thumb.src = att.thumbUrl || att.dataUrl;
        } else {
            thumb = document.createElement('div');
            thumb.innerHTML = `<i class="fa-solid fa-file-pdf" style="font-size:2em"></i><span>PDF</span>`;
        }
        thumb.classList.add('thumb');

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = `✓ ${att.name} (${(att.size / 1024).toFixed(1)} KB)`;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'red underlined';
        remove.innerHTML = '<i class="fa-solid fa-trash-can"></i> Remove';
        remove.onclick = () => removeAttachment(att.id);

        card.append(thumb, name, remove);
        container.appendChild(card);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function exportJSON() {
    //this used to use formdata but it doesn't include everything so now i do this

    let saveFile = {
        "version" : 2,
        "radios" : [],
        "checkboxes" : [],
        "text" : [],
        "lineItems" : [],
        "signature" : "",
        "attachments" : []
    }

    // Save radio buttons
    let radios = document.querySelectorAll('input[type="radio"]');

    for (let radio of radios) {

        if (radio.checked) {
            saveFile.radios.push([radio.name, radio.value]);
        }
    }

    // Save checkboxes
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');

    for (let checkbox of checkboxes) {
        saveFile.checkboxes.push([checkbox.name, checkbox.checked]);
    }

    // Save text values
    let inputValues = document.querySelectorAll('input[type="text"],input[type="date"],input[type="number"]');

    for (let text of inputValues) {
        // skip inputs with no name (line items)
        if (text.name == '') continue;

        saveFile.text.push([text.name, text.value]);
    }

    // add line items
    saveFile.lineItems = lineItems;

    // add signature
    saveFile.signature = canvas.toDataURL();

    // add attached files (already stored as data: URLs, so they embed as plain strings)
    saveFile.attachments = attachments.map(({ name, type, size, dataUrl }) => ({ name, type, size, dataUrl }));

    const jsonStr = JSON.stringify(saveFile, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const concat = `${document.querySelector('#rfp-type').value}-${document.querySelector('#rfp-id').value}-${document.querySelector('#submitted_by').value}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = `${concat}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // showToast("Exported JSON file!", "success");
}

function triggerJSONImport() {
    document.getElementById('json_import_input').click();
}

function loadForm(form) {

    try {
        const data = JSON.parse(form);
        
        for (let radio of data.radios) {
            let key = radio[0];
            let value = radio[1];

            const input = document.querySelector(`input[type="radio"][name="${CSS.escape(key)}"][value="${CSS.escape(value)}"]`);
            if (input) input.checked = true;
        }

        for (let checkbox of data.checkboxes) {
            let key = checkbox[0];
            let value = checkbox[1];

            document.querySelector(`input[type="checkbox"][name="${key}"]`).checked = value;
        }

        for (let text of data.text) {
            let key = text[0];
            let value = text[1];

            document.querySelector(`input[name="${key}"]`).value = value;
        }

        // Setting .checked/.value from code does NOT fire onchange, so re-run the
        // handlers that depend on those fields by hand.
        togglePaymentFields();
        toggleSignatureMode();
        hideOrShowUploads();

        lineItems = data.lineItems;
        renderLineItems();

        if (data.signature) {
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
            };
            img.src = data.signature;
        }

        // Restore attachments (older v1 save files don't have any)
        clearAttachments();
        for (const att of data.attachments || []) {
            addAttachment({ name: att.name, type: att.type, size: att.size, dataUrl: att.dataUrl });
        }

        calculateTotals();
        
        var el = document.querySelectorAll('input[type="date"]');

        for (let element of el) {
            checkIfEmpty(element);
        }
    } catch (err) {
        console.error("Error loading saved form", err);
    }
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            // localStorage.setItem('st_pat_rfp_v2_saved', event.target.result);
            loadForm(event.target.result);
            // showToast("Form imported successfully!", "success");
        } catch (err) {
            // showToast("Invalid JSON file.", "error");
        }
    };
    reader.readAsText(file);
}

// Custom Modal Controls
function openResetModal() {
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeResetModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
}

function confirmResetForm() {
    closeResetModal();
    localStorage.removeItem('st_pat_rfp_v2_saved');
    location.reload();
}

function viewChangelogModal() {
    document.getElementById('changelog-modal').classList.remove('hidden');
}

function closeChangelogModal() {
    document.getElementById('changelog-modal').classList.add('hidden');
}

function clearInvalid() {
    let invalid = this.closest(".invalid")
    if (invalid) { invalid.classList.remove('invalid'); }
}

for (let input of document.querySelectorAll('input')) {
    input.addEventListener('click', clearInvalid)
}

for (let radio of document.querySelectorAll('#cost-centers input[type="radio"]')) {
    radio.addEventListener('change', updateRfpType);
}

function hideOrShowUploads() {
    let isTrue = document.getElementById('recepits-printed-separately').checked;
    let uploads = document.getElementById('uploads');

    if (isTrue) {
        uploads.style.display = 'none';
    } else {
        uploads.style.display = 'block';
    }

    // Don't print the digital attachments if the paper ones are being used instead.
    document.getElementById('print-attachments').classList.toggle('suppressed', isTrue);
}

function prepForPrint() {
    // clear out all invalid things
    for (element of document.querySelectorAll('.invalid')) {
        element.classList.remove('invalid');
    }

    // blank all disabled fields
    for (input of document.querySelectorAll('input:disabled')) {
        if (['radio', 'checkbox'].includes(input.type)) {
            if (input.checked) { input.checked = false }
        } else {
            if (input.value) { input.value = ""; }
        }
    }
}

function printTemplate() {
    prepForPrint();

    for (input of document.querySelectorAll('input')) {
        if (['radio', 'checkbox'].includes(input.type)) {
            if (input.checked) { input.checked = false }
        } else {
            if (input.value) { input.value = ""; }
        }
        input.disabled = false;
    }

    // remove all line items
    for (row of document.querySelectorAll('.line-item')) {
        console.log(`removing ${row.getAttribute("data-id")}`)
        removeLineItem(parseFloat(row.getAttribute("data-id")));
    }

    // add 11 blank ones
    for(let i=0;i<11;i++) {
        addLineItem();
    }

    // completely futz up the table by removing all labels
    let table = document.querySelector('table');

    for (let input of table.querySelectorAll('input')) {
        input.value = '';
    }
    for (let total of table.querySelectorAll('.line-total')) {
        total.textContent = '';
    }

    for (let i of ['subtotal-display', 'sales-tax', 'grand-total-display']) {
        document.querySelector(`#${i}`).textContent = '';
    }

    // footer only on page 2
    document.querySelector('tfoot').style.display = 'table-row-group';

    // clear signature
    clearSignature();

    // remove void warning
    document.body.classList.add('valid');

    // no attachments on a blank template
    document.getElementById('print-attachments').innerHTML = '';

    // mark all dates invalid
    for (let el of document.querySelectorAll('input[type="date"]')) { checkIfEmpty(el); }

    // print it!
    window.print();

    // refresh the page afterwards to restore everything
    window.location.reload();
}

async function validateAndPrint() {
    prepForPrint();

    // blank other fields if other not checked
    if (!document.querySelector('input[name="bank_account_choice"][value="Other"]').checked) { document.getElementById('bank_account_other_text').value = ''; }

    // time to actually validate
    let invalid_reason = '';

    // innocent until proven guilty
    let valid = true;
    let sectionValid = true;

    // 1: name and date
    let section = document.getElementById('name');
    
    if (!document.getElementById('submitted_by').value) {
        sectionValid = false;
        invalid_reason += 'Name cannot be blank.\n';
    }

    let now = new Date();
    let today = now.toISOString().split('T')[0];
    if (document.getElementById('date_submitted').value < today) {
        sectionValid = false;
        invalid_reason += 'Submission date cannot be prior to the current date.\n';        
    }

    if (!document.getElementById('cost-centers').querySelector('input[type="radio"]:checked')) {
        let section = document.querySelector("#cost-centers");
        section.classList.add('invalid');
        invalid_reason = 'At least one cost center must be selected.\n';

        sectionValid = false;
    }

    if (!sectionValid) {
        valid = false;
        section.classList.add('invalid');
        section.setAttribute("data-invalid-reason", invalid_reason);
    }

    sectionValid = true;

    // 2: payment method.
    section = document.getElementById('payment-method');
    invalid_reason = '';
    
    // get payment method:
    const method = document.querySelector('input[name="order_method"]:checked');

    if (!method) {
        sectionValid = false;
        invalid_reason = "You must select if you are paying for this purchase or not."
    } else {
        if (method.value == 'reimburse_me') {
            if (document.querySelector('input#payee_name').value == '') {
                invalid_reason = "You must fill in the name of the payee if you are being reimbursed. (This is probably your name.)";
                sectionValid = false;
            }
        }
    }

    if (!sectionValid) {
        section.classList.add('invalid');
        section.setAttribute("data-invalid-reason", invalid_reason);
        
        valid = false;
    }

    // sectionValid = true;

    // 3. line items
    section = document.getElementById('itemization');
    
    if (lineItems.length < 1) {
        section.classList.add('invalid');
        section.setAttribute("data-invalid-reason", 'There must be at least one line item.')

        sectionValid = false;
    } else {
        for (let item of lineItems) {
            if (item.qty == '' || item.cost == '') {
                section.classList.add('invalid');
                section.setAttribute("data-invalid-reason", 'Quantity and Cost cannot be blank for any item.')
        
                sectionValid = false;
            }
        }
    }

    if (!sectionValid) { valid = false; }

    sectionValid = true;
    section = document.getElementById('sig-type-container');

    // 4. signature?
    if (document.getElementById('typed_signature_input').value != '') {
        if (document.getElementById('legal').checked == false) {
            sectionValid = false;

            section.classList.add('invalid');
            section.setAttribute("data-invalid-reason", 'You must agree, legally binding, that the above signed name is your own.')

        }
    }

    if (!sectionValid) { valid = false; }

    sectionValid = true;

    // 5. attachments?

    if(!document.getElementById('recepits-printed-separately').checked) {
        if (attachments.length == 0) {
            sectionValid = false;
            valid = false;
            section = document.getElementById('receipts');
            section.classList.add('invalid');
            section.setAttribute('data-invalid-reason', 'You must provide receipts of your transaction, Amazon cart, or invoice.')
        }
    }

    // valid? let's go!
    if (valid) {
        // Make sure any PDFs still being rendered are finished before printing.
        await attachmentsReady;

        document.body.classList.add('valid');

        window.print();
        
        document.body.classList.remove('valid');
    } else {
        // Get the first invalid section...
        let invalid = document.querySelector('.invalid');

        // ...and scroll to it!
        invalid.scrollIntoView({
            behavior: "smooth", 
            block: "center" 
        })
    }
}

// attempt to override the default print hotkey so we can run our helper funcs first
// we have contingincies in place just in case someone tries to bypass
// this but the hotkey would be nice to have so i did this

window.addEventListener('keydown', function(event) {
    // Check for Ctrl+P (Windows/Linux) or Cmd+P (macOS)
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        // Stop the native browser print dialog from opening
        event.preventDefault(); 

        validateAndPrint();
    }
});

// Fires for window.print() and for the browser's own print menu.
window.addEventListener('beforeprint', updateAttachmentCaptions);

function checkIfEmpty(elementOrEvent) {
    let element;

    if (elementOrEvent) {
        if (elementOrEvent.target) {
            element = elementOrEvent.target;
        } else {
            element = elementOrEvent;
        }
        
    } else {
        element = this;
    }

    if (element.value === '') {
        element.classList.add("empty");
    } else {
        element.classList.remove("empty");
    }
}

// disable default window drag-and-drop behavior
window.addEventListener("drop", (e) => {
  if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
    e.preventDefault();
  }
});

window.addEventListener("dragover", (e) => {
  const fileItems = [...e.dataTransfer.items].filter(
    (item) => item.kind === "file",
  );
  if (fileItems.length > 0) {
    e.preventDefault();
    if (!dropZone.contains(e.target)) {
      e.dataTransfer.dropEffect = "none";
    }
  }
});

// register our own drag-and-drop behavior

const itemsUploadContainer = document.getElementById('items-upload-container');

itemsUploadContainer.addEventListener('drop', (ev) => {
  ev.preventDefault();

  // extract files from datatransfer
  const files = [...ev.dataTransfer.items]
    .map((item) => item.getAsFile())
    .filter((file) => file);

  // make fake file upload event
  let fakeEvent = {
    target: {
        files: files
    }
  }

  handleFileUpload(fakeEvent);
})

itemsUploadContainer.addEventListener("dragover", (e) => {
  const fileItems = [...e.dataTransfer.items].filter(
    (item) => item.kind === "file",
  );
  if (fileItems.length > 0) {
    e.preventDefault();
    if (fileItems.some((item) => item.type.startsWith("image/")) || fileItems.some((item) => item.type == "application/pdf") ) {
      e.dataTransfer.dropEffect = "copy";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }
});

itemsUploadContainer.addEventListener('dragenter', (e) => {
    itemsUploadContainer.classList.add('dragging');
});

function dragLeave(e) {
    itemsUploadContainer.classList.remove('dragging')
}
itemsUploadContainer.addEventListener('dragleave', dragLeave);
itemsUploadContainer.addEventListener('drop', dragLeave);

window.onload = function () {
    // savedRfpId = generateRfpId();

    updateRfpType();
    updateRfpId();

    // document.getElementById('form-id-display').innerText = randomId;

    // Init Canvas
    initSignaturePad();

    // Load saved data or default sample items
    
    // we used to store the rfp in localstorage but now everything
    // is done through saving and loading.

    // if (!localStorage.getItem('st_pat_rfp_v2_saved')) {
        addLineItem("Amazon", "", "Classroom Paper & Office Supplies", 2, 14.50);
        addLineItem("Wal-Mart", "", "Laminating Pouch Refills", 1, 22.99);
    // } else {
    //     loadFormFromLocalStorage();
    // }

    calculateTotals();

    togglePaymentFields();
    
    var el = document.querySelectorAll('input[type="date"]');

    for (let element of el) {
        checkIfEmpty(element);
        element.onchange = checkIfEmpty;
    }
};
