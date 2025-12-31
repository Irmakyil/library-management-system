package com.library.library_system.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Book;
import com.library.library_system.repository.BookRepository;

@Service
@org.springframework.transaction.annotation.Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final com.library.library_system.repository.AuthorRepository authorRepository;
    private final com.library.library_system.repository.CategoryRepository categoryRepository;

    // Constructor ile repository bağımlılıklarını enjekte eder (Book, Author ve
    // Category işlemleri için)
    public BookService(BookRepository bookRepository,
            com.library.library_system.repository.AuthorRepository authorRepository,
            com.library.library_system.repository.CategoryRepository categoryRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.categoryRepository = categoryRepository;
    }

    // Tüm kitapları getir
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // Yeni kitap ekle
    public Book addBook(com.library.library_system.dto.BookRequest request) {
        Book book = new Book();
        updateBookFromRequest(book, request);
        return bookRepository.save(book);
    }

    // ID ile kitap bul
    public Book getBookById(Long id) {
        return bookRepository.findById(id).orElse(null);
    }

    public List<Book> getBooksByCategory(Long categoryId) {
        return bookRepository.findByCategoryId(categoryId);
    }

    public List<Book> getBooksByAuthor(Long authorId) {
        return bookRepository.findByAuthorId(authorId);
    }

    public List<Book> searchBooks(String query) {
        // Gelen arama kelimesini hem başlıkta hem yazarda arar
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthor_NameContainingIgnoreCase(query, query);
    }

    public Book updateBook(Long id, com.library.library_system.dto.BookRequest request) {
        Book book = bookRepository.findById(id).orElseThrow(() -> new RuntimeException("Kitap bulunamadı"));
        updateBookFromRequest(book, request);
        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id).orElse(null);
        if (book == null) {
            return;
        }

        com.library.library_system.model.Author author = book.getAuthor();
        bookRepository.deleteById(id);

        // Eğer yazarın başka kitabı kalmadıysa yazarı da sil
        if (author != null) {
            List<Book> remainingBooks = bookRepository.findByAuthorId(author.getId());
            if (remainingBooks.isEmpty()) {
                authorRepository.delete(author);
            }
        }
    }

    // Yardımcı Method: Request'ten Book nesnesini güncelle
    private void updateBookFromRequest(Book book, com.library.library_system.dto.BookRequest request) {
        book.setTitle(request.getTitle());
        book.setIsbn(request.getIsbn());
        book.setPublicationYear(request.getPublicationYear());

        // Yazar Kontrolü
        com.library.library_system.model.Author author = authorRepository.findByName(request.getAuthorName());
        if (author == null) {
            author = new com.library.library_system.model.Author();
            author.setName(request.getAuthorName());
            author = authorRepository.save(author);
        }
        book.setAuthor(author);

        // Kategori Kontrolü
        if (request.getCategoryId() != null) {
            com.library.library_system.model.Category category = categoryRepository.findById(request.getCategoryId())
                    .orElse(null);
            book.setCategory(category);
        }

        // Yeni kitap eklenirken available true olsun
        if (book.getId() == null) {
            book.setAvailable(true);
        }
    }
}