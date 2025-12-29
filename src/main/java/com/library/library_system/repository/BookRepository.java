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
    List<Book> findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(String title, String authorName);
    // Kitap başlığına göre veya Yazarın ismine (firstName) göre arama yapar
    // List<Book> findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(String title, String authorName);

    // "Category" nesnesinin "Id" alanına göre bul.
    List<Book> findByCategoryId(Long categoryId);

    List<Book> findByAuthorId(Long authorId);
    // Seçilen tüm yazar ID'lerine ait kitapları getirir (IN operatörü ile)
    //List<Book> findByAuthorIdIn(List<Long> authorIds);

}