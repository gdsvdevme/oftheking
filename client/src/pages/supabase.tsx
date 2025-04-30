import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Key, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SupabasePage() {
  const [selectedTab, setSelectedTab] = useState("profiles");
  const [resetingDemoData, setResetingDemoData] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Lidar com a sincronização com o Supabase
  const syncQuery = useQuery({
    queryKey: ['/api/supabase/sync'],
    queryFn: async () => {
      const response = await fetch('/api/supabase/sync');
      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || 'Falha ao sincronizar com Supabase';
        
        // Se for erro de permissão específico
        if (errorMsg.includes('not allowed') || errorMsg.includes('not_admin')) {
          throw new Error('Erro de permissão: É necessária uma chave de serviço do Supabase com permissões administrativas');
        }
        
        throw new Error(errorMsg);
      }
      return response.json();
    },
    enabled: false, // Não executar automaticamente
  });
  
  // Buscar perfis do Supabase
  const profilesQuery = useQuery({
    queryKey: ['/api/supabase/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/supabase/profiles');
      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || 'Falha ao buscar perfis do Supabase';
        
        // Se for erro de permissão específico
        if (errorMsg.includes('not allowed') || errorMsg.includes('not_admin')) {
          throw new Error('Erro de permissão: É necessária uma chave de serviço do Supabase com permissões administrativas');
        }
        
        throw new Error(errorMsg);
      }
      return response.json();
    },
  });
  
  // Buscar usuários do Supabase
  const usersQuery = useQuery({
    queryKey: ['/api/supabase/users'],
    queryFn: async () => {
      const response = await fetch('/api/supabase/users');
      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || 'Falha ao buscar usuários do Supabase';
        
        // Se for erro de permissão específico
        if (errorMsg.includes('not allowed') || errorMsg.includes('not_admin')) {
          throw new Error('Erro de permissão: É necessária uma chave de serviço do Supabase com permissões administrativas');
        }
        
        throw new Error(errorMsg);
      }
      return response.json();
    },
  });
  
  const handleSync = () => {
    syncQuery.refetch();
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dados do Supabase</h1>
      
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-orange-700">Aviso: Dados de Demonstração</CardTitle>
          <CardDescription className="text-orange-600">
            Atualmente exibindo dados de demonstração do PostgreSQL local. Para visualizar os dados reais do Supabase, é necessário configurar a chave de serviço com permissões administrativas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleSync}
                disabled={syncQuery.isPending}
                className="w-full sm:w-auto"
              >
                {syncQuery.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar com Supabase
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="w-full sm:w-auto"
              >
                <Key className="mr-2 h-4 w-4" />
                {showKeyInput ? "Cancelar" : "Configurar Chave de Serviço"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Limpar Dados de Demonstração
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação vai remover todos os dados de demonstração do banco de dados. Isso não pode ser desfeito.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          setResetingDemoData(true);
                          const response = await fetch('/api/reset-demo-data', {
                            method: 'POST'
                          });
                          
                          if (!response.ok) {
                            throw new Error('Falha ao limpar dados');
                          }
                          
                          // Recarregar a página após limpar
                          window.location.reload();
                        } catch (err) {
                          console.error(err);
                          // Podemos adicionar uma notificação de erro aqui
                        } finally {
                          setResetingDemoData(false);
                        }
                      }}
                    >
                      {resetingDemoData ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Limpando...
                        </>
                      ) : "Sim, limpar dados"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {showKeyInput && (
              <div className="mt-3 p-4 border border-gray-200 rounded-md bg-white">
                <h3 className="text-lg font-medium mb-2">Configurar Chave de Serviço do Supabase</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para acessar dados do Supabase, você precisa de uma chave de serviço (service_role) com permissões administrativas.
                </p>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="serviceKey">Chave de Serviço</Label>
                    <Input 
                      id="serviceKey" 
                      type="password" 
                      value={serviceKey} 
                      onChange={(e) => setServiceKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                  
                  <Button 
                    onClick={async () => {
                      if (!serviceKey.trim()) return;
                      
                      try {
                        const response = await fetch('/api/supabase/set-service-key', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ serviceKey })
                        });
                        
                        if (!response.ok) {
                          throw new Error('Falha ao configurar a chave');
                        }
                        
                        // Recarregar a página após configurar
                        window.location.reload();
                      } catch (err) {
                        console.error(err);
                        // Podemos adicionar uma notificação de erro aqui
                      }
                    }}
                    disabled={!serviceKey.trim()}
                  >
                    Salvar e Aplicar
                  </Button>
                </div>
              </div>
            )}
            
            {syncQuery.isSuccess && (
              <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-2">Sincronização concluída!</h3>
                <p className="text-sm mb-2">Timestamp: {syncQuery.data.timestamp}</p>
                
                {syncQuery.data.results?.operations && syncQuery.data.results.operations.length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-medium mb-1 text-green-800">Operações realizadas:</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {syncQuery.data.results.operations.map((op, index) => (
                        <li key={index}>{op}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {syncQuery.data.results?.profiles && (
                  <div className="mt-2 p-2 bg-white/50 rounded border border-green-200">
                    <p className="font-medium">
                      Perfis: {syncQuery.data.results.profiles.success ? (
                        <span className="text-green-600">
                          {syncQuery.data.results.profiles.count} encontrados
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Falha: {syncQuery.data.results.profiles.message}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {syncQuery.data.results?.users && (
                  <div className="mt-2 p-2 bg-white/50 rounded border border-green-200">
                    <p className="font-medium">
                      Usuários: {syncQuery.data.results.users.success ? (
                        <span className="text-green-600">
                          {syncQuery.data.results.users.count} encontrados
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Falha: {syncQuery.data.results.users.message}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {syncQuery.isError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                <h3 className="text-lg font-medium text-red-800 mb-2">Erro na sincronização</h3>
                <p className="text-sm">Mensagem: {syncQuery.error.message}</p>
                {syncQuery.error.cause && (
                  <p className="text-sm mt-1">Causa: {String(syncQuery.error.cause)}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Perfis do Supabase</CardTitle>
              <CardDescription>
                Perfis armazenados no Supabase associados às contas de usuário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profilesQuery.isPending ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : profilesQuery.isError ? (
                <div className="p-3 bg-red-50 text-red-700 rounded-md">
                  Erro ao carregar perfis: {profilesQuery.error.message}
                </div>
              ) : !profilesQuery.data?.profiles || profilesQuery.data.profiles.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum perfil encontrado no Supabase.
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-3 rounded-md text-blue-800 mb-4">
                    <p className="font-medium">Total: {profilesQuery.data.count} perfis encontrados</p>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Atualizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profilesQuery.data.profiles.map((profile: any) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-mono text-xs">{profile.id}</TableCell>
                          <TableCell>{profile.name || "-"}</TableCell>
                          <TableCell>{profile.email || "-"}</TableCell>
                          <TableCell>{profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Supabase</CardTitle>
              <CardDescription>
                Contas de usuário no serviço de autenticação do Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersQuery.isPending ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersQuery.isError ? (
                <div className="p-3 bg-red-50 text-red-700 rounded-md">
                  Erro ao carregar usuários: {usersQuery.error.message}
                </div>
              ) : !usersQuery.data?.users || usersQuery.data.users.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum usuário encontrado no Supabase.
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-3 rounded-md text-blue-800 mb-4">
                    <p className="font-medium">Total: {usersQuery.data.count} usuários encontrados</p>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último login</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersQuery.data.users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">{user.id}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.banned_until ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Banido
                              </span>
                            ) : user.confirmed_at ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pendente
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Nunca"}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}