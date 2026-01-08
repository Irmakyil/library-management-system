package com.library.library_system.model;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity // Bu class'ın bir veritabanı tablosu olduğunu söyler
@Table(name = "books") // Veritabanında tablonun adı 'books' olsun
public class Book {

    @Id // Bu alanın Primary Key olduğunu belirtir
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'yi veritabanı otomatik 1, 2, 3 diye artırsın
    private Long id;

    @Column(name = "title", nullable = false) // Boş bırakılamaz
    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false) // Boş bırakılamaz
    private Author author;

    @Column(name = "isbn", unique = true) // ISBN benzersiz olmalı
    private String isbn;

    @Column(name = "publication_year")
    private int publicationYear;

    @Column(columnDefinition = "boolean default true")
    private boolean available = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.EAGER) // Kitabı çekerken kategoriyi de getir
    @JoinColumn(name = "category_id") // Veritabanında 'category_id' adında bir sütun oluşacak
    private Category category;

    @OneToMany(mappedBy = "book", cascade = { CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REFRESH })
    @JsonIgnore // Kitap listesini çekerken sonsuz döngüye girmesin ve performans artsın
    private List<Inventory> inventories;

    // --- Constructor (Boş) ---
    public Book() {
    }

    // --- Constructor (Dolu) ---
    public Book(String title, Author author, String isbn, int publicationYear, Category category) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publicationYear = publicationYear;
        this.category = category;
        this.available = true;
    }

    // --- Getter ve Setter Metotları ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Author getAuthor() {
        return author;
    }

    public void setAuthor(Author author) {
        this.author = author;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public int getPublicationYear() {
        return publicationYear;
    }

    public void setPublicationYear(int publicationYear) {
        this.publicationYear = publicationYear;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public List<Inventory> getInventories() {
        return inventories;
    }

    public void setInventories(List<Inventory> inventories) {
        this.inventories = inventories;
    }

    // inventory bilgisi döndürme
    public java.util.Map<String, Object> getInventory() {
        int totalStock = 0;
        if (inventories != null) {
            for (Inventory inv : inventories) {
                totalStock += inv.getStockQuantity();
            }
        }
        java.util.Map<String, Object> inventoryData = new java.util.HashMap<>();
        inventoryData.put("stockQuantity", totalStock);
        return inventoryData;
    }

    @PreUpdate
    @PrePersist
    public void updateTime() {
        this.updatedAt = LocalDateTime.now();
    }
}