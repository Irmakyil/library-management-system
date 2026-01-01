// --- AYARLAR ---
const API = "http://localhost:8080/api"; 
let allCategories = [];
let allAuthors = [];
// Artık tüm kitapları tutan devasa bir diziye ihtiyacımız yok!

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return { 
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token 
    };
}

// --- GÜVENLİK VE GİRİŞ ---
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "ADMIN") {
        window.location.href = "../index.html";
        return null;
    }
    const adminNameEl = document.getElementById("sidebarAdminName");
    if (adminNameEl) adminNameEl.innerText = `${user.firstName} ${user.lastName}`;
    return user;
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "../login.html";
}

// --- ORTAK YÜKLEYİCİLER (Kategori & Yazar) ---
async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories`, { headers: getAuthHeaders() });
        allCategories = await res.json();
        
        // Kitap Ekleme Modalındaki Select
        const modalSelect = document.getElementById("bookCategory");
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">Kategori Seçin</option>' +
                allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }
        // Admin Filtre Select
        const filterSelect = document.getElementById("adminCategoryFilter");
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">Tüm Kategoriler</option>' +
                allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }
    } catch (e) { console.error("Kategori Hatası:", e); }
}

async function loadAuthors() {
    try {
        const res = await fetch(`${API}/authors`, { headers: getAuthHeaders() });
        allAuthors = await res.json();
        const select = document.getElementById("adminAuthorFilter");
        if (select) {
            select.innerHTML = '<option value="all">Tüm Yazarlar</option>' +
                allAuthors.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
        }
    } catch (e) { console.error("Yazar Hatası:", e); }
}

// --- DASHBOARD (ANASAYFA) - HIZLANDIRILMIŞ VERSİYON ---
async function loadDashboardStats() {
    checkAdminAuth();
    try {
        // Tek bir istek ile SAYILAR + LİSTELER geliyor (Java hesapladı)
        const res = await fetch(`${API}/dashboard/stats`, { headers: getAuthHeaders() });
        const data = await res.json();

        // 1. İstatistik Kutucukları
        document.getElementById('stat-total-books').innerText = data.totalBooks || 0;
        document.getElementById('stat-total-members').innerText = data.totalMembers || 0;
        document.getElementById('stat-active-loans').innerText = data.activeLoans || 0;
        document.getElementById('stat-overdue-loans').innerText = data.overdueLoans || 0;

        // 2. Listeleri Çiz (Backend'den hazır geldi, hesaplama yok!)
        renderDashboardWidgets(data.recentTransactions || [], data.urgentReturns || []);

    } catch (e) {
        console.error("Dashboard yüklenirken hata:", e);
    }
}

function renderDashboardWidgets(recentLoans, overdueLoans) {
    // --- Son Hareketler Tablosu ---
    const recentContainer = document.getElementById("dashboardRecentLoans");
    if (recentContainer) {
        recentContainer.innerHTML = "";
        if (recentLoans.length === 0) {
            recentContainer.innerHTML = "<tr><td colspan='3' style='padding:10px; text-align:center; color:#9ca3af'>İşlem yok.</td></tr>";
        } else {
            recentLoans.forEach(l => {
                const memberName = l.member ? `${l.member.firstName} ${l.member.lastName}` : "Bilinmeyen";
                const bookTitle = l.book ? l.book.title : "Silinmiş Kitap";
                const isReturn = l.returnDate !== null;
                const statusIcon = isReturn 
                    ? `<span style="color:#10b981; font-size:1.2rem;">↩</span>` 
                    : `<span style="color:#f59e0b; font-size:1.2rem;">➝</span>`;
                const actionText = isReturn ? "İade Etti" : "Ödünç Aldı";

                recentContainer.innerHTML += `
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                        <td style="padding: 12px 5px; text-align:center;">${statusIcon}</td>
                        <td style="padding: 12px 5px;">
                            <div style="font-weight: 600; color: #374151;">${memberName}</div>
                            <div style="font-size: 0.85rem; color: #6b7280;">${actionText}: ${bookTitle}</div>
                        </td>
                        <td style="padding: 12px 5px; text-align: right; color: #9ca3af; font-size: 0.85rem;">
                            ${l.returnDate || l.loanDate}
                        </td>
                    </tr>`;
            });
        }
    }

    // --- Acil İade Bekleyenler (Gecikenler) ---
    const overdueContainer = document.getElementById("dashboardOverdueList");
    if (overdueContainer) {
        overdueContainer.innerHTML = "";
        if (overdueLoans.length === 0) {
            overdueContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#10b981;">Geciken kitap yok!</div>`;
        } else {
            overdueLoans.forEach(l => {
                const memberName = l.member ? `${l.member.firstName} ${l.member.lastName}` : "Üye";
                const bookTitle = l.book ? l.book.title : "-";
                
                // Gün farkı hesabı (Sadece gösterim için JS kullanıyoruz)
                const dueDate = new Date(l.loanDate);
                dueDate.setDate(dueDate.getDate() + 15);
                const diffTime = Math.abs(new Date() - dueDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                overdueContainer.innerHTML += `
                    <div style="background: #fef2f2; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                        <div>
                            <div style="font-weight: 600; color: #991b1b; font-size: 1.05rem;">${memberName}</div>
                            <div style="font-size: 0.9rem; color: #b91c1c;">${bookTitle}</div>
                        </div>
                        <div style="text-align: center; background: #fee2e2; padding: 4px 8px; border-radius: 6px;">
                            <div style="font-weight: bold; color: #ef4444; font-size: 0.9rem;">${diffDays} Gün</div>
                            <div style="font-size: 0.75rem; color: #b91c1c;">Gecikme</div>
                        </div>
                    </div>`;
            });
        }
    }
}

// --- KİTAP YÖNETİMİ (SERVER-SIDE FILTERING) ---
// Artık filtrelemeyi Java yapıyor, biz sadece parametre yolluyoruz.
async function loadBooks() {
    checkAdminAuth();
    loadCategories(); // Load for filters
    loadAuthors();    // Load for filters
    try {
        const res = await fetch(`${API}/books?size=1000`);
        const data = await res.json();
        allAdminBooks = data.content || data;

        if (!Array.isArray(allAdminBooks)) {
            allAdminBooks = [];
        }
        runBookFilters();
    } catch (e) {
        console.error("Kitaplar yüklenemedi:", e);
        const tbody = document.querySelector("#booksTable tbody");
        if (tbody) tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; color:red;'>Kitaplar yüklenirken hata oluştu!</td></tr>";
    }
}

// Bu fonksiyon artık sadece loadBooks'u tetikler (HTML uyumluluğu için)
function runBookFilters() {
    loadBooks();
}

function renderBooks(books) {
    const tbody = document.querySelector("#booksTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if(books.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:15px'>Kriterlere uygun kitap bulunamadı.</td></tr>";
        return;
    }

    books.forEach(b => {
        const tr = document.createElement("tr");
        tr.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        tr.style.borderRadius = "8px";

        const createCell = (text, align = "left") => {
            const td = document.createElement("td");
            td.textContent = text || "-";
            td.style.color = "#3e2723";
            td.style.fontWeight = "500";
            td.style.textAlign = align;
            return td;
        };

        tr.appendChild(createCell(b.title));
        tr.appendChild(createCell(b.author?.name));
        tr.appendChild(createCell(b.category?.name));
        tr.appendChild(createCell(b.publicationYear));

        // Stok
        const stock = b.inventory ? b.inventory.stockQuantity : 0;
        tr.appendChild(createCell(stock, "center"));

        // Durum
        const tdStatus = document.createElement("td");
        const statusSpan = document.createElement("span");
        statusSpan.style.padding = "4px 8px";
        statusSpan.style.borderRadius = "4px";
        statusSpan.style.fontSize = "0.85rem";
        
        if (stock > 0) {
            statusSpan.textContent = "Müsait";
            statusSpan.style.color = "#10b981";
            statusSpan.style.background = "rgba(16,185,129,0.1)";
        } else {
            statusSpan.textContent = "Tükendi";
            statusSpan.style.color = "#ef4444";
            statusSpan.style.background = "rgba(239,68,68,0.1)";
        }
        tdStatus.appendChild(statusSpan);
        tr.appendChild(tdStatus);

        // İşlemler
        const tdActions = document.createElement("td");
        tdActions.style.textAlign = "right";

        const btnEdit = document.createElement("button");
        btnEdit.textContent = "Düzenle";
        btnEdit.style.cssText = "background-color: #5d4037; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-right: 5px; font-size: 0.85rem;";
        btnEdit.onclick = () => editBook(b);

        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Sil";
        btnDelete.style.cssText = "background-color: #8a1c1c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;";
        btnDelete.onclick = () => deleteBook(b.id);

        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// --- KİTAP EKLEME / DÜZENLEME (Modal) ---
function openBookModal() {
    loadCategories();
    document.getElementById("modalTitle").innerText = "Yeni Kitap Ekle";
    document.getElementById("bookId").value = "";
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthorName").value = "";
    document.getElementById("bookIsbn").value = "";
    document.getElementById("bookYear").value = "";
    if(document.getElementById("bookStock")) document.getElementById("bookStock").value = "1";
    document.getElementById("bookModal").classList.remove("hidden");
    const errorEl = document.getElementById("bookErrorMsg");
    if (errorEl) errorEl.style.display = 'none';
}

async function editBook(b) {
    await loadCategories();
    document.getElementById("modalTitle").innerText = "Kitabı Düzenle";
    document.getElementById("bookId").value = b.id;
    document.getElementById("bookTitle").value = b.title;
    document.getElementById("bookAuthorName").value = b.author?.name || "";
    document.getElementById("bookIsbn").value = b.isbn;
    document.getElementById("bookYear").value = b.publicationYear;
    
    if(document.getElementById("bookStock")) {
        document.getElementById("bookStock").value = b.inventory ? b.inventory.stockQuantity : 0;
    }
    if (b.category && b.category.id) {
        document.getElementById("bookCategory").value = b.category.id.toString();
    }
    document.getElementById("bookModal").classList.remove("hidden");
}

async function saveBook() {
    const id = document.getElementById("bookId").value;
    const catVal = document.getElementById("bookCategory").value;
    const yearVal = document.getElementById("bookYear").value;
    const stockVal = document.getElementById("bookStock")?.value;

    const book = {
        title: document.getElementById("bookTitle").value,
        authorName: document.getElementById("bookAuthorName").value,
        isbn: document.getElementById("bookIsbn").value,
        publicationYear: yearVal ? parseInt(yearVal) : 0,
        categoryId: catVal ? catVal : null,
        stock: stockVal ? parseInt(stockVal) : 0 
    };

    if (!book.title || !book.authorName || !book.isbn) {
        alert("Lütfen zorunlu alanları doldurun!");
        return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/books/${id}` : `${API}/books`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(book)
        });

        if (!res.ok) throw new Error("İşlem başarısız");

        document.getElementById("bookModal").classList.add("hidden");
        loadBooks(); // Listeyi yenile
        
    } catch (err) { alert("Hata: " + err.message); }
}

async function deleteBook(id) {
    if (confirm("Silmek istediğinize emin misiniz?")) {
        try {
            await fetch(`${API}/books/${id}`, { method: "DELETE", headers: getAuthHeaders() });
            loadBooks();
        } catch(e) { console.error(e); }
    }
}

// --- ÜYE YÖNETİMİ ---
async function loadMembers(query = "") {
    checkAdminAuth();
    const tbody = document.querySelector("#membersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    try {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const url = query ? `${API}/members/search?query=${query}` : `${API}/members`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json();
        const members = Array.isArray(data) ? data : (data.content || []);

        members.forEach(u => {
            const tr = document.createElement("tr");
            tr.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
            tr.style.borderRadius = "8px";
            tr.style.marginBottom = "5px";

            tr.innerHTML = `
                <td style="padding:12px; color:#3e2723; font-weight:500;">${u.firstName} ${u.lastName}</td>
                <td style="padding:12px; color:#3e2723;">${u.email}</td>
                <td style="padding:12px; text-align:right;">
                    ${(currentUser && currentUser.id !== u.id) 
                        ? `<button onclick="deleteUser(${u.id})" style="padding:6px 12px; background:#8a1c1c; color:white; border:none; border-radius:6px; cursor:pointer;">Sil</button>` 
                        : `<span style="font-size:0.8rem; color:#999; font-style:italic;">(Siz)</span>`}
                </td>`;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}

function searchMembers(val) { loadMembers(val); }

async function deleteUser(id) {
    if (confirm("Üyeyi silmek istediğinize emin misiniz?")) {
        await fetch(`${API}/members/${id}`, { method: "DELETE", headers: getAuthHeaders() });
        loadMembers();
    }
}

// --- ÖDÜNÇ YÖNETİMİ ---
// Basit tutmak adına ödünçleri şimdilik direkt çekiyoruz, ama ileride buraya da search/filter eklenebilir.
async function loadLoans() {
    checkAdminAuth();
    try {
        const res = await fetch(`${API}/loans`, { headers: getAuthHeaders() });
        const loans = await res.json();
        // İstersen burada da basit bir client-side render yapabilirsin veya
        // Backend'e search endpoint'i yazıp loadBooks gibi yapabilirsin.
        renderLoans(loans);
    } catch(e) { console.error(e); }
}

// Basitleştirilmiş loan search (Client side - veri az olduğu varsayımıyla şimdilik kalabilir)
function runLoanFilters() {
    const query = document.getElementById("adminLoanSearch")?.value.toLowerCase() || "";
    const rows = document.querySelectorAll("#loansTable tbody tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
    });
}

function renderLoans(loans) {
    const tbody = document.querySelector("#loansTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    loans.forEach(l => {
        const isReturn = l.returnDate !== null;
        let statusHtml = isReturn 
            ? `<span style="color:#10b981">Teslim Edildi</span>`
            : ((new Date() > new Date(new Date(l.loanDate).setDate(new Date(l.loanDate).getDate() + 15))) 
                ? `<span style="color:#ef4444; font-weight:bold">Gecikmiş!</span>` 
                : `<span style="color:#f59e0b">Okuyor</span>`);

        tbody.innerHTML += `
            <tr>
                <td>${l.member ? l.member.firstName + ' ' + l.member.lastName : '-'}</td>
                <td>${l.book ? l.book.title : '-'}</td>
                <td>${l.loanDate}</td>
                <td>${l.returnDate || '-'}</td>
                <td>${statusHtml}</td>
            </tr>`;
    });
}