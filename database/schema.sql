-- Kütüphane Yönetim Sistemi Veritabanı Şeması 

-- 1. Yazarlar (Authors) Tablosu
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio VARCHAR(1000)
);

-- 2. Kategoriler (Categories) Tablosu
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 3. Kitaplar (Books) Tablosu
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(255) UNIQUE,
    publication_year INTEGER,
    
    -- İlişki Sütunları
    author_id BIGINT NOT NULL,
    category_id BIGINT,

    -- Durum
    available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_book_author FOREIGN KEY (author_id) REFERENCES authors(id),
    CONSTRAINT fk_book_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. Şubeler (Branches) Tablosu
CREATE TABLE IF NOT EXISTS branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255)
);

-- 5. Üyeler (Members) Tablosu
CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER', -- 'ADMIN' veya 'MEMBER'
);

-- 6. Ödünç İşlemleri (Loans) Tablosu
CREATE TABLE IF NOT EXISTS loans (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    loan_date DATE NOT NULL,
    return_date DATE,
    penalty DECIMAL(10, 2) DEFAULT 0.0,
    
    CONSTRAINT fk_loan_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_loan_book FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 7. Envanter (Inventory) Tablosu
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL UNIQUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_inventory_book FOREIGN KEY (book_id) REFERENCES books(id)
);