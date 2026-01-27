import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, User, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  phone: z
    .string()
    .regex(/^(\+254|254|0)?[17]\d{8}$/, 'Please enter a valid Kenyan phone number (e.g., 0712345678)')
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        username: profile.username || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setError(null);
    setLoading(true);

    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', data.username.toLowerCase())
        .neq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          username: data.username.toLowerCase(),
          phone: data.phone,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('delete-account');
      if (fnError) throw fnError;
      if (data && typeof data === 'object' && 'success' in data && (data as any).success !== true) {
        throw new Error((data as any).error || 'Failed to delete account');
      }

      // Local sign-out to clear UI state
      await supabase.auth.signOut();
      toast.success('Your account has been deleted.');
      navigate('/', { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete account';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-xl">Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-foreground">{profile?.email}</p>
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Alex Mwangi"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Username
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="johndoe"
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Your unique identifier (letters, numbers, underscores only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          Phone Number
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="0712345678"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        For WhatsApp reminders about contributions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/8 animate-fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>

                <div className="pt-2">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Delete account</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Permanently remove your account and contributions. This cannot be undone.
                        </p>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your account data. If you proceed, you will be signed out.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              disabled={deleting}
                            >
                              Delete permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
