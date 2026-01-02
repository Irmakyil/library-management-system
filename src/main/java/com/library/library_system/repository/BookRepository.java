package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository sayesinde save, findAll, findById gibi metotlar hazır gelir.

    @Override
    @EntityGraph(attributePaths = { "author", "category", "inventories" })
    List<Book> findAll(Sort sort);
 //   Page<Book> findAll(Pageable pageable);

 
    // "Containing": İçinde geçenleri bul (LIKE %query%)
    // "IgnoreCase": Büyük/küçük harf fark etmez
    List<Book> findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(String title, String authorName);
    // Kitap başlığına göre veya Yazarın ismine (firstName) göre arama yapar
    
    // "Category" nesnesinin "Id" alanına göre bul.
    List<Book> findByCategoryId(Long categoryId);

    // Seçilen tüm yazar ID'lerine ait kitapları getirir
    List<Book> findByAuthorId(Long authorId);

    // --- 2. RECOMMENDATION SERVICE (ÖNERİ SİSTEMİ) İÇİN ---

    // Belirli kategorideki, ama listedeki ID'ler HARİÇ kitaplar (Okuduklarını önermemek için)
    List<Book> findByCategoryIdAndIdNotIn(Long categoryId, List<Long> excludedBookIds);

    // Belirli bir yazara ait, ama listedeki ID'ler HARİÇ kitapları getir
    List<Book> findByAuthorIdAndIdNotIn(Long authorId, List<Long> excludedBookIds);

    // Hiç geçmişi olmayanlar için rastgele 4 kitap getir (PostgreSQL özel sorgusu)
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