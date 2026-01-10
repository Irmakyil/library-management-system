// Bu sınıf, API'den kitap ekleme/güncelleme isteklerinde kullanılan DTO'dur (Request modeli).
// Entity (Book) yerine bunu kullanarak sadece gerekli alanların dışarıdan gelmesini sağlar,
// böylece id, createdAt gibi istenmeyen alanların istemci tarafından gönderilip set edilmesi engellenir.

package com.library.library_system.dto;

public class BookRequest {
    private String title;
    private String authorName;
    private String isbn;
    private int publicationYear;
    private Long categoryId;
    private int stockQuantity;
    private Long branchId;
    private java.util.Map<Long, Integer> branchStocks;

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public int getStock() {
        return stockQuantity;
    }

    public void setStock(int stock) {
        this.stockQuantity = stock;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public java.util.Map<Long, Integer> getBranchStocks() {
        return branchStocks;
    }

    public void setBranchStocks(java.util.Map<Long, Integer> branchStocks) {
        this.branchStocks = branchStocks;
    }
}
