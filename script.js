let voterData = [];
let searchTimeout = null;

/* ===== NORMALIZE ===== */
function normalize(text) {
    if (!text) return "";
    return text.toString().toLowerCase().trim();
}

/* ===== FILE UPLOAD ===== */
document.getElementById('upload').addEventListener('change', handleFile, false);

function handleFile(e) {
    const file = e.target.files[0];

    if (!file) {
        alert("⚠️ No file selected");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            voterData = XLSX.utils.sheet_to_json(sheet);

            alert(`✅ Loaded ${voterData.length} records`);

        } catch (err) {
            console.error(err);
            alert("❌ Error reading file");
        }
    };

    reader.readAsArrayBuffer(file);
}

/* ===== LIVE SEARCH (DEBOUNCE) ===== */
document.getElementById('searchBox').addEventListener('input', function () {
    clearTimeout(searchTimeout);

    // delay for performance (important for 10k+ rows)
    searchTimeout = setTimeout(() => {
        searchData();
    }, 300);
});

/* ===== HIGHLIGHT FUNCTION ===== */
function highlight(text, query) {
    if (!text) return "-";

    const str = text.toString();

    if (!query) return str;

    const regex = new RegExp(`(${query})`, 'gi');

    return str.replace(regex, `<span class="highlight">$1</span>`);
}

/* ===== SEARCH FUNCTION ===== */
function searchData() {
    const rawQuery = document.getElementById('searchBox').value.trim();
    const query = normalize(rawQuery);
    const isNumber = !isNaN(rawQuery);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "";

    if (!query) {
        resultsDiv.innerHTML = "<p>🔍 Start typing to search</p>";
        return;
    }

    if (voterData.length === 0) {
        resultsDiv.innerHTML = "<p>⚠️ Upload voter list first</p>";
        return;
    }

    /* ===== FAST FILTER ===== */
    const filtered = [];

    for (let i = 0; i < voterData.length; i++) {
        const voter = voterData[i];

        for (let key in voter) {
            const value = voter[key];
            if (!value) continue;

            const val = value.toString().trim();

            // number → exact match
            if (isNumber) {
                if (val === rawQuery) {
                    filtered.push(voter);
                    break;
                }
            } 
            // text → partial match
            else {
                if (val.toLowerCase().includes(query)) {
                    filtered.push(voter);
                    break;
                }
            }
        }
    }

    if (filtered.length === 0) {
        resultsDiv.innerHTML = "<p>❌ No results found</p>";
        return;
    }

    /* ===== RESULT COUNT ===== */
    let html = `
        <p style="text-align:center; margin-bottom:10px;">
            ✅ ${filtered.length} result(s)
        </p>
    `;

    /* ===== RENDER RESULTS ===== */
    for (let i = 0; i < filtered.length; i++) {
        const v = filtered[i];

        let content = "";

        for (let key in v) {
            let value = v[key] ? v[key].toString() : "-";

            // highlight only for text search
            if (!isNumber) {
                value = highlight(value, rawQuery);
            }

            content += `<p><strong>${key}:</strong> ${value}</p>`;
        }

        html += `
            <div class="card">
                <p style="color:#60a5fa; font-weight:600;">
                    Record ${i + 1}
                </p>
                ${content}
            </div>
        `;
    }

    resultsDiv.innerHTML = html;
}