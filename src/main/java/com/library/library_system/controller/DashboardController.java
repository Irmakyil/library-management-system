package com.library.library_system.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.library_system.model.Loan;
import com.library.library_system.repository.InventoryRepository;
import com.library.library_system.repository.LoanRepository;
import com.library.library_system.repository.MemberRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final InventoryRepository inventoryRepository;
    private final MemberRepository memberRepository;
    private final LoanRepository loanRepository;

    public DashboardController(InventoryRepository inventoryRepository,
            MemberRepository memberRepository,
            LoanRepository loanRepository) {
        this.inventoryRepository = inventoryRepository;
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Toplam Stok (Tüm inventory'deki stockQuantity toplamı)
        Integer totalBooks = inventoryRepository.sumTotalStock();
        stats.put("totalBooks", totalBooks != null ? totalBooks : 0);

        // Üye Sayısı (ADMIN hariç)
        long totalMembers = memberRepository.countByRoleNot("ADMIN");
        stats.put("totalMembers", totalMembers);

        // Aktif Ödünçler (Return date is null)
        long activeLoans = loanRepository.countByReturnDateIsNull();
        stats.put("activeLoans", activeLoans);

        // Gecikenler
        // Gecikme kuralı: loanDate + 2 gün < now => loanDate < now - 2
        LocalDateTime dueDateThreshold = LocalDateTime.now().minusDays(2);
        long overdueLoans = loanRepository.countByReturnDateIsNullAndLoanDateBefore(dueDateThreshold);
        stats.put("overdueLoans", overdueLoans);

        return stats;
    }

    @GetMapping("/recent-loans")
    public List<Loan> getRecentLoans() {
        return loanRepository.findRecentActivity(org.springframework.data.domain.PageRequest.of(0, 5));
    }

    @GetMapping("/overdue-loans")
    public List<Loan> getOverdueLoans() {
        LocalDateTime dueDateThreshold = LocalDateTime.now().minusDays(2);
        return loanRepository.findTop5ByReturnDateIsNullAndLoanDateBeforeOrderByLoanDateAsc(dueDateThreshold);
    }
}
