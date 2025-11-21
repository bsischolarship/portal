async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Gagal load ${path}: ${res.status}`);
    }
    return await res.json();
}

let mahasiswaData = null;
let formsConfig = null;

async function ensureDataLoaded() {
    if (!mahasiswaData) {
        mahasiswaData = await loadJson("data/mahasiswa.json");
    }
    if (!formsConfig) {
        formsConfig = await loadJson("config/forms.json");
    }
}

function setBannerMonthIfExists() {
    const el = document.getElementById("alert-month");
    if (!el) return;

    const now = new Date();
    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];
    const monthLabel = monthNames[now.getMonth()];
    const year = now.getFullYear();
    el.textContent = ` (Periode bulan ${monthLabel} ${year})`;
}

async function initFormPage(slug) {
    try {
        await ensureDataLoaded();
    } catch (err) {
        console.error(err);
        const resultEl = document.getElementById("cek-result");
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="error-box">
                    Terjadi kesalahan saat memuat data awal. Silakan coba refresh halaman
                    atau hubungi admin jika masalah berlanjut.
                </div>
            `;
        }
        return;
    }

    setBannerMonthIfExists();
    const cfg = formsConfig[slug];
    if (!cfg) {
        const resultEl = document.getElementById("cek-result");
        if (resultEl) {
            resultEl.innerHTML = `
                <div class="error-box">
                    Konfigurasi form untuk halaman ini belum tersedia.
                    Pastikan <code>config/forms.json</code> sudah diisi untuk slug: <strong>${slug}</strong>.
                </div>
            `;
        }
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const body = document.body;
    const slug = body.dataset.formSlug;
    const nimInput = document.getElementById("nim");
    const resultEl = document.getElementById("cek-result");

    if (!nimInput || !resultEl) return false;

    const nim = (nimInput.value || "").trim();
    if (!nim) {
        resultEl.innerHTML = `
            <div class="error-box">
                Nomor Induk tidak boleh kosong.
            </div>
        `;
        return false;
    }

    try {
        await ensureDataLoaded();
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `
            <div class="error-box">
                Terjadi kesalahan saat memuat data. Coba muat ulang halaman.
            </div>
        `;
        return false;
    }

    const found = (mahasiswaData || []).find((m) => String(m.nim) === nim);
    if (!found) {
        resultEl.innerHTML = `
            <div class="error-box">
                NIM <strong>${nim}</strong> tidak ditemukan di database.
                Pastikan NIM sudah benar atau hubungi admin program.
            </div>
        `;
        return false;
    }

    const cfg = formsConfig && formsConfig[slug];
    if (!cfg || !cfg.form_url || !cfg.prefill) {
        resultEl.innerHTML = `
            <div class="error-box">
                Konfigurasi form untuk halaman ini belum lengkap.
                Cek kembali file <code>config/forms.json</code>.
            </div>
        `;
        return false;
    }

    const fields = cfg.prefill;
    const params = new URLSearchParams();
    if (fields.nim) params.set(fields.nim, found.nim || "");
    if (fields.nama) params.set(fields.nama, found.nama || "");
    if (fields.kampus) params.set(fields.kampus, found.kampus || "");
    if (fields.email) params.set(fields.email, found.email || "");

    const baseUrl = cfg.form_url;
    const finalUrl =
        baseUrl.includes("?") ? `${baseUrl}&${params.toString()}` : `${baseUrl}?${params.toString()}`;

    resultEl.innerHTML = `
        <div class="result-card">
            <p><strong>Data ditemukan:</strong></p>
            <p>NIM: <strong>${found.nim}</strong></p>
            <p>Nama: <strong>${found.nama || "-"}</strong></p>
            <p>Kampus: <strong>${found.kampus || "-"}</strong></p>
            <p>Email: <strong>${found.email || "-"}</strong></p>
            <br/>
            <a class="btn btn-primary btn-full" href="${finalUrl}" target="_blank" rel="noopener">
                Buka Google Form &amp; Lanjutkan →
            </a>
        </div>
    `;

    return false;
}

async function handleChangeNumber(event) {
    event.preventDefault();
    const nimInput = document.getElementById("nim-change");
    const resultEl = document.getElementById("change-number-result");
    if (!nimInput || !resultEl) return false;

    const nim = (nimInput.value || "").trim();
    if (!nim) {
        resultEl.innerHTML = `
            <div class="error-box">
                Nomor Induk tidak boleh kosong.
            </div>
        `;
        return false;
    }

    try {
        await ensureDataLoaded();
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `
            <div class="error-box">
                Terjadi kesalahan saat memuat data. Coba muat ulang halaman.
            </div>
        `;
        return false;
    }

    const found = (mahasiswaData || []).find((m) => String(m.nim) === nim);
    if (!found) {
        resultEl.innerHTML = `
            <div class="error-box">
                NIM <strong>${nim}</strong> tidak ditemukan di database.
                Pastikan NIM sudah benar atau hubungi admin program.
            </div>
        `;
        return false;
    }

    const cfg = formsConfig && formsConfig["ganti-nomor"];
    if (!cfg || !cfg.form_url || !cfg.prefill) {
        resultEl.innerHTML = `
            <div class="error-box">
                Konfigurasi form ganti nomor belum lengkap.
                Cek kembali file <code>config/forms.json</code> untuk slug "ganti-nomor".
            </div>
        `;
        return false;
    }

    const fields = cfg.prefill;
    const params = new URLSearchParams();
    if (fields.nim) params.set(fields.nim, found.nim || "");
    if (fields.nama) params.set(fields.nama, found.nama || "");
    if (fields.kampus) params.set(fields.kampus, found.kampus || "");
    if (fields.email) params.set(fields.email, found.email || "");

    const baseUrl = cfg.form_url;
    const finalUrl =
        baseUrl.includes("?") ? `${baseUrl}&${params.toString()}` : `${baseUrl}?${params.toString()}`;

    resultEl.innerHTML = `
        <div class="result-card">
            <p>Data ditemukan untuk NIM <strong>${found.nim}</strong>.</p>
            <p>Kamu akan diarahkan ke form ganti nomor.</p>
            <br/>
            <a class="btn btn-primary btn-full" href="${finalUrl}" target="_blank" rel="noopener">
                Buka Form Ganti Nomor →
            </a>
        </div>
    `;

    return false;
}

function initPage() {
    const body = document.body;
    const page = body.dataset.page;

    if (page === "form") {
        const slug = body.dataset.formSlug;
        if (slug) {
            initFormPage(slug);
        }
    } else if (page === "ganti-nomor") {
        ensureDataLoaded().catch((err) => console.error(err));
    }
}

document.addEventListener("DOMContentLoaded", initPage);

window.handleFormSubmit = handleFormSubmit;
window.handleChangeNumber = handleChangeNumber;
