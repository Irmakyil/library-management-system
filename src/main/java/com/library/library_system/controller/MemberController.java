package com.library.library_system.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.library_system.model.Member;
import com.library.library_system.service.MemberService;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    // Tüm üyeleri getir
    @GetMapping
    public List<Member> getAllMembers() {
        return memberService.getAllMembers();
    }

    // Kayıt Ol (Register)
    @PostMapping("/register")
    public ResponseEntity<Member> register(@RequestBody Member member) {
        Member newMember = memberService.addMember(member);
        return ResponseEntity.status(HttpStatus.CREATED).body(newMember);
    }

    // Giriş Yap (Login)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        Member member = memberService.authenticate(email, password);

        if (member != null) {
            // Giriş başarılı, üye bilgilerini dön
            return ResponseEntity.ok(member);
        } else {
            // Giriş başarısız
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Hatalı email veya şifre");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMember(@PathVariable Long id) {
    memberService.deleteMember(id);
    return ResponseEntity.ok("Üye başarıyla silindi.");
    }
}