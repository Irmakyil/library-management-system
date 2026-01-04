package com.library.library_system.dto;

public class LoanRequest {
        
    private Long memberId;
    private Long bookId;
    private Long branchId; 

    
    public Long getMemberId() 
    {
        return memberId; 
    }
    public void setMemberId(Long memberId) 
    {
        this.memberId = memberId;
    }

    public Long getBookId() 
    {
        return bookId; 
    }
    public void setBookId(Long bookId) 
    {
        this.bookId = bookId;
    }

    public Long getBranchId() 
    { 
        return branchId; 
    }
    public void setBranchId(Long branchId) 
    {
        this.branchId = branchId; 
    }
}
