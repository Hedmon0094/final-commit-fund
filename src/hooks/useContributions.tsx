import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TARGET_AMOUNT, TOTAL_TARGET } from '@/lib/constants';

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

// Public profile interface (excludes sensitive data)
interface PublicProfile {
  id: string;
  user_id: string;
  name: string;
  is_treasurer: boolean;
  created_at: string;
}

interface MemberWithContributions {
  profile: PublicProfile;
  totalPaid: number;
  contributions: Contribution[];
}

export function useMyContributions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-contributions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contribution[];
    },
    enabled: !!user,
  });
}

export function useMyTotal() {
  const { data: contributions = [] } = useMyContributions();
  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

export function useAllMembersWithContributions() {
  const { profile } = useAuth();
  const isTreasurer = profile?.is_treasurer ?? false;

  return useQuery({
    queryKey: ['all-members-contributions', isTreasurer],
    queryFn: async () => {
      // Use public_profiles view to get only non-sensitive profile data
      // Cast to unknown first since view isn't in generated types yet
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles' as 'profiles')
        .select('id, user_id, name, is_treasurer, created_at')
        .order('name');

      if (profileError) throw profileError;

      // Get all contributions
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('*')
        .eq('status', 'completed');

      if (contribError) throw contribError;

      // Map profiles with their contributions
      const members: MemberWithContributions[] = (profiles as PublicProfile[]).map(profile => {
        const memberContributions = (contributions as Contribution[]).filter(
          c => c.user_id === profile.user_id
        );
        const totalPaid = memberContributions.reduce((sum, c) => sum + c.amount, 0);

        return {
          profile,
          totalPaid,
          contributions: memberContributions,
        };
      });

      return members;
    },
  });
}

export function useGroupStats() {
  const { data: members = [] } = useAllMembersWithContributions();

  const totalCollected = members.reduce((sum, m) => sum + m.totalPaid, 0);
  const memberCount = members.length;
  const totalTarget = memberCount * TARGET_AMOUNT;
  const completedCount = members.filter(m => m.totalPaid >= TARGET_AMOUNT).length;
  const inProgressCount = members.filter(m => m.totalPaid > 0 && m.totalPaid < TARGET_AMOUNT).length;
  const notStartedCount = members.filter(m => m.totalPaid === 0).length;

  return {
    totalCollected,
    totalTarget,
    memberCount,
    completedCount,
    inProgressCount,
    notStartedCount,
    progressPercentage: totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0,
  };
}

export function useAddContribution() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contributions')
        .insert({
          user_id: user.id,
          amount,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['all-members-contributions'] });
    },
  });
}

export function getMemberStatus(totalPaid: number): 'completed' | 'in-progress' | 'pending' {
  if (totalPaid >= TARGET_AMOUNT) return 'completed';
  if (totalPaid > 0) return 'in-progress';
  return 'pending';
}
