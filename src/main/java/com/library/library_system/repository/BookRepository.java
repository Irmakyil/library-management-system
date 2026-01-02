package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Book;
import com.library.library_system.dto.BookDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository sayesinde save, findAll, findById gibi metotlar hazır gelir.

    // Optimized for User Dashboard
    @Query("SELECT new com.library.library_system.dto.BookDTO(b.id, b.title, a.name, a.id, c.name, c.id, b.isbn, b.available) FROM Book b LEFT JOIN b.author a LEFT JOIN b.category c")
    Page<BookDTO> findAllDTO(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "author", "category", "inventory" })
    Page<Book> findAll(Pageable pageable);

    // "Containing": İçinde geçenleri bul (LIKE %query%)
    // "IgnoreCase": Büyük/küçük harf fark etmez
    List<Book> findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(String title, String authorName);
    // Kitap başlığına göre veya Yazarın ismine (firstName) göre arama yapar

    // "Category" nesnesinin "Id" alanına göre bul.
    List<Book> findByCategoryId(Long categoryId);

    // Seçilen tüm yazar ID'lerine ait kitapları getirir
    List<Book> findByAuthorId(Long authorId);

    // Belirli bir kategorideki, ama listedeki ID'ler HARİÇ kitapları getir
    // (Okuduklarını elemek için)
    List<Book> findByCategoryIdAndIdNotIn(Long categoryId, List<Long> excludedBookIds);

    // Belirli bir yazara ait, ama listedeki ID'ler HARİÇ kitapları getir
    List<Book> findByAuthorIdAndIdNotIn(Long authorId, List<Long> excludedBookIds);

    // Hiç geçmişi olmayanlar için rastgele 4 kitap getir (PostgreSQL özel sorgusu)
    @Query(value = "SELECT * FROM books ORDER BY RANDOM() LIMIT 4", nativeQuery = true)
    List<Book> findRandomBooks();

    @Query(value = "SELECT * FROM books WHERE id NOT IN (:excludedIds) ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Book> findRandomBooksExcept(
            @org.springframework.data.repository.query.Param("excludedIds") List<Long> excludedIds,
            @org.springframework.data.repository.query.Param("limit") int limit);

}