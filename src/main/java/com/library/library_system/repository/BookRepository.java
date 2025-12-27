package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository sayesinde save, findAll, findById gibi metotlar hazır gelir.

    // "Containing": İçinde geçenleri bul (LIKE %query%)
    // "IgnoreCase": Büyük/küçük harf fark etmez
    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);

}