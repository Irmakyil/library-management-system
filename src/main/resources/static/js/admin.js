const API = "http://localhost:8080/api";
let allCategories = [];
let allAuthors = [];
let allAdminBooks = [];
let allAdminLoans = [];

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

// --- DASHBOARD FUNCTIONS ---
async function loadDashboardStats() {
    checkAdminAuth();
    try {
        const [books, members, loans] = await Promise.all([
            fetch(`${API}/books`).then(r => r.json()),
            fetch(`${API}/members`).then(r => r.json()),
            fetch(`${API}/loans`).then(r => r.json())
        ]);

        document.getElementById('stat-total-books').innerText = books.length;
        document.getElementById('stat-total-members').innerText = members.length;

        const activeLoans = loans.filter(l => l.returnDate === null);
        document.getElementById('stat-active-loans').innerText = activeLoans.length;

        const overdue = activeLoans.filter(l => {
            const dueDate = new Date(l.loanDate);
            dueDate.setDate(dueDate.getDate() + 1); // 1 day overdue rule
            return new Date() > dueDate;
        });
        document.getElementById('stat-overdue-loans').innerText = overdue.length;

        renderDashboardWidgets(loans, overdue);
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
                        ${l.returnDate || l.loanDate}
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
        const bookTitle = l.book ? l.book.title : "Silinmiş Kitap";
        if (l.penalty) penalty += l.penalty;

        if (l.returnDate === null) {
            activeDiv.innerHTML += `<div style="padding:10px; background:#f3f4f6; margin-bottom:5px; border-radius:4px; color: #374151;">${bookTitle}</div>`;
        } else {
            historyDiv.innerHTML += `<div style="padding:10px; background:#f3f4f6; margin-bottom:5px; border-radius:4px; color: #374151;">${bookTitle} <br><span style="font-size:0.8em; color:#6b7280">${l.returnDate}</span></div>`;
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
    const res = await fetch(`${API}/books`);
    allAdminBooks = await res.json();
    runBookFilters();
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
        const status = b.available
            ? `<span style="color:#10b981; background:rgba(16,185,129,0.1); padding:4px 8px; border-radius:4px; font-size:0.85rem;">Müsait</span>`
            : `<span style="color:#ef4444; background:rgba(239,68,68,0.1); padding:4px 8px; border-radius:4px; font-size:0.85rem;">Ödünçte</span>`;

        tbody.innerHTML += `
            <tr>
                <td style="font-weight:500">${b.title}</td>
                <td style="color:#6b7280">${b.author?.name || '-'}</td>
                <td style="color:#6b7280">${b.category?.name || '-'}</td>
                <td style="color:#6b7280">${b.publicationYear}</td>
                <td>${status}</td>
                <td>
                    <button onclick='editBook(${JSON.stringify(b)})' style="margin-right:5px; padding: 4px 10px; background: #143800; color: white; border: none; border-radius: 4px; cursor: pointer;">Düzenle</button>
                    <button onclick="deleteBook(${b.id})" style="padding: 4px 10px; background: #7b1e1e; color: white; border: none; border-radius: 4px; cursor: pointer;">Sil</button>
                </td>
            </tr>
        `;
    });
}

// --- BOOKS: MODAL ACTIONS ---
function openBookModal() {
    loadCategories(); // Ensure categories are loaded for modal
    document.getElementById("modalTitle").innerText = "Yeni Kitap Ekle";
    document.getElementById("bookId").value = "";
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthorName").value = "";
    document.getElementById("bookIsbn").value = "";
    document.getElementById("bookYear").value = "";
    document.getElementById("bookYear").value = "";
    document.getElementById("bookModal").classList.remove("hidden");

    // Clear error message
    const errorEl = document.getElementById("bookErrorMsg");
    if (errorEl) errorEl.style.display = 'none';
}

function editBook(b) {
    loadCategories();
    document.getElementById("modalTitle").innerText = "Kitabı Düzenle";
    document.getElementById("bookId").value = b.id;
    document.getElementById("bookTitle").value = b.title;
    document.getElementById("bookAuthorName").value = b.author?.name || "";
    document.getElementById("bookIsbn").value = b.isbn;
    document.getElementById("bookYear").value = b.publicationYear;
    document.getElementById("bookCategory").value = b.category?.id;
    document.getElementById("bookModal").classList.remove("hidden");
}

async function saveBook() {
    const id = document.getElementById("bookId").value;
    const catVal = document.getElementById("bookCategory").value;
    const yearVal = document.getElementById("bookYear").value;

    const book = {
        title: document.getElementById("bookTitle").value,
        authorName: document.getElementById("bookAuthorName").value,
        isbn: document.getElementById("bookIsbn").value,
        publicationYear: yearVal ? parseInt(yearVal) : 0,
        categoryId: catVal ? catVal : null
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
        await fetch(`${API}/books/${id}`, { method: "DELETE" });
        loadBooks();
    }
}

// --- LOANS PAGE FUNCTIONS ---
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
        const memberName = (l.member ? l.member.firstName + " " + l.member.lastName : "").toLowerCase();
        const bookTitle = (l.book ? l.book.title : "").toLowerCase();

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
                <td>${l.member ? l.member.firstName + ' ' + l.member.lastName : '-'}</td>
                <td>${l.book ? l.book.title : '-'}</td>
                <td>${l.loanDate}</td>
                <td>${l.returnDate || '-'}</td>
                <td>${statusHtml}</td>
            </tr>
        `;
    });
}
