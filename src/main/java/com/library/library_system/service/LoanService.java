package com.library.library_system.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Book;
import com.library.library_system.model.Loan;
import com.library.library_system.model.Member;
import com.library.library_system.repository.BookRepository;
import com.library.library_system.repository.LoanRepository;
import com.library.library_system.repository.MemberRepository;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public LoanService(LoanRepository loanRepository, BookRepository bookRepository, MemberRepository memberRepository) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
    }

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    // --- ÜYEYE GÖRE LİSTELEME ---
    public List<Loan> getLoansByMember(Long memberId) {
        return loanRepository.findByMemberId(memberId);
    }

    // --- ÖDÜNÇ ALMA İŞLEMİ ---
    public Loan createLoan(Long bookId, Long memberId) {
        // 1. Kitabı bul
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Kitap bulunamadı!"));
        
        // Kitap zaten başkasında mı?
        if (!book.isAvailable()) {
            throw new RuntimeException("Bu kitap şu an stokta yok!");
        }

        // 2. Üyeyi bul
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Üye bulunamadı!"));

        // 3. Ödünç kaydını oluştur
        Loan loan = new Loan();
        loan.setBook(book);
        loan.setMember(member);
        loan.setLoanDate(LocalDate.now()); // Bugünün tarihi
        loan.setPenalty(0.0);

        // Kitabın durumunu 'Müsait Değil' (false) yap
        book.setAvailable(false);
        bookRepository.save(book);

        return loanRepository.save(loan);
    }

    // --- İADE ETME İŞLEMİ ---
    public Loan returnLoan(Long loanId) {
        // 1. İşlemi bul
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Ödünç işlemi bulunamadı!"));

        // 2. Zaten iade edilmiş mi kontrol et
        if (loan.getReturnDate() != null) {
            throw new RuntimeException("Bu kitap zaten iade edilmiş!");
        }

        // 3. İade tarihini bugün yap
        loan.setReturnDate(LocalDate.now());

        // 4. CEZA HESAPLAMA
        LocalDate dueDate = loan.getLoanDate().plusDays(15);
        
        if (loan.getReturnDate().isAfter(dueDate)) {
            long overdueDays = ChronoUnit.DAYS.between(dueDate, loan.getReturnDate());
            double penaltyAmount = overdueDays * 5.0; // Günlük 5 TL
            loan.setPenalty(penaltyAmount);
        } else {
            loan.setPenalty(0.0);
        }
        
        // Kitap geri geldi, durumunu 'Müsait' (true) yap
        Book book = loan.getBook();
        book.setAvailable(true);
        bookRepository.save(book);

        // 5. Kaydet ve bitir
        return loanRepository.save(loan);
    }
}