package com.library.library_system.controller;

import com.library.library_system.dto.DashboardStats; 
import com.library.library_system.model.Loan;
import com.library.library_system.repository.InventoryRepository;
import com.library.library_system.repository.LoanRepository;
import com.library.library_system.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private LoanRepository loanRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        // 1. Sayılar
        Long totalStock = inventoryRepository.sumTotalStock();
        if (totalStock == null) totalStock = 0L;
        
        // Üye Sayısı (Admin Hariç)
        Long memberCount = memberRepository.countAllMembersExceptAdmin();

        // Aktif ödünç sayısını hesapla (İade tarihi boş olanlar)
        Long activeCount = loanRepository.countByReturnDateIsNull(); 
        // -----------------------------------

        LocalDate overdueThreshold = LocalDate.now().minusDays(1);
        Long overdueCount = loanRepository.countOverdueLoans(overdueThreshold);

        // 2. Listeler 
        List<Loan> recentLoans = loanRepository.findTop5ByOrderByIdDesc();
        
        // Gecikenlerden ilk 5 tanesini getir
        List<Loan> urgentLoans = loanRepository.findUrgentOverdueLoans(overdueThreshold, PageRequest.of(0, 5));

        // 3. Paketleme
        DashboardStats stats = new DashboardStats(
            totalStock, memberCount, activeCount, overdueCount, recentLoans, urgentLoans
        );

        return ResponseEntity.ok(stats);
    }
}