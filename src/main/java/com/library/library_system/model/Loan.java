package com.library.library_system.model;

import java.time.LocalDate;
 
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch; // Kitap hangi şubeden teslim alındı?

    private LocalDate loanDate;
    private LocalDate returnDate;

    @Column(name = "penalty")
    private Double penalty = 0.0;

    // --- JSON'DA GÖRÜNECEK HESAPLANMIŞ ALAN ---
    // @Transient notasyonu bu alanın veritabanına kaydedilmemesini, 
    // sadece çalışma anında hesaplanmasını sağlar.
    @Transient
    private boolean overdue;

    public Loan() {}

    // GECİKME DURUMUNU HESAPLAYAN GETTER ---
    public boolean isOverdue() {
        if (this.returnDate != null) {
            return false; // İade edildiyse gecikmiş sayılmaz
        }
        // Ödünç tarihinden itibaren 1 gün geçtiyse ve hala iade edilmediyse true döner
        return LocalDate.now().isAfter(this.loanDate.plusDays(1));
    }

    // --- Getter & Setter ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }

    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public LocalDate getLoanDate() { return loanDate; }
    public void setLoanDate(LocalDate loanDate) { this.loanDate = loanDate; }

    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }

    public Double getPenalty() { return penalty; }
    public void setPenalty(Double penalty) { this.penalty = penalty; }
}