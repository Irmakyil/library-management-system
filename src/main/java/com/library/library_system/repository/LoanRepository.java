package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
        // Belirli bir üyeye ait tüm ödünç kayıtlarını getirir
        List<Loan> findByMemberId(Long memberId);

        @org.springframework.data.jpa.repository.Query("SELECT new com.library.library_system.dto.LoanDTO(l.id, b.id, b.category.id, b.author.id, b.title, concat(m.firstName, ' ', m.lastName), concat(b.author.name, ''), concat(b.category.name, ''), l.loanDate, l.returnDate, l.penalty) FROM Loan l JOIN l.book b JOIN l.member m LEFT JOIN b.author LEFT JOIN b.category WHERE l.member.id = :memberId ORDER BY CASE WHEN l.returnDate IS NOT NULL THEN l.returnDate ELSE l.loanDate END DESC, l.id DESC")
        List<com.library.library_system.dto.LoanDTO> findDTOByMemberId(
                        @org.springframework.data.repository.query.Param("memberId") Long memberId);

        @org.springframework.data.jpa.repository.Query("SELECT new com.library.library_system.dto.LoanDTO(l.id, b.id, b.category.id, b.author.id, b.title, concat(m.firstName, ' ', m.lastName), concat(b.author.name, ''), concat(b.category.name, ''), l.loanDate, l.returnDate, l.penalty) FROM Loan l JOIN l.book b JOIN l.member m LEFT JOIN b.author LEFT JOIN b.category ORDER BY CASE WHEN l.returnDate IS NOT NULL THEN l.returnDate ELSE l.loanDate END DESC, l.id DESC")
        List<com.library.library_system.dto.LoanDTO> findAllDTOs();

        // Belirli bir üyeye ait tüm ödünç kayıtlarını siler
        void deleteByMemberId(Long memberId);

        // Bir üyenin, belirli bir kitabı henüz iade edip etmediğini kontrol eder
        boolean existsByMemberIdAndBookIdAndReturnDateIsNull(Long memberId, Long bookId);

        void deleteByBookId(Long bookId);

        // Üyenin adı soyadı veya kitabın başlığında geçen ifadeye göre ödünç
        // kayıtlarını arar
        List<Loan> findByMember_FirstNameContainingIgnoreCaseOrMember_LastNameContainingIgnoreCaseOrBook_TitleContainingIgnoreCase(
                        String firstName, String lastName, String bookTitle);

        // Sidebar için optimize edilmiş sorgu:
        // 1. Sadece aktif (iade edilmemiş) kitapları getirir (returnDate is null)
        // 2. @EntityGraph ile book, author ve category ilişkilerini TEK sorguda çeker
        // (N+1 problemini çözer)
        @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "book", "book.author",
                        "book.category" })
        List<Loan> findByMemberIdAndReturnDateIsNull(Long memberId);

        // --- DASHBOARD OPTIMIZASYONU ---
        long countByReturnDateIsNull();

        // Gecikmiş: İade edilmemiş (returnDate null) VE İade süresi (loanDate + 1 gün)
        // geçmiş (loanDate < (now - 1 gün))
        long countByReturnDateIsNullAndLoanDateBefore(java.time.LocalDateTime date);

        // Son 5 işlem (İade veya Ödünç tarihine göre)
        @org.springframework.data.jpa.repository.Query("SELECT l FROM Loan l ORDER BY CASE WHEN l.returnDate IS NOT NULL THEN l.returnDate ELSE l.loanDate END DESC, l.id DESC")
        List<Loan> findRecentActivity(org.springframework.data.domain.Pageable pageable);

        // Gecikenler listesi (Top 5)
        List<Loan> findTop5ByReturnDateIsNullAndLoanDateBeforeOrderByLoanDateAsc(java.time.LocalDateTime date);
}