package com.library.library_system.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import com.library.library_system.model.Book;
import com.library.library_system.model.Branch;
import com.library.library_system.model.Inventory;
import com.library.library_system.model.Loan;
import com.library.library_system.model.Member;
import com.library.library_system.repository.BookRepository;
import com.library.library_system.repository.BranchRepository;
import com.library.library_system.repository.InventoryRepository;
import com.library.library_system.repository.LoanRepository;
import com.library.library_system.repository.MemberRepository;
import com.library.library_system.dto.LoanRequest;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final InventoryRepository inventoryRepository;
    private final BranchRepository branchRepository;

    public LoanService(LoanRepository loanRepository, BookRepository bookRepository,
            MemberRepository memberRepository,
            InventoryRepository inventoryRepository,
            BranchRepository branchRepository) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.inventoryRepository = inventoryRepository;
        this.branchRepository = branchRepository;
    }

    public List<com.library.library_system.dto.LoanDTO> getAllLoans() {
        return loanRepository.findAllDTOs();
    }

    // --- ÜYEYE GÖRE LİSTELEME ---
    public List<com.library.library_system.dto.LoanDTO> getLoansByMember(Long memberId) {
        return loanRepository.findDTOByMemberId(memberId);
    }

    // Sidebar performans optimizasyonu için: Sadece aktif ödünçleri getir
    public List<Loan> getActiveLoansByMember(Long memberId) {
        return loanRepository.findByMemberIdAndReturnDateIsNull(memberId);
    }

    // --- ÖDÜNÇ ALMA İŞLEMİ ---
    @Transactional // İşlem sırasında hata olursa stok düşmesini geri almak için
    public Loan createLoan(LoanRequest request) {
        // 1. Üye ve Kitap Kontrolü
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Üye bulunamadı"));

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new RuntimeException("Kitap bulunamadı"));

        // --- KULLANICIDA BU KİTAP ZATEN VAR MI? ---
        boolean alreadyHasBook = loanRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(member.getId(), book.getId());
        if (alreadyHasBook) {
            throw new RuntimeException("Bu kitabı zaten ödünç aldınız! Önce elinizdekini iade etmelisiniz.");
        }

        // 2. Şube Kontrolü
        if (request.getBranchId() == null) {
            throw new RuntimeException("Lütfen bir şube seçiniz!");
        }
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Şube bulunamadı"));

        // 3. Stok Kontrolü ve Düşürme (YENİ)
        Inventory inventory = inventoryRepository.findByBookIdAndBranchId(book.getId(), branch.getId());
        
        if (inventory == null || inventory.getStockQuantity() <= 0) {
            throw new RuntimeException("Seçilen şubede bu kitap tükenmiş!");
        }

        // Stoğu 1 azalt
        inventory.setStockQuantity(inventory.getStockQuantity() - 1);
        inventoryRepository.save(inventory);

        // Tüm şubelerdeki toplam stok sayısını soralım
        Integer totalStock = inventoryRepository.sumStockByBookId(book.getId());
        
        // Eğer toplam stok null ise veya 0'a eşit/küçükse kitabı kapat
        if (totalStock == null || totalStock <= 0) {
            book.setAvailable(false);
            bookRepository.save(book);
        }

        // 4. Ödünç Kaydını Oluştur
        Loan loan = new Loan();
        loan.setBook(book);
        loan.setMember(member);
        loan.setBranch(branch); // <--- Şubeyi kaydet
        loan.setLoanDate(LocalDateTime.now());
        
        return loanRepository.save(loan);
    }

    // --- İADE ETME İŞLEMİ ---
    public Loan returnLoan(Long loanId) {
        // İşlemi bul
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Ödünç işlemi bulunamadı!"));

        // Zaten iade edilmiş mi kontrol et
        if (loan.getReturnDate() != null) {
            throw new RuntimeException("Bu kitap zaten iade edilmiş!");
        }

        // İade tarihini şu an yap
        loan.setReturnDate(LocalDateTime.now());

        // CEZA HESAPLAMA
        LocalDateTime dueDate = loan.getLoanDate().plusDays(2);

        if (loan.getReturnDate().isAfter(dueDate)) {
            // Tam 24 saatlik döngüler halinde ceza hesapla
            // Örn: 1 saat gecikirse bile 1 gün sayılır
            java.time.Duration diff = java.time.Duration.between(dueDate, loan.getReturnDate());
            long overdueDays = (long) Math.ceil(diff.toMinutes() / (24.0 * 60.0));
            // Math.ceil 0.1 -> 1.0 verir.
            if (overdueDays < 1)
                overdueDays = 1;

            double penaltyAmount = overdueDays * 5.0; // Günlük 5 TL
            loan.setPenalty(penaltyAmount);
        } else {
            loan.setPenalty(0.0);
        }

        // STOK ARTIRMA İŞLEMİ
       Book book = loan.getBook();
        Branch branch = loan.getBranch(); // Ödünç alırken kaydettiğimiz şube

        if (branch != null) {
            Inventory inventory = inventoryRepository.findByBookIdAndBranchId(book.getId(), branch.getId());
            
            if (inventory != null) {
                // Stoğu 1 artırıp yerine koyuyoruz
                inventory.setStockQuantity(inventory.getStockQuantity() + 1);
                inventoryRepository.save(inventory);
            } else {
                // Eğer envanter kaydı silinmişse (çok düşük ihtimal), yeniden oluşturabilirsin
                // Ama şimdilik sadece loglayalım veya hata atalım
                System.out.println("UYARI: İade edilen kitabın envanter kaydı bulunamadı!");
            }
        }
        
        // 5. Kitabı tekrar 'Müsait' (available) yap
        // (Eğer tüm stoklar bitince false yaptıysak, şimdi true yapmalıyız)
        book.setAvailable(true);
        bookRepository.save(book);

        return loanRepository.save(loan);
    }

    public List<Loan> searchLoans(String query) {
        // Girilen kelimeye göre (ad/soyad veya kitap başlığı içinde) ödünç kayıtlarını
        // arar
        return loanRepository
                .findByMember_FirstNameContainingIgnoreCaseOrMember_LastNameContainingIgnoreCaseOrBook_TitleContainingIgnoreCase(
                        query, query, query);
    }
}