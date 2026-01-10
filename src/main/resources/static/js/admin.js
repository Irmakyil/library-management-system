const API = "http://localhost:8080/api";
let allCategories = [];
let allAuthors = [];
let allBranches = [];
let allAdminBooks = [];
let allAdminLoans = [];

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}

// --- COMMON AUTH & INIT ---
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "ADMIN") {
        window.location.href = "../index.html";
        return null;
    }
    // Display Admin Name if element exists
    const adminNameEl = document.getElementById("sidebarAdminName");
    if (adminNameEl) {
        adminNameEl.innerText = `${user.firstName} ${user.lastName}`;
    }
    return user;
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "../login.html";
}

// --- SHARED DATA LOADERS ---
async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories`);
        allCategories = await res.json();

        // Modal select
        const modalSelect = document.getElementById("bookCategory");
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">Kategori Seçin</option>' +
                allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }

        // Filter select
        const filterSelect = document.getElementById("adminCategoryFilter");
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">Tüm Kategoriler</option>' +
                allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }
    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

async function loadAuthors() {
    try {
        const res = await fetch(`${API}/authors`);
        allAuthors = await res.json();
        const select = document.getElementById("adminAuthorFilter");
        if (select) {
            select.innerHTML = '<option value="all">Tüm Yazarlar</option>' +
                allAuthors.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
        }
    } catch (e) {
        console.error("Error loading authors:", e);
    }
}

async function loadBranches() {
    try {
        const res = await fetch(`${API}/branches`);
        allBranches = await res.json();
    } catch (e) {
        console.error("Error loading branches:", e);
    }
}

// Şube stok alanlarını modal'a render et
function renderBranchStockInputs(existingStocks = {}) {
    const container = document.getElementById("branchStocksContainer");
    if (!container) return;

    // Başlık satırı
    let html = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #5d4037; font-weight: 600; font-size: 0.9rem;">Şube Adı</span>
            <span style="color: #5d4037; font-weight: 600; font-size: 0.9rem; margin-right: 60px;">Stok</span>
        </div>
    `;

    // Şube satırları
    html += allBranches.map(branch => {
        const currentStock = existingStocks[branch.id] || 0;
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <label style="color: #374151; font-weight: 500;">${branch.name}</label>
                <div style="display: flex; align-items: center;">
                    <input type="number" 
                           id="branchStock_${branch.id}" 
                           data-branch-id="${branch.id}"
                           class="branch-stock-input"
                           min="0" 
                           value="${currentStock}"
                           style="width: 60px; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; text-align: center; background: #fff;">
                    <span style="margin-left: 6px; color: #6b7280; font-size: 0.8rem; width: 25px;">adet</span>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = html;
}

// --- DASHBOARD FUNCTIONS ---
async function loadDashboardStats() {
    checkAdminAuth();
    try {
        const [stats, recentLoans, overdueLoans] = await Promise.all([
            fetch(`${API}/dashboard/stats`).then(r => r.json()),
            fetch(`${API}/dashboard/recent-loans`).then(r => r.json()),
            fetch(`${API}/dashboard/overdue-loans`).then(r => r.json())
        ]);

        // İstatistikleri yaz
        document.getElementById('stat-total-books').innerText = stats.totalBooks;
        document.getElementById('stat-total-members').innerText = stats.totalMembers;
        document.getElementById('stat-active-loans').innerText = stats.activeLoans;
        document.getElementById('stat-overdue-loans').innerText = stats.overdueLoans;

        // Widget'ları render et
        renderDashboardWidgets(recentLoans, overdueLoans);
    } catch (e) {
        console.error("Error loading dashboard stats:", e);
    }
}

function renderDashboardWidgets(allLoans, overdueLoans) {
    // Recent Transactions
    const sortedLoans = [...allLoans].sort((a, b) => b.id - a.id).slice(0, 5);
    const recentContainer = document.getElementById("dashboardRecentLoans");
    recentContainer.innerHTML = "";

    if (sortedLoans.length === 0) {
        recentContainer.innerHTML = "<tr><td style='padding:10px; text-align:center; color:#9ca3af'>Henüz işlem yok.</td></tr>";
    } else {
        sortedLoans.forEach(l => {
            const memberName = l.member ? `${l.member.firstName} ${l.member.lastName}` : "Bilinmeyen Üye";
            const bookTitle = l.book ? l.book.title : "Silinmiş Kitap";
            const isReturn = l.returnDate !== null;
            const statusIcon = isReturn
                ? `<span style="color:#10b981; font-size:1.2rem;">↩</span>`
                : `<span style="color:#f59e0b; font-size:1.2rem;">➝</span>`;

            const actionText = isReturn ? "İade Etti" : "Ödünç Aldı";

            recentContainer.innerHTML += `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px 5px; width: 40px; text-align: center;">${statusIcon}</td>
                    <td style="padding: 12px 5px;">
                        <div style="font-weight: 600; color: #374151;">${memberName}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">${actionText}: ${bookTitle}</div>
                    </td>
                    <td style="padding: 12px 5px; text-align: right; color: #9ca3af; font-size: 0.85rem;">
                        ${formatDateTime(l.returnDate || l.loanDate)}
                    </td>
                </tr>
            `;
        });
    }

    // Overdue List
    const overdueContainer = document.getElementById("dashboardOverdueList");
    overdueContainer.innerHTML = "";

    if (overdueLoans.length === 0) {
        overdueContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#10b981;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:5px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p style="margin:0;">Geciken kitap yok!</p>
        </div>`;
    } else {
        overdueLoans.slice(0, 5).forEach(l => {
            const memberName = l.member ? `${l.member.firstName} ${l.member.lastName}` : "Bilinmeyen Üye";
            const bookTitle = l.book ? l.book.title : "-";
            const dueDate = new Date(l.loanDate);
            dueDate.setDate(dueDate.getDate() + 1);
            const diffTime = Math.abs(new Date() - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            overdueContainer.innerHTML += `
                <div style="background: #fef2f2; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-weight: 600; color: #991b1b; font-size: 1.05rem; margin-bottom: 2px;">${memberName}</div>
                        <div style="font-size: 0.9rem; color: #b91c1c;">${bookTitle}</div>
                    </div>
                    <div style="text-align: center; background: #fee2e2; padding: 4px 8px; border-radius: 6px; min-width: 60px;">
                        <div style="font-weight: bold; color: #ef4444; font-size: 0.9rem;">${diffDays} Gün</div>
                        <div style="font-size: 0.75rem; color: #b91c1c;">Gecikme</div>
                    </div>
                </div>
            `;
        });
    }
}

// --- MEMBERS PAGE FUNCTIONS ---
async function loadMembers(query = "") {
    checkAdminAuth();
    const url = query ? `${API}/members/search?query=${query}` : `${API}/members`;
    const res = await fetch(url);
    const data = await res.json();
    renderMembers(data);
}

function searchMembers(val) {
    loadMembers(val);
}

function renderMembers(users) {
    const tbody = document.querySelector("#membersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    users.forEach(u => {
        tbody.innerHTML += `
            <tr style="cursor:pointer" onclick="openUserDetail(${u.id}, '${u.firstName} ${u.lastName}')">
                <td style="font-weight:500;">${u.firstName} ${u.lastName}</td>
                <td style="color:#6b7280;">${u.email}</td>
                <td>
                    ${u.role !== 'ADMIN' ? `<button onclick="event.stopPropagation(); deleteUser(${u.id})" style="padding: 4px 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Sil</button>` : '<span style="font-size:0.8rem; opacity:0.5">Admin</span>'}
                </td>
            </tr>
        `;
    });
}

// --- MEMBERS: DETAIL MODAL ---
async function openUserDetail(id, name) {
    document.getElementById('detailName').innerText = name;
    document.getElementById('userDetailModal').classList.remove('hidden');

    const activeDiv = document.getElementById("detailActiveLoans");
    const historyDiv = document.getElementById("detailHistoryLoans");
    activeDiv.innerHTML = "Yükleniyor...";
    historyDiv.innerHTML = "Yükleniyor...";

    const res = await fetch(`${API}/loans/member/${id}`);
    const loans = await res.json();

    activeDiv.innerHTML = "";
    historyDiv.innerHTML = "";
    let penalty = 0;

    if (loans.length === 0) {
        activeDiv.innerHTML = "Kayıt yok.";
        historyDiv.innerHTML = "Kayıt yok.";
    }

    loans.forEach(l => {
        const bookTitle = l.bookTitle || "Silinmiş Kitap";
        if (l.penalty) penalty += l.penalty;

        if (l.returnDate === null) {
            activeDiv.innerHTML += `<div style="padding:10px; background:#f3f4f6; margin-bottom:5px; border-radius:4px; color: #374151;">${bookTitle}</div>`;
        } else {
            const dateObj = new Date(l.returnDate);
            const formattedDate = dateObj.toLocaleDateString("tr-TR", {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            historyDiv.innerHTML += `<div style="padding:10px; background:#f3f4f6; margin-bottom:5px; border-radius:4px; color: #374151;">${bookTitle} <br><span style="font-size:0.8em; color:#6b7280">${formattedDate}</span></div>`;
        }
    });
    document.getElementById('detailTotalPenalty').innerText = `${penalty} TL Ceza`;
}

async function deleteUser(id) {
    if (confirm("Emin misiniz?")) {
        await fetch(`${API}/members/${id}`, { method: "DELETE" });
        loadMembers();
    }
}

// --- BOOKS PAGE FUNCTIONS ---
async function loadBooks() {
    checkAdminAuth();
    loadCategories(); // Load for filters
    loadAuthors();    // Load for filters
    await loadBranches(); // Load for table rendering
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

function runBookFilters() {
    const catId = document.getElementById("adminCategoryFilter").value;
    const authorId = document.getElementById("adminAuthorFilter").value;
    const query = document.getElementById("adminBookSearch").value.toLowerCase();

    let filtered = allAdminBooks.filter(b => {
        const matchesCat = (catId === "all" || (b.category && b.category.id.toString() === catId));
        const matchesAuthor = (authorId === "all" || (b.author && b.author.id.toString() === authorId));
        const matchesSearch = !query ||
            b.title.toLowerCase().includes(query) ||
            (b.author && b.author.name.toLowerCase().includes(query)) ||
            b.isbn.toLowerCase().includes(query);

        return matchesCat && matchesAuthor && matchesSearch;
    });

    renderBooks(filtered);
}

function renderBooks(books) {
    const tbody = document.querySelector("#booksTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    books.forEach(b => {
        const tr = document.createElement("tr");
        tr.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        tr.style.borderRadius = "8px";

        const createCell = (text) => {
            const td = document.createElement("td");
            td.textContent = text || "-";
            td.style.color = "#3e2723";
            td.style.fontWeight = "500";
            return td;
        };

        tr.appendChild(createCell(b.title));
        tr.appendChild(createCell(b.author?.name));
        tr.appendChild(createCell(b.category?.name));
        tr.appendChild(createCell(b.publicationYear));

        // Toplam stok (durum için kullanılacak)
        const stock = b.inventory ? b.inventory.stockQuantity : 0;

        // Şube & Stok
        const tdBranch = document.createElement("td");
        tdBranch.style.color = "#3e2723";
        tdBranch.style.fontWeight = "500";
        tdBranch.style.fontSize = "0.8rem";
        tdBranch.style.lineHeight = "1.6";
        tdBranch.style.textAlign = "center";

        const branchStocks = b.inventory?.branchStocks || {};

        if (allBranches && allBranches.length > 0) {
            const branchHtml = allBranches.map(br => {
                const count = branchStocks[br.id] || 0;
                return `${br.name} (${count})`;
            }).join("<br>");
            tdBranch.innerHTML = branchHtml;
        } else {
            // Fallback
            const branches = b.inventory?.branches || [];
            if (branches.length > 0) {
                const formattedBranches = branches.map(branch =>
                    branch.replace(/\((\d+)\)/, '($1)')
                );
                tdBranch.innerHTML = formattedBranches.join("<br>");
            } else {
                tdBranch.textContent = "-";
            }
        }
        tr.appendChild(tdBranch);

        // Durum
        const tdStatus = document.createElement("td");
        tdStatus.style.textAlign = "right";
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
        tdActions.style.textAlign = "center";
        tdActions.style.whiteSpace = "nowrap";

        const btnEdit = document.createElement("button");
        btnEdit.textContent = "Düzenle";
        btnEdit.style.cssText = "background-color: #143800; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 4px; font-size: 0.8rem;";
        btnEdit.onclick = () => editBook(b);

        const btnDelete = document.createElement("button");
        btnDelete.textContent = "Sil";
        btnDelete.style.cssText = "background-color: #8a1c1c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;";
        btnDelete.onclick = () => deleteBook(b.id);

        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// --- BOOKS: MODAL ACTIONS ---
async function openBookModal() {
    await loadCategories(); // Ensure categories are loaded for modal
    await loadBranches(); // Ensure branches are loaded for modal
    document.getElementById("modalTitle").innerText = "Yeni Kitap Ekle";
    document.getElementById("bookId").value = "";
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthorName").value = "";
    document.getElementById("bookIsbn").value = "";
    document.getElementById("bookYear").value = "";
    document.getElementById("bookModal").classList.remove("hidden");

    // Şube stok alanlarını render et (yeni kitap için hepsi 0)
    renderBranchStockInputs({});

    // Clear error message
    const errorEl = document.getElementById("bookErrorMsg");
    if (errorEl) errorEl.style.display = 'none';
}

async function editBook(b) {
    await loadCategories(); // Wait for categories to load so options exist
    await loadBranches(); // Wait for branches to load so options exist
    document.getElementById("modalTitle").innerText = "Kitabı Düzenle";
    document.getElementById("bookId").value = b.id;
    document.getElementById("bookTitle").value = b.title;
    document.getElementById("bookAuthorName").value = b.author?.name || "";
    document.getElementById("bookIsbn").value = b.isbn;
    document.getElementById("bookYear").value = b.publicationYear;

    if (b.category && b.category.id) {
        document.getElementById("bookCategory").value = b.category.id.toString();
    }

    // Mevcut şube stoklarını al ve render et
    const existingStocks = b.inventory?.branchStocks || {};
    renderBranchStockInputs(existingStocks);

    document.getElementById("bookModal").classList.remove("hidden");
}

async function saveBook() {
    const id = document.getElementById("bookId").value;
    const catVal = document.getElementById("bookCategory").value;
    const yearVal = document.getElementById("bookYear").value;

    // Tüm şube stoklarını topla
    const branchStocks = {};
    const stockInputs = document.querySelectorAll(".branch-stock-input");
    stockInputs.forEach(input => {
        const branchId = input.dataset.branchId;
        const stock = parseInt(input.value) || 0;
        if (stock > 0) {
            branchStocks[branchId] = stock;
        }
    });

    const book = {
        title: document.getElementById("bookTitle").value,
        authorName: document.getElementById("bookAuthorName").value,
        isbn: document.getElementById("bookIsbn").value,
        publicationYear: yearVal ? parseInt(yearVal) : 0,
        categoryId: catVal ? catVal : null,
        branchStocks: branchStocks
    };

    const errorEl = document.getElementById("bookErrorMsg");
    if (errorEl) errorEl.style.display = 'none';

    if (!book.title || !book.authorName || !book.isbn || !book.publicationYear || !book.categoryId) {
        if (errorEl) {
            errorEl.innerText = "Lütfen tüm alanları doldurun!";
            errorEl.style.display = 'block';
        } else {
            alert("Lütfen tüm alanları doldurun!");
        }
        return;
    }

    // En az bir şubede stok olmalı
    if (Object.keys(branchStocks).length === 0) {
        if (errorEl) {
            errorEl.innerText = "En az bir şubede stok bilgisi giriniz!";
            errorEl.style.display = 'block';
        } else {
            alert("En az bir şubede stok bilgisi giriniz!");
        }
        return;
    }

    const method = id ? "PUT" : "POST";
    const url = id ? `${API}/books/${id}` : `${API}/books`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(book)
        });

        if (!res.ok) {
            const errMsg = await res.text();
            throw new Error(errMsg || "Kaydetme başarısız");
        }

        document.getElementById("bookModal").classList.add("hidden");
        loadBooks();
    } catch (err) {
        alert("Hata: " + err.message);
    }
}

async function deleteBook(id) {
    if (confirm("Silmek istediğinize emin misiniz?")) {
        try {
            const res = await fetch(`${API}/books/${id}`, { method: "DELETE" });
            if (!res.ok) {
                alert("Silme işlemi başarısız! Kitap başka kayıtlarla ilişkili olabilir.");
                return;
            }
            loadBooks();
        } catch (e) {
            alert("Bir hata oluştu: " + e.message);
        }
    }
}

// --- LOANS PAGE FUNCTIONS ---
function formatDateTime(dateData) {
    if (!dateData) return '-';
    try {
        const date = new Date(dateData);
        if (isNaN(date.getTime())) return '-';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (e) {
        return '-';
    }
}

async function loadLoans() {
    checkAdminAuth();
    const res = await fetch(`${API}/loans`);
    allAdminLoans = await res.json();
    runLoanFilters();
}

function runLoanFilters() {
    const statusFilter = document.getElementById("adminLoanStatusFilter").value;
    const query = document.getElementById("adminLoanSearch").value.toLowerCase();

    let filtered = allAdminLoans.filter(l => {
        const memberName = (l.memberName || "").toLowerCase();
        const bookTitle = (l.bookTitle || "").toLowerCase();

        const matchesSearch = !query || memberName.includes(query) || bookTitle.includes(query);

        let matchesStatus = true;
        if (statusFilter !== "all") {
            const isReturned = l.returnDate !== null;
            const dueDate = new Date(l.loanDate);
            dueDate.setDate(dueDate.getDate() + 1);
            const isOverdue = !isReturned && new Date() > dueDate;

            if (statusFilter === "returned") matchesStatus = isReturned;
            else if (statusFilter === "overdue") matchesStatus = isOverdue;
            else if (statusFilter === "reading") matchesStatus = !isReturned && !isOverdue;
        }

        return matchesSearch && matchesStatus;
    });

    renderLoans(filtered);
}

function renderLoans(loans) {
    const tbody = document.querySelector("#loansTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    loans.forEach(l => {
        const isReturn = l.returnDate !== null;
        let statusHtml = "";
        if (isReturn) {
            statusHtml = `<span style="color:#10b981">Teslim Edildi</span>`;
        } else {
            const dueDate = new Date(l.loanDate);
            dueDate.setDate(dueDate.getDate() + 1); // 1 day rule
            const isOverdue = new Date() > dueDate;
            statusHtml = isOverdue
                ? `<span style="color:#ef4444; font-weight:bold">Gecikmiş!</span>`
                : `<span style="color:#f59e0b">Okuyor</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${l.memberName || '-'}</td>
                <td>${l.bookTitle || '-'}</td>
                <td>${formatDateTime(l.loanDate)}</td>
                <td>${formatDateTime(l.returnDate)}</td>
                <td>${statusHtml}</td>
            </tr>
        `;
    });
}