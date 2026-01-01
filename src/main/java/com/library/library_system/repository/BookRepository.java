package com.library.library_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    // JpaRepository sayesinde save, findAll, findById gibi metotlar hazır gelir.

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

}