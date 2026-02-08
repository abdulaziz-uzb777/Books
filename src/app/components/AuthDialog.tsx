import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { signup, signin, getCurrentUser } from '../../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign in state
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');

  // Sign up state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { accessToken } = await signin(loginValue, password);
      const { user } = await getCurrentUser(accessToken);
      login(accessToken, user);
      toast.success('Успешный вход');
      onOpenChange(false);
      setLoginValue('');
      setPassword('');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dateOfBirth || !country || !city || !signupPassword) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      const { login: generatedLogin, password: generatedPassword } = await signup({
        firstName,
        lastName,
        dateOfBirth,
        country,
        city,
        aboutMe,
        password: signupPassword,
      });

      toast.success(
        <div>
          <p>Аккаунт создан!</p>
          <p className="text-sm mt-1">Логин: <strong>{generatedLogin}</strong></p>
          <p className="text-sm">Используйте этот логин для входа</p>
        </div>,
        { duration: 8000 }
      );

      // Auto sign in
      const { accessToken } = await signin(generatedLogin, generatedPassword);
      const { user } = await getCurrentUser(accessToken);
      login(accessToken, user);
      
      onOpenChange(false);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setCountry('');
      setCity('');
      setAboutMe('');
      setSignupPassword('');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Вход в систему</DialogTitle>
          <DialogDescription>
            Войдите в свой аккаунт или создайте новый
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">
              <LogIn className="mr-2 h-4 w-4" />
              Вход
            </TabsTrigger>
            <TabsTrigger value="signup">
              <UserPlus className="mr-2 h-4 w-4" />
              Регистрация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  placeholder="Введите логин"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ваше имя"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ваша фамилия"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Дата рождения *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Страна *</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ваша страна"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ваш город"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="aboutMe">О себе</Label>
                <Textarea
                  id="aboutMe"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Расскажите о себе (необязательно)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="signupPassword">Пароль *</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Создание...' : 'Создать аккаунт'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                После регистрации вам будет сгенерирован уникальный логин
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}