const API = "http://localhost:8080/api";
let allCategories = [], allAuthors = [];

// --- YARDIMCI ARAÇLAR ---
const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("token")
});

const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${API}${endpoint}`, { ...options, headers: getAuthHeaders() });
    if (!res.ok) throw new Error("İşlem başarısız");
    return res.status !== 204 ? res.json() : null;
};

// --- GÜVENLİK ---
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "ADMIN") return window.location.href = "../index.html";
    if (document.getElementById("sidebarAdminName")) 
        document.getElementById("sidebarAdminName").innerText = `${user.firstName} ${user.lastName}`;
    return user;
}

const logout = () => { localStorage.removeItem("user"); window.location.href = "../login.html"; };

// --- ORTAK VERİ YÜKLEYİCİLER ---
async function loadFilters() {
    const [cats, auths] = await Promise.all([apiFetch("/categories"), apiFetch("/authors")]);
    allCategories = cats; allAuthors = auths;

    const fillSelect = (id, data, defaultText) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<option value="">${defaultText}</option>` + 
            data.map(d => `<option value="${d.id}">${d.name}</option>`).join("");
    };

    fillSelect("bookCategory", allCategories, "Kategori Seçin");
    fillSelect("adminCategoryFilter", allCategories, "Tüm Kategoriler");
    fillSelect("adminAuthorFilter", allAuthors, "Tüm Yazarlar");
}

// --- DASHBOARD ---
async function loadDashboardStats() {
    try {
        const data = await apiFetch("/dashboard/stats");
        
        // 1. İstatistik Kutucuklarını Doldur
        const statsMap = { 
            'total-books': data.totalBooks, 
            'total-members': data.totalMembers, 
            'active-loans': data.activeLoans, 
            'overdue-loans': data.overdueLoans 
        };
        
        Object.entries(statsMap).forEach(([id, val]) => {
            const el = document.getElementById(`stat-${id}`);
            if (el) el.innerText = val || 0;
        });

        // 2. Son Hareketler Listesi
        const recentContainer = document.getElementById("dashboardRecentLoans");
        if (recentContainer) {
            recentContainer.innerHTML = data.recentTransactions?.map(l => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px 5px; text-align:center;">${l.returnDate ? '↩' : '➝'}</td>
                    <td style="padding: 12px 5px;">
                        <div style="font-weight: 600;">${l.member?.firstName} ${l.member?.lastName}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">${l.returnDate ? 'İade' : 'Ödünç'}: ${l.book?.title}</div>
                    </td>
                    <td style="padding: 12px 5px; text-align: right; color: #9ca3af; font-size: 0.85rem;">${l.returnDate || l.loanDate}</td>
                </tr>`).join("") || "<tr><td colspan='3' style='text-align:center;'>İşlem yok.</td></tr>";
        }

        // 3. ACİL İADE BEKLEYENLER (Gecikenler) Listesi - Eksik olan kısım burasıydı
        const overdueContainer = document.getElementById("dashboardOverdueList");
        if (overdueContainer) {
            if (!data.urgentReturns || data.urgentReturns.length === 0) {
                overdueContainer.innerHTML = "<p style='text-align:center; padding:20px; color:#10b981;'>Geciken kitap yok!</p>";
            } else {
                overdueContainer.innerHTML = data.urgentReturns.map(l => `
                    <div style="background: #fef2f2; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: 600; color: #991b1b;">${l.member?.firstName} ${l.member?.lastName}</div>
                            <div style="font-size: 0.9rem; color: #b91c1c;">${l.book?.title}</div>
                        </div>
                        <div style="text-align: center; color: #ef4444; font-weight: bold; font-size: 0.85rem; background: #fee2e2; padding: 4px 8px; border-radius: 6px;">
                            GECİKTİ
                        </div>
                    </div>`).join("");
            }
        }
    } catch (e) {
        console.error("Dashboard yüklenirken hata:", e);
    }
}

// --- KİTAP YÖNETİMİ ---
async function loadBooks() {
    const data = await apiFetch("/books?size=1000");
    const books = data.content || data || [];
    const tbody = document.querySelector("#booksTable tbody");
    if (!tbody) return;

    tbody.innerHTML = books.map(b => {
        const stock = b.inventory?.stockQuantity || 0;
        return `
            <tr style="background: rgba(255, 255, 255, 0.95); border-radius: 8px;">
                <td style="padding:12px;">${b.title}</td>
                <td>${b.author?.name || "-"}</td>
                <td>${b.category?.name || "-"}</td>
                <td>${b.publicationYear}</td>
                <td style="text-align:center;">${stock}</td>
                <td><span style="padding:4px 8px; border-radius:4px; color:${stock > 0 ? '#10b981':'#ef4444'}">${stock > 0 ? 'Müsait':'Tükendi'}</span></td>
                <td style="text-align:right;">
                    <button onclick='editBook(${JSON.stringify(b).replace(/'/g, "&apos;")})' style="background:#5d4037; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">Düzenle</button>
                    <button onclick="deleteBook(${b.id})" style="background:#8a1c1c; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">Sil</button>
                </td>
            </tr>`;
    }).join("");
}

const deleteBook = async (id) => { if(confirm("Silmek istediğinize emin misiniz?")) { await apiFetch(`/books/${id}`, { method: "DELETE" }); loadBooks(); } };

// --- ÜYE & ÖDÜNÇ YÖNETİMİ ---
async function loadMembers(query = "") {
    const data = await apiFetch(query ? `/members/search?query=${query}` : "/members");
    const members = data.content || data || [];
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    document.querySelector("#membersTable tbody").innerHTML = members.map(u => `
        <tr>
            <td style="padding:12px;">${u.firstName} ${u.lastName}</td>
            <td>${u.email}</td>
            <td style="text-align:right;">
                ${currentUser.id !== u.id ? `<button onclick="deleteUser(${u.id})" style="background:#8a1c1c; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">Sil</button>` : '<i>(Siz)</i>'}
            </td>
        </tr>`).join("");
}

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

// --- INITIALIZE ---
document.addEventListener("DOMContentLoaded", () => {
    if (!checkAdminAuth()) return;
    const pageLoaders = { "booksTable": loadBooks, "membersTable": loadMembers, "loansTable": loadLoans, "stat-total-books": loadDashboardStats };
    
    Object.entries(pageLoaders).forEach(([id, loader]) => {
        if (document.getElementById(id)) {
            if (id === "booksTable") loadFilters();
            loader();
        }
    });
});