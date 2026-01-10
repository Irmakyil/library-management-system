package com.library.library_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Branch;
import com.library.library_system.model.Inventory;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    // Kitap ID'sine göre stok bulmak için özel metot
    Inventory findByBookId(Long bookId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(i.stockQuantity), 0) FROM Inventory i")
    Integer sumTotalStock();

    // Envanter tablosuna bak, kitabı bul, stoğu 0'dan büyükse o satırdaki 'Branch'
    // bilgisini getir.
    @Query("SELECT DISTINCT i.branch FROM Inventory i WHERE i.book.id = :bookId AND i.stockQuantity > 0")
    List<Branch> findBranchesWithStock(@Param("bookId") Long bookId);

    // Belirli bir kitap ve şube kombinasyonunu bulmak için (Ödünç verirken stok
    // düşmek için lazım)
    Inventory findByBookIdAndBranchId(Long bookId, Long branchId);

    // Bir kitabın TÜM şubelerdeki toplam stoğunu hesapla
    @Query("SELECT SUM(i.stockQuantity) FROM Inventory i WHERE i.book.id = :bookId")
    Integer sumStockByBookId(@Param("bookId") Long bookId);

    void deleteByBookId(Long bookId);
}