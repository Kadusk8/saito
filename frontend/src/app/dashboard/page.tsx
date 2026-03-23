import { createClient } from '../../lib/supabase/server';
import DashboardUI from './DashboardUI';

const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function Dashboard() {
  const supabase = await createClient();

  // Fetch true connection status
  let connectedInstanceIds: string[] = [];
  let instances: any[] = [];
  try {
    const res = await fetch(`${API}/api/instances`, { cache: 'no-store' });
    const json = await res.json();
    if (json.success) {
      instances = (json.data || []).filter((i: any) => i.connectionStatus === 'open');
      connectedInstanceIds = instances.map(i => i.id);
    }
  } catch (e) {
    console.error("Failed to fetch instance status", e);
  }

  // Fetch all groups with their rules
  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, jid, rules, instance_id')
    .order('created_at', { ascending: false });

  // Only keep groups of connected instances
  const groups = (groupsData || []).filter(g => connectedInstanceIds.includes(g.instance_id));
  const totalGroups = groups.length;
  const monitoredGroups = groups.filter((g: any) => g.rules?.moderationEnabled).length;

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
