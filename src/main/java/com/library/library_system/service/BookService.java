package com.library.library_system.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.library_system.model.Book;
import com.library.library_system.model.Branch;
import com.library.library_system.model.Inventory;
import com.library.library_system.repository.AuthorRepository;
import com.library.library_system.repository.BookRepository;
import com.library.library_system.repository.CategoryRepository;
import com.library.library_system.repository.InventoryRepository;
import com.library.library_system.repository.BranchRepository;;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final BranchRepository branchRepository;

    // Constructor Dependency Injection
    public BookService(BookRepository bookRepository,
            AuthorRepository authorRepository,
            CategoryRepository categoryRepository,
            InventoryRepository inventoryRepository,
            BranchRepository branchRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.branchRepository = branchRepository;
    }

    // Tüm kitapları getir
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    // Sayfalı getir
    public Page<Book> getAllBooks(Pageable pageable) {
        return bookRepository.findAll(pageable);
    }

    public Page<com.library.library_system.dto.BookDTO> getAllBooksDTO(Pageable pageable) {
        return bookRepository.findAllDTO(pageable);
    }

    // Yeni kitap ekle
    public Book addBook(com.library.library_system.dto.BookRequest request) {
        Book book = new Book();
        updateBookFromRequest(book, request);

        // Önce kitabı kaydet
        Book savedBook = bookRepository.save(book);

        // 2. Şube Bilgisini Al (Eğer request'te yoksa varsayılan 1. şubeyi seç)
        Long branchId = request.getBranchId();
        if (branchId == null) {
            branchId = 1L; // Varsayılan Şube ID (Merkez)
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Şube bulunamadı. ID: " + request.getBranchId()));

        // 3. Envanter (Stok) Kaydını Oluştur (Kitap + Şube + Stok)
        // Inventory.java'daki 3 parametreli constructor'ı kullanıyoruz
        int stock = request.getStock() > 0 ? request.getStock() : 1; // En az 1 tane olsun
        Inventory inventory = new Inventory(savedBook, branch, stock);

        inventoryRepository.save(inventory);

        return savedBook;
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

    // --- GÜNCELLENEN METOT: updateBook ---
    public Book updateBook(Long id, com.library.library_system.dto.BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kitap bulunamadı"));

        // Kitap bilgilerini güncelle
        updateBookFromRequest(book, request);

        // --- STOK GÜNCELLEME KISMI ---

        // 1. Stoğun hangi şubeye ait olduğunu bul
        // Request'ten gelmezse varsayılan olarak 1 (Merkez) kabul et
        Long branchId = request.getBranchId();
        if (branchId == null) {
            branchId = 1L;
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Şube bulunamadı"));

        // 2. Bu kitabın O ŞUBEDEKİ kaydını bul
        Inventory inventory = inventoryRepository.findByBookIdAndBranchId(book.getId(), branch.getId());

        if (inventory == null) {
            // Eğer bu şubede bu kitap daha önce hiç yoksa YENİ OLUŞTUR
            inventory = new Inventory(book, branch, request.getStock());
        } else {
            // Varsa güncelle
            inventory.setStockQuantity(request.getStock());
        }
        inventoryRepository.save(inventory);

        // Stok durumuna göre 'available' (müsaitlik) bilgisini güncelle
        // Stok > 0 ise true, değilse false
        // Kitabın 'available' durumunu güncelle
        boolean isAvailable = request.getStock() > 0;

        // Sadece durum değiştiyse işlem yap, yoksa veritabanını yorma
        if (book.isAvailable() != isAvailable) {
            book.setAvailable(isAvailable);
            // Cascade sorunu yaşamamak için save işlemini dikkatli yapıyoruz
            bookRepository.save(book);
        }

        return book;
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