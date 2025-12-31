const API_BASE = "http://localhost:8080/api";

// --- ARAYÜZ İŞLEMLERİ (KİTAP ÇEVİRME) ---
function flipToRegister() {
    // Mobil geçersiz kılma kontrolü
    if (window.innerWidth <= 850) {
        document.getElementById('loginFace').classList.add('mobile-hidden');
        document.getElementById('registerFace').classList.remove('mobile-hidden');
    } else {
        document.getElementById('flippingPage').classList.add('flipped');
    }
}

function flipToLogin() {
    // Mobil geçersiz kılma kontrolü
    if (window.innerWidth <= 850) {
        document.getElementById('registerFace').classList.add('mobile-hidden');
        document.getElementById('loginFace').classList.remove('mobile-hidden');
    } else {
        document.getElementById('flippingPage').classList.remove('flipped');
    }
}

// Mobil yedek görünürlüğü için ilk kurulum
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth <= 850) {
        const regFace = document.getElementById('registerFace');
        if (regFace) regFace.classList.add('mobile-hidden');
    }

    // Kullanıcının halihazırda giriş yapıp yapmadığını kontrol et
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.role !== "ADMIN") { // Admin admin.html'e gitmek isteyebilir
                // Zaten user sayfasındaysak yönlendirme yapma
                if (!window.location.pathname.includes("/user/")) {
                    window.location.href = "user/dashboard.html";
                }
            } else if (user && user.role === "ADMIN") {
                window.location.href = "admin/dashboard.html";
            }
        } catch (e) {
            localStorage.removeItem("user");
        }
    }
});


// --- AUTH İŞLEMLERİ (GİRİŞ / KAYIT) ---

// Mesaj göstermek için yardımcı fonksiyon
function showMsg(elementId, message, type) {
    const box = document.getElementById(elementId);
    if (!box) return;
    box.textContent = message;
    box.className = 'message-box'; // reset
    box.classList.add(type); // 'error' veya 'success'
    box.style.display = 'block';
}

function clearMsg(elementId) {
    const box = document.getElementById(elementId);
    if (box) box.style.display = 'none';
}

async function handleRegister() {
    clearMsg("registerMsg");
    const fullName = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-pass").value;

    if (!fullName || !email || !password) {
        showMsg("registerMsg", "Lütfen tüm alanları doldurun.", "error");
        return;
    }

    // İsim/soyisim için basit ayırma
    let firstName = fullName;
    let lastName = "";
    const spaceIndex = fullName.lastIndexOf(" ");
    if (spaceIndex > 0) {
        firstName = fullName.substring(0, spaceIndex);
        lastName = fullName.substring(spaceIndex + 1);
    }

    const member = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password
    };

    try {
        const res = await fetch(`${API_BASE}/members/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(member)
        });

        if (res.ok) {
            showMsg("registerMsg", "Kayıt Başarılı! Giriş ekranına yönlendiriliyorsunuz...", "success");
            // Temizle ve Girişe Dön
            document.getElementById("reg-name").value = "";
            document.getElementById("reg-email").value = "";
            document.getElementById("reg-pass").value = "";
            setTimeout(() => {
                clearMsg("registerMsg");
                flipToLogin();
                // Opsiyonel: Giriş ekranında başarılı mesajı göster
                showMsg("loginMsg", "Kaydınız oluşturuldu. Lütfen giriş yapın.", "success");
            }, 1500);
        } else {
            const errorMsg = await res.text();
            showMsg("registerMsg", "Kayıt başarısız: " + (errorMsg || "Bilinmeyen hata"), "error");
        }
    } catch (e) {
        console.error(e);
        showMsg("registerMsg", "Sunucu ile bağlantı kurulamadı.", "error");
    }
}

async function handleLogin() {
    clearMsg("loginMsg");
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;

    if (!email || !password) {
        showMsg("loginMsg", "Lütfen email ve şifre girin.", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/members/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const currentUser = await res.json();
            // Kullanıcıyı sayfalar arasında kalıcı hale getirmek için sakla
            localStorage.setItem("user", JSON.stringify(currentUser));

            if (currentUser.role === "ADMIN") {
                window.location.href = "admin/dashboard.html";
            } else {
                window.location.href = "user/dashboard.html";
            }
        } else {
            showMsg("loginMsg", "Hatalı email veya şifre!", "error");
        }
    } catch (e) {
        console.error(e);
        showMsg("loginMsg", "Sunucu ile bağlantı kurulamadı.", "error");
    }
}
