package com.library.library_system.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
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

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // GET İsteği: Tüm kitapları listele
    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    // POST İsteği: Yeni kitap ekle
    @PostMapping
    public Book addBook(@RequestBody Book book) {
        return bookService.addBook(book);
    }

    // GET: /api/books/search?query=suç
    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam String query) {
        return bookService.searchBooks(query);
    }
}