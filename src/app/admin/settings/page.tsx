// SETTINGS PAGE
'use client';

import { useEffect, useState } from 'react';

type IntegrationStatus = {
  email: { provider: string; configured: boolean; from: string | null };
  telegram: { botConfigured: boolean; chatConfigured: boolean };
  r2: { configured: boolean; bucket: string | null };
  cron: { secretConfigured: boolean };
  anthropic: { configured: boolean };
};

export default function SettingsPage() {
  const badgeActive = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  const badgeInactive = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20';
  const badgeInfo = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20';

  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    fetch('/api/v1/system/integrations')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const integrations = status
    ? [
        { name: 'Email (Resend)', configured: status.email.configured, hint: 'Add RESEND_API_KEY to Vercel' },
        { name: 'Telegram Bot', configured: status.telegram.botConfigured, hint: 'Add TELEGRAM_DIVA_BOT_TOKEN' },
        { name: 'Telegram Chat', configured: status.telegram.chatConfigured, hint: 'Add TELEGRAM_ADMIN_CHAT_ID' },
        { name: 'Cloudflare R2', configured: status.r2.configured, hint: 'Add R2 credentials' },
        { name: 'AI (Claude)', configured: status.anthropic.configured, hint: 'Add ANTHROPIC_API_KEY' },
        { name: 'Cron Secret', configured: status.cron.secretConfigured, hint: 'Add CRON_SECRET to Vercel' },
      ]
    : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">System configuration</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Database</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Provider</span>
              <span className={badgeInfo}>PostgreSQL (Neon.tech)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Tables</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">30+ tables</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Status</span>
              <span className={badgeActive}>Connected</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Integrations</h3>
          <div className="space-y-3">
            {integrations ? (
              integrations.map(item => (
                <div key={item.name} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">{item.name}</span>
                  {item.configured ? (
                    <span className={badgeActive}>Connected</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={badgeInactive}>Not Configured</span>
                      <span className="text-xs text-zinc-600">{item.hint}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-500">Loading integration status...</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">System Information</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Version', value: 'v3.0.0' },
              { label: 'Release', value: 'Release 1 (Foundation)' },
              { label: 'Environment', value: 'Development' },
              { label: 'Node.js', value: 'v20.x' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-zinc-500">{item.label}</span>
                <span className="font-mono text-zinc-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
