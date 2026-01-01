package com.library.library_system.repository;

import java.time.LocalDate;
import java.util.List; // EKSİK OLAN IMPORT BU

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.library.library_system.model.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    // --- DASHBOARD İÇİN GEREKLİ OLANLAR ---
    
    // 1. Son 5 Hareket (ID'ye göre tersten sırala)
    List<Loan> findTop5ByOrderByIdDesc();

    // 2. Acil İade Bekleyenler (Gecikenler + Sayfalama desteği) 
    @Query("SELECT l FROM Loan l WHERE l.returnDate IS NULL AND l.loanDate < :overdueLimit ORDER BY l.loanDate ASC")
    List<Loan> findUrgentOverdueLoans(@Param("overdueLimit") LocalDate overdueLimit, Pageable pageable);

    // 3. İstatistikler
    long countByReturnDateIsNull();

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.returnDate IS NULL AND l.loanDate < :overdueLimit")
    long countOverdueLoans(@Param("overdueLimit") LocalDate overdueLimit);


    // --- LOAN SERVICE & MEMBER SERVICE İÇİN GEREKLİ OLANLAR ---

    // Bir üyenin tüm geçmişi
    List<Loan> findByMemberId(Long memberId);

    // Bir üyenin sadece aktif (iade edilmemiş) kitapları
    List<Loan> findByMemberIdAndReturnDateIsNull(Long memberId);

    // Üye silinirken geçmişini temizlemek için
    @Modifying
    @Transactional
    void deleteByMemberId(Long memberId);

    // Detaylı Arama (Üye adı, soyadı veya kitap adına göre)
    List<Loan> findByMember_FirstNameContainingIgnoreCaseOrMember_LastNameContainingIgnoreCaseOrBook_TitleContainingIgnoreCase(String firstName, String lastName, String bookTitle);
}