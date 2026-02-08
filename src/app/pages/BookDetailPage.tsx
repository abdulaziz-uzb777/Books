import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { getBook, addToFavorites, removeFromFavorites, addToRecent, getCurrentUser } from '../../utils/api';
import type { Book } from '../../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Download, Heart, BookOpen } from 'lucide-react';
import AuthDialog from '../components/AuthDialog';
import Footer from '../components/Footer';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, accessToken, updateUser } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadBook(id);
    }
  }, [id]);

  useEffect(() => {
    if (user && book) {
      setIsFavorite(user.favorites?.includes(book.id) || false);
    }
  }, [user, book]);

  const loadBook = async (bookId: string) => {
    try {
      const { book } = await getBook(bookId);
      setBook(book);

      // Add to recent if user is logged in
      if (accessToken) {
        try {
          await addToRecent(accessToken, bookId);
          // Refresh user data
          const { user: updatedUser } = await getCurrentUser(accessToken);
          updateUser(updatedUser);
        } catch (error) {
          console.error('Error adding to recent:', error);
        }
      }
    } catch (error) {
      console.error('Error loading book:', error);
      toast.error('Книга не найдена');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !accessToken) {
      toast.error('Войдите в систему, чтобы добавить в избранное');
      setAuthDialogOpen(true);
      return;
    }

    if (!book) return;

    try {
      if (isFavorite) {
        await removeFromFavorites(accessToken, book.id);
        toast.success('Удалено из избранного');
      } else {
        await addToFavorites(accessToken, book.id);
        toast.success('Добавлено в избранное');
      }

      // Refresh user data
      const { user: updatedUser } = await getCurrentUser(accessToken);
      updateUser(updatedUser);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Ошибка при изменении избранного');
    }
  };

  const handleDownload = () => {
    if (!book?.pdfUrl) {
      toast.error('PDF файл недоступен');
      return;
    }

    window.open(book.pdfUrl, '_blank');
    toast.success('Открытие PDF файла');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-2">{book.category}</Badge>
                  <CardTitle className="text-3xl mb-2">{book.title}</CardTitle>
                  <CardDescription className="text-lg">
                    Автор: {book.author}
                  </CardDescription>
                </div>
                <Button
                  variant={isFavorite ? 'default' : 'outline'}
                  size="icon"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Описание
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              </div>

              <Separator />

              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Краткий пересказ</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {book.summary}
                </p>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                {book.pdfUrl ? (
                  <Button onClick={handleDownload} className="flex-1" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Скачать / Читать PDF
                  </Button>
                ) : (
                  <Button disabled className="flex-1" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    PDF недоступен
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className="flex-1"
                  size="lg"
                >
                  <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'В избранном' : 'Добавить в избранное'}
                </Button>
              </div>

              {!user && (
                <div className="bg-accent/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Войдите в систему, чтобы сохранять книги в избранное и отслеживать историю чтения
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setAuthDialogOpen(true)}
                  >
                    Войти в систему
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}