import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function SupabasePage() {
  const [selectedTab, setSelectedTab] = useState("profiles");
  
  // Lidar com a sincronização com o Supabase
  const syncQuery = useQuery({
    queryKey: ['/api/supabase/sync'],
    queryFn: async () => {
      const response = await fetch('/api/supabase/sync');
      if (!response.ok) {
        throw new Error('Falha ao sincronizar com Supabase');
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
        throw new Error('Falha ao buscar perfis do Supabase');
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
        throw new Error('Falha ao buscar usuários do Supabase');
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
      
      <div className="mb-6">
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
          ) : "Sincronizar com Supabase"}
        </Button>
        
        {syncQuery.isSuccess && (
          <div className="mt-2 p-3 bg-green-50 text-green-700 rounded-md">
            Sincronização concluída com sucesso!
          </div>
        )}
        
        {syncQuery.isError && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md">
            Erro ao sincronizar: {syncQuery.error.message}
          </div>
        )}
      </div>
      
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
              ) : profilesQuery.data?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum perfil encontrado no Supabase.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Usuário ID</TableHead>
                      <TableHead>Atualizado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profilesQuery.data?.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-mono text-xs">{profile.id}</TableCell>
                        <TableCell>{profile.name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{profile.user_id}</TableCell>
                        <TableCell>{new Date(profile.updated_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              ) : usersQuery.data?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum usuário encontrado no Supabase.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Confirmado</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.data?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.email_confirmed_at ? "Sim" : "Não"}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}