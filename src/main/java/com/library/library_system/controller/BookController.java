package com.library.library_system.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.library.library_system.model.Book;
import com.library.library_system.service.BookService;

@RestController
@RequestMapping("/api/books") // Adresimiz: localhost:8080/api/books
public class BookController {

    private final BookService bookService;
    private final com.library.library_system.service.RecommendationService recommendationService; 

    public BookController(BookService bookService, com.library.library_system.service.RecommendationService recommendationService) {
        this.bookService = bookService;
        this.recommendationService = recommendationService;
    }

    // GET İsteği: Tüm kitapları listele
    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    // POST İsteği: Yeni kitap ekle
    @PostMapping
    public Book addBook(@RequestBody com.library.library_system.dto.BookRequest request) {
        return bookService.addBook(request);
    } // Book entity yerine BookRequest (DTO) alırız: sadece gerekli alanlar gelir,
      // istenmeyen alanların (id vb.) gelmesi engellenir.

    // GET: /api/books/search?query=suç
    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam String query) {
        return bookService.searchBooks(query);
    }

    // GET: /api/books/category/{id}
    @GetMapping("/category/{categoryId}")
    public List<Book> getBooksByCategory(@org.springframework.web.bind.annotation.PathVariable Long categoryId) {
        return bookService.getBooksByCategory(categoryId);
    }

    // GET: /api/books/author/{id}
    @GetMapping("/author/{authorId}")
    public List<Book> getBooksByAuthor(@org.springframework.web.bind.annotation.PathVariable Long authorId) {
        return bookService.getBooksByAuthor(authorId);
    }

    // Kitaplar için güncelleme (PUT) ve silme (DELETE) işlemlerini yönetir.
    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<Book> updateBook(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestBody com.library.library_system.dto.BookRequest request) {
        // Path'ten gelen id'ye göre kitabı, request (DTO) içindeki yeni bilgilerle
        // günceller
        Book updatedBook = bookService.updateBook(id, request);
        // Güncellenen kitabı 200 OK ile döndürür
        return org.springframework.http.ResponseEntity.ok(updatedBook);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<Void> deleteBook(
            @org.springframework.web.bind.annotation.PathVariable Long id) {
        // Path'ten gelen id'ye göre kitabı siler
        bookService.deleteBook(id);
        // Silme işlemi başarılı olursa 200 OK (boş body) döndürür
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @GetMapping("/recommendations/{memberId}")
    public org.springframework.http.ResponseEntity<List<Book>> getRecommendations(@PathVariable Long memberId) {
        return org.springframework.http.ResponseEntity.ok(recommendationService.recommendBooks(memberId));
    }

}