package com.library.library_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Branch;
import com.library.library_system.repository.BranchRepository;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Branch addBranch(Branch branch) {
        return branchRepository.save(branch);
    }
}