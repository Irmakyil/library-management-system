package com.library.library_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Member;
import com.library.library_system.repository.MemberRepository;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final com.library.library_system.repository.LoanRepository loanRepository;

    public MemberService(MemberRepository memberRepository,
            com.library.library_system.repository.LoanRepository loanRepository) {
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
    }

    // Tüm üyeleri listeler
    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    // !! İlerde şifreyi burada hash'leyebilirsin
    public Member addMember(Member member) {
        if (member.getRole() == null || member.getRole().isEmpty()) {
            member.setRole("USER");
        }
        return memberRepository.save(member);
    }

    public Member authenticate(String email, String password) {
        Member member = memberRepository.findByEmail(email);
        if (member != null && member.getPassword().equals(password)) {
            return member;
        }
        return null;
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteMember(Long id) {
        // Önce bu üyenin tüm ödünç geçmişini sil (ilişki/foreign key hatası
        // olmaması için)
        loanRepository.deleteByMemberId(id);
        // Sonra üyeyi sil
        memberRepository.deleteById(id);
    }

    public List<Member> searchMembers(String query) {
        // Üye adında veya soyadında geçen ifadeye göre arama yapar
        return memberRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query);
    }
}