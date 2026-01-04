package com.library.library_system.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // İlişki: Bir ödünç işlemi bir üyeye aittir.
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // İlişki: Bir ödünç işlemi bir kitaba aittir.
    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch; // Kitap hangi şubeden teslim alındı?

    private LocalDateTime loanDate; // Veriliş Tarihi
    private LocalDateTime returnDate; // İade Tarihi

    @Column(name = "penalty")
    private Double penalty = 0.0; // Varsayılan 0.0 olsun

    // --- Constructorlar ---
    public Loan() {
    }

    // --- Getter & Setter ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Member getMember() {
        return member;
    }

    public void setMember(Member member) {
        this.member = member;
    }

    public Book getBook() {
        return book;
    }

    public void setBook(Book book) {
        this.book = book;
    }

    public Branch getBranch() { 
        return branch; 
    }
    public void setBranch(Branch branch) { 
        this.branch = branch; 
    }

    public LocalDateTime getLoanDate() {
        return loanDate;
    }

    public void setLoanDate(LocalDateTime loanDate) {
        this.loanDate = loanDate;
    }

    public LocalDateTime getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDateTime returnDate) {
        this.returnDate = returnDate;
    }

    public Double getPenalty() {
        return penalty;
    }

    public void setPenalty(Double penalty) {
        this.penalty = penalty;
    }
}