package com.library.library_system.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.library.library_system.model.Loan;
import com.library.library_system.service.LoanService;
import com.library.library_system.dto.LoanRequest;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping
    public List<com.library.library_system.dto.LoanDTO> getAllLoans() {
        return loanService.getAllLoans();
    }

    // --- ÜYEYE GÖRE LİSTELEME ---
    // Frontend'de 'loadMyLoans' fonksiyonunun çalışması için bu gerekli
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<com.library.library_system.dto.LoanDTO>> getLoansByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(loanService.getLoansByMember(memberId));
    }

    // Sidebar ceza hesaplaması için hafifletilmiş endpoint
    @GetMapping("/member/{memberId}/active")
    public ResponseEntity<List<Loan>> getActiveLoansByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(loanService.getActiveLoansByMember(memberId));
    }

    @GetMapping("/search")
    public List<Loan> searchLoans(@RequestParam String query) {
        return loanService.searchLoans(query);
    }

    @PostMapping("/borrow")
    // RequestBody olarak artık kendi oluşturduğumuz LoanRequest DTO'sunu kullanıyoruz
    public ResponseEntity<?> createLoan(@RequestBody LoanRequest request) { 
        try {
            Loan newLoan = loanService.createLoan(request); 
            return ResponseEntity.ok(newLoan);
        } catch (RuntimeException e) {
            // Hata olursa (Kitap yoksa, stokta yoksa vb.) 400 Bad Request dön
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<?> returnBook(@PathVariable Long id) {
        try {
            Loan loan = loanService.returnLoan(id);
            return ResponseEntity.ok(loan);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}