-- OTOMATİK TARİH GÜNCELLEME TETİKLEYİCİSİ

-- 1. Fonksiyonu Tanımla
-- Bu fonksiyon, bir satır güncellendiğinde 'updated_at' sütununa şimdiki zamanı basar.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Books Tablosu İçin Trigger Oluştur

-- Eğer trigger daha önce varsa önce sil!
DROP TRIGGER IF EXISTS update_books_updated_at ON books;

-- Trigger'ı oluştur
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();