import { useEffect, useState } from 'react';
import { exitFullscreen, isKiosk } from './core/fullscreen';
import { useSave } from './core/saveContext';
import { setSoundEnabled } from './core/sound';
import { setVoiceEnabled } from './core/speech';
import { Boot } from './os/Boot';
import { Desktop } from './os/Desktop';
import { Login } from './os/Login';
import { Shutdown } from './os/Shutdown';

type Phase =
  | { name: 'off' }
  | { name: 'login' }
  | { name: 'desktop'; id: string }
  | { name: 'bye'; who: string };

export default function App() {
  const save = useSave();
  const [phase, setPhase] = useState<Phase>({ name: 'off' });

  // Kein Browser-Menü beim Rechtsklick: Der Computer hat sein eigenes.
  useEffect(() => {
    const onMenu = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest('input, textarea')) e.preventDefault();
    };
    document.addEventListener('contextmenu', onMenu);
    return () => document.removeEventListener('contextmenu', onMenu);
  }, []);

  // Außerhalb eines Profils gelten die Grundeinstellungen.
  useEffect(() => {
    if (phase.name !== 'desktop') {
      setSoundEnabled(true);
      setVoiceEnabled(true);
    }
  }, [phase.name]);

  switch (phase.name) {
    case 'off':
      return <Boot onStarted={() => setPhase({ name: 'login' })} />;
    case 'login':
      return (
        <Login
          onLogin={(id) => {
            save.setLastProfile(id);
            setPhase({ name: 'desktop', id });
          }}
          onShutdown={() => setPhase({ name: 'bye', who: '' })}
        />
      );
    case 'desktop': {
      const profile = save.profile(phase.id);
      if (!profile) {
        return <Login onLogin={(id) => setPhase({ name: 'desktop', id })} onShutdown={() => setPhase({ name: 'off' })} />;
      }
      return (
        <Desktop
          key={profile.id}
          profile={profile}
          onLogout={() => setPhase({ name: 'login' })}
          onShutdown={() => setPhase({ name: 'bye', who: profile.name })}
        />
      );
    }
    case 'bye':
      return (
        <Shutdown
          name={phase.who}
          onDone={() => {
            if (!isKiosk()) void exitFullscreen();
            setPhase({ name: 'off' });
          }}
        />
      );
  }
}
