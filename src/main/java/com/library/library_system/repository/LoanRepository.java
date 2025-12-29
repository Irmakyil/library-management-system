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
}