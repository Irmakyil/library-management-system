package com.library.library_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.library_system.model.Inventory;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    // Kitap ID'sine göre stok bulmak için özel metot
    Inventory findByBookId(Long bookId);

    // Stok miktarını toplar
    @Query("SELECT SUM(i.stockQuantity) FROM Inventory i")
    Long sumTotalStock();
}