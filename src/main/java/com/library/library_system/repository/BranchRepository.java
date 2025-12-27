package com.library.library_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Branch;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
}