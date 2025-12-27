package com.library.library_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Member;
import com.library.library_system.repository.MemberRepository;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    public Member addMember(Member member) {
        // İlerde şifreyi burada hash'leyebilirsin
        return memberRepository.save(member);
    }

    // Login Kontrol Metodu
    public Member authenticate(String email, String password) {
        Member member = memberRepository.findByEmail(email);
        
        // Üye var mı ve şifre eşleşiyor mu kontrolü
        if (member != null && member.getPassword().equals(password)) {
            return member;
        }
        return null; // Giriş başarısız
    }

    public void deleteMember(Long id) {
    memberRepository.deleteById(id);
}
}