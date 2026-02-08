import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { getBooks } from '../../utils/api';
import type { Book } from '../../utils/api';
import { ArrowLeft, Heart, Clock, User as UserIcon } from 'lucide-react';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadBooks();
  }, [user, navigate]);

  const loadBooks = async () => {
    try {
      const { books } = await getBooks();
      setBooks(books);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const favoriteBooks = books.filter((book) => user.favorites?.includes(book.id));
  const recentBooks = (user.recent || [])
    .map((bookId) => books.find((b) => b.id === bookId))
    .filter((book): book is Book => book !== undefined);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Главная
            </Button>
          </Link>
          <Button variant="outline" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Info */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <CardDescription>@{user.login}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Страна</p>
                  <p className="font-medium">{user.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Город</p>
                  <p className="font-medium">{user.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Дата рождения</p>
                  <p className="font-medium">{user.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Избранное</p>
                  <p className="font-medium">{user.favorites?.length || 0} книг</p>
                </div>
              </div>
              {user.aboutMe && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">О себе</p>
                  <p className="mt-1">{user.aboutMe}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="favorites" className="space-y-4">
            <TabsList>
              <TabsTrigger value="favorites">
                <Heart className="mr-2 h-4 w-4" />
                Избранное ({favoriteBooks.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="mr-2 h-4 w-4" />
                Недавние ({recentBooks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorites">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Загрузка...</p>
                </div>
              ) : favoriteBooks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground mb-2">
                      Избранное пусто
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Добавьте книги в избранное, чтобы быстро находить их
                    </p>
                    <Link to="/">
                      <Button>Перейти к книгам</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favoriteBooks.map((book) => (
                    <Link key={book.id} to={`/book/${book.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                        {book.coverImageUrl && (
                          <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                            <img
                              src={book.coverImageUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <Badge className="w-fit mb-2">{book.category}</Badge>
                          <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {book.description}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Подробнее
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Загрузка...</p>
                </div>
              ) : recentBooks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground mb-2">
                      История пуста
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Просматривайте книги, чтобы они появлялись здесь
                    </p>
                    <Link to="/">
                      <Button>Перейти к книгам</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recentBooks.map((book) => (
                    <Link key={book.id} to={`/book/${book.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                        {book.coverImageUrl && (
                          <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                            <img
                              src={book.coverImageUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <Badge className="w-fit mb-2">{book.category}</Badge>
                          <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                          <CardDescription>{book.author}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {book.description}
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Подробнее
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}