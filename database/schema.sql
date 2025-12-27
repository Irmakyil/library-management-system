-- Kütüphane Yönetim Sistemi Veritabanı Şeması

-- Eğer varsa önce eski tabloyu temizle (Opsiyonel)
-- DROP TABLE IF EXISTS books;

-- Kitaplar (Books) Tablosu
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,           -- Otomatik artan ID
    title VARCHAR(255) NOT NULL,        -- Kitap Başlığı (Boş olamaz)
    author VARCHAR(255) NOT NULL,       -- Yazar (Boş olamaz)
    isbn VARCHAR(255) UNIQUE,           -- ISBN (Benzersiz olmalı)
    publication_year INTEGER            -- Basım Yılı
);

-- Şubeler (Branches) Tablosu
CREATE TABLE IF NOT EXISTS branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255)
);

-- Üyeler (Members) Tablosu
CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Ödünç İşlemleri (Loans) Tablosu
CREATE TABLE IF NOT EXISTS loans (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    loan_date DATE NOT NULL,
    return_date DATE,
    penalty DECIMAL(10, 2), -- Yeni eklenen ceza alanı
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Yazarlar (Authors) Tablosu
CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio VARCHAR(1000)
);

-- Kategoriler (Categories) Tablosu
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Envanter (Inventory) Tablosu
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL UNIQUE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES books(id)
);