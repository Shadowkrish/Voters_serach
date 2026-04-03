let voterData = [];
let searchTimeout = null;

/* ===== NORMALIZE ===== */
function normalize(text) {
    if (!text) return "";
    return text.toString().toLowerCase().trim();
}

/* ===== AUTO LOAD EXCEL FROM GITHUB ===== */
window.addEventListener("load", loadDefaultExcel);

async function loadDefaultExcel() {
    try {
        const response = await fetch("voters.xlsx"); // file in repo
        const arrayBuffer = await response.arrayBuffer();

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        voterData = XLSX.utils.sheet_to_json(sheet);

        console.log(`✅ Loaded ${voterData.length} records`);

        // Optional: show ready message
        document.getElementById('results').innerHTML =
            "<p>✅ Data loaded. Start typing to search</p>";

    } catch (error) {
        console.error("Error loading Excel:", error);
        document.getElementById('results').innerHTML =
            "<p>❌ Failed to load data</p>";
    }
}

/* ===== LIVE SEARCH (DEBOUNCE) ===== */
document.getElementById('searchBox').addEventListener('input', function () {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        searchData();
    }, 300); // delay for performance
});

/* ===== HIGHLIGHT FUNCTION ===== */
function highlight(text, query) {
    if (!text) return "-";

    const str = text.toString();

    if (!query) return str;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // safe regex
    const regex = new RegExp(`(${escaped})`, 'gi');

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
        resultsDiv.innerHTML = "<p>⚠️ Data not loaded yet</p>";
        return;
    }

    /* ===== FAST SEARCH LOOP ===== */
    const filtered = [];

    for (let i = 0; i < voterData.length; i++) {
        const voter = voterData[i];

        for (let key in voter) {
            const value = voter[key];
            if (!value) continue;

            const val = value.toString().trim();

            // 🔢 Number → exact match
            if (isNumber) {
                if (val === rawQuery) {
                    filtered.push(voter);
                    break;
                }
            } 
            // 🔤 Text → partial match
            else {
                if (val.toLowerCase().includes(query)) {
                    filtered.push(voter);
                    break;
                }
            }
        }
    }

    if (filtered.length === 0) {
        resultsDiv.innerHTML = "<p>❌ No matching records found</p>";
        return;
    }

    /* ===== BUILD HTML (FASTER THAN +=) ===== */
    let html = `
        <p style="text-align:center; margin-bottom:10px;">
            ✅ ${filtered.length} result(s)
        </p>
    `;

    for (let i = 0; i < filtered.length; i++) {
        const v = filtered[i];
        let content = "";

        for (let key in v) {
            let value = v[key] ? v[key].toString() : "-";

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
