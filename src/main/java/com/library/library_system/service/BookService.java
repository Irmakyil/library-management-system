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
import com.library.library_system.repository.BranchRepository;
import com.library.library_system.repository.LoanRepository;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final BranchRepository branchRepository;
    private final LoanRepository loanRepository;

    // Constructor Dependency Injection
    public BookService(BookRepository bookRepository,
            AuthorRepository authorRepository,
            CategoryRepository categoryRepository,
            InventoryRepository inventoryRepository,
            BranchRepository branchRepository,
            LoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.authorRepository = authorRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.branchRepository = branchRepository;
        this.loanRepository = loanRepository;
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

        // 3. Envanter (Stok) Kaydını Oluştur
        // Eğer branchStocks haritası varsa onu kullan, yoksa tekli giriş (fallback) yap
        if (request.getBranchStocks() != null && !request.getBranchStocks().isEmpty()) {
            for (java.util.Map.Entry<Long, Integer> entry : request.getBranchStocks().entrySet()) {
                Long bId = entry.getKey();
                Integer qty = entry.getValue();
                if (qty != null && qty > 0) {
                    Branch br = branchRepository.findById(bId).orElse(null);
                    if (br != null) {
                        Inventory inv = new Inventory(savedBook, br, qty);
                        inventoryRepository.save(inv);
                    }
                }
            }
        } else {
            // Eski yöntem (Tek şube)
            Long branchId = request.getBranchId();
            if (branchId == null)
                branchId = 1L;
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new RuntimeException("Şube bulunamadı. ID: " + request.getBranchId()));
            int stock = request.getStock() > 0 ? request.getStock() : 1;
            Inventory inventory = new Inventory(savedBook, branch, stock);
            inventoryRepository.save(inventory);
        }

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
        if (request.getBranchStocks() != null && !request.getBranchStocks().isEmpty()) {
            boolean anyStock = false;
            for (java.util.Map.Entry<Long, Integer> entry : request.getBranchStocks().entrySet()) {
                Long bId = entry.getKey();
                Integer qty = entry.getValue();

                Branch br = branchRepository.findById(bId).orElse(null);
                if (br != null) {
                    Inventory inv = inventoryRepository.findByBookIdAndBranchId(book.getId(), bId);
                    if (inv == null) {
                        if (qty != null && qty > 0) {
                            inv = new Inventory(book, br, qty);
                            inventoryRepository.save(inv);
                            anyStock = true;
                        }
                    } else {
                        // Varsa güncelle (0 olsa bile güncelle, stok bitmiş olabilir)
                        inv.setStockQuantity(qty != null ? qty : 0);
                        inventoryRepository.save(inv);
                        if (inv.getStockQuantity() > 0)
                            anyStock = true;
                    }
                }
            }
            // Stok durumuna göre available güncelle
            if (book.isAvailable() != anyStock) {
                book.setAvailable(anyStock);
                bookRepository.save(book);
            }

        } else {
            // Eski Mantık (Tek Şube update)
            Long branchId = request.getBranchId();
            if (branchId == null)
                branchId = 1L;
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new RuntimeException("Şube bulunamadı"));
            Inventory inventory = inventoryRepository.findByBookIdAndBranchId(book.getId(), branch.getId());
            if (inventory == null) {
                inventory = new Inventory(book, branch, request.getStock());
            } else {
                inventory.setStockQuantity(request.getStock());
            }
            inventoryRepository.save(inventory);

            boolean isAvailable = request.getStock() > 0;
            if (book.isAvailable() != isAvailable) {
                book.setAvailable(isAvailable);
                bookRepository.save(book);
            }
        }

        return book;
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id).orElse(null);
        if (book == null) {
            return;
        }

        // 1. İlgili Stokları Sil
        inventoryRepository.deleteByBookId(id);

        // 2. İlgili Ödünç Kayıtlarını Sil
        loanRepository.deleteByBookId(id);

        // 3. Kitabı Sil
        bookRepository.deleteById(id);

        // 4. (Opsiyonel) Eğer yazarın başka kitabı kalmadıysa yazarı da sil
        com.library.library_system.model.Author author = book.getAuthor();
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