package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    // Belirli bir üyeye ait tüm ödünç kayıtlarını getirir
    List<Loan> findByMemberId(Long memberId);

    // Belirli bir üyeye ait tüm ödünç kayıtlarını siler
    void deleteByMemberId(Long memberId);

    // Üyenin adı soyadı veya kitabın başlığında geçen ifadeye göre ödünç
    // kayıtlarını arar
    List<Loan> findByMember_FirstNameContainingIgnoreCaseOrMember_LastNameContainingIgnoreCaseOrBook_TitleContainingIgnoreCase(
            String firstName, String lastName, String bookTitle);

    // Sidebar için optimize edilmiş sorgu:
    // 1. Sadece aktif (iade edilmemiş) kitapları getirir (returnDate is null)
    // 2. @EntityGraph ile book, author ve category ilişkilerini TEK sorguda çeker
    // (N+1 problemini çözer)
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "book", "book.author", "book.category" })
    List<Loan> findByMemberIdAndReturnDateIsNull(Long memberId);
}