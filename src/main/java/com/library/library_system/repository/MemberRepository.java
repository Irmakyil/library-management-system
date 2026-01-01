package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    // E-posta ile bulma (Login için)
    Member findByEmail(String email);

    // İsim veya Soyisim ile arama
    List<Member> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    // Dashboard istatistikleri için (Üye sayısını almak için)
    long countByRole(String role);
}