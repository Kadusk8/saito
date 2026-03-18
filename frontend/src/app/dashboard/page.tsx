import { createClient } from '../../lib/supabase/server';
import DashboardUI from './DashboardUI';

export default async function Dashboard() {
  const supabase = await createClient();

  // Fetch all groups with their rules
  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, jid, rules')
    .order('created_at', { ascending: false });

  const groups = groupsData || [];
  const totalGroups = groups.length;
  const monitoredGroups = groups.filter((g: any) => g.rules?.moderationEnabled).length;

  // Fetch instances
  const { data: instancesData } = await supabase
    .from('instances')
    .select('id, name');

  const instances = instancesData || [];

  // Fetch active strikes (members with strikes > 0)
  const { count: activeStrikesCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gt('strikes', 0);

  const activeStrikes = activeStrikesCount || 0;

  // Fetch IA bans today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: iaBansCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'banned')
    .ilike('reason', '%IA%')
    .gte('created_at', today.toISOString());

  const iaBansToday = iaBansCount || 0;

  return (
    <DashboardUI
      totalGroups={totalGroups}
      monitoredGroups={monitoredGroups}
      totalInstances={instances.length}
      activeStrikes={activeStrikes}
      iaBansToday={iaBansToday}
      recentGroups={groups as any}
      instances={instances as any}
    />
  );
}
