package com.library.library_system.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Book;
import com.library.library_system.model.Loan;
import com.library.library_system.repository.BookRepository;
import com.library.library_system.repository.LoanRepository;

@Service
public class RecommendationService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;

    public RecommendationService(LoanRepository loanRepository, BookRepository bookRepository) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
    }

    public List<Book> recommendBooks(Long memberId) {
        // 1. Kullanıcının geçmiş ödünç aldığı kitapları getir
        List<Loan> history = loanRepository.findByMemberId(memberId);

        // A. Kullanıcı yeniyse (Geçmişi yoksa) rastgele kitap öner
        if (history.isEmpty()) {
            return bookRepository.findRandomBooks();
        }

        // 2. Kullanıcının okuduğu kitapların ID'lerini listele (Tekrar önermemek için)
        List<Long> readBookIds = history.stream()
                .map(loan -> loan.getBook().getId())
                .collect(Collectors.toList());

        // 3. ALGORİTMA: En çok okunan kategoriyi bul
        // Map yapısı: Kategori -> Okunma Sayısı (Örn: Bilim Kurgu -> 5, Roman -> 2)
        Map<Long, Integer> categoryFrequency = new HashMap<>();

        for (Loan loan : history) {
            Book book = loan.getBook();
            if (book.getCategory() != null) {
                Long catId = book.getCategory().getId();
                categoryFrequency.put(catId, categoryFrequency.getOrDefault(catId, 0) + 1);
            }
        }

        // En yüksek frekansa sahip kategoriyi bul
        Long favoriteCategoryId = null;
        int maxCount = -1;

        for (Map.Entry<Long, Integer> entry : categoryFrequency.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                favoriteCategoryId = entry.getKey();
            }
        }

        // 4. Eğer favori kategori bulunduysa, o kategoriden okunmamış kitapları getir
        if (favoriteCategoryId != null) {
            List<Book> recommendations = bookRepository.findByCategoryIdAndIdNotIn(favoriteCategoryId, readBookIds);
            
            // Eğer o kategoride okunacak kitap kalmadıysa rastgele öner
            if (recommendations.isEmpty()) {
                return bookRepository.findRandomBooks();
            }
            
            // En fazla 4 tane öner
            return recommendations.stream().limit(4).collect(Collectors.toList());
        }

        // Algoritma bir şey bulamazsa varsayılan olarak rastgele öner
        return bookRepository.findRandomBooks();
    }
}