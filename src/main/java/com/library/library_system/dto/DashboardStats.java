package com.library.library_system.dto;

import com.library.library_system.model.Loan;
import java.util.List;

public class DashboardStats {
    private Long totalBooks;
    private Long totalMembers;
    private Long activeLoans;
    private Long overdueLoans;
    
    private List<Loan> recentTransactions;
    private List<Loan> urgentReturns;

    // Constructor 
    public DashboardStats(Long totalBooks, Long totalMembers, Long activeLoans, Long overdueLoans, 
                             List<Loan> recentTransactions, List<Loan> urgentReturns) {
        this.totalBooks = totalBooks;
        this.totalMembers = totalMembers;
        this.activeLoans = activeLoans;
        this.overdueLoans = overdueLoans;
        this.recentTransactions = recentTransactions;
        this.urgentReturns = urgentReturns;
    }

    // Getter ve Setter'lar
    public Long getTotalBooks() { return totalBooks; }
    public Long getTotalMembers() { return totalMembers; }
    public Long getActiveLoans() { return activeLoans; }
    public Long getOverdueLoans() { return overdueLoans; }
    public List<Loan> getRecentTransactions() { return recentTransactions; }
    public List<Loan> getUrgentReturns() { return urgentReturns; }
}