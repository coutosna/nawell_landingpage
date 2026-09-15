import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { NaWellMark } from '@/components/ecf/NaWellBrand';
import { A11yToggle } from '@/components/a11y/A11yToggle';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(username, password);
    
    if (success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo à NAWELL",
      });
      navigate('/efd');
    } else {
      toast({
        title: "Erro no login",
        description: "Usuário ou senha incorretos",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4 animate-fade-in font-manrope relative overflow-hidden">
      {/* Background geometric watermark */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <NaWellMark className="absolute -top-24 -right-24 w-[420px] h-[420px] text-white" />
        <NaWellMark className="absolute -bottom-32 -left-24 w-[460px] h-[460px] text-white" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,130,246,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(90,91,145,0.35),transparent_55%)]" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border border-border/60 relative z-10 animate-scale-in rounded-2xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-sidebar border border-white/10 p-2.5 shadow-xl shadow-black/20 flex items-center justify-center">
            <img src="/nawelllogo.png" alt="NAWELL" className="h-full w-full object-contain" />
          </div>
          <div>
            <CardDescription className="text-sm mt-2 text-muted-foreground font-medium">
              Transformamos Complexidade em Clareza.
            </CardDescription>
            <CardDescription className="text-xs mt-3 text-muted-foreground">
              Inteligência Tributária — EFD, ECF, eSocial e Reforma
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="relative z-10 mt-6 animate-fade-in">
        <A11yToggle variant="full" className="bg-white/10 text-white hover:bg-white/15 border-white/20 shadow-sm backdrop-blur-sm" />
      </div>
    </div>
  );
}