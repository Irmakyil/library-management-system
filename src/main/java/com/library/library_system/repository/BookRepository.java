package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // --- 1. BOOK SERVICE İÇİN GEREKLİ OLANLAR  ---
    
    // Yazara göre kitapları getir
    List<Book> findByAuthorId(Long authorId);

    // BookService'deki basit arama (Başlık veya Yazar İsmine göre)
    List<Book> findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(String title, String authorName);

    // Kategoriye göre getir
    List<Book> findByCategoryId(Long categoryId);


    // --- 2. RECOMMENDATION SERVICE (ÖNERİ SİSTEMİ) İÇİN ---

    // Belirli kategorideki, ama listedeki ID'ler HARİÇ kitaplar (Okuduklarını önermemek için)
    List<Book> findByCategoryIdAndIdNotIn(Long categoryId, List<Long> excludedBookIds);
    
    // Belirli yazardaki, ama listedeki ID'ler HARİÇ kitaplar
    List<Book> findByAuthorIdAndIdNotIn(Long authorId, List<Long> excludedBookIds);

    // Rastgele 4 Kitap (PostgreSQL uyumlu)
    @Query(value = "SELECT * FROM books ORDER BY RANDOM() LIMIT 4", nativeQuery = true)
    List<Book> findRandomBooks();


    // --- 3. DASHBOARD & ADMIN PANELİ İÇİN (GELİŞMİŞ ARAMA) ---
    
    // Hem Arama Kelimesi, Hem Kategori, Hem Yazar ID'sine göre sayfalama (Page) destekli arama
    // NOT: CONCAT kullanımı yerine parametreye % eklenmiş halini bekliyoruz (Controller'da yaptık)
    @Query("SELECT b FROM Book b WHERE " +
           "(:categoryId IS NULL OR b.category.id = :categoryId) AND " +
           "(:authorId IS NULL OR b.author.id = :authorId) AND " +
           "(:query IS NULL OR LOWER(b.title) LIKE LOWER(:query) OR " +
           "LOWER(b.isbn) LIKE LOWER(:query))")
    Page<Book> searchBooks(@Param("query") String query, 
                           @Param("categoryId") Long categoryId, 
                           @Param("authorId") Long authorId, 
                           Pageable pageable);
}