package com.library.library_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    // Email adresine göre üyeyi bulur (login/rol kontrolü gibi işlemlerde
    // kullanılır)
    Member findByEmail(String email);

    // Adına göre üyeyi bulur
    Member findByFirstName(String firstName);

    // Üyenin adında veya soyadında geçen ifadeye göre arama yapar
    java.util.List<Member> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName,
            String lastName);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM Member m WHERE m.role <> :role OR m.role IS NULL")
    long countByRoleNot(@org.springframework.data.repository.query.Param("role") String role);
}