package com.library.library_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}