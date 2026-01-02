package com.library.library_system.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; // Eklendi
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.library_system.model.Branch;
import com.library.library_system.service.BranchService;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    // Tüm Şubeleri Getir (Admin paneli vs. için)
    @GetMapping
    public List<Branch> getAllBranches() {
        return branchService.getAllBranches();
    }

    // Belirli bir kitabın stoğu olan şubeleri getir
    // Örnek: GET /api/branches/book/5 (ID'si 5 olan kitabın bulunduğu şubeler)
    @GetMapping("/book/{bookId}")
    public List<Branch> getBranchesByBook(@PathVariable Long bookId) {
        return branchService.getBranchesForBook(bookId);
    }

    // Yeni Şube Ekle
    @PostMapping
    public Branch addBranch(@RequestBody Branch branch) {
        return branchService.addBranch(branch);
    }
}