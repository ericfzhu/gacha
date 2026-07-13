import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/SettingsModal.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ muted: false, quality: 'high' });

  useEffect(() => {
    const raw = localStorage.getItem('kc_settings_v2');
    if (!raw) return;
    try { setSettings(JSON.parse(raw)); } catch { /* ignore invalid local preferences */ }
  }, []);

  useEffect(() => { localStorage.setItem('kc_settings_v2', JSON.stringify(settings)); }, [settings]);

  return (
    <main className="title-screen">
      <div className="title-clouds" />
      <div className="title-water" />
      <motion.img className="title-character" src="/assets/original/aster-vale.png" alt="Aster Vale, original naval flagship" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .45, bounce: 0 }} />
      <motion.section className="title-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, bounce: 0 }}>
        <div className="title-crest"><span>⚓</span></div>
        <p className="title-kicker">NAVAL DISTRICT COMMAND</p>
        <h1>Fleet<br/><em>Collection</em></h1>
        <p className="title-subtitle">Build your fleet. Command the seas.</p>
        <div className="title-rule"><i/><span>★</span><i/></div>
        <div className="title-actions">
          <button id="start-game" className="title-start" onClick={() => navigate('/game')}><span>ENTER NAVAL DISTRICT</span><b>›</b></button>
          <button className="title-settings" onClick={() => setSettingsOpen(true)}><span>⚙</span> Settings</button>
        </div>
        <small className="title-version">DISTRICT CLIENT 2.0 · ORIGINAL FLEET ART</small>
      </motion.section>
      <div className="title-stripe"><span>YOKOSUKA · SASEBO · KURE · MAIZURU</span></div>
      <AnimatePresence initial={false}>
        {settingsOpen && <SettingsModal settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}
