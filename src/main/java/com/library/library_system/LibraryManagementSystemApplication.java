package com.library.library_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(LibraryManagementSystemApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner demo(
			com.library.library_system.repository.MemberRepository memberRepository,
			javax.sql.DataSource dataSource) {
		return (args) -> {
			// PostgreSQL için sequence değerlerini tablodaki max(id) ile senkronlar
			try (java.sql.Connection conn = dataSource.getConnection();
					java.sql.Statement stmt = conn.createStatement()) {
				stmt.execute("SELECT setval('books_id_seq', COALESCE((SELECT MAX(id) FROM books), 1))");
				stmt.execute("SELECT setval('members_id_seq', COALESCE((SELECT MAX(id) FROM members), 1))");
				stmt.execute("SELECT setval('loans_id_seq', COALESCE((SELECT MAX(id) FROM loans), 1))");
				stmt.execute("SELECT setval('authors_id_seq', COALESCE((SELECT MAX(id) FROM authors), 1))");
				stmt.execute("SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1))");
			} catch (Exception e) {
				System.out.println("Sequence reset error" + e.getMessage());
			}

			// Admin kullanıcı yoksa oluşturur
			com.library.library_system.model.Member admin = memberRepository.findByEmail("admin@library.com");
			if (admin == null) {
				admin = new com.library.library_system.model.Member();
				admin.setFirstName("System");
				admin.setLastName("Administrator");
				admin.setEmail("admin@library.com");
				admin.setPassword("admin123");
				admin.setRole("ADMIN");
				memberRepository.save(admin);
				System.out.println("Admin kullanıcısı oluşturuldu: admin@library.com / admin123");
			}
		};
	}

}
