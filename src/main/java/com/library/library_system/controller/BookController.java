package com.library.library_system.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.library.library_system.dto.BookRequest;
import com.library.library_system.model.Book;
import com.library.library_system.repository.BookRepository;
import com.library.library_system.service.BookService;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookService bookService;

    // --- DÜZELTME 1: Return tipi List<Book> değil Page<Book> oldu ---
    @GetMapping
    public ResponseEntity<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "19") int size) { // JS'de pageSize 19 ayarlı
        
        // getContent() metodunu kaldırdık. Direkt Page nesnesini dönüyoruz.
        Page<Book> bookPage = bookRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(bookPage);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Book>> searchBooks(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "19") int size) {

        String searchQuery = null;
        if (query != null && !query.trim().isEmpty()) {
            searchQuery = "%" + query.trim() + "%";
        }

        Page<Book> books = bookRepository.searchBooks(
                searchQuery,
                categoryId,
                authorId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
        );

        return ResponseEntity.ok(books);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // --- DÜZELTME 2: Add işlemi Service katmanına bağlandı ---
    // (Böylece kitap eklerken Branch ve Inventory mantığı çalışacak)
    @PostMapping
    public ResponseEntity<Book> addBook(@RequestBody BookRequest bookRequest) {
        // Repository.save yerine bookService.addBook kullanıyoruz
        Book newBook = bookService.addBook(bookRequest);
        return ResponseEntity.ok(newBook);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody BookRequest bookRequest) {
        try {
            Book updatedBook = bookService.updateBook(id, bookRequest);
            return ResponseEntity.ok(updatedBook);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        if (bookRepository.existsById(id)) {
            bookRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<List<Book>> getRecommendations(@PathVariable Long userId) {
        // Tavsiyelerde sayfalama genelde olmaz, liste dönebilir
        return ResponseEntity.ok(bookRepository.findRandomBooks());
    }
}