package com.library.library_system.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.library.library_system.model.Book;
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
        // 1. Kullanıcının geçmiş ödünç aldığı kitapları getir (Optimize edilmiş DTO)
        List<com.library.library_system.dto.LoanDTO> history = loanRepository.findDTOByMemberId(memberId);

        // Okunan kitapların ID'lerini listele
        List<Long> readBookIds = history.stream()
                .map(loan -> loan.getBookId())
                .collect(Collectors.toList());

        List<Book> finalRecommendations = new java.util.ArrayList<>();

        // 2. Geçmiş varsa favori kategori mantığı uygula
        if (!history.isEmpty()) {
            Map<Long, Integer> categoryFrequency = new HashMap<>();
            for (com.library.library_system.dto.LoanDTO loan : history) {
                Long catId = loan.getCategoryId();
                if (catId != null) {
                    categoryFrequency.put(catId, categoryFrequency.getOrDefault(catId, 0) + 1);
                }
            }

            Long favoriteCategoryId = null;
            int maxCount = -1;
            for (Map.Entry<Long, Integer> entry : categoryFrequency.entrySet()) {
                if (entry.getValue() > maxCount) {
                    maxCount = entry.getValue();
                    favoriteCategoryId = entry.getKey();
                }
            }

            if (favoriteCategoryId != null) {
                // Favori kategoriden okunmamış kitapları getir
                List<Book> categoryRecs = bookRepository.findByCategoryIdAndIdNotIn(favoriteCategoryId, readBookIds);
                // En fazla 4 tane al
                finalRecommendations.addAll(categoryRecs.stream().limit(4).collect(Collectors.toList()));
            }
        }

        // 3. EKSİK TAMAMLAMA (Her zaman 4'e tamamla)
        if (finalRecommendations.size() < 4) {
            int needed = 4 - finalRecommendations.size();

            // Hariç tutulacaklar: Zaten okudukları + Şu an öneri listesine eklenenler
            List<Long> excluded = new java.util.ArrayList<>(readBookIds);
            finalRecommendations.forEach(b -> excluded.add(b.getId()));

            List<Book> randomFill;
            if (excluded.isEmpty()) {
                // Hiçbir şey okunmamış ve önerilmemişse direkt rastgele al
                randomFill = bookRepository.findRandomBooks(); // Default 4 returns
            } else {
                randomFill = bookRepository.findRandomBooksExcept(excluded, needed);
            }

            finalRecommendations.addAll(randomFill);
        }

        // Yine de 4'ten fazla olursa (randomBooks 4 dönerse vs) kırp
        return finalRecommendations.stream().limit(4).collect(Collectors.toList());
    }
}