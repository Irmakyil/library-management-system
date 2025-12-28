package com.library.library_system.controller;

import com.library.library_system.model.Category;
import com.library.library_system.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    // Tüm kategorileri getirir (Dropdown içini doldurmak için)
    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}
