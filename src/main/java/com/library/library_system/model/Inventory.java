package com.library.library_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    @JsonIgnore
    private Book book;

    // Hangi Şube
    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity; // Stok Adedi

    // --- Constructor, Getter & Setter ---
    public Inventory() {}

    public Inventory(Book book, Branch branch, int stockQuantity) {
        this.book = book;
        this.branch = branch;
        this.stockQuantity = stockQuantity;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
}