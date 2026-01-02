package com.library.library_system.dto;

public class BookDTO {
    private Long id;
    private String title;
    private String authorName;
    private Long authorId;
    private String categoryName;
    private Long categoryId;
    private String isbn;
    private boolean available;

    public BookDTO(Long id, String title, String authorName, Long authorId, String categoryName, Long categoryId,
            String isbn, boolean available) {
        this.id = id;
        this.title = title;
        this.authorName = authorName;
        this.authorId = authorId;
        this.categoryName = categoryName;
        this.categoryId = categoryId;
        this.isbn = isbn;
        this.available = available;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthorName() {
        return authorName;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getIsbn() {
        return isbn;
    }

    public boolean isAvailable() {
        return available;
    }
}
