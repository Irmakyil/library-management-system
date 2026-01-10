const API_BASE = "http://localhost:8080/api";
let currentUser = null;
let allBooks = [];
let allLoans = []; // Filtreleme için ödünçleri sakla
let currentPage = 0;
const pageSize = 18;
let isLoading = false;
let hasMore = true;

let dashboardActiveLoans = []; // Kullanıcının elindeki kitapları burada tutacağız

// --- AUTH & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Login veya register sayfasında değilsek
    if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("register.html")) {

        // Sayfa yönlendirme mantığı
        if (window.location.pathname.includes("dashboard.html")) {
            initDashboard();
        } else if (window.location.pathname.includes("my-books.html")) {
            initMyBooks();
        } else if (window.location.pathname.includes("history.html")) {
            initHistory();
        } else if (window.location.pathname.includes("settings.html")) {
            initSettings();
        } else {
            // Diğer sayfalar veya ana root
            checkUserAuth();
        }
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


function parseLocalDate(dateData) {
    if (!dateData) return new Date();
    if (Array.isArray(dateData)) {
        // [yyyy, mm, dd, HH, MM, SS, nnn]
        const year = dateData[0];
        const month = dateData[1] - 1;
        const day = dateData[2];
        const hour = dateData[3] || 0;
        const minute = dateData[4] || 0;
        const second = dateData[5] || 0;
        return new Date(year, month, day, hour, minute, second);
    }
    return new Date(dateData);
}

async function updateSidebarPenalty() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/loans/member/${currentUser.id}`);
        const loans = await res.json();
        let totalPenalty = 0;

        loans.forEach(l => {
            if (l.returnDate && l.penalty) {
                totalPenalty += l.penalty;
            }
        });

        const sidebarPenalty = document.getElementById("sidebarPenaltyDisplay");
        if (sidebarPenalty) sidebarPenalty.innerText = totalPenalty.toFixed(2) + " TL";
    } catch (e) {
        console.error(e);
    }
}

async function refreshUserLoans() {
    if (!currentUser) return;
    try {
        // My-Books sayfasındaki mantığın aynısı
        const res = await fetch(`${API_BASE}/loans/member/${currentUser.id}`);
        if (res.ok) {
            const allLoans = await res.json();
            // Global listeyi güncelle
            dashboardActiveLoans = allLoans.filter(loan => loan.returnDate === null);
            console.log("Liste Tazelendi. Güncel Kitap Sayısı:", dashboardActiveLoans.length);
        }
    } catch (e) {
        console.error("Liste tazelenirken hata:", e);
    }
}


// --- DASHBOARD (HOME) FUNCTIONS ---
async function initDashboard() {
    await checkUserAuth();
    updateSidebarPenalty();
    await refreshUserLoans();

    // Her iki veri kümesini paralel olarak getir (Öncelikli İçerik)
    const [recs, booksData] = await Promise.all([
        fetchRecommendations(),
        fetchBooks(0, pageSize)
    ]);

    // Her ikisini birlikte ve anında render et
    renderRecommendations(recs);
    handleBooksData(booksData, true);

    // Filtreleri ve diğer meta verileri yükle (Ertelenmiş)
    loadCategories();
    loadAuthors();

    // Sonsuz kaydırma
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', () => {
            // ScrollTop + ClientHeight >= ScrollHeight - Threshold
            if ((mainContent.scrollTop + mainContent.clientHeight) >= mainContent.scrollHeight - 300) {
                if (hasMore && !isLoading && window.location.pathname.includes("dashboard.html")) {
                    loadMoreBooks();
                }
            }
        });
    }
}

// --- RECOMMENDATIONS ---
async function fetchRecommendations() {
    if (!currentUser) return [];
    try {
        const recRes = await fetch(`${API_BASE}/books/recommendations/${currentUser.id}`);
        if (!recRes.ok) throw new Error("Recommendation API error");
        return await recRes.json();
    } catch (e) {
        console.error("Öneriler çekilemedi:", e);
        return [];
    }
}

function renderRecommendations(books) {
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
}

// Kept for backward compatibility if needed, but unused in initDashboard now
async function loadRecommendations() {
    const recs = await fetchRecommendations();
    renderRecommendations(recs);
}

// --- ALL BOOKS ---
async function fetchBooks(page, size) {
    try {
        // Use optimized endpoint
        const res = await fetch(`${API_BASE}/books/list?page=${page}&size=${size}`);
        if (!res.ok) throw new Error("Fetch error");
        return await res.json();
    } catch (e) {
        console.error("Kitap fetch hatası:", e);
        return [];
    }
}

function handleBooksData(data, reset = false) {
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

    filterBooks(); // Render
    updateLoadMoreButton();
}

async function loadMoreBooks() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    try {
        const data = await fetchBooks(currentPage, pageSize);
        handleBooksData(data, false);
    } finally {
        isLoading = false;
    }
}

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
        const data = await fetchBooks(currentPage, pageSize);
        handleBooksData(data, reset);
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
    'bg-spine-1': '#546e7a',
    'bg-spine-2': '#6a1b9a',
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

    books.forEach((book) => {
        if (!book) return;

        if (currentRow.children.length >= 18) {
            currentRow = document.createElement("div");
            currentRow.className = "shelf-row";
            shelfContainer.appendChild(currentRow);
        }

        let myLoan = null;

        // Global listeyi kontrol et
        if (dashboardActiveLoans && dashboardActiveLoans.length > 0) {
            myLoan = dashboardActiveLoans.find(loan => {
                // Loan nesnesinin içindeki kitap ID'si nerede?
                // loadMyLoans'da 'loan.bookId' veya 'loan.book.id' olabilir.
                let loanBookId = loan.bookId; 
                if (!loanBookId && loan.book) {
                    loanBookId = loan.book.id;
                }

                // String'e çevirerek karşılaştır (Type hatasını önler)
                return String(loanBookId) === String(book.id);
            });
        }

        const isMyBook = (myLoan != null); // Eşleşme bulundu mu?
        const isAvailable = book.available;
        
        // Görsel Ayarlar
        let opacity = "1";
        let cursor = "pointer";
        let spineTitle = book.title;

        if (isMyBook) {
            // Kitap bizdeyse -> Parlak olsun
            spineTitle += " (SİZDE)";
        } else if (!isAvailable) {
            // Bizde değil ve stok yoksa -> Soluk olsun
            opacity = "0.6";
            cursor = "not-allowed";
            spineTitle += " (Tükendi)";
        }
        
        // Spine Oluşturma
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
        spine.title = spineTitle;
        spine.innerText = book.title;

        // --- TIKLAMA OLAYI ---
        spine.onclick = () => {
            // Eğer isMyBook true ise myLoan doludur -> Modal 'İADE ET' açar
            // Eğer isMyBook false ise myLoan null'dır -> Modal 'ÖDÜNÇ AL' açar
            console.log("Kitap Tıklandı:", book.id, "Bende mi:", isMyBook);
            openBookModal(book, myLoan);
        };
        
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
        filtered = filtered.filter(book => (book.categoryId == catVal) || (book.category && book.category.id == catVal));
    }

    if (authVal !== 'all') {
        filtered = filtered.filter(book => (book.authorId == authVal) || (book.author && book.author.id == authVal));
    }

    if (query) {
        filtered = filtered.filter(book =>
            (book.title && book.title.toLowerCase().includes(query)) ||
            (book.authorName && book.authorName.toLowerCase().includes(query)) ||
            (book.author && book.author.name.toLowerCase().includes(query)) ||
            (book.isbn && book.isbn.includes(query))
        );
    }
    renderBooks(filtered);
}

// --- MY LOANS / HISTORY ---
async function initMyBooks() {
    await checkUserAuth();
    updateSidebarPenalty();
    loadMyLoans(true); // Active loans
}

async function initHistory() {
    await checkUserAuth();
    updateSidebarPenalty();
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
        if (loan.categoryName) {
            const catName = loan.categoryName;
            genreCounts[catName] = (genreCounts[catName] || 0) + 1;
        }

        const loanDate = parseLocalDate(loan.loanDate);
        const dueDate = new Date(loanDate);
        dueDate.setDate(dueDate.getDate() + 2);

        const now = new Date();
        if (now > dueDate) overdueCount++;
    });

    const uniqueReadBooks = new Set(
        loans.filter(l => l.returnDate !== null && l.bookId)
            .map(l => l.bookId)
    );
    const totalReadCount = uniqueReadBooks.size;

    let mostReadGenre = "-";
    let maxCount = 0;

    const allGenreCounts = {};
    loans.forEach(loan => {
        if (loan.categoryName) {
            const catName = loan.categoryName;
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
        if (loan.bookTitle) {
            if (count > 0 && count % 18 === 0) {
                currentRow = document.createElement("div");
                currentRow.className = "shelf-row";
                shelfContainer.appendChild(currentRow);
            }
            count++;

            const spineData = getRandomSpineData(loan.bookId);
            const titleLen = loan.bookTitle.length;
            let dynamicWidth = 35 + (titleLen * 0.8);
            if (dynamicWidth > 65) dynamicWidth = 65;
            if (dynamicWidth < 35) dynamicWidth = 35;

            const spine = document.createElement("div");
            spine.className = `book-spine ${spineData.colorClass} ${spineData.sizeClass}`;
            spine.style.width = `${dynamicWidth}px`;
            spine.style.minWidth = `${dynamicWidth}px`;
            spine.title = `${loan.bookTitle}`;
            spine.innerText = loan.bookTitle;

            const mockBook = {
                id: loan.bookId,
                title: loan.bookTitle,
                author: { name: loan.authorName },
                category: { name: loan.categoryName }
            };

            spine.onclick = () => {
                openBookModal(mockBook, loan);
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
        const bookTitle = loan.bookTitle || "Bilinmeyen Kitap";
        const authorName = loan.authorName || "-";
        const catName = loan.categoryName || "-";

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
        filtered = filtered.filter(l => l.categoryId && l.categoryId == catVal);
    }

    if (authVal !== 'all') {
        filtered = filtered.filter(l => l.authorId && l.authorId == authVal);
    }

    if (query) {
        filtered = filtered.filter(l => {
            return (l.bookTitle && l.bookTitle.toLowerCase().includes(query)) ||
                (l.authorName && l.authorName.toLowerCase().includes(query));
        });
    }

    renderHistory(filtered);
}

// --- SETTINGS ---
function initSettings() {
    checkUserAuth();
    updateSidebarPenalty();
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
async function borrowBook(bookId, branchId) {
    // Debug için konsola yazalım
    console.log("Borrow Fonksiyonu Çalıştı -> Kitap:", bookId, "Şube:", branchId);

    if (!currentUser) return;

    // Şube ID kontrolü
    if (!branchId || branchId === "Şubeler Yükleniyor..." || branchId === "") {
        alert("Lütfen bir şube seçiniz! (Değer alınamadı)");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/loans/borrow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                memberId: currentUser.id,
                bookId: bookId,
                branchId: parseInt(branchId) // Sayıya çevirip gönderiyoruz
            })
        });

        if (res.ok) {
            alert("Kitap başarıyla ödünç alındı!");

            if (window.location.pathname.includes("dashboard.html")) {
                // 1. Önce "Bende ne var?" listesini güncelle
                await refreshUserLoans(); 
                
                // 2. Sonra kitapları ve stokları yeniden yükle
                // (loadAllBooks true ile çağrılırsa listeyi sıfırlar ve yeniden çizer)
                loadAllBooks(true); 
                
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

            if (window.location.pathname.includes("dashboard.html")) {
                // 1. Listeyi güncelle 
                await refreshUserLoans();
                // 2. Kitapları yeniden diz
                loadAllBooks(true);
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
// user.js

let currentBookIdForModal = null;

async function openBookModal(book, loan = null) {
    currentBookIdForModal = book.id;

    // Modal içeriklerini doldur
    const titleEl = document.getElementById("modalTitle");
    titleEl.innerText = book.title;

    // Uzun başlıklar için font boyutunu küçült
    if (book.title.length > 20) {
        titleEl.style.fontSize = "22px";
    } else if (book.title.length > 15) {
        titleEl.style.fontSize = "28px";
    } else {
        titleEl.style.fontSize = "36px";
    }
    const authorName = book.authorName || (book.author ? book.author.name : "Bilinmeyen Yazar");
    const categoryName = book.categoryName || (book.category ? book.category.name : "Genel");

    document.getElementById("modalAuthor").innerText = authorName;
    document.getElementById("modalCategory").innerText = `~ ${categoryName} ~`;
    document.getElementById("modalIsbn").innerText = book.isbn ? `ISBN: ${book.isbn}` : "";

    // Renk ve Tasarım Ayarları
    const statusEl = document.getElementById("modalLoanStatus");
    if (statusEl) statusEl.innerText = "";

    const spineData = getRandomSpineData(book.id);
    const colorHex = spineColorMap[spineData.colorClass] || '#5d1717';
    const modalContent = document.getElementById("modalContent");
    if (modalContent) {
        modalContent.style.backgroundColor = colorHex;
        modalContent.style.borderColor = colorHex;
    }

    // HTML Elemanlarını Seç
    const branchDiv = document.getElementById("branchSelectionDiv");
    const branchSelect = document.getElementById("modalBranchSelect");
    const borrowBtn = document.getElementById("modalBorrowBtn");

    // Butonu sıfırla (Eski event listener'ları temizle)
    // replaceWith klonu, event listener'ları temizlemenin en temiz yoludur
    const newBorrowBtn = borrowBtn.cloneNode(true);
    borrowBtn.parentNode.replaceChild(newBorrowBtn, borrowBtn);

    if (loan) {
        // --- İADE MODU ---
        if (branchDiv) branchDiv.style.display = "none";

        newBorrowBtn.innerHTML = "İADE ET";
        newBorrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
        newBorrowBtn.disabled = false;
        newBorrowBtn.style.cursor = "pointer";
        newBorrowBtn.onclick = () => returnBook(loan.id);

        const loanDate = parseLocalDate(loan.loanDate);
        const dueDate = new Date(loanDate);
        dueDate.setDate(dueDate.getDate() + 2); // Exact 48h from borrow time

        const now = new Date();
        const diffTime = dueDate - now; // Milliseconds

        if (statusEl) {
            if (diffTime > 0) {
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

                if (diffHours < 24) {
                    // Less than 24 hours remaining
                    statusEl.innerText = `İade İçin Son ${diffHours} Saat!`;
                    statusEl.style.color = "#ffb74d"; // Warning color
                }
                else {
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    statusEl.innerText = `İade İçin ${diffDays} Gün Kaldı`;
                    statusEl.style.color = "#f5efea";
                }
            }
            else {
                // Overdue
                const overdueDiff = Math.abs(diffTime);
                const overdueDays = Math.ceil(overdueDiff / (1000 * 60 * 60 * 24));
                statusEl.innerText = `SÜRESİ GEÇTİ! (${overdueDays} Gün)`;
                statusEl.style.color = "#ff5252";
            }
        }
    }

    else {
        // --- ÖDÜNÇ ALMA MODU ---

        if (book.available) {
            if (branchDiv) branchDiv.style.display = "block";
            if (branchSelect) branchSelect.innerHTML = "<option>Şubeler Yükleniyor...</option>";

            newBorrowBtn.innerHTML = "YÜKLENİYOR...";
            newBorrowBtn.disabled = true;
            newBorrowBtn.style.cursor = "wait";
            newBorrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
            newBorrowBtn.style.color = "#3e1212";
            newBorrowBtn.style.opacity = "1";

            try {
                // Şubeleri Getir
                const res = await fetch(`${API_BASE}/branches/book/${book.id}`);
                const branches = await res.json();

                if (branchSelect) branchSelect.innerHTML = "";

                if (branches.length === 0) {
                    if (branchSelect) branchSelect.innerHTML = "<option>Stokta Yok!</option>";
                    newBorrowBtn.innerHTML = "TÜKENDİ";
                    newBorrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
                    newBorrowBtn.style.color = "#3e1212";
                    newBorrowBtn.style.opacity = "0.5";
                    newBorrowBtn.disabled = true;
                    newBorrowBtn.style.cursor = "not-allowed";
                } else {
                    // Şubeleri dropdown'a doldur
                    branches.forEach(br => {
                        const opt = document.createElement("option");
                        opt.value = br.id;
                        opt.text = br.name;
                        branchSelect.appendChild(opt);
                    });

                    newBorrowBtn.innerHTML = "ÖDÜNÇ AL";
                    newBorrowBtn.disabled = false;
                    newBorrowBtn.style.cursor = "pointer";

                    // --- İŞTE DÜZELTİLEN KISIM ---
                    newBorrowBtn.onclick = function () {
                        // 1. Tıklama anında seçili değeri al
                        const selectedVal = document.getElementById("modalBranchSelect").value;

                        // 2. Kontrol et
                        console.log("Tıklanan Kitap:", currentBookIdForModal);
                        console.log("Seçilen Şube ID:", selectedVal);

                        // 3. borrowBook fonksiyonuna gönder
                        borrowBook(currentBookIdForModal, selectedVal);

                        closeBookModal();
                    };
                }
            } catch (e) {
                console.error("Şube hatası:", e);
                newBorrowBtn.innerHTML = "HATA";
            }

        } else {
            // Kitap Müsait Değil
            if (branchDiv) branchDiv.style.display = "none";
            newBorrowBtn.innerHTML = "ÖDÜNÇTE";
            newBorrowBtn.disabled = true;
            newBorrowBtn.style.background = "linear-gradient(to bottom, #ffd700, #f59e0b)";
            newBorrowBtn.style.color = "#3e1212";
            newBorrowBtn.style.opacity = "0.5";
            newBorrowBtn.style.cursor = "not-allowed";
            newBorrowBtn.onclick = () => alert("Bu kitap şu an başkasında.");
        }
    }

    // Modalı Göster
    document.getElementById("bookDetailModal").classList.remove("hidden");
    document.getElementById("bookDetailModal").style.display = "flex";
}

function closeBookModal() {
    document.getElementById("bookDetailModal").classList.add("hidden");
    currentBookIdForModal = null;
}
