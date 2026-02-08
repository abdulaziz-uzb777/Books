import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { adminLogin, addBook, getUsers, deleteBook, getBooks } from '../../utils/api';
import type { Book, UserProfile } from '../../utils/api';
import { toast } from 'sonner';
import { Trash2, BookOpen, Users, LogOut, Image as ImageIcon, X } from 'lucide-react';

const CATEGORIES = [
  'Роман',
  'Фантастика',
  'Фэнтези',
  'Детектив',
  'Любовный роман',
  'Приключения',
  'Научно-популярная литература',
  'Саморазвитие',
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  
  // Book form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      setIsLoggedIn(true);
      loadData(token);
    }
  }, []);

  const loadData = async (token: string) => {
    try {
      const [usersData, booksData] = await Promise.all([
        getUsers(token),
        getBooks(),
      ]);
      setUsers(usersData.users || []);
      setBooks(booksData.books || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast on initial load if no data exists
      if (error instanceof Error && !error.message.includes('not found')) {
        toast.error('Ошибка загрузки данных: ' + error.message);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await adminLogin(password);
      setAdminToken(token);
      setIsLoggedIn(true);
      localStorage.setItem('adminToken', token);
      toast.success('Успешный вход');
      loadData(token);
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Неверный пароль');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminToken('');
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !description || !summary || !category) {
      toast.error('Заполните все поля');
      return;
    }

    setIsSubmitting(true);
    try {
      let pdfBase64 = undefined;
      if (pdfFile) {
        const reader = new FileReader();
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pdfFile);
        });
      }

      let coverImageBase64 = undefined;
      if (coverImage) {
        const reader = new FileReader();
        coverImageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(coverImage);
        });
      }

      const { book } = await addBook(adminToken, {
        title,
        author,
        description,
        summary,
        category,
        pdfBase64,
        coverImageBase64,
      });

      setBooks([...books, book]);
      toast.success('Книга успешно добавлена');
      
      // Reset form
      setTitle('');
      setAuthor('');
      setDescription('');
      setSummary('');
      setCategory('');
      setPdfFile(null);
      setCoverImage(null);
      setCoverImagePreview(null);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error('Ошибка добавления книги');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
      return;
    }

    try {
      await deleteBook(adminToken, bookId);
      setBooks(books.filter(b => b.id !== bookId));
      toast.success('Книга удалена');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Ошибка удаления книги');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Панель администратора</CardTitle>
            <CardDescription>Введите пароль для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                />
              </div>
              <Button type="submit" className="w-full">Войти</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>

        <Tabs defaultValue="books" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="books">
              <BookOpen className="mr-2 h-4 w-4" />
              Книги
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Пользователи
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Добавить новую книгу</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="title">Название</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Название книги"
                      />
                    </div>
                    <div>
                      <Label htmlFor="author">Автор</Label>
                      <Input
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Автор книги"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Описание книги"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Краткий пересказ</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Краткий пересказ"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pdf">PDF файл</Label>
                    <Input
                      id="pdf"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coverImage">Обложка книги</Label>
                    <Input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setCoverImage(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setCoverImagePreview(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setCoverImagePreview(null);
                        }
                      }}
                    />
                    {coverImagePreview && (
                      <div className="mt-2">
                        <img
                          src={coverImagePreview}
                          alt="Cover"
                          className="h-20 w-20 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCoverImage(null);
                            setCoverImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Добавление...' : 'Добавить книгу'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Управление книгами ({books.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {books.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Книги еще не добавлены
                    </p>
                  ) : (
                    books.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {book.author} • {book.category}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBook(book.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Зарегистрированные пользователи ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Пользователей еще нет
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Логин: {user.login}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.country}, {user.city}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            <p>Избранное: {user.favorites?.length || 0}</p>
                            <p>Недавние: {user.recent?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}