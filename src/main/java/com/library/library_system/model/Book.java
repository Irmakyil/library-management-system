package com.library.library_system.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity // Bu class'ın bir veritabanı tablosu olduğunu söyler
@Table(name = "books") // Veritabanında tablonun adı 'books' olsun
public class Book {

    @Id // Bu alanın Primary Key  olduğunu belirtir
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'yi veritabanı otomatik 1, 2, 3 diye artırsın
    private Long id;

    @Column(name = "title", nullable = false) // Boş bırakılamaz
    private String title;

    @Column(name = "author", nullable = false)
    private String author;

    @Column(name = "isbn", unique = true) // ISBN benzersiz olmalı
    private String isbn;

    @Column(name = "publication_year")
    private int publicationYear;

    @Column(columnDefinition = "boolean default true")
    private boolean available = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Constructor (Boş) ---
    public Book() {
    }

    // --- Constructor (Dolu) ---
    public Book(String title, String author, String isbn, int publicationYear) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publicationYear = publicationYear;
        this.available = true;
    }

    // --- Getter ve Setter Metotları ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public int getPublicationYear() { return publicationYear; }
    public void setPublicationYear(int publicationYear) { this.publicationYear = publicationYear; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    @PrePersist
    public void updateTime() {
        this.updatedAt = LocalDateTime.now();
    }
}