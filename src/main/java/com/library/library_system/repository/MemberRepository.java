package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    // E-posta ile bulma (Login için)
    Member findByEmail(String email);

    // İsim veya Soyisim ile arama
    List<Member> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    // Dashboard istatistikleri için (Üye sayısını almak için)
    @Query("SELECT COUNT(m) FROM Member m WHERE m.role <> 'ADMIN' OR m.role IS NULL")
    long countAllMembersExceptAdmin();

}