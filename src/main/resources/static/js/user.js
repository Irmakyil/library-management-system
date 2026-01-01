const API_BASE = "http://localhost:8080/api";
let currentUser = null;
let allBooks = [];
let allLoans = []; // Filtreleme için ödünçleri sakla
let currentPage = 0;
const pageSize = 12;
let isLoading = false;
let hasMore = true;

// --- AUTH & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Sayfa yüklendiğinde kullanıcı kontrolü
    // Login veya register sayfasında değilsek
    if (!window.location.pathname.endsWith("login.html")) {
        checkUserAuth();
    }
});

function checkUserAuth() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
        window.location.href = "../login.html";
        return;
    }

    try {
        currentUser = JSON.parse(storedUser);
        if (!currentUser || !currentUser.id) {
            throw new Error("Invalid user data");
        }

        // Admin ise admin paneline yönlendir
        if (currentUser.role === 'ADMIN' && !window.location.pathname.includes('admin/')) {
            window.location.href = "../admin/";
        }

        // Hoşgeldin mesajını güncelle
        const sidebarWelcome = document.getElementById("sidebarWelcomeMsg");
        if (sidebarWelcome) sidebarWelcome.innerText = `${currentUser.firstName} ${currentUser.lastName}`;

        // Sidebar ceza bilgisini güncelle
        updateSidebarPenalty();

    } catch (e) {
        console.error("Auth error:", e);
        localStorage.removeItem("user");
        window.location.href = "../login.html";
    }
}

function logout() {
    localStorage.removeItem("user");
    currentUser = null;
    window.location.href = "../login.html";
}

async function updateSidebarPenalty() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/loans/member/${currentUser.id}/active`);
        const loans = await res.json();
        let totalPenalty = 0;
        loans.forEach(l => {
            if (l.penalty) totalPenalty += l.penalty;
        });
        const sidebarPenalty = document.getElementById("sidebarPenaltyDisplay");
        if (sidebarPenalty) sidebarPenalty.innerText = totalPenalty.toFixed(2) + " TL";
    } catch (e) {
        console.error(e);
    }
}

// --- DASHBOARD (HOME) FUNCTIONS ---
async function initDashboard() {
    await checkUserAuth();
    loadRecommendations();
    loadAllBooks();
    loadCategories();
    loadAuthors();
}

// --- RECOMMENDATIONS ---
async function loadRecommendations() {
    if (!currentUser) return;

    try {
        const [recRes, loanRes] = await Promise.all([
            fetch(`${API_BASE}/books/recommendations/${currentUser.id}`),
            fetch(`${API_BASE}/loans/member/${currentUser.id}`)
        ]);

        if (!recRes.ok) throw new Error("Recommendation API error");

        let books = await recRes.json();

        // Kullanıcının şu anda ödünç aldığı kitapları filtrele
        if (loanRes.ok) {
            const loans = await loanRes.json();
            const activeBookIds = loans
                .filter(l => l.returnDate === null && l.book)
                .map(l => l.book.id);

            books = books.filter(b => !activeBookIds.includes(b.id));
        }

        const section = document.getElementById("recommendationSection");
        const grid = document.getElementById("recommendationGrid");

        if (books && books.length > 0) {
            if (section) section.style.display = "block";
            if (grid) {
                grid.innerHTML = "";
                grid.style.display = "block";
                grid.className = "";

                // Öneriler için bir raf konteyneri oluştur
                const shelfContainer = document.createElement("div");
                shelfContainer.className = "shelf-container";
                shelfContainer.style.background = "#3e2723";
                shelfContainer.style.padding = "20px";
                shelfContainer.style.borderRadius = "12px";

                const shelfRow = document.createElement("div");
                shelfRow.className = "shelf-row";
                shelfRow.style.height = "250px";
                shelfRow.style.justifyContent = "center";
                shelfRow.style.padding = "0 40px";
                shelfRow.style.gap = "20px";

                books.forEach((book, index) => {
                    const colorIndex = (book.id % 7) + 1;
                    const colorClass = `bg-cover-${colorIndex}`;

                    const bookFront = document.createElement("div");
                    bookFront.className = `book-front ${colorClass}`;

                    bookFront.innerHTML = `
                        <div class="rec-badge">ÖNERİ</div>
                        <div class="book-cover-frame">
                            <div class="rec-author">${book.author ? book.author.name : 'Unknown'}</div>
                            <div class="rec-divider"></div>
                            <div class="rec-title">${book.title}</div>
                            <div class="rec-category">~ ${book.category ? book.category.name : 'Genel'} ~</div>
                        </div>
                    `;

                    bookFront.onclick = () => {
                        openBookModal(book);
                    };

                    shelfRow.appendChild(bookFront);
                });

                shelfContainer.appendChild(shelfRow);
                grid.appendChild(shelfContainer);
            }
        } else {
            if (section) section.style.display = "none";
        }
    } catch (e) {
        console.error("Öneriler yüklenemedi:", e);
        const sec = document.getElementById("recommendationSection");
        if (sec) sec.style.display = "none";
    }
}

// --- ALL BOOKS ---
// --- ALL BOOKS ---
async function loadAllBooks(reset = true) {
    if (isLoading) return;

    if (reset) {
        currentPage = 0;
        allBooks = [];
        hasMore = true;
    }

    if (!hasMore && !reset) return;

    isLoading = true;
    try {
        const res = await fetch(`${API_BASE}/books?page=${currentPage}&size=${pageSize}`);
        const data = await res.json();

        // Backend Page<Book> dönerse data.content, yoksa data (List)
        let newBooks = [];
        if (data.content) {
            newBooks = data.content;
            hasMore = !data.last;
            currentPage++;
        } else if (Array.isArray(data)) {
            newBooks = data;
            hasMore = false;
        }

        if (reset) {
            allBooks = newBooks;
        } else {
            allBooks = [...allBooks, ...newBooks];
        }

        filterBooks(); // Mevcut filtreleri koruyarak render et
        updateLoadMoreButton();

    } catch (e) {
        console.error("Kitaplar yüklenemedi", e);
        isLoading = false;
    } finally {
        isLoading = false;
    }
}

function updateLoadMoreButton() {
    let btn = document.getElementById("loadMoreBtn");
    const grid = document.getElementById("booksGrid");

    // Grid yoksa buton işlemine gerek yok
    if (!grid) return;

    if (!btn) {
        btn = document.createElement("button");
        btn.id = "loadMoreBtn";
        btn.innerText = "Daha Fazla Yükle";

        // Style
        btn.style.display = "block";
        btn.style.width = "200px";
        btn.style.margin = "30px auto";
        btn.style.padding = "12px 20px";
        btn.style.background = "#7b1e1e";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.fontSize = "16px";
        btn.style.fontWeight = "600";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        btn.style.transition = "transform 0.1s";

        btn.onmouseover = () => btn.style.background = "#5a1616";
        btn.onmouseout = () => btn.style.background = "#7b1e1e";
        btn.onclick = () => loadAllBooks(false);

        // Grid'den sonra ekle
        grid.parentNode.insertBefore(btn, grid.nextSibling);
    }

    // Eğer daha fazla veri yoksa gizle
    if (hasMore) {
        btn.style.display = "block";
        btn.innerHTML = isLoading ? "Yükleniyor..." : "Daha Fazla Yükle";
    } else {
        btn.style.display = "none";
    }
}

const spineColors = ['bg-spine-1', 'bg-spine-2', 'bg-spine-3', 'bg-spine-4', 'bg-spine-5', 'bg-spine-6', 'bg-spine-7'];
const spineColorMap = {
    'bg-spine-1': '#263238',
    'bg-spine-2': '#3e2723',
    'bg-spine-3': '#b71c1c',
    'bg-spine-4': '#1b5e20',
    'bg-spine-5': '#311b92',
    'bg-spine-6': '#880e4f',
    'bg-spine-7': '#e65100'
};
const spineSizes = ['spine-sm', 'spine-md', 'spine-lg', 'spine-xl'];

function getRandomSpineData(id) {
    const colorIndex = id % spineColors.length;
    const sizeIndex = (id * 3) % spineSizes.length;
    return {
        colorClass: spineColors[colorIndex],
        sizeClass: spineSizes[sizeIndex]
    };
}

function renderBooks(books) {
    const grid = document.getElementById("booksGrid");
    if (!grid) return;

    grid.innerHTML = "";
    grid.className = "";

    if (books.length === 0) {
        grid.innerHTML = "<p style='color:#666;'>Kitap bulunamadı.</p>";
        return;
    }

    const shelfContainer = document.createElement("div");
    shelfContainer.className = "shelf-container";

    let currentRow = document.createElement("div");
    currentRow.className = "shelf-row";
    shelfContainer.appendChild(currentRow);

    books.forEach((book, index) => {
        if (index > 0 && index % 12 === 0) {
            currentRow = document.createElement("div");
            currentRow.className = "shelf-row";
            shelfContainer.appendChild(currentRow);
        }

        const isAvailable = book.available;
        const opacity = isAvailable ? "1" : "0.6";
        const cursor = isAvailable ? "pointer" : "not-allowed";

        const spineData = getRandomSpineData(book.id);

        const titleLen = book.title.length;
        let dynamicWidth = 35 + (titleLen * 0.8);
        if (dynamicWidth > 65) dynamicWidth = 65;
        if (dynamicWidth < 35) dynamicWidth = 35;

        const spine = document.createElement("div");
        spine.className = `book-spine ${spineData.colorClass} ${spineData.sizeClass}`;
        spine.style.opacity = opacity;
        spine.style.cursor = cursor;
        spine.style.width = `${dynamicWidth}px`;
        spine.style.minWidth = `${dynamicWidth}px`;

        spine.title = `${book.title} - ${book.author.name} (${isAvailable ? 'Müsait' : 'Ödünçte'})`;
        spine.onclick = () => {
            openBookModal(book);
        };

        spine.innerText = book.title;

        currentRow.appendChild(spine);
    });

    grid.appendChild(shelfContainer);
}

// --- FILTERS ---
async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        const categories = await res.json();
        const selectBox = document.getElementById("categorySelect");
        const historySelectBox = document.getElementById("historyCategorySelect");

        const optionsHtml = '<option value="all">Tüm Kategoriler</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

        if (selectBox) selectBox.innerHTML = optionsHtml;
        if (historySelectBox) historySelectBox.innerHTML = optionsHtml;

    } catch (e) { console.error("Kategoriler yüklenemedi:", e); }
}

async function loadAuthors() {
    try {
        const res = await fetch(`${API_BASE}/authors`);
        const authors = await res.json();
        const selectBox = document.getElementById("authorSelect");
        const historySelectBox = document.getElementById("historyAuthorSelect");

        const optionsHtml = '<option value="all">Tüm Yazarlar</option>' +
            authors.map(auth => `<option value="${auth.id}">${auth.name}</option>`).join('');

        if (selectBox) selectBox.innerHTML = optionsHtml;
        if (historySelectBox) historySelectBox.innerHTML = optionsHtml;

    } catch (e) { console.error("Yazarlar yüklenemedi", e); }
}

function filterBooks() {
    let filtered = allBooks;

    const catVal = document.getElementById("categorySelect").value;
    const authVal = document.getElementById("authorSelect").value;
    const query = document.getElementById("searchInput").value.toLowerCase();

    if (catVal !== 'all') {
        filtered = filtered.filter(book => book.category && book.category.id == catVal);
    }

    if (authVal !== 'all') {
        filtered = filtered.filter(book => book.author && book.author.id == authVal);
    }

    if (query) {
        filtered = filtered.filter(book =>
            (book.title && book.title.toLowerCase().includes(query)) ||
            (book.author && book.author.name.toLowerCase().includes(query)) ||
            (book.isbn && book.isbn.includes(query))
        );
    }
    renderBooks(filtered);
}

// --- MY LOANS / HISTORY ---
async function initMyBooks() {
    await checkUserAuth();
    loadMyLoans(true); // Active loans
}

async function initHistory() {
    await checkUserAuth();
    loadMyLoans(false); // History
    loadCategories();
    loadAuthors();
}

async function loadMyLoans(isActiveView = true) {
    if (!currentUser) return;

    try {
        const res = await fetch(`${API_BASE}/loans/member/${currentUser.id}`);
        const loans = await res.json();
        allLoans = loans;

        if (isActiveView) {
            renderActiveLoans(loans);
        } else {
            // Initial render for history page
            const historyLoans = loans.filter(l => l.returnDate !== null);
            renderHistory(historyLoans);
        }

    } catch (e) {
        console.error("Ödünç listesi çekilemedi:", e);
    }
}

function renderActiveLoans(loans) {
    const activeListDiv = document.getElementById("activeLoansList");
    if (!activeListDiv) return;

    // Filter active loans
    const activeLoans = loans.filter(l => l.returnDate === null);

    // Stats
    let overdueCount = 0;
    const genreCounts = {};

    activeLoans.forEach(loan => {
        const book = loan.book;
        if (book && book.category) {
            const catName = book.category.name;
            genreCounts[catName] = (genreCounts[catName] || 0) + 1;
        }

        const loanDate = new Date(loan.loanDate);
        const dueDate = new Date(loanDate);
        dueDate.setDate(dueDate.getDate() + 1);
        if (new Date() > dueDate) overdueCount++;
    });

    const totalReadCount = loans.filter(l => l.returnDate !== null).length;
    let mostReadGenre = "-";
    let maxCount = 0;
    // Calculate most read genre from ALL loans
    const allGenreCounts = {};
    loans.forEach(loan => {
        const book = loan.book;
        if (book && book.category) {
            const catName = book.category.name;
            allGenreCounts[catName] = (allGenreCounts[catName] || 0) + 1;
        }
    });

    for (const [genre, count] of Object.entries(allGenreCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostReadGenre = genre;
        }
    }

    // Update Stats in DOM if they exist
    const statActive = document.getElementById("statActiveCount");
    if (statActive) statActive.innerText = activeLoans.length;

    const statOverdue = document.getElementById("statOverdueCount");
    if (statOverdue) statOverdue.innerText = overdueCount;

    const statTotal = document.getElementById("statTotalRead");
    if (statTotal) statTotal.innerText = totalReadCount;

    const statGenre = document.getElementById("statMostReadGenre");
    if (statGenre) statGenre.innerText = mostReadGenre;

    // Render Shelf
    activeListDiv.innerHTML = "";
    activeListDiv.className = "";
    activeListDiv.style.display = "block";

    if (activeLoans.length === 0) {
        activeListDiv.innerHTML = "<p style='font-size:14px; color:#666;'>Henüz ödünç alınan kitap yok.</p>";
        return;
    }

    const shelfContainer = document.createElement("div");
    shelfContainer.className = "shelf-container";
    let currentRow = document.createElement("div");
    currentRow.className = "shelf-row";
    shelfContainer.appendChild(currentRow);

    let count = 0;
    activeLoans.forEach(loan => {
        const book = loan.book;
        if (book) {
            if (count > 0 && count % 12 === 0) {
                currentRow = document.createElement("div");
                currentRow.className = "shelf-row";
                shelfContainer.appendChild(currentRow);
            }
            count++;

            const spineData = getRandomSpineData(book.id);
            const titleLen = book.title.length;
            let dynamicWidth = 35 + (titleLen * 0.8);
            if (dynamicWidth > 65) dynamicWidth = 65;
            if (dynamicWidth < 35) dynamicWidth = 35;

            const spine = document.createElement("div");
            spine.className = `book-spine ${spineData.colorClass} ${spineData.sizeClass}`;
            spine.style.width = `${dynamicWidth}px`;
            spine.style.minWidth = `${dynamicWidth}px`;
            spine.title = `${book.title}`;
            spine.innerText = book.title;

            spine.onclick = () => {
                openBookModal(book, loan);
            };

            currentRow.appendChild(spine);
        }
    });

    activeListDiv.appendChild(shelfContainer);
}

function renderHistory(loanList) {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (loanList.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#5d4037; font-style:italic;'>Kriterlere uygun geçmiş bulunamadı.</td></tr>";
        return;
    }

    loanList.forEach((loan, index) => {
        const bookTitle = loan.book ? loan.book.title : "Bilinmeyen Kitap";
        const authorName = loan.book && loan.book.author ? loan.book.author.name : "-";
        const catName = loan.book && loan.book.category ? loan.book.category.name : "-";

        const loanDate = loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('tr-TR') : "-";
        const returnDate = loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('tr-TR') : "-";

        let penaltyHtml = '<span class="no-penalty">Yok</span>';
        if (loan.penalty && loan.penalty > 0) {
            penaltyHtml = `<span class="penalty-tag">${loan.penalty.toFixed(2)} TL</span>`;
        }

        const row = `
            <tr>
                <td style="font-weight:bold; color: #5d4037;">${index + 1}</td>
                <td style="font-weight:600; color:#1f2937;">${bookTitle}</td>
                <td>${authorName}</td>
                <td><span class="genre-badge">${catName}</span></td>
                <td>${loanDate}</td>
                <td>${returnDate}</td>
                <td>${penaltyHtml}</td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

function filterHistory() {
    let filtered = allLoans.filter(l => l.returnDate !== null);

    const catVal = document.getElementById("historyCategorySelect").value;
    const authVal = document.getElementById("historyAuthorSelect").value;
    const query = document.getElementById("historySearchInput").value.toLowerCase();

    if (catVal !== 'all') {
        filtered = filtered.filter(l => l.book && l.book.category && l.book.category.id == catVal);
    }

    if (authVal !== 'all') {
        filtered = filtered.filter(l => l.book && l.book.author && l.book.author.id == authVal);
    }

    if (query) {
        filtered = filtered.filter(l => {
            const b = l.book;
            if (!b) return false;
            return (b.title && b.title.toLowerCase().includes(query)) ||
                (b.author && b.author.name.toLowerCase().includes(query)) ||
                (b.isbn && b.isbn.includes(query));
        });
    }

    renderHistory(filtered);
}

// --- SETTINGS ---
function initSettings() {
    checkUserAuth();
    loadProfile();
}

function loadProfile() {
    if (!currentUser) return;
    const nameInput = document.getElementById("settingsName");
    const emailInput = document.getElementById("settingsEmail");
    if (nameInput) nameInput.value = `${currentUser.firstName} ${currentUser.lastName}`;
    if (emailInput) emailInput.value = currentUser.email;
}

async function updatePassword() {
    const currentPass = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const msgBox = document.getElementById("passwordMsg");

    msgBox.style.display = 'none';
    msgBox.className = 'message-box';

    if (!currentPass || !newPass) {
        msgBox.textContent = "Lütfen tüm alanları doldurun.";
        msgBox.classList.add("error");
        msgBox.style.display = "block";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/members/${currentUser.id}/password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentPassword: currentPass,
                newPassword: newPass
            })
        });

        if (res.ok) {
            msgBox.textContent = "Şifreniz başarıyla güncellendi!";
            msgBox.classList.add("success");
            msgBox.style.display = "block";
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
        } else {
            const msg = await res.text();
            msgBox.textContent = "Hata: " + msg;
            msgBox.classList.add("error");
            msgBox.style.display = "block";
        }
    } catch (error) {
        msgBox.textContent = "Bir hata oluştu.";
        msgBox.classList.add("error");
        msgBox.style.display = "block";
    }
}

// --- BORROW / RETURN LOGIC ---
async function borrowBook(bookId) {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/loans/borrow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                memberId: currentUser.id,
                bookId: bookId
            })
        });

        if (res.ok) {
            alert("Kitap başarıyla ödünç alındı!");
            // Refresh logic depends on the page
            if (window.location.pathname.includes("dashboard.html")) {
                loadAllBooks();
                loadRecommendations();
                updateSidebarPenalty();
            }
        } else {
            const errorMsg = await res.text();
            alert("HATA: " + errorMsg);
        }
    } catch (e) {
        console.error(e);
        alert("İşlem sırasında hata oluştu.");
    }
}

async function returnBook(loanId) {
    if (!confirm("Bu kitabı iade etmek istiyor musunuz?")) return;
    try {
        const res = await fetch(`${API_BASE}/loans/${loanId}/return`, {
            method: "PUT"
        });

        if (res.ok) {
            const updatedLoan = await res.json();
            if (updatedLoan.penalty > 0) {
                alert(`Kitap iade edildi. Gecikme Cezası: ${updatedLoan.penalty} TL`);
            } else {
                alert("Kitap zamanında iade edildi. Teşekkürler!");
            }
            closeBookModal();
            // Refresh logic depends on page
            if (window.location.pathname.includes("my-books.html")) {
                loadMyLoans(true);
            }
            updateSidebarPenalty();
        } else {
            const err = await res.text();
            alert("İade Hatası: " + err);
        }
    } catch (e) {
        console.error(e);
        alert("Sunucu hatası.");
    }
}

// --- MODAL ---
let currentBookIdForModal = null;

function openBookModal(book, loan = null) {
    currentBookIdForModal = book.id;

    document.getElementById("modalTitle").innerText = book.title;
    document.getElementById("modalAuthor").innerText = book.author ? book.author.name : "Bilinmeyen Yazar";
    document.getElementById("modalCategory").innerText = book.category ? `~ ${book.category.name} ~` : "~ Genel ~";
    document.getElementById("modalIsbn").innerText = book.isbn ? `ISBN: ${book.isbn}` : "";

    const statusEl = document.getElementById("modalLoanStatus");
    if (statusEl) statusEl.innerText = "";

    const spineData = getRandomSpineData(book.id);
    const colorHex = spineColorMap[spineData.colorClass] || '#5d1717';
    const modalContent = document.getElementById("modalContent");
    if (modalContent) {
        modalContent.style.backgroundColor = colorHex;
        modalContent.style.borderColor = colorHex;
    }

    const borrowBtn = document.getElementById("modalBorrowBtn");
    borrowBtn.onclick = null;

    if (loan) {
        // RETURN MODE
        borrowBtn.innerHTML = "İADE ET";
        borrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
        borrowBtn.style.color = "#3e1212";
        borrowBtn.style.opacity = "1";
        borrowBtn.style.cursor = "pointer";

        const loanDate = new Date(loan.loanDate);
        const dueDate = new Date(loanDate);
        dueDate.setDate(dueDate.getDate() + 1);
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (statusEl) {
            if (diffDays >= 0) {
                statusEl.innerText = `İade İçin ${diffDays} Gün Kaldı`;
                statusEl.style.color = "#f5efea";
            } else {
                statusEl.innerText = `SÜRESİ GEÇTİ! (${Math.abs(diffDays)} Gün)`;
                statusEl.style.color = "#ff5252";
            }
        }
        borrowBtn.onclick = () => returnBook(loan.id);

    } else if (book.available) {
        // BORROW MODE
        borrowBtn.innerHTML = "ÖDÜNÇ AL";
        borrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
        borrowBtn.style.color = "#3e1212";
        borrowBtn.style.opacity = "1";
        borrowBtn.style.cursor = "pointer";
        borrowBtn.onclick = () => {
            borrowBook(currentBookIdForModal);
            closeBookModal();
        };

    } else {
        // UNAVAILABLE MODE
        borrowBtn.innerHTML = "ŞU AN ÖDÜNÇTE";
        borrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
        borrowBtn.style.color = "#3e1212";
        borrowBtn.style.opacity = "0.5";
        borrowBtn.style.cursor = "not-allowed";
        borrowBtn.onclick = () => alert("Bu kitap şu an başkasında, ödünç alınamaz.");
    }

    document.getElementById("bookDetailModal").classList.remove("hidden");
    document.getElementById("bookDetailModal").style.display = "flex";
}

function closeBookModal() {
    document.getElementById("bookDetailModal").classList.add("hidden");
    currentBookIdForModal = null;
}
