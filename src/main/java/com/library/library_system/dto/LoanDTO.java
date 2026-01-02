package com.library.library_system.dto;

import java.time.LocalDateTime;

public class LoanDTO {
    private Long id;
    private Long bookId;
    private Long categoryId;
    private String bookTitle;
    private String memberName;
    private String authorName;
    private String categoryName;
    private LocalDateTime loanDate;
    private LocalDateTime returnDate;
    private Double penalty;

    public LoanDTO(Long id, Long bookId, Long categoryId, String bookTitle, String memberName, String authorName,
            String categoryName,
            LocalDateTime loanDate, LocalDateTime returnDate, Double penalty) {
        this.id = id;
        this.bookId = bookId;
        this.categoryId = categoryId;
        this.bookTitle = bookTitle;
        this.memberName = memberName;
        this.authorName = authorName;
        this.categoryName = categoryName;
        this.loanDate = loanDate;
        this.returnDate = returnDate;
        this.penalty = penalty;
    }

    public LoanDTO(Long id, String bookTitle, LocalDateTime loanDate, LocalDateTime returnDate, Double penalty) {
        this.id = id;
        this.bookTitle = bookTitle;
        this.loanDate = loanDate;
        this.returnDate = returnDate;
        this.penalty = penalty;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public Long getBookId() {
        return bookId;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public String getMemberName() {
        return memberName;
    }

    public String getAuthorName() {
        return authorName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public LocalDateTime getLoanDate() {
        return loanDate;
    }

    public LocalDateTime getReturnDate() {
        return returnDate;
    }

    public Double getPenalty() {
        return penalty;
    }
}
