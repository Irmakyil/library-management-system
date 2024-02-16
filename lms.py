import sys

class Library:
    def __init__(self, file_name):
        self.file_name = file_name
        self.file = open(self.file_name, "a+")
        
    def __del__(self):
        self.file.close()
        
    def List_books(self):
        try:
            self.file.seek(0)
            data = self.file.read().splitlines()
            for book in data:
                book, author, *_ = book.split(',')
                print("Book:", book.strip(), "Author: ", author.strip())
        except Exception as e:
            print("Error: ",e) 
       
    def add_book(self):
        book = input("Enter the book title: ")
        author = input("Enter the author: ")
        relyear = input("Enter the release year: ")
        pages = input("Enter the number of pages: ")
        NewBook = book + "," + author + "," + relyear + "," + pages + "\n"
        self.file.write(NewBook)
        print("Book added successfully!\n")
        
    def remove_book(self):
        getbook = input("Enter the book name that you want to delete:")
        self.file.seek(0)
        data = self.file.readlines()
        new_data = []
        for line in data:
            if getbook not in line:
                new_data.append(line)
        self.file.seek(0)
        self.file.truncate()
        self.file.writelines(new_data)       
        print("Book removed successfully!\n")
                        
        
    def quit(self):
        sys.exit()
             
while True:
    print("***MENU***")
    print("1) List Books")
    print("2) Add Book")
    print("3) Remove Books")
    print("q) Quit")
    secim = input("\nEnter your choice (1-4): ")
    
    library = Library("books.txt")
    
    if secim == "1":
        library.List_books()
        del library
        
    elif secim == "2":
        library.add_book()
        del library
        
    elif secim == "3":
        library.remove_book()
        del library
        
    elif secim == "q":
        library.quit()
        del library
        
    else:
        print("Wrong option")