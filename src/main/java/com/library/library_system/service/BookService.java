package com.library.library_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Book;
import com.library.library_system.repository.BookRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;

    // Constructor Injection (En sağlıklı yöntem)
    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    // Tüm kitapları getir
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // Yeni kitap ekle
    public Book addBook(Book book) {
        return bookRepository.save(book);
    }

    // ID ile kitap bul
    public Book getBookById(Long id) {
        return bookRepository.findById(id).orElse(null);
    }

    public List<Book> getBooksByCategory(Long categoryId) {
        return bookRepository.findByCategoryId(categoryId);
    }

    public List<Book> searchBooks(String query) {
        // Gelen arama kelimesini hem başlıkta hem yazarda arar
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(query, query);
    }
}