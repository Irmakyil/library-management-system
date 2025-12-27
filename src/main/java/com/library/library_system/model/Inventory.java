package com.library.library_system.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Bir kitabın bir envanter kaydı olur
    @OneToOne
    @JoinColumn(name = "book_id", nullable = false, unique = true)
    private Book book;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity; // Stok Adedi

    // --- Constructor, Getter & Setter ---
    public Inventory() {}

    public Inventory(Book book, int stockQuantity) {
        this.book = book;
        this.stockQuantity = stockQuantity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
}